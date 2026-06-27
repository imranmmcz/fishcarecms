require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const { initDatabase } = require('./config/initDatabase');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const marketPriceRoutes = require('./routes/marketPrices');
const settingsRoutes = require('./routes/settings');
const adSettingsRoutes = require('./routes/adSettings');
const pageContentRoutes = require('./routes/pageContent');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const farmingRoutes = require('./routes/farming');
const extrasRoutes = require('./routes/extras');
const uploadRoutes = require('./routes/uploads');
const customerRoutes = require('./routes/customers');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
['products', 'avatars', 'general'].forEach(dir => {
  const fullPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'অনেক বেশি রিকোয়েস্ট পাঠানো হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন।' }
});
app.use(limiter);

// === STRICT CORS Configuration ===
const allowedOrigins = [
  'https://fishcal.lovable.app',
  'https://fishcare.lovable.app',
  'https://fishcare.com.bd',
  'https://www.fishcare.com.bd',
  'https://blog.fishcare.com.bd',
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [])
].filter(Boolean);

// Add localhost only in development
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000');
}

// Remove duplicates
const uniqueOrigins = [...new Set(allowedOrigins)];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const isAllowed = uniqueOrigins.includes(origin) || 
      origin.includes('.lovableproject.com') ||
      origin.includes('.lovable.app');
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS BLOCKED] Origin: ${origin} at ${new Date().toISOString()}`);
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.options('*', cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/market-prices', marketPriceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ad-settings', adSettingsRoutes);
app.use('/api/page-content', pageContentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/farming', farmingRoutes);
app.use('/api', extrasRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Handle CORS errors specifically
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'Access denied: CORS policy violation' });
  }
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

(async () => {
  try {
    // Auto-create database + apply every schema file in database/ on boot.
    // Safe on re-runs (uses CREATE TABLE IF NOT EXISTS / INSERT IGNORE).
    await initDatabase();
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      console.error('🛑 Refusing to start API server — database init failed.');
      process.exit(1);
    } else {
      console.warn('⚠️  Starting API server despite database init errors (dev mode).');
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 FishCare API Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Allowed Origins: ${uniqueOrigins.join(', ')}`);
  });
})();
