const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ===================== FARMER PONDS =====================

// Get user's ponds
router.get('/ponds', authenticateToken, async (req, res) => {
  try {
    const userId = req.query.user_id && req.user.role === 'admin' ? req.query.user_id : req.user.id;
    const [ponds] = await db.execute(
      'SELECT * FROM farmer_ponds WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({ data: ponds });
  } catch (error) {
    console.error('Get ponds error:', error);
    res.status(500).json({ error: 'Failed to fetch ponds' });
  }
});

// Create pond
router.post('/ponds', authenticateToken, async (req, res) => {
  try {
    const { name, area, area_unit, depth, depth_unit, fish_types, fish_count, stocking_date, fish_stock_entries, total_stocking_cost, notes } = req.body;
    const [result] = await db.execute(
      `INSERT INTO farmer_ponds (user_id, name, area, area_unit, depth, depth_unit, fish_types, fish_count, stocking_date, fish_stock_entries, total_stocking_cost, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, area || 0, area_unit || 'শতক', depth || 0, depth_unit || 'ফুট',
       JSON.stringify(fish_types || []), fish_count || 0, stocking_date || null,
       JSON.stringify(fish_stock_entries || []), total_stocking_cost || 0, notes || null]
    );
    const [newPond] = await db.execute('SELECT * FROM farmer_ponds WHERE id = ?', [result.insertId]);
    res.status(201).json({ data: newPond[0] });
  } catch (error) {
    console.error('Create pond error:', error);
    res.status(500).json({ error: 'Failed to create pond' });
  }
});

// Update pond
router.put('/ponds/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const updates = [];
    const params = [];

    const allowedFields = ['name', 'area', 'area_unit', 'depth', 'depth_unit', 'fish_count', 'stocking_date', 'total_stocking_cost', 'status', 'notes'];
    for (const key of allowedFields) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(fields[key]);
      }
    }
    // JSON fields
    if (fields.fish_types !== undefined) { updates.push('fish_types = ?'); params.push(JSON.stringify(fields.fish_types)); }
    if (fields.fish_stock_entries !== undefined) { updates.push('fish_stock_entries = ?'); params.push(JSON.stringify(fields.fish_stock_entries)); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(id, req.user.id);
    await db.execute(`UPDATE farmer_ponds SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);
    const [updated] = await db.execute('SELECT * FROM farmer_ponds WHERE id = ?', [id]);
    res.json({ data: updated[0] });
  } catch (error) {
    console.error('Update pond error:', error);
    res.status(500).json({ error: 'Failed to update pond' });
  }
});

// Delete pond
router.delete('/ponds/:id', authenticateToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM farmer_ponds WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Pond deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete pond' });
  }
});

// ===================== FARMER INCOMES =====================

