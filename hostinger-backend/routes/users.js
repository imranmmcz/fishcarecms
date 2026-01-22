const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search, division, district, upazila, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT id, email, full_name, mobile, division, district, upazila, village, role, avatar_url, created_at 
      FROM users WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (full_name LIKE ? OR email LIKE ? OR mobile LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (division) {
      query += ` AND division = ?`;
      params.push(division);
    }

    if (district) {
      query += ` AND district = ?`;
      params.push(district);
    }

    if (upazila) {
      query += ` AND upazila = ?`;
      params.push(upazila);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [users] = await db.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (full_name LIKE ? OR email LIKE ? OR mobile LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    if (division) {
      countQuery += ` AND division = ?`;
      countParams.push(division);
    }
    if (district) {
      countQuery += ` AND district = ?`;
      countParams.push(district);
    }
    if (upazila) {
      countQuery += ` AND upazila = ?`;
      countParams.push(upazila);
    }

    const [countResult] = await db.execute(countQuery, countParams);

    res.json({
      users,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only view their own profile unless admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [users] = await db.execute(
      `SELECT id, email, full_name, mobile, division, district, upazila, village, role, avatar_url, created_at 
       FROM users WHERE id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, mobile, division, district, upazila, village, avatar_url } = req.body;

    // Users can only update their own profile unless admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = [];
    const params = [];

    if (full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(full_name);
    }
    if (mobile !== undefined) {
      updates.push('mobile = ?');
      params.push(mobile);
    }
    if (division !== undefined) {
      updates.push('division = ?');
      params.push(division);
    }
    if (district !== undefined) {
      updates.push('district = ?');
      params.push(district);
    }
    if (upazila !== undefined) {
      updates.push('upazila = ?');
      params.push(upazila);
    }
    if (village !== undefined) {
      updates.push('village = ?');
      params.push(village);
    }
    if (avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      params.push(avatar_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await db.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Return updated user
    const [users] = await db.execute(
      `SELECT id, email, full_name, mobile, division, district, upazila, village, role, avatar_url, created_at 
       FROM users WHERE id = ?`,
      [id]
    );

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Update user role (Admin only)
router.patch('/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await db.execute(
      'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
      [role, id]
    );

    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await db.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user statistics (Admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [totalUsers] = await db.execute('SELECT COUNT(*) as count FROM users');
    const [admins] = await db.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    const [recentUsers] = await db.execute(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );

    res.json({
      total: totalUsers[0].count,
      admins: admins[0].count,
      recentSignups: recentUsers[0].count
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
