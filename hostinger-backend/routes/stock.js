const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * Stock Adjustments API — /api/stock-adjustments
 *
 * Mirrors the Supabase `stock_adjustments` table used by
 * POSStockTransfers, StockHistory and SalesAnalytics.
 *
 * POST performs an atomic (transactional) insert + products.stock_quantity
 * update, matching the two-step Supabase flow but crash-safe.
 */

const FIELDS = [
  'product_id', 'adjustment_type', 'quantity_change',
  'previous_quantity', 'new_quantity',
  'reference_type', 'reference_id', 'notes', 'created_by',
];

function pick(body, fields) {
  const out = {};
  for (const k of fields) {
    if (body[k] !== undefined) out[k] = body[k] === '' ? null : body[k];
  }
  return out;
}

function shape(row) {
  if (!row) return row;
  const out = { ...row };
  if (row.product_name !== undefined || row.product_sku !== undefined) {
    out.products = { name: row.product_name, sku: row.product_sku };
    out.product = { name: row.product_name, sku: row.product_sku };
    delete out.product_name;
    delete out.product_sku;
  }
  return out;
}

// GET /api/stock-adjustments
//   ?product_id=..&type=..&limit=..&include_product=1
router.get('/stock-adjustments', async (req, res) => {
  try {
    const {
      product_id, type, limit, include_product,
    } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (product_id) { where += ' AND sa.product_id = ?'; params.push(product_id); }
    if (type)       { where += ' AND sa.adjustment_type = ?'; params.push(type); }

    const withProduct = include_product === '1' || include_product === 'true';
    const selectSql = withProduct
      ? `SELECT sa.*, p.name AS product_name, p.sku AS product_sku
           FROM stock_adjustments sa
           LEFT JOIN products p ON p.id = sa.product_id`
      : `SELECT sa.* FROM stock_adjustments sa`;

    const lim = Math.min(parseInt(limit) || 100, 500);
    const [rows] = await db.execute(
      `${selectSql} ${where} ORDER BY sa.created_at DESC LIMIT ${lim}`,
      params,
    );
    res.json({ adjustments: rows.map(shape) });
  } catch (err) {
    console.error('List stock adjustments error:', err);
    res.status(500).json({ error: 'Failed to fetch stock adjustments' });
  }
});

// POST /api/stock-adjustments
// Transactional: insert adjustment + update products.stock_quantity
router.post('/stock-adjustments', authenticateToken, requireAdmin, async (req, res) => {
  const data = pick(req.body || {}, FIELDS);
  if (!data.product_id || !data.adjustment_type) {
    return res.status(400).json({ error: 'product_id and adjustment_type are required' });
  }
  if (data.quantity_change === undefined || data.quantity_change === null) {
    return res.status(400).json({ error: 'quantity_change is required' });
  }
  data.quantity_change = parseInt(data.quantity_change);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [prodRows] = await conn.execute(
      'SELECT id, stock_quantity FROM products WHERE id = ? FOR UPDATE',
      [data.product_id],
    );
    if (!prodRows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    const prev = Number(prodRows[0].stock_quantity) || 0;
    const next = prev + data.quantity_change;
    if (next < 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    data.previous_quantity = prev;
    data.new_quantity = next;

    const cols = Object.keys(data);
    const sql = `INSERT INTO stock_adjustments (${cols.join(',')})
                 VALUES (${cols.map(() => '?').join(',')})`;
    const [result] = await conn.execute(sql, Object.values(data));

    await conn.execute(
      'UPDATE products SET stock_quantity = ? WHERE id = ?',
      [next, data.product_id],
    );

    await conn.commit();
    const [rows] = await conn.execute(
      'SELECT * FROM stock_adjustments WHERE id = ?',
      [result.insertId],
    );
    res.status(201).json({ adjustment: rows[0] });
  } catch (err) {
    try { await conn.rollback(); } catch (_) { /* ignore */ }
    console.error('Create stock adjustment error:', err);
    res.status(500).json({ error: 'Failed to create stock adjustment' });
  } finally {
    conn.release();
  }
});

module.exports = router;