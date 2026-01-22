const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all page content (Public)
router.get('/', async (req, res) => {
  try {
    const { active_only } = req.query;

    let query = 'SELECT * FROM page_content';
    if (active_only === 'true') {
      query += ' WHERE is_active = true';
    }
    query += ' ORDER BY display_order ASC';

    const [content] = await db.execute(query);

    // Parse JSON content
    const parsedContent = content.map(item => ({
      ...item,
      content: typeof item.content === 'string' ? JSON.parse(item.content) : item.content
    }));

    res.json({ content: parsedContent });
  } catch (error) {
    console.error('Get page content error:', error);
    res.status(500).json({ error: 'Failed to fetch page content' });
  }
});

// Get page content by section key
router.get('/section/:key', async (req, res) => {
  try {
    const { key } = req.params;

    const [content] = await db.execute(
      'SELECT * FROM page_content WHERE section_key = ? AND is_active = true',
      [key]
    );

    if (content.length === 0) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const parsedContent = {
      ...content[0],
      content: typeof content[0].content === 'string' ? JSON.parse(content[0].content) : content[0].content
    };

    res.json({ section: parsedContent });
  } catch (error) {
    console.error('Get section error:', error);
    res.status(500).json({ error: 'Failed to fetch section' });
  }
});

// Get page content by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [content] = await db.execute('SELECT * FROM page_content WHERE id = ?', [id]);

    if (content.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const parsedContent = {
      ...content[0],
      content: typeof content[0].content === 'string' ? JSON.parse(content[0].content) : content[0].content
    };

    res.json({ section: parsedContent });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Create page content (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { section_key, section_name, content, is_active, display_order } = req.body;

    if (!section_key || !section_name) {
      return res.status(400).json({ error: 'Section key and name are required' });
    }

    // Check for duplicate section_key
    const [existing] = await db.execute(
      'SELECT id FROM page_content WHERE section_key = ?',
      [section_key]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Section key already exists' });
    }

    const [result] = await db.execute(
      `INSERT INTO page_content (section_key, section_name, content, is_active, display_order, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        section_key,
        section_name,
        JSON.stringify(content || {}),
        is_active !== undefined ? is_active : true,
        display_order || 0
      ]
    );

    const [newContent] = await db.execute('SELECT * FROM page_content WHERE id = ?', [result.insertId]);

    const parsedContent = {
      ...newContent[0],
      content: typeof newContent[0].content === 'string' ? JSON.parse(newContent[0].content) : newContent[0].content
    };

    res.status(201).json({ section: parsedContent });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({ error: 'Failed to create content' });
  }
});

// Update page content (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { section_key, section_name, content, is_active, display_order } = req.body;

    const updates = [];
    const params = [];

    if (section_key !== undefined) {
      updates.push('section_key = ?');
      params.push(section_key);
    }
    if (section_name !== undefined) {
      updates.push('section_name = ?');
      params.push(section_name);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      params.push(JSON.stringify(content));
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }
    if (display_order !== undefined) {
      updates.push('display_order = ?');
      params.push(display_order);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await db.execute(`UPDATE page_content SET ${updates.join(', ')} WHERE id = ?`, params);

    const [updatedContent] = await db.execute('SELECT * FROM page_content WHERE id = ?', [id]);

    const parsedContent = {
      ...updatedContent[0],
      content: typeof updatedContent[0].content === 'string' ? JSON.parse(updatedContent[0].content) : updatedContent[0].content
    };

    res.json({ section: parsedContent });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// Delete page content (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute('DELETE FROM page_content WHERE id = ?', [id]);

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

module.exports = router;
