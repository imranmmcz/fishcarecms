const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * Purchase Orders API — /api/purchase-orders
 *
 * Mirrors Supabase purchase_orders + purchase_order_items used by
 * POSPurchaseList and POSNewPurchase.
 *
 * POST is transactional: it inserts the order, all items, and (when
 * status='received') stock adjustments — all in one atomic block.
 */

const ORDER_FIELDS = [
  'company_id', 'status', 'order_date', 'expected_date', 'received_date',
  'subtotal', 'tax_amount', 'shipping_cost', 'total_amount',
  'notes', 'created_by',
];

function pick(body, fields) {
  const out = {};
  for (const k of fields) {
    if (body[k] !== undefined) out[k] = body[k] === '' ? null : body[k];
  }
  return out;
}

function shapeOrder(row, items) {
  if (!row) return null;
  const out = { ...row };
  if (row.company_name !== undefined) {
    out.companies = row.company_name ? { name: row.company_name } : null;
    delete out.company_name;
  }
  if (items !== undefined) {
    out.purchase_order_items = items || [];
  }
  return out;
}

async function generateOrderNumber(conn) {
  const [rows] = await conn.execute('SELECT COUNT(*) AS c FROM purchase_orders');
  const n = (rows[0]?.c || 0) + 1;
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `PO-${stamp}-${String(n).padStart(4, '0')}`;
}

// GET /api/purchase-orders?search=&status=&limit=&include_items=1
router.get('/purchase-orders', async (req, res) => {
  try {
    const { search, status, limit, include_items } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (status) { where += ' AND po.status = ?'; params.push(status); }
    if (search) {
      where += ' AND (po.order_number LIKE ? OR c.name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s);
    }
    const lim = Math.min(parseInt(limit) || 200, 500);
    const [rows] = await db.execute(
      `SELECT po.*, c.name AS company_name
         FROM purchase_orders po
         LEFT JOIN companies c ON c.id = po.company_id
        ${where}
        ORDER BY po.created_at DESC
        LIMIT ${lim}`,
      params,
    );

    let itemsByOrder = new Map();
    if (include_items === '1' || include_items === 'true') {
      const ids = rows.map(r => r.id);
      if (ids.length) {
        const [items] = await db.query(
          `SELECT * FROM purchase_order_items WHERE purchase_order_id IN (?)`,
          [ids],
        );
        for (const it of items) {
          if (!itemsByOrder.has(it.purchase_order_id)) itemsByOrder.set(it.purchase_order_id, []);
          itemsByOrder.get(it.purchase_order_id).push(it);
        }
      }
    }

    res.json({
      purchase_orders: rows.map(r => shapeOrder(r, itemsByOrder.get(r.id))),
    });
  } catch (err) {
    console.error('List purchase orders error:', err);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// GET /api/purchase-orders/:id (with items)
router.get('/purchase-orders/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT po.*, c.name AS company_name
         FROM purchase_orders po
         LEFT JOIN companies c ON c.id = po.company_id
        WHERE po.id = ?`,
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'Purchase order not found' });
    const [items] = await db.execute(
      'SELECT * FROM purchase_order_items WHERE purchase_order_id = ?',
      [req.params.id],
    );
    res.json({ purchase_order: shapeOrder(rows[0], items) });
  } catch (err) {
    console.error('Get purchase order error:', err);
    res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
});

// POST /api/purchase-orders  { order: {...}, items: [...] }
router.post('/purchase-orders', authenticateToken, requireAdmin, async (req, res) => {
  const orderIn = pick(req.body?.order || {}, ORDER_FIELDS);
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ error: 'At least one item is required' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const orderNumber = req.body?.order?.order_number || (await generateOrderNumber(conn));

    const cols = ['order_number', ...Object.keys(orderIn)];
    const vals = [orderNumber, ...Object.values(orderIn)];
    const sql = `INSERT INTO purchase_orders (${cols.join(',')})
                 VALUES (${cols.map(() => '?').join(',')})`;
    const [result] = await conn.execute(sql, vals);
    const orderId = result.insertId;

    for (const it of items) {
      await conn.execute(
        `INSERT INTO purchase_order_items
           (purchase_order_id, product_id, quantity, unit_cost, total_cost)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, it.product_id, it.quantity, it.unit_cost, it.total_cost],
      );
    }

    await conn.commit();
    const [rows] = await conn.execute(
      `SELECT po.*, c.name AS company_name
         FROM purchase_orders po
         LEFT JOIN companies c ON c.id = po.company_id
        WHERE po.id = ?`,
      [orderId],
    );
    const [outItems] = await conn.execute(
      'SELECT * FROM purchase_order_items WHERE purchase_order_id = ?',
      [orderId],
    );
    res.status(201).json({ purchase_order: shapeOrder(rows[0], outItems) });
  } catch (err) {
    try { await conn.rollback(); } catch (_) { /* ignore */ }
    console.error('Create purchase order error:', err);
    res.status(500).json({ error: 'Failed to create purchase order' });
  } finally {
    conn.release();
  }
});

// PATCH /api/purchase-orders/:id  (status/notes updates)
router.patch('/purchase-orders/:id', authenticateToken, requireAdmin, async (req, res) => {
  const data = pick(req.body || {}, ORDER_FIELDS);
  if (!Object.keys(data).length) return res.status(400).json({ error: 'No fields to update' });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const set = Object.keys(data).map(k => `${k} = ?`).join(', ');
    await conn.execute(
      `UPDATE purchase_orders SET ${set} WHERE id = ?`,
      [...Object.values(data), req.params.id],
    );

    // Stock update when marking as received
    if (data.status === 'received') {
      const [items] = await conn.execute(
        'SELECT * FROM purchase_order_items WHERE purchase_order_id = ?',
        [req.params.id],
      );
      for (const it of items) {
        const [pr] = await conn.execute(
          'SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE',
          [it.product_id],
        );
        if (!pr.length) continue;
        const prev = Number(pr[0].stock_quantity) || 0;
        const next = prev + Number(it.quantity);
        await conn.execute(
          'UPDATE products SET stock_quantity = ? WHERE id = ?',
          [next, it.product_id],
        );
        await conn.execute(
          `INSERT INTO stock_adjustments
             (product_id, adjustment_type, quantity_change, previous_quantity, new_quantity,
              reference_type, reference_id, notes)
           VALUES (?, 'purchase', ?, ?, ?, 'purchase_order', ?, ?)`,
          [it.product_id, it.quantity, prev, next, String(req.params.id),
           `Purchase Order received`],
        );
      }
      await conn.execute(
        'UPDATE purchase_orders SET received_date = CURRENT_DATE WHERE id = ?',
        [req.params.id],
      );
    }

    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch (_) { /* ignore */ }
    console.error('Update purchase order error:', err);
    res.status(500).json({ error: 'Failed to update purchase order' });
  } finally {
    conn.release();
  }
});

// DELETE /api/purchase-orders/:id
router.delete('/purchase-orders/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM purchase_orders WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete purchase order error:', err);
    res.status(500).json({ error: 'Failed to delete purchase order' });
  }
});

module.exports = router;