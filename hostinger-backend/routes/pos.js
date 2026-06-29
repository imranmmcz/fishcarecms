const express = require('express');
const crypto = require('crypto');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const uuid = () => crypto.randomUUID();

function isAdmin(req) {
  return req.user && req.user.role === 'admin';
}

// ---------- numbering helpers ----------
async function nextSaleNumber() {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
  const [[row]] = await db.query('SELECT COUNT(*) AS c FROM pos_sales');
  return `POS-${ymd}-${String((row.c || 0) + 1).padStart(4, '0')}`;
}

async function nextShiftNumber() {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
  const [[row]] = await db.query('SELECT COUNT(*) AS c FROM pos_shifts');
  return `SHIFT-${ymd}-${String((row.c || 0) + 1).padStart(3, '0')}`;
}

// =========================================================================
// SHIFTS
// =========================================================================

router.get('/shifts', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;
    const where = [];
    const params = [];
    if (!isAdmin(req)) { where.push('user_id = ?'); params.push(req.user.id); }
    if (status) { where.push('status = ?'); params.push(status); }
    const sql = `SELECT * FROM pos_shifts ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY opened_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    const [rows] = await db.execute(sql, params);
    res.json({ shifts: rows });
  } catch (e) {
    console.error('list shifts', e);
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
});

router.get('/shifts/active', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM pos_shifts WHERE user_id = ? AND status = 'open' ORDER BY opened_at DESC LIMIT 1`,
      [req.user.id]
    );
    res.json({ shift: rows[0] || null });
  } catch (e) {
    console.error('active shift', e);
    res.status(500).json({ error: 'Failed to fetch active shift' });
  }
});

router.post('/shifts/open', authenticateToken, async (req, res) => {
  try {
    const { opening_amount = 0, notes = null } = req.body || {};
    const [active] = await db.execute(
      `SELECT id FROM pos_shifts WHERE user_id = ? AND status = 'open' LIMIT 1`,
      [req.user.id]
    );
    if (active.length) return res.status(400).json({ error: 'An open shift already exists' });
    const id = uuid();
    const shiftNumber = await nextShiftNumber();
    await db.execute(
      `INSERT INTO pos_shifts (id, shift_number, user_id, status, opening_amount, notes)
       VALUES (?, ?, ?, 'open', ?, ?)`,
      [id, shiftNumber, req.user.id, Number(opening_amount) || 0, notes]
    );
    const [rows] = await db.execute('SELECT * FROM pos_shifts WHERE id = ?', [id]);
    res.status(201).json({ shift: rows[0] });
  } catch (e) {
    console.error('open shift', e);
    res.status(500).json({ error: 'Failed to open shift' });
  }
});

router.patch('/shifts/:id/close', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { closing_amount = 0, notes = null } = req.body || {};
    const [rows] = await db.execute('SELECT * FROM pos_shifts WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Shift not found' });
    const shift = rows[0];
    if (!isAdmin(req) && shift.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (shift.status === 'closed') return res.status(400).json({ error: 'Shift already closed' });

    // Aggregate sales for this shift
    const [[agg]] = await db.query(
      `SELECT
         COUNT(*) AS cnt,
         COALESCE(SUM(total_amount),0) AS total_sales,
         COALESCE(SUM(CASE WHEN payment_method='cash' THEN total_amount ELSE 0 END),0) AS cash_sales,
         COALESCE(SUM(CASE WHEN payment_method IN ('bkash','nagad','rocket','mobile_banking') THEN total_amount ELSE 0 END),0) AS mb_sales
       FROM pos_sales WHERE shift_id = ?`,
      [id]
    );
    const expected = Number(shift.opening_amount || 0) + Number(agg.cash_sales || 0);

    await db.execute(
      `UPDATE pos_shifts SET status='closed', closing_amount=?, expected_amount=?,
         cash_sales=?, mobile_banking_sales=?, total_sales=?, total_transactions=?,
         notes=COALESCE(?, notes), closed_at=NOW() WHERE id = ?`,
      [Number(closing_amount) || 0, expected, agg.cash_sales, agg.mb_sales,
       agg.total_sales, agg.cnt, notes, id]
    );
    const [out] = await db.execute('SELECT * FROM pos_shifts WHERE id = ?', [id]);
    res.json({ shift: out[0] });
  } catch (e) {
    console.error('close shift', e);
    res.status(500).json({ error: 'Failed to close shift' });
  }
});

