const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get ad settings (Public - needed for rendering ads)
router.get('/', async (req, res) => {
  try {
    const [settings] = await db.execute('SELECT * FROM ad_settings LIMIT 1');

    if (settings.length === 0) {
      // Return default settings if none exist
      return res.json({
        settings: {
          ad_client_id: null,
          header_ad_enabled: false,
          header_ad_slot: null,
          sidebar_ad_enabled: false,
          sidebar_ad_slot: null,
          footer_ad_enabled: false,
          footer_ad_slot: null,
          in_article_ad_enabled: false,
          in_article_ad_slot: null,
          between_modules_ad_enabled: false,
          between_modules_ad_slot: null
        }
      });
    }

    res.json({ settings: settings[0] });
  } catch (error) {
    console.error('Get ad settings error:', error);
    res.status(500).json({ error: 'Failed to fetch ad settings' });
  }
});

// Update ad settings (Admin only)
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      ad_client_id,
      header_ad_enabled,
      header_ad_slot,
      sidebar_ad_enabled,
      sidebar_ad_slot,
      footer_ad_enabled,
      footer_ad_slot,
      in_article_ad_enabled,
      in_article_ad_slot,
      between_modules_ad_enabled,
      between_modules_ad_slot
    } = req.body;

    // Check if settings exist
    const [existing] = await db.execute('SELECT id FROM ad_settings LIMIT 1');

    if (existing.length > 0) {
      // Update
      await db.execute(
        `UPDATE ad_settings SET 
         ad_client_id = ?,
         header_ad_enabled = ?,
         header_ad_slot = ?,
         sidebar_ad_enabled = ?,
         sidebar_ad_slot = ?,
         footer_ad_enabled = ?,
         footer_ad_slot = ?,
         in_article_ad_enabled = ?,
         in_article_ad_slot = ?,
         between_modules_ad_enabled = ?,
         between_modules_ad_slot = ?,
         updated_at = NOW()
         WHERE id = ?`,
        [
          ad_client_id || null,
          header_ad_enabled || false,
          header_ad_slot || null,
          sidebar_ad_enabled || false,
          sidebar_ad_slot || null,
          footer_ad_enabled || false,
          footer_ad_slot || null,
          in_article_ad_enabled || false,
          in_article_ad_slot || null,
          between_modules_ad_enabled || false,
          between_modules_ad_slot || null,
          existing[0].id
        ]
      );
    } else {
      // Create
      await db.execute(
        `INSERT INTO ad_settings 
         (ad_client_id, header_ad_enabled, header_ad_slot, sidebar_ad_enabled, sidebar_ad_slot,
          footer_ad_enabled, footer_ad_slot, in_article_ad_enabled, in_article_ad_slot,
          between_modules_ad_enabled, between_modules_ad_slot, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          ad_client_id || null,
          header_ad_enabled || false,
          header_ad_slot || null,
          sidebar_ad_enabled || false,
          sidebar_ad_slot || null,
          footer_ad_enabled || false,
          footer_ad_slot || null,
          in_article_ad_enabled || false,
          in_article_ad_slot || null,
          between_modules_ad_enabled || false,
          between_modules_ad_slot || null
        ]
      );
    }

    const [settings] = await db.execute('SELECT * FROM ad_settings LIMIT 1');

    res.json({ settings: settings[0] });
  } catch (error) {
    console.error('Update ad settings error:', error);
    res.status(500).json({ error: 'Failed to update ad settings' });
  }
});

module.exports = router;
