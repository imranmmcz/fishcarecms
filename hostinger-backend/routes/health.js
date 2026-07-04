const express = require('express');
const os = require('os');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getLatencySummary, getRecentErrors } = require('../middleware/metrics');

const router = express.Router();

const COUNT_TABLES = [
  'products',
  'product_variations',
  'categories',
  'brands',
  'customers',
  'orders',
  'order_items',
  'pos_sales',
  'pos_sale_items',
  'pos_shifts',
  'pos_expenses',
  'stock_adjustments',
  'purchase_orders',
  'purchase_order_items',
];

router.get('/summary', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    // Pool stats (mysql2 exposes internal counters)
    let pool = {};
    try {
      const p = db.pool || db;
      pool = {
        connectionLimit: p.config && p.config.connectionLimit,
        allConnections: (p._allConnections && p._allConnections.length) || 0,
        freeConnections: (p._freeConnections && p._freeConnections.length) || 0,
        queue: (p._connectionQueue && p._connectionQueue.length) || 0,
      };
    } catch { /* ignore */ }

    // Latency probe
    const t0 = Date.now();
    await db.query('SELECT 1');
    const dbPingMs = Date.now() - t0;

    // Row counts (per table, silently skip missing tables)
    const counts = {};
    for (const t of COUNT_TABLES) {
      try {
        const [rows] = await db.query(`SELECT COUNT(*) AS c FROM \`${t}\``);
        counts[t] = rows[0].c;
      } catch {
        counts[t] = null;
      }
    }

    const mem = process.memoryUsage();
    res.json({
      status: 'ok',
      server: {
        uptime_s: Math.round(process.uptime()),
        node: process.version,
        env: process.env.NODE_ENV || 'development',
        memory: {
          rss_mb: Math.round(mem.rss / 1024 / 1024),
          heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
          heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
        },
        load_avg: os.loadavg(),
      },
      database: {
        ping_ms: dbPingMs,
        pool,
        row_counts: counts,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    next(e);
  }
});

router.get('/recent-errors', authenticateToken, requireAdmin, (req, res) => {
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
  res.json({ errors: getRecentErrors(limit) });
});

router.get('/latency', authenticateToken, requireAdmin, (req, res) => {
  res.json(getLatencySummary());
});

module.exports = router;