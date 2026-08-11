/**
 * Bulk data migration endpoints (Supabase → MySQL).
 *
 * The client pulls paginated rows from Supabase and POSTs batches here.
 * We whitelist columns per module and use INSERT ... ON DUPLICATE KEY UPDATE
 * so re-running the migration is idempotent (safe to retry).
 */
const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

// Per-module column whitelist. Only these columns are copied.
const MODULES = {
  products: {
    table: 'products',
    columns: ['id', 'name', 'name_bn', 'description', 'price', 'cost_price', 'stock_quantity', 'category', 'brand', 'image_url', 'sku', 'unit', 'is_active', 'created_at', 'updated_at'],
  },
  product_variations: {
    table: 'product_variations',
    columns: ['id', 'product_id', 'variation_name', 'sku', 'price', 'cost_price', 'stock_quantity', 'unit', 'weight_value', 'is_active', 'created_at', 'updated_at'],
  },
  categories: {
    table: 'categories',
    columns: ['id', 'name', 'name_bn', 'slug', 'description', 'image_url', 'parent_id', 'sort_order', 'is_active', 'created_at', 'updated_at'],
  },
  brands: {
    table: 'brands',
    columns: ['id', 'name', 'name_bn', 'slug', 'description', 'logo_url', 'is_active', 'created_at', 'updated_at'],
  },
  customers: {
    table: 'customers',
    columns: ['id', 'name', 'phone', 'email', 'address', 'city', 'notes', 'total_purchases', 'total_due', 'created_at', 'updated_at'],
  },
  orders: {
    table: 'orders',
    columns: ['id', 'order_number', 'user_id', 'customer_name', 'customer_email', 'customer_phone', 'shipping_address', 'subtotal', 'discount_amount', 'delivery_charge', 'total_amount', 'status', 'payment_method', 'payment_status', 'notes', 'created_at', 'updated_at'],
  },
  order_items: {
    table: 'order_items',
    columns: ['id', 'order_id', 'product_id', 'product_name', 'quantity', 'unit_price', 'total_price', 'created_at'],
  },
  pos_sales: {
    table: 'pos_sales',
    columns: ['id', 'sale_number', 'shift_id', 'customer_id', 'customer_name', 'subtotal', 'discount_amount', 'tax_amount', 'total_amount', 'paid_amount', 'due_amount', 'payment_method', 'status', 'notes', 'created_at', 'updated_at'],
  },
  pos_sale_items: {
    table: 'pos_sale_items',
    columns: ['id', 'sale_id', 'product_id', 'variation_id', 'product_name', 'quantity', 'unit_price', 'total_price', 'created_at'],
  },
  pos_shifts: {
    table: 'pos_shifts',
    columns: ['id', 'shift_number', 'user_id', 'opening_balance', 'closing_balance', 'total_sales', 'total_expenses', 'status', 'opened_at', 'closed_at', 'notes', 'created_at', 'updated_at'],
  },
  pos_expenses: {
    table: 'pos_expenses',
    columns: ['id', 'shift_id', 'category_id', 'amount', 'description', 'created_by', 'created_at', 'updated_at'],
  },
  stock_adjustments: {
    table: 'stock_adjustments',
    columns: ['id', 'product_id', 'adjustment_type', 'quantity_change', 'previous_quantity', 'new_quantity', 'reference_type', 'reference_id', 'notes', 'created_by', 'created_at'],
  },
  purchase_orders: {
    table: 'purchase_orders',
    columns: ['id', 'order_number', 'company_id', 'company_name', 'subtotal', 'discount_amount', 'tax_amount', 'total_amount', 'paid_amount', 'due_amount', 'status', 'order_date', 'received_date', 'notes', 'created_at', 'updated_at'],
  },
  purchase_order_items: {
    table: 'purchase_order_items',
    columns: ['id', 'purchase_order_id', 'product_id', 'product_name', 'quantity', 'unit_price', 'total_price', 'created_at'],
  },
  farmer_ponds: {
    table: 'farmer_ponds',
    columns: ['id', 'user_id', 'name', 'area', 'area_unit', 'depth', 'depth_unit', 'fish_types', 'fish_count', 'stocking_date', 'fish_stock_entries', 'total_stocking_cost', 'status', 'notes', 'created_at', 'updated_at'],
  },
  farmer_incomes: {
    table: 'farmer_incomes',
    columns: ['id', 'user_id', 'date', 'category', 'description', 'amount', 'pond_name', 'fish_type', 'fish_weight', 'fish_price', 'created_at', 'updated_at'],
  },
  farmer_expenses: {
    table: 'farmer_expenses',
    columns: ['id', 'user_id', 'date', 'category', 'description', 'amount', 'pond_name', 'created_at', 'updated_at'],
  },
  farmer_samplings: {
    table: 'farmer_samplings',
    columns: ['id', 'user_id', 'pond_id', 'pond_name', 'date', 'fish_entries', 'total_fish', 'total_weight', 'avg_weight', 'notes', 'created_at'],
  },
  market_prices: {
    table: 'market_prices',
    columns: ['id', 'fish_name', 'fish_name_bn', 'price_per_kg', 'min_price', 'max_price', 'division', 'district', 'upazila', 'market_name', 'price_date', 'created_at', 'updated_at'],
  },
  product_reviews: {
    table: 'product_reviews',
    columns: ['id', 'product_id', 'user_id', 'user_name', 'rating', 'title', 'comment', 'is_verified_purchase', 'is_approved', 'helpful_count', 'created_at', 'updated_at'],
  },
  blog_posts: {
    table: 'blog_posts',
    columns: ['id', 'user_id', 'title', 'slug', 'content', 'category', 'tags', 'status', 'is_pinned', 'is_comments_locked', 'view_count', 'comment_count', 'author_name', 'author_role', 'meta_title', 'meta_description', 'og_image', 'created_at', 'updated_at'],
  },
  blog_comments: {
    table: 'blog_comments',
    columns: ['id', 'post_id', 'user_id', 'parent_id', 'author_name', 'author_role', 'comment_text', 'image_url', 'helpful_count', 'status', 'created_at', 'updated_at'],
  },
  farming_alerts: {
    table: 'farming_alerts',
    columns: ['id', 'user_id', 'created_by', 'pond_id', 'pond_name', 'title', 'title_bn', 'message', 'message_bn', 'alert_type', 'fish_species', 'alert_date', 'alert_time', 'priority', 'status', 'channels', 'is_global', 'is_recurring', 'recurrence_interval', 'created_at', 'updated_at'],
  },
};