// =========================================================================
// SALES (+ items)
// =========================================================================

router.get('/sales', authenticateToken, async (req, res) => {
  try {
    const { date_from, date_to, status, shift_id, customer_phone,
            include_items, limit = 100, offset = 0, search } = req.query;
    const where = [];
    const params = [];
    if (!isAdmin(req)) { where.push('user_id = ?'); params.push(req.user.id); }
    if (status) { where.push('status = ?'); params.push(status); }
    if (shift_id) { where.push('shift_id = ?'); params.push(shift_id); }
    if (customer_phone) { where.push('customer_phone = ?'); params.push(customer_phone); }
    if (date_from) { where.push('created_at >= ?'); params.push(date_from); }
    if (date_to) { where.push('created_at <= ?'); params.push(date_to); }
    if (search) {
      const s = `%${String(search).toLowerCase()}%`;
      where.push(`(LOWER(sale_number) LIKE ? OR LOWER(COALESCE(customer_name,'')) LIKE ? OR LOWER(COALESCE(customer_phone,'')) LIKE ?)`);
      params.push(s, s, s);
    }
    const sql = `SELECT * FROM pos_sales ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    const [sales] = await db.execute(sql, params);

    if ((include_items === '1' || include_items === 'true') && sales.length) {
      const ids = sales.map(s => s.id);
      const placeholders = ids.map(() => '?').join(',');
      const [items] = await db.execute(
        `SELECT * FROM pos_sale_items WHERE sale_id IN (${placeholders})`,
        ids
      );
      const byId = items.reduce((acc, it) => {
        (acc[it.sale_id] = acc[it.sale_id] || []).push(it);
        return acc;
      }, {});
      sales.forEach(s => { s.items = byId[s.id] || []; });
    }

    res.json({ sales });
  } catch (e) {
    console.error('list sales', e);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

router.get('/sales/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute('SELECT * FROM pos_sales WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Sale not found' });
    const sale = rows[0];
    if (!isAdmin(req) && sale.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const [items] = await db.execute('SELECT * FROM pos_sale_items WHERE sale_id = ?', [id]);
    const [dues] = await db.execute('SELECT * FROM pos_due_payments WHERE sale_id = ? ORDER BY created_at DESC', [id]);
    sale.items = items;
    sale.due_payments = dues;
    res.json({ sale });
  } catch (e) {
    console.error('get sale', e);
    res.status(500).json({ error: 'Failed to fetch sale' });
  }
});

router.post('/sales', authenticateToken, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const {
      items = [],
      customer_name = null, customer_phone = null,
      discount_amount = 0,
      paid_amount = 0,
      change_amount = 0,
      payment_method = 'cash',
      payment_type = 'full',
      mobile_banking_provider = null,
      mobile_banking_number = null,
      transaction_id = null,
      shift_id = null,
      notes = null,
      status = 'completed',
    } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Sale must have at least one item' });
    }

    let subtotal = 0;
    const prepared = [];
    for (const it of items) {
      const qty = Number(it.quantity) || 0;
      const unit = Number(it.unit_price) || 0;
      const disc = Number(it.discount_percentage) || 0;
      const total = unit * qty * (1 - disc / 100);
      subtotal += total;
      prepared.push({
        id: uuid(),
        product_id: String(it.product_id),
        product_name: String(it.product_name || ''),
        quantity: qty,
        unit_price: unit,
        discount_percentage: disc,
        total_price: total,
      });
    }
    const totalAmount = Math.max(subtotal - Number(discount_amount || 0), 0);
    const paid = Number(paid_amount || 0);
    const due = Math.max(totalAmount - paid, 0);

    const id = uuid();
    const saleNumber = await nextSaleNumber();
    await conn.execute(
      `INSERT INTO pos_sales (
         id, sale_number, user_id, shift_id, customer_name, customer_phone,
         subtotal, discount_amount, total_amount, paid_amount, due_amount, change_amount,
         payment_method, payment_type, mobile_banking_provider, mobile_banking_number,
         transaction_id, status, notes
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, saleNumber, req.user.id, shift_id, customer_name, customer_phone,
       subtotal, Number(discount_amount) || 0, totalAmount, paid, due,
       Number(change_amount) || 0, payment_method, payment_type,
       mobile_banking_provider, mobile_banking_number, transaction_id, status, notes]
    );

    for (const it of prepared) {
      await conn.execute(
        `INSERT INTO pos_sale_items
           (id, sale_id, product_id, product_name, quantity, unit_price, discount_percentage, total_price)
         VALUES (?,?,?,?,?,?,?,?)`,
        [it.id, id, it.product_id, it.product_name, it.quantity,
         it.unit_price, it.discount_percentage, it.total_price]
      );
      // Best-effort stock decrement (matches order behavior). Out-of-stock allowed.
      try {
        await conn.execute(
          `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`,
          [it.quantity, it.product_id]
        );
      } catch (_) { /* ignore if product table absent in lean installs */ }
    }

    await conn.commit();
    const [out] = await db.execute('SELECT * FROM pos_sales WHERE id = ?', [id]);
    res.status(201).json({ sale: out[0] });
  } catch (e) {
    await conn.rollback();
    console.error('create sale', e);
    res.status(500).json({ error: 'Failed to create sale' });
  } finally {
    conn.release();
  }
});