router.get('/incomes', authenticateToken, async (req, res) => {
  try {
    const userId = req.query.user_id && req.user.role === 'admin' ? req.query.user_id : req.user.id;
    const [incomes] = await db.execute(
      'SELECT * FROM farmer_incomes WHERE user_id = ? ORDER BY date DESC',
      [userId]
    );
    res.json({ data: incomes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch incomes' });
  }
});

router.post('/incomes', authenticateToken, async (req, res) => {
  try {
    const { date, category, description, amount, pond_name, fish_type, fish_weight, fish_price } = req.body;
    const [result] = await db.execute(
      `INSERT INTO farmer_incomes (user_id, date, category, description, amount, pond_name, fish_type, fish_weight, fish_price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, date || new Date().toISOString().slice(0, 10), category || 'মাছ বিক্রয়',
       description || null, amount || 0, pond_name || null, fish_type || null, fish_weight || null, fish_price || null]
    );
    const [newIncome] = await db.execute('SELECT * FROM farmer_incomes WHERE id = ?', [result.insertId]);
    res.status(201).json({ data: newIncome[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create income' });
  }
});

router.delete('/incomes/:id', authenticateToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM farmer_incomes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Income deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete income' });
  }
});

// ===================== FARMER EXPENSES =====================

router.get('/expenses', authenticateToken, async (req, res) => {
  try {
    const userId = req.query.user_id && req.user.role === 'admin' ? req.query.user_id : req.user.id;
    const [expenses] = await db.execute(
      'SELECT * FROM farmer_expenses WHERE user_id = ? ORDER BY date DESC',
      [userId]
    );
    res.json({ data: expenses });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.post('/expenses', authenticateToken, async (req, res) => {
  try {
    const { date, category, description, amount, pond_name } = req.body;
    const [result] = await db.execute(
      `INSERT INTO farmer_expenses (user_id, date, category, description, amount, pond_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, date || new Date().toISOString().slice(0, 10), category || 'খাবার',
       description || null, amount || 0, pond_name || null]
    );
    const [newExpense] = await db.execute('SELECT * FROM farmer_expenses WHERE id = ?', [result.insertId]);
    res.status(201).json({ data: newExpense[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.delete('/expenses/:id', authenticateToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM farmer_expenses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// ===================== FARMER SAMPLINGS =====================

router.get('/samplings', authenticateToken, async (req, res) => {
  try {
    const userId = req.query.user_id && req.user.role === 'admin' ? req.query.user_id : req.user.id;
    const [samplings] = await db.execute(
      'SELECT * FROM farmer_samplings WHERE user_id = ? ORDER BY date DESC',
      [userId]
    );
    res.json({ data: samplings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch samplings' });
  }
});

router.post('/samplings', authenticateToken, async (req, res) => {
  try {
    const { pond_id, pond_name, date, fish_entries, total_fish, total_weight, avg_weight, notes } = req.body;
    const [result] = await db.execute(
      `INSERT INTO farmer_samplings (user_id, pond_id, pond_name, date, fish_entries, total_fish, total_weight, avg_weight, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, pond_id || null, pond_name, date || new Date().toISOString().slice(0, 10),
       JSON.stringify(fish_entries || []), total_fish || 0, total_weight || 0, avg_weight || 0, notes || null]
    );
    const [newSampling] = await db.execute('SELECT * FROM farmer_samplings WHERE id = ?', [result.insertId]);
    res.status(201).json({ data: newSampling[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create sampling' });
  }
});

router.delete('/samplings/:id', authenticateToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM farmer_samplings WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Sampling deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sampling' });
  }
});

// ===================== DASHBOARD SETTINGS =====================

// ===================== FARMING ALERTS =====================

router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const userId = req.query.user_id && req.user.role === 'admin' ? req.query.user_id : req.user.id;
    const [alerts] = await db.execute(
      `SELECT * FROM farming_alerts
         WHERE user_id = ? OR is_global = 1
         ORDER BY alert_date DESC, alert_time DESC`,
      [userId]
    );
    res.json({ data: alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

router.post('/alerts', authenticateToken, async (req, res) => {
  try {
    const b = req.body || {};
    const [result] = await db.execute(
      `INSERT INTO farming_alerts
        (user_id, created_by, pond_id, pond_name, title, title_bn, message, message_bn,
         alert_type, fish_species, alert_date, alert_time, priority, status, channels,
         is_global, is_recurring, recurrence_interval)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        b.user_id ?? req.user.id,
        req.user.id,
        b.pond_id ?? null,
        b.pond_name ?? null,
        b.title,
        b.title_bn ?? null,
        b.message,
        b.message_bn ?? null,
        b.alert_type ?? 'general',
        b.fish_species ?? null,
        b.alert_date || new Date().toISOString().slice(0, 10),
        b.alert_time ?? null,
        b.priority ?? 'medium',
        b.status ?? 'pending',
        JSON.stringify(b.channels ?? []),
        b.is_global ? 1 : 0,
        b.is_recurring ? 1 : 0,
        b.recurrence_interval ?? null,
      ]
    );
    const [rows] = await db.execute('SELECT * FROM farming_alerts WHERE id = ?', [result.insertId]);
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

router.put('/alerts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body || {};
    const allowed = [
      'pond_id', 'pond_name', 'title', 'title_bn', 'message', 'message_bn',
      'alert_type', 'fish_species', 'alert_date', 'alert_time',
      'priority', 'status', 'is_global', 'is_recurring', 'recurrence_interval',
    ];
    const updates = [];
    const params = [];
    for (const k of allowed) {
      if (fields[k] !== undefined) {
        updates.push(`${k} = ?`);
        params.push(fields[k]);
      }
    }
    if (fields.channels !== undefined) {
      updates.push('channels = ?');
      params.push(JSON.stringify(fields.channels));
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    params.push(id, req.user.id);
    await db.execute(
      `UPDATE farming_alerts SET ${updates.join(', ')}
         WHERE id = ? AND (user_id = ? OR is_global = 1)`,
      params
    );
    const [rows] = await db.execute('SELECT * FROM farming_alerts WHERE id = ?', [id]);
    res.json({ data: rows[0] });
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

router.delete('/alerts/:id', authenticateToken, async (req, res) => {
  try {
    await db.execute(
      'DELETE FROM farming_alerts WHERE id = ? AND (user_id = ? OR is_global = 1)',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Alert deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

// ===================== DASHBOARD SETTINGS =====================

router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute('SELECT dashboard_settings FROM users WHERE id = ?', [req.user.id]);
    res.json({ data: users[0]?.dashboard_settings || null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const { settings } = req.body;
    await db.execute('UPDATE users SET dashboard_settings = ? WHERE id = ?', [JSON.stringify(settings), req.user.id]);
    res.json({ message: 'Settings saved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// ===================== ADMIN: ALL FARMER DATA =====================

router.get('/admin/user-dashboard/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const [ponds] = await db.execute('SELECT * FROM farmer_ponds WHERE user_id = ?', [userId]);
    const [incomes] = await db.execute('SELECT * FROM farmer_incomes WHERE user_id = ?', [userId]);
    const [expenses] = await db.execute('SELECT * FROM farmer_expenses WHERE user_id = ?', [userId]);
    const [samplings] = await db.execute('SELECT * FROM farmer_samplings WHERE user_id = ?', [userId]);

    const totalIncome = incomes.reduce((s, i) => s + parseFloat(i.amount), 0);
    const totalExpense = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    const totalFish = ponds.reduce((s, p) => s + (p.fish_count || 0), 0);

    res.json({
      ponds,
      incomes,
      expenses,
      samplings,
      summary: {
        pondCount: ponds.length,
        activePonds: ponds.filter(p => p.status === 'active').length,
        totalFish,
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user dashboard data' });
  }
});

module.exports = router;