router.get('/count/:module', authenticateToken, requireAdmin, async (req, res, next) => {
  const mod = MODULES[req.params.module];
  if (!mod) return res.status(400).json({ error: 'Unknown module' });
  try {
    const [rows] = await db.query(`SELECT COUNT(*) AS c FROM \`${mod.table}\``);
    res.json({ module: req.params.module, count: rows[0].c });
  } catch (e) {
    next(e);
  }
});

router.post(
  '/import/:module',
  authenticateToken,
  requireAdmin,
  validateBody({ rows: { type: 'array', required: true, min: 0, max: 1000 } }),
  async (req, res, next) => {
    const mod = MODULES[req.params.module];
    if (!mod) return res.status(400).json({ error: 'Unknown module' });
    const rows = req.body.rows;
    if (rows.length === 0) return res.json({ inserted: 0, module: req.params.module });

    const cols = mod.columns;
    const placeholders = `(${cols.map(() => '?').join(',')})`;
    const updateClause = cols
      .filter((c) => c !== 'id')
      .map((c) => `\`${c}\`=VALUES(\`${c}\`)`)
      .join(',');

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      let inserted = 0;
      // Batch in chunks of 100 (single multi-row insert per chunk)
      for (let i = 0; i < rows.length; i += 100) {
        const chunk = rows.slice(i, i + 100);
        const values = [];
        const parts = [];
        for (const r of chunk) {
          parts.push(placeholders);
          for (const c of cols) {
            let v = r[c];
            if (v === undefined) v = null;
            // Coerce nested objects/arrays into JSON strings
            if (v && typeof v === 'object' && !(v instanceof Date)) v = JSON.stringify(v);
            values.push(v);
          }
        }
        const sql = `INSERT INTO \`${mod.table}\` (${cols.map((c) => `\`${c}\``).join(',')}) VALUES ${parts.join(',')} ON DUPLICATE KEY UPDATE ${updateClause}`;
        const [result] = await conn.query(sql, values);
        inserted += result.affectedRows || 0;
      }
      await conn.commit();
      res.json({ inserted, module: req.params.module, received: rows.length });
    } catch (e) {
      await conn.rollback();
      next(e);
    } finally {
      conn.release();
    }
  }
);

router.get('/modules', authenticateToken, requireAdmin, (req, res) => {
  res.json({ modules: Object.keys(MODULES) });
});

module.exports = router;