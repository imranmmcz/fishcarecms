const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// ===== Login-specific rate limiter =====
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
  message: { 
    error: 'অনেক বেশি লগইন চেষ্টা করা হয়েছে। ১৫ মিনিট পর আবার চেষ্টা করুন।',
    error_en: 'Too many login attempts. Please try again after 15 minutes.',
    locked: true,
    lockout_minutes: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by IP + email combination
    return `${req.ip}-${(req.body.email || '').toLowerCase()}`;
  }
});

// ===== In-memory failed attempt tracker (per-account lockout) =====
const failedAttempts = new Map();
const MAX_FAILED = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCKOUT_MS = (parseInt(process.env.LOGIN_LOCKOUT_MINUTES) || 15) * 60 * 1000;

function checkAccountLock(email) {
  const key = email.toLowerCase();
  const record = failedAttempts.get(key);
  if (!record) return { locked: false };
  
  if (record.count >= MAX_FAILED) {
    const elapsed = Date.now() - record.lastAttempt;
    if (elapsed < LOCKOUT_MS) {
      const remainingMin = Math.ceil((LOCKOUT_MS - elapsed) / 60000);
      return { locked: true, remainingMinutes: remainingMin };
    }
    // Lockout expired, reset
    failedAttempts.delete(key);
    return { locked: false };
  }
  return { locked: false, attempts: record.count };
}

function recordFailedAttempt(email) {
  const key = email.toLowerCase();
  const record = failedAttempts.get(key) || { count: 0, lastAttempt: 0 };
  record.count += 1;
  record.lastAttempt = Date.now();
  failedAttempts.set(key, record);
  return { attempts: record.count, maxAttempts: MAX_FAILED, remaining: MAX_FAILED - record.count };
}

function clearFailedAttempts(email) {
  failedAttempts.delete(email.toLowerCase());
}

// Cleanup old entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of failedAttempts.entries()) {
    if (now - record.lastAttempt > LOCKOUT_MS * 2) {
      failedAttempts.delete(key);
    }
  }
}, 30 * 60 * 1000);


// ===== Sign Up =====
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name, mobile, division, district, upazila, village } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password and full name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const [result] = await db.execute(
      `INSERT INTO users (email, password, full_name, mobile, division, district, upazila, village, role, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'user', NOW())`,
      [email, hashedPassword, full_name, mobile || null, division || null, district || null, upazila || null, village || null]
    );

    // Generate token
    const token = jwt.sign(
      { userId: result.insertId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: result.insertId,
        email,
        full_name,
        role: 'user'
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// ===== Sign In (with rate limiting + account lockout) =====
router.post('/signin', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check account lockout
    const lockStatus = checkAccountLock(email);
    if (lockStatus.locked) {
      return res.status(429).json({ 
        error: `অ্যাকাউন্ট সাময়িকভাবে লক করা হয়েছে। ${lockStatus.remainingMinutes} মিনিট পর আবার চেষ্টা করুন।`,
        error_en: `Account temporarily locked. Try again in ${lockStatus.remainingMinutes} minutes.`,
        locked: true,
        remaining_minutes: lockStatus.remainingMinutes
      });
    }

    // Find user
    const [users] = await db.execute(
      'SELECT id, email, password, full_name, role, avatar_url FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      const attemptInfo = recordFailedAttempt(email);
      return res.status(401).json({ 
        error: 'ভুল ইমেইল বা পাসওয়ার্ড',
        error_en: 'Invalid email or password',
        attempts_remaining: attemptInfo.remaining
      });
    }

    const user = users[0];

    // Check if user is blocked
    if (user.is_blocked) {
      return res.status(403).json({ 
        error: 'আপনার অ্যাকাউন্ট ব্লক করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।',
        error_en: 'Your account has been blocked. Contact admin.',
        blocked: true
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      const attemptInfo = recordFailedAttempt(email);
      
      let warningMsg = '';
      if (attemptInfo.remaining <= 2) {
        warningMsg = ` আরো ${attemptInfo.remaining}টি চেষ্টার পর অ্যাকাউন্ট লক হবে।`;
      }
      
      return res.status(401).json({ 
        error: `ভুল ইমেইল বা পাসওয়ার্ড।${warningMsg}`,
        error_en: `Invalid email or password. ${attemptInfo.remaining} attempts remaining.`,
        attempts_remaining: attemptInfo.remaining
      });
    }

    // Success — clear failed attempts
    clearFailedAttempts(email);

    // Update last sign in
    try {
      await db.execute('UPDATE users SET last_sign_in_at = NOW() WHERE id = ?', [user.id]);
    } catch (e) {
      // Non-critical, don't fail login
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar_url: user.avatar_url
      },
      token
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT id, email, full_name, mobile, division, district, upazila, village, role, avatar_url, created_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Update password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const [users] = await db.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
    
    const isValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.execute('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Sign Out
router.post('/signout', authenticateToken, (req, res) => {
  res.json({ message: 'Signed out successfully' });
});

// Get login attempts status (for admin monitoring)
router.get('/login-attempts', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const attempts = [];
  for (const [email, record] of failedAttempts.entries()) {
    attempts.push({
      email,
      failed_count: record.count,
      last_attempt: new Date(record.lastAttempt).toISOString(),
      is_locked: record.count >= MAX_FAILED && (Date.now() - record.lastAttempt) < LOCKOUT_MS
    });
  }
  
  res.json({ attempts, max_allowed: MAX_FAILED, lockout_minutes: LOCKOUT_MS / 60000 });
});

module.exports = router;
