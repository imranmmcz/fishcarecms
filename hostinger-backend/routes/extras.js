const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ===================== CATEGORIES =====================
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await db.execute('SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC');
    res.json({ data: categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, name_bn, slug, description, icon, display_order } = req.body;
    const [result] = await db.execute(
      'INSERT INTO categories (name, name_bn, slug, description, icon, display_order) VALUES (?, ?, ?, ?, ?, ?)',
      [name, name_bn, slug, description || null, icon || null, display_order || 0]
    );
    const [cat] = await db.execute('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json({ data: cat[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, name_bn, slug, description, icon, is_active, display_order } = req.body;
    await db.execute(
      'UPDATE categories SET name=?, name_bn=?, slug=?, description=?, icon=?, is_active=?, display_order=? WHERE id=?',
      [name, name_bn, slug, description, icon, is_active !== false, display_order || 0, req.params.id]
    );
    const [cat] = await db.execute('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    res.json({ data: cat[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ===================== BRANDS =====================
router.get('/brands', async (req, res) => {
  try {
    const [brands] = await db.execute('SELECT b.*, c.name as company_name FROM brands b LEFT JOIN companies c ON b.company_id = c.id WHERE b.is_active = 1 ORDER BY b.name');
    res.json({ data: brands });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

router.post('/brands', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, name_bn, company_id, logo_url, description } = req.body;
    const [result] = await db.execute(
      'INSERT INTO brands (name, name_bn, company_id, logo_url, description) VALUES (?, ?, ?, ?, ?)',
      [name, name_bn || null, company_id || null, logo_url || null, description || null]
    );
    const [brand] = await db.execute('SELECT * FROM brands WHERE id = ?', [result.insertId]);
    res.status(201).json({ data: brand[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create brand' });
  }
});

// ===================== COMPANIES =====================
router.get('/companies', async (req, res) => {
  try {
    const [companies] = await db.execute('SELECT * FROM companies WHERE is_active = 1 ORDER BY name');
    res.json({ data: companies });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

router.post('/companies', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, name_bn, company_type, contact_person, phone, email, address } = req.body;
    const [result] = await db.execute(
      'INSERT INTO companies (name, name_bn, company_type, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, name_bn || null, company_type || 'supplier', contact_person || null, phone || null, email || null, address || null]
    );
    const [company] = await db.execute('SELECT * FROM companies WHERE id = ?', [result.insertId]);
    res.status(201).json({ data: company[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// ===================== HERO SLIDES =====================
router.get('/hero-slides', async (req, res) => {
  try {
    const [slides] = await db.execute('SELECT * FROM hero_slides WHERE is_active = 1 ORDER BY display_order ASC');
    res.json({ data: slides });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hero slides' });
  }
});

router.post('/hero-slides', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, subtitle, tagline, tagline_icon, button_text, button_link, button_variant, background_type, background_value, display_order } = req.body;
    const [result] = await db.execute(
      `INSERT INTO hero_slides (title, subtitle, tagline, tagline_icon, button_text, button_link, button_variant, background_type, background_value, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, subtitle || null, tagline || null, tagline_icon || 'Sparkles', button_text || null, button_link || '/', button_variant || 'primary', background_type || 'gradient', background_value || null, display_order || 0]
    );
    const [slide] = await db.execute('SELECT * FROM hero_slides WHERE id = ?', [result.insertId]);
    res.status(201).json({ data: slide[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create hero slide' });
  }
});

router.put('/hero-slides/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const fields = req.body;
    const updates = [];
    const params = [];
    const allowed = ['title', 'subtitle', 'tagline', 'tagline_icon', 'button_text', 'button_link', 'button_variant', 'background_type', 'background_value', 'is_active', 'display_order'];
    for (const key of allowed) {
      if (fields[key] !== undefined) { updates.push(`${key} = ?`); params.push(fields[key]); }
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields' });
    params.push(req.params.id);
    await db.execute(`UPDATE hero_slides SET ${updates.join(', ')} WHERE id = ?`, params);
    const [slide] = await db.execute('SELECT * FROM hero_slides WHERE id = ?', [req.params.id]);
    res.json({ data: slide[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update hero slide' });
  }
});

router.delete('/hero-slides/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM hero_slides WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete hero slide' });
  }
});

// ===================== DELIVERY CHARGE RULES =====================
router.get('/delivery-rules', async (req, res) => {
  try {
    const [rules] = await db.execute('SELECT * FROM delivery_charge_rules WHERE is_active = 1 ORDER BY priority ASC');
    res.json({ data: rules });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch delivery rules' });
  }
});

router.post('/delivery-rules', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { rule_type, district_name, min_value, max_value, charge_amount, priority } = req.body;
    const [result] = await db.execute(
      'INSERT INTO delivery_charge_rules (rule_type, district_name, min_value, max_value, charge_amount, priority) VALUES (?, ?, ?, ?, ?, ?)',
      [rule_type || 'district', district_name || null, min_value || 0, max_value || null, charge_amount || 0, priority || 0]
    );
    const [rule] = await db.execute('SELECT * FROM delivery_charge_rules WHERE id = ?', [result.insertId]);
    res.status(201).json({ data: rule[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create delivery rule' });
  }
});

// ===================== CUSTOM PAGES =====================
router.get('/custom-pages', async (req, res) => {
  try {
    const [pages] = await db.execute("SELECT * FROM custom_pages WHERE status = 'published' ORDER BY created_at DESC");
    res.json({ data: pages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

router.get('/custom-pages/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [pages] = await db.execute('SELECT * FROM custom_pages ORDER BY created_at DESC');
    res.json({ data: pages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

router.get('/custom-pages/:slug', async (req, res) => {
  try {
    const [pages] = await db.execute("SELECT * FROM custom_pages WHERE slug = ? AND status = 'published'", [req.params.slug]);
    if (pages.length === 0) return res.status(404).json({ error: 'Page not found' });
    res.json({ data: pages[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

router.post('/custom-pages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, title_bn, slug, content, content_type, meta_title, meta_description, status } = req.body;
    const [result] = await db.execute(
      'INSERT INTO custom_pages (title, title_bn, slug, content, content_type, meta_title, meta_description, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, title_bn || null, slug, content || null, content_type || 'rich', meta_title || null, meta_description || null, status || 'draft', req.user.id]
    );
    const [page] = await db.execute('SELECT * FROM custom_pages WHERE id = ?', [result.insertId]);
    res.status(201).json({ data: page[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create page' });
  }
});

// ===================== SMTP SETTINGS =====================
router.get('/smtp', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [settings] = await db.execute('SELECT * FROM smtp_settings LIMIT 1');
    res.json({ data: settings[0] || null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SMTP settings' });
  }
});

router.put('/smtp', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password, smtp_from_name, smtp_from_email, is_enabled } = req.body;
    await db.execute(
      `UPDATE smtp_settings SET smtp_host=?, smtp_port=?, smtp_secure=?, smtp_user=?, smtp_password=?, smtp_from_name=?, smtp_from_email=?, is_enabled=? WHERE id=1`,
      [smtp_host, smtp_port || 587, smtp_secure !== false, smtp_user, smtp_password, smtp_from_name, smtp_from_email, is_enabled || false]
    );
    const [settings] = await db.execute('SELECT * FROM smtp_settings LIMIT 1');
    res.json({ data: settings[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update SMTP settings' });
  }
});

// ===================== PRODUCT IMAGES =====================
router.get('/product-images/:productId', async (req, res) => {
  try {
    const [images] = await db.execute('SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order ASC', [req.params.productId]);
    res.json({ data: images });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product images' });
  }
});

router.post('/product-images', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { product_id, image_url, alt_text, display_order, is_primary } = req.body;
    const [result] = await db.execute(
      'INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES (?, ?, ?, ?, ?)',
      [product_id, image_url, alt_text || null, display_order || 0, is_primary || false]
    );
    const [img] = await db.execute('SELECT * FROM product_images WHERE id = ?', [result.insertId]);
    res.status(201).json({ data: img[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add product image' });
  }
});

router.delete('/product-images/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM product_images WHERE id = ?', [req.params.id]);
    res.json({ message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router;
