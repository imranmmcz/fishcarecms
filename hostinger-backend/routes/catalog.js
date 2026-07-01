const express = require('express');
const crypto = require('crypto');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * Catalog API — Categories, Brands, Product Variations.
 * Matches the front-end facades in src/repositories/{categories,brands,productVariations}.ts.
 *
 * Categories & Brands rows live in tables created by complete_schema.sql
 * (INT auto-increment ids). Product variations use CHAR(36) UUIDs generated
 * here, matching Supabase.
 *
 * All ids are returned as strings so the facade can normalize them
 * regardless of underlying column type.
 */

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0980-\u09FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function pick(body, fields) {
  const out = {};
  for (const k of fields) {
    if (body[k] !== undefined) out[k] = body[k] === '' ? null : body[k];
  }
  return out;
}

// =========================================================================
// CATEGORIES  /api/categories
// =========================================================================

const CATEGORY_FIELDS = [
  'name', 'name_bn', 'slug', 'description', 'icon',
  'is_active', 'display_order', 'parent_id',
];

router.get('/categories', async (_req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM categories ORDER BY display_order ASC, name ASC'
    );
    res.json({ categories: rows });
  } catch (err) {
    console.error('List categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const data = pick(req.body || {}, CATEGORY_FIELDS);
    if (!data.name || !data.name_bn) {
      return res.status(400).json({ error: 'name and name_bn are required' });
    }
    if (!data.slug) data.slug = slugify(data.name);
    if (data.is_active === undefined) data.is_active = 1;
    if (data.is_active !== null) data.is_active = data.is_active ? 1 : 0;

    const cols = Object.keys(data);
    const sql = `INSERT INTO categories (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`;
    const [result] = await db.execute(sql, Object.values(data));
    const [rows] = await db.execute('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json({ category: rows[0] });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Category slug already exists' });
    }
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const data = pick(req.body || {}, CATEGORY_FIELDS);
    if (data.is_active !== undefined && data.is_active !== null) {
      data.is_active = data.is_active ? 1 : 0;
    }
    const keys = Object.keys(data);
    if (keys.length === 0) return res.status(400).json({ error: 'No updatable fields' });
    const setSql = keys.map((k) => `${k} = ?`).join(', ');
    const [result] = await db.execute(
      `UPDATE categories SET ${setSql} WHERE id = ?`,
      [...Object.values(data), req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
    const [rows] = await db.execute('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    res.json({ category: rows[0] });
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// =========================================================================
// BRANDS  /api/brands
// =========================================================================

const BRAND_FIELDS = [
  'name', 'name_bn', 'company_id', 'logo_url', 'description', 'is_active',
];

router.get('/brands', async (_req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM brands ORDER BY name ASC');
    res.json({ brands: rows });
  } catch (err) {
    console.error('List brands error:', err);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

router.post('/brands', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const data = pick(req.body || {}, BRAND_FIELDS);
    if (!data.name) return res.status(400).json({ error: 'name is required' });
    if (data.is_active === undefined) data.is_active = 1;
    if (data.is_active !== null) data.is_active = data.is_active ? 1 : 0;

    const cols = Object.keys(data);
    const sql = `INSERT INTO brands (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`;
    const [result] = await db.execute(sql, Object.values(data));
    const [rows] = await db.execute('SELECT * FROM brands WHERE id = ?', [result.insertId]);
    res.status(201).json({ brand: rows[0] });
  } catch (err) {
    console.error('Create brand error:', err);
    res.status(500).json({ error: 'Failed to create brand' });
  }
});

router.put('/brands/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const data = pick(req.body || {}, BRAND_FIELDS);
    if (data.is_active !== undefined && data.is_active !== null) {
      data.is_active = data.is_active ? 1 : 0;
    }
    const keys = Object.keys(data);
    if (keys.length === 0) return res.status(400).json({ error: 'No updatable fields' });
    const setSql = keys.map((k) => `${k} = ?`).join(', ');
    const [result] = await db.execute(
      `UPDATE brands SET ${setSql} WHERE id = ?`,
      [...Object.values(data), req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Brand not found' });
    const [rows] = await db.execute('SELECT * FROM brands WHERE id = ?', [req.params.id]);
    res.json({ brand: rows[0] });
  } catch (err) {
    console.error('Update brand error:', err);
    res.status(500).json({ error: 'Failed to update brand' });
  }
});

router.delete('/brands/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM brands WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Brand not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete brand error:', err);
    res.status(500).json({ error: 'Failed to delete brand' });
  }
});

// =========================================================================
// PRODUCT VARIATIONS  /api/product-variations
// =========================================================================

const VARIATION_FIELDS = [
  'product_id', 'variation_name', 'unit', 'weight_value',
  'price', 'cost_price', 'stock_quantity', 'sku', 'is_active',
];

router.get('/product-variations', async (req, res) => {
  try {
    const { product_id } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (product_id) {
      where += ' AND product_id = ?';
      params.push(product_id);
    }
    const [rows] = await db.execute(
      `SELECT * FROM product_variations ${where} ORDER BY created_at DESC`,
      params
    );
    res.json({ variations: rows });
  } catch (err) {
    console.error('List variations error:', err);
    res.status(500).json({ error: 'Failed to fetch variations' });
  }
});

router.post('/product-variations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const data = pick(req.body || {}, VARIATION_FIELDS);
    if (!data.product_id || !data.variation_name) {
      return res.status(400).json({ error: 'product_id and variation_name are required' });
    }
    if (data.is_active === undefined) data.is_active = 1;
    if (data.is_active !== null) data.is_active = data.is_active ? 1 : 0;

    const id = crypto.randomUUID();
    const cols = ['id', ...Object.keys(data)];
    const values = [id, ...Object.values(data)];
    const sql = `INSERT INTO product_variations (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`;
    await db.execute(sql, values);
    const [rows] = await db.execute('SELECT * FROM product_variations WHERE id = ?', [id]);
    res.status(201).json({ variation: rows[0] });
  } catch (err) {
    console.error('Create variation error:', err);
    res.status(500).json({ error: 'Failed to create variation' });
  }
});

router.put('/product-variations/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const data = pick(req.body || {}, VARIATION_FIELDS);
    if (data.is_active !== undefined && data.is_active !== null) {
      data.is_active = data.is_active ? 1 : 0;
    }
    const keys = Object.keys(data);
    if (keys.length === 0) return res.status(400).json({ error: 'No updatable fields' });
    const setSql = keys.map((k) => `${k} = ?`).join(', ');
    const [result] = await db.execute(
      `UPDATE product_variations SET ${setSql} WHERE id = ?`,
      [...Object.values(data), req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Variation not found' });
    const [rows] = await db.execute('SELECT * FROM product_variations WHERE id = ?', [req.params.id]);
    res.json({ variation: rows[0] });
  } catch (err) {
    console.error('Update variation error:', err);
    res.status(500).json({ error: 'Failed to update variation' });
  }
});

router.delete('/product-variations/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM product_variations WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Variation not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete variation error:', err);
    res.status(500).json({ error: 'Failed to delete variation' });
  }
});

module.exports = router;