router.delete('/sales/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM pos_sales WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('delete sale', e);
    res.status(500).json({ error: 'Failed to delete sale' });
  }
});

// ---- due payments ----
router.post('/sales/:id/due-payments', authenticateToken, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id: saleId } = req.params;
    const { amount, payment_method = 'cash', mobile_banking_provider = null,
            transaction_id = null, notes = null } = req.body || {};
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    const [sales] = await conn.execute('SELECT * FROM pos_sales WHERE id = ? FOR UPDATE', [saleId]);
    if (!sales.length) { await conn.rollback(); return res.status(404).json({ error: 'Sale not found' }); }
    const sale = sales[0];

    const id = uuid();
    await conn.execute(
      `INSERT INTO pos_due_payments (id, sale_id, amount, payment_method, mobile_banking_provider, transaction_id, notes, collected_by)
       VALUES (?,?,?,?,?,?,?,?)`,
      [id, saleId, amt, payment_method, mobile_banking_provider, transaction_id, notes, req.user.id]
    );
    const newPaid = Number(sale.paid_amount || 0) + amt;
    const newDue = Math.max(Number(sale.total_amount || 0) - newPaid, 0);
    await conn.execute(
      `UPDATE pos_sales SET paid_amount = ?, due_amount = ? WHERE id = ?`,
      [newPaid, newDue, saleId]
    );
    await conn.commit();
    res.status(201).json({ payment: { id, sale_id: saleId, amount: amt }, paid_amount: newPaid, due_amount: newDue });
  } catch (e) {
    await conn.rollback();
    console.error('add due payment', e);
    res.status(500).json({ error: 'Failed to record payment' });
  } finally {
    conn.release();
  }
});

// =========================================================================
// EXPENSE CATEGORIES
// =========================================================================

