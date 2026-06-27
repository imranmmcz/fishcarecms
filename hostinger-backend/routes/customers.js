const express = require('express');
const crypto = require('crypto');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { normalizePhone } = require('../utils/phone');

const router = express.Router();

/**
 * Customers API — matches the front-end customersRepo facade
 * (src/repositories/customers.ts). Admin/staff only.
 */

const ALLOWED_FIELDS = [
  'customer_name',
  'customer_phone',
  'customer_email',
  'division',
  'district',
  'upazila',
  'village',
  'shipping_address',
  'notes',
];

function pickFields(body) {
  const out = {};
  for (const k of ALLOWED_FIELDS) {
    if (body[k] !== undefined) out[k] = body[k] === '' ? null : body[k];
  }
  return out;
}

/**
 * Ensure `customer_phone_normalized` mirrors `customer_phone` on every
 * write. The DB unique index lives on the normalized column, so this is
 * what makes "01712345678", "+8801712345678", "8801712345678" and
 * " 017-1234-5678 " all dedupe to the same customer.
 */
function withNormalizedPhone(data) {
  if (data.customer_phone !== undefined) {
    data.customer_phone_normalized = normalizePhone(data.customer_phone);
  }
  return data;
}

// GET /api/customers?search=&limit=&offset=
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    const limit = Math.min(parseInt(req.query.limit ?? '1000', 10) || 1000, 5000);
    const offset = parseInt(req.query.offset ?? '0', 10) || 0;

    let where = 'WHERE 1=1';
    const params = [];
    if (search) {
      // Match on raw phone, normalized phone (so "+8801..." finds "017...")
      // and name / email.
      const s = `%${search}%`;
      const normalized = normalizePhone(search);
      const nLike = normalized ? `%${normalized}%` : null;
      if (nLike) {
        where +=
          ' AND (customer_name LIKE ? OR customer_phone LIKE ? OR customer_phone_normalized LIKE ? OR customer_email LIKE ?)';
        params.push(s, s, nLike, s);
      } else {
        where += ' AND (customer_name LIKE ? OR customer_phone LIKE ? OR customer_email LIKE ?)';
        params.push(s, s, s);
      }
    }

    const [rows] = await db.execute(
      `SELECT * FROM customers ${where} ORDER BY customer_name ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [countRows] = await db.execute(
      `SELECT COUNT(*) as total FROM customers ${where}`,
      params
    );

    res.json({ customers: rows, total: countRows[0].total, limit, offset });
  } catch (err) {
    console.error('Get customers error:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /api/customers/:id
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM customers WHERE id = ? LIMIT 1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ customer: rows[0] });
  } catch (err) {
    console.error('Get customer error:', err);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// POST /api/customers           -> create
// POST /api/customers?upsert=phone -> upsert by customer_phone
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const data = withNormalizedPhone(pickFields(req.body || {}));
    if (!data.customer_name || !data.customer_phone) {
      return res.status(400).json({ error: 'customer_name and customer_phone are required' });
    }
    if (!data.customer_phone_normalized) {
      return res.status(400).json({ error: 'customer_phone must contain digits' });
    }

    const upsert = String(req.query.upsert || '').toLowerCase() === 'phone';
    const id = crypto.randomUUID();
    const cols = ['id', ...Object.keys(data)];
    const placeholders = cols.map(() => '?').join(', ');
    const values = [id, ...Object.values(data)];

    let sql = `INSERT INTO customers (${cols.join(', ')}) VALUES (${placeholders})`;
    if (upsert) {
      const updates = Object.keys(data)
        .filter((k) => k !== 'customer_phone_normalized')
        .map((k) => `${k} = VALUES(${k})`)
        .join(', ');
      sql += updates
        ? ` ON DUPLICATE KEY UPDATE ${updates}`
        : ' ON DUPLICATE KEY UPDATE customer_phone_normalized = customer_phone_normalized';
    }

    try {
      await db.execute(sql, values);
    } catch (err) {
      if (err && err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Customer with this phone already exists' });
      }
      throw err;
    }

    const [rows] = await db.execute(
      'SELECT * FROM customers WHERE customer_phone_normalized = ? LIMIT 1',
      [data.customer_phone_normalized]
    );
    res.status(201).json({ customer: rows[0] });
  } catch (err) {
    console.error('Create customer error:', err);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// PUT /api/customers/:id
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const data = withNormalizedPhone(pickFields(req.body || {}));
    const keys = Object.keys(data);
    if (keys.length === 0) return res.status(400).json({ error: 'No updatable fields provided' });
    if (
      data.customer_phone !== undefined &&
      !data.customer_phone_normalized
    ) {
      return res.status(400).json({ error: 'customer_phone must contain digits' });
    }

    const setSql = keys.map((k) => `${k} = ?`).join(', ');
    const [result] = await db.execute(
      `UPDATE customers SET ${setSql} WHERE id = ?`,
      [...Object.values(data), req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Customer not found' });

    const [rows] = await db.execute('SELECT * FROM customers WHERE id = ? LIMIT 1', [req.params.id]);
    res.json({ customer: rows[0] });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Customer with this phone already exists' });
    }
    console.error('Update customer error:', err);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM customers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete customer error:', err);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;