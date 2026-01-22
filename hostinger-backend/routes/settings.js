const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all settings (Authenticated users)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [settings] = await db.execute('SELECT * FROM system_settings ORDER BY setting_key');

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Get setting by key
router.get('/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;

    const [settings] = await db.execute(
      'SELECT * FROM system_settings WHERE setting_key = ?',
      [key]
    );

    if (settings.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({ setting: settings[0] });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// Create or update setting (Admin only)
router.put('/:key', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    // Check if setting exists
    const [existing] = await db.execute(
      'SELECT id FROM system_settings WHERE setting_key = ?',
      [key]
    );

    if (existing.length > 0) {
      // Update
      await db.execute(
        `UPDATE system_settings SET setting_value = ?, description = ?, updated_at = NOW(), updated_by = ? 
         WHERE setting_key = ?`,
        [value, description || null, req.user.id, key]
      );
    } else {
      // Create
      await db.execute(
        `INSERT INTO system_settings (setting_key, setting_value, description, updated_at, updated_by) 
         VALUES (?, ?, ?, NOW(), ?)`,
        [key, value, description || null, req.user.id]
      );
    }

    const [settings] = await db.execute(
      'SELECT * FROM system_settings WHERE setting_key = ?',
      [key]
    );

    res.json({ setting: settings[0] });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Bulk update settings (Admin only)
router.post('/bulk', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      return res.status(400).json({ error: 'Settings must be an array' });
    }

    for (const setting of settings) {
      const { key, value, description } = setting;

      const [existing] = await db.execute(
        'SELECT id FROM system_settings WHERE setting_key = ?',
        [key]
      );

      if (existing.length > 0) {
        await db.execute(
          `UPDATE system_settings SET setting_value = ?, description = ?, updated_at = NOW(), updated_by = ? 
           WHERE setting_key = ?`,
          [value, description || null, req.user.id, key]
        );
      } else {
        await db.execute(
          `INSERT INTO system_settings (setting_key, setting_value, description, updated_at, updated_by) 
           VALUES (?, ?, ?, NOW(), ?)`,
          [key, value, description || null, req.user.id]
        );
      }
    }

    const [allSettings] = await db.execute('SELECT * FROM system_settings ORDER BY setting_key');

    res.json({ settings: allSettings });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Delete setting (Admin only)
router.delete('/:key', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;

    await db.execute('DELETE FROM system_settings WHERE setting_key = ?', [key]);

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

module.exports = router;