router.get('/expense-categories', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM pos_expense_categories ORDER BY name');
    res.json({ categories: rows });
  } catch (e) {
    console.error('list expense categories', e);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/expense-categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, name_bn, description = null, is_active = true } = req.body || {};
    if (!name || !name_bn) return res.status(400).json({ error: 'name and name_bn required' });
    const id = uuid();
    await db.execute(
      `INSERT INTO pos_expense_categories (id, name, name_bn, description, is_active) VALUES (?,?,?,?,?)`,
      [id, name, name_bn, description, is_active ? 1 : 0]
    );
    const [rows] = await db.execute('SELECT * FROM pos_expense_categories WHERE id = ?', [id]);
    res.status(201).json({ category: rows[0] });
  } catch (e) {
    console.error('create category', e);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.patch('/expense-categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['name', 'name_bn', 'description', 'is_active'];
    const sets = [], params = [];
    for (const k of allowed) {
      if (k in req.body) {
        sets.push(`${k} = ?`);
        params.push(k === 'is_active' ? (req.body[k] ? 1 : 0) : req.body[k]);
      }
    }
    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
    params.push(id);
    await db.execute(`UPDATE pos_expense_categories SET ${sets.join(', ')} WHERE id = ?`, params);
    const [rows] = await db.execute('SELECT * FROM pos_expense_categories WHERE id = ?', [id]);
    res.json({ category: rows[0] });
  } catch (e) {
    console.error('update category', e);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/expense-categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM pos_expense_categories WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('delete category', e);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// =========================================================================
// EXPENSES
// =========================================================================

router.get('/expenses', authenticateToken, async (req, res) => {
  try {
    const { date_from, date_to, category_id, limit = 200, offset = 0 } = req.query;
    const where = [];
    const params = [];
    if (!isAdmin(req)) { where.push('e.user_id = ?'); params.push(req.user.id); }
    if (category_id) { where.push('e.category_id = ?'); params.push(category_id); }
    if (date_from) { where.push('e.expense_date >= ?'); params.push(date_from); }
    if (date_to) { where.push('e.expense_date <= ?'); params.push(date_to); }
    const sql = `
      SELECT e.*,
             c.id AS category__id, c.name AS category__name, c.name_bn AS category__name_bn,
             c.is_active AS category__is_active
      FROM pos_expenses e
      LEFT JOIN pos_expense_categories c ON c.id = e.category_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY e.expense_date DESC, e.created_at DESC
      LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    const [rows] = await db.execute(sql, params);
    const expenses = rows.map((r) => {
      const category = r.category__id ? {
        id: r.category__id, name: r.category__name,
        name_bn: r.category__name_bn, is_active: !!r.category__is_active,
      } : null;
      const { category__id, category__name, category__name_bn, category__is_active, ...rest } = r;
      return { ...rest, category };
    });
    res.json({ expenses });
  } catch (e) {
    console.error('list expenses', e);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.post('/expenses', authenticateToken, async (req, res) => {
  try {
    const { category_id = null, amount, description = null, expense_date,
            payment_method = 'cash', reference_no = null } = req.body || {};
    const amt = Number(amount);
    if (!amt || amt <= 0) return res.status(400).json({ error: 'Amount must be positive' });
    if (!expense_date) return res.status(400).json({ error: 'expense_date required' });
    const id = uuid();
    await db.execute(
      `INSERT INTO pos_expenses (id, user_id, category_id, amount, description, expense_date, payment_method, reference_no)
       VALUES (?,?,?,?,?,?,?,?)`,
      [id, req.user.id, category_id, amt, description, expense_date, payment_method, reference_no]
    );
    const [rows] = await db.execute('SELECT * FROM pos_expenses WHERE id = ?', [id]);
    res.status(201).json({ expense: rows[0] });
  } catch (e) {
    console.error('create expense', e);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.delete('/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute('SELECT user_id FROM pos_expenses WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Expense not found' });
    if (!isAdmin(req) && rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await db.execute('DELETE FROM pos_expenses WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('delete expense', e);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

module.exports = router;