const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Generate unique order number
const generateOrderNumber = async () => {
  const today = new Date().toISOString().slice(0, 10);
  
  try {
    // Try to increment existing sequence
    const [result] = await db.execute(
      `INSERT INTO order_sequence (created_at, sequence_number) VALUES (?, 1)
       ON DUPLICATE KEY UPDATE sequence_number = sequence_number + 1`,
      [today]
    );
    
    const [sequence] = await db.execute(
      'SELECT sequence_number FROM order_sequence WHERE created_at = ?',
      [today]
    );
    
    const seq = sequence[0]?.sequence_number || 1;
    const dateStr = today.replace(/-/g, '');
    return `FC${dateStr}${String(seq).padStart(4, '0')}`;
  } catch (error) {
    // Fallback to timestamp-based
    return `FC${Date.now()}`;
  }
};

// Get all orders (Admin) or user's orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      status,
      user_id,
      limit = 50,
      offset = 0,
      date_from,
      date_to,
      include_items,
      search,
    } = req.query;
    const isAdmin = req.user.role === 'admin';
    
    let query = `
      SELECT o.*, u.full_name as customer_name, u.email as customer_email,
      (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Non-admin users can only see their own orders
    if (!isAdmin) {
      query += ' AND o.user_id = ?';
      params.push(req.user.id);
    } else if (user_id) {
      query += ' AND o.user_id = ?';
      params.push(user_id);
    }

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (date_from) {
      query += ' AND o.created_at >= ?';
      params.push(date_from);
    }
    if (date_to) {
      query += ' AND o.created_at <= ?';
      params.push(date_to);
    }
    if (search) {
      query += ' AND (o.order_number LIKE ? OR o.shipping_name LIKE ? OR o.shipping_mobile LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [orders] = await db.execute(query, params);

    // Optionally embed order items so admin lists with drill-down state
    // can render line-items without a per-order round trip.
    if (include_items === '1' || include_items === 'true') {
      const ids = orders.map((o) => o.id);
      if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        const [items] = await db.execute(
          `SELECT * FROM order_items WHERE order_id IN (${placeholders})`,
          ids
        );
        const byOrder = items.reduce((acc, it) => {
          (acc[it.order_id] = acc[it.order_id] || []).push(it);
          return acc;
        }, {});
        orders.forEach((o) => {
          o.items = byOrder[o.id] || [];
        });
      } else {
        orders.forEach((o) => { o.items = []; });
      }
    }

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
    const countParams = [];
    
    if (!isAdmin) {
      countQuery += ' AND user_id = ?';
      countParams.push(req.user.id);
    } else if (user_id) {
      countQuery += ' AND user_id = ?';
      countParams.push(user_id);
    }
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (date_from) {
      countQuery += ' AND created_at >= ?';
      countParams.push(date_from);
    }
    if (date_to) {
      countQuery += ' AND created_at <= ?';
      countParams.push(date_to);
    }
    if (search) {
      countQuery += ' AND (order_number LIKE ? OR shipping_name LIKE ? OR shipping_mobile LIKE ?)';
      const s = `%${search}%`;
      countParams.push(s, s, s);
    }

    const [countResult] = await db.execute(countQuery, countParams);

    res.json({
      orders,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order by ID or order number
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';
    
    // Check if id is order number or numeric id
    const isOrderNumber = isNaN(parseInt(id));
    
    let query = `
      SELECT o.*, u.full_name as customer_name, u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE ${isOrderNumber ? 'o.order_number = ?' : 'o.id = ?'}
    `;
    
    if (!isAdmin) {
      query += ' AND o.user_id = ?';
    }
    
    const params = isAdmin ? [id] : [id, req.user.id];
    const [orders] = await db.execute(query, params);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    const [items] = await db.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orders[0].id]
    );

    // Get status history
    const [history] = await db.execute(
      `SELECT osh.*, u.full_name as changed_by_name 
       FROM order_status_history osh
       LEFT JOIN users u ON osh.changed_by = u.id
       WHERE osh.order_id = ?
       ORDER BY osh.created_at DESC`,
      [orders[0].id]
    );

    res.json({ 
      order: {
        ...orders[0],
        items,
        status_history: history
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create new order (Customer)
router.post('/', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      items, 
      shipping_name,
      shipping_mobile,
      shipping_division,
      shipping_district,
      shipping_upazila,
      shipping_address,
      payment_method = 'cod',
      customer_note,
      payment_trx_id,
      payment_sender_number
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must have at least one item' });
    }

    if (!shipping_name || !shipping_mobile) {
      return res.status(400).json({ error: 'Shipping name and mobile are required' });
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();
    
    // Calculate totals and validate stock
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const [products] = await connection.execute(
        'SELECT * FROM products WHERE id = ?',
        [item.product_id]
      );

      if (products.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: `Product not found: ${item.product_id}` });
      }

      const product = products[0];
      
      // Check stock
      if (product.stock_quantity < item.quantity) {
        await connection.rollback();
        return res.status(400).json({ 
          error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}` 
        });
      }

      // Calculate price with discount
      const unitPrice = product.price;
      const discountPercentage = product.discount_percentage || 0;
      const discountedPrice = unitPrice * (1 - discountPercentage / 100);
      const totalPrice = discountedPrice * item.quantity;
      
      subtotal += totalPrice;
      
      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        product_image: product.image_url,
        quantity: item.quantity,
        unit_price: unitPrice,
        discount_percentage: discountPercentage,
        total_price: totalPrice
      });

      // Reduce stock
      await connection.execute(
        `UPDATE products SET 
         stock_quantity = stock_quantity - ?,
         stock_status = CASE 
           WHEN stock_quantity - ? <= 0 THEN 'out_of_stock'
           WHEN stock_quantity - ? <= 10 THEN 'low_stock'
           ELSE 'in_stock'
         END
         WHERE id = ?`,
        [item.quantity, item.quantity, item.quantity, product.id]
      );
    }

    const shippingCost = 0; // Free shipping or calculate based on location
    const discountAmount = 0;
    const totalAmount = subtotal + shippingCost - discountAmount;

    // Determine payment status based on method
    // For bKash/Nagad with TrxID, set status as verification_pending
    let paymentStatus = 'pending';
    if ((payment_method === 'bkash' || payment_method === 'nagad') && payment_trx_id) {
      paymentStatus = 'verification_pending';
    }

    // Create order
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (
        order_number, user_id, status, payment_status, payment_method,
        payment_trx_id, payment_sender_number,
        subtotal, shipping_cost, discount_amount, total_amount,
        shipping_name, shipping_mobile, shipping_division, shipping_district,
        shipping_upazila, shipping_address, customer_note
      ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber, req.user.id, paymentStatus, payment_method,
        payment_trx_id || null, payment_sender_number || null,
        subtotal, shippingCost, discountAmount, totalAmount,
        shipping_name, shipping_mobile, shipping_division || null,
        shipping_district || null, shipping_upazila || null,
        shipping_address || null, customer_note || null
      ]
    );

    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of validatedItems) {
      await connection.execute(
        `INSERT INTO order_items (
          order_id, product_id, product_name, product_image,
          quantity, unit_price, discount_percentage, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId, item.product_id, item.product_name, item.product_image,
          item.quantity, item.unit_price, item.discount_percentage, item.total_price
        ]
      );
    }

    // Add initial status history
    await connection.execute(
      `INSERT INTO order_status_history (order_id, status, note, changed_by)
       VALUES (?, 'pending', 'Order placed', ?)`,
      [orderId, req.user.id]
    );

    await connection.commit();

    // Fetch complete order
    const [newOrder] = await db.execute(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    res.status(201).json({ 
      order: newOrder[0],
      message: 'Order placed successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    connection.release();
  }
});

// Update order status (Admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get current order
    const [orders] = await db.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentOrder = orders[0];

    // Update timestamps based on status
    let additionalUpdates = '';
    if (status === 'shipped' && !currentOrder.shipped_at) {
      additionalUpdates = ', shipped_at = NOW()';
    } else if (status === 'delivered' && !currentOrder.delivered_at) {
      additionalUpdates = ', delivered_at = NOW()';
    }

    // If cancelling, restore stock
    if (status === 'cancelled' && currentOrder.status !== 'cancelled') {
      const [items] = await db.execute(
        'SELECT * FROM order_items WHERE order_id = ?',
        [id]
      );
      
      for (const item of items) {
        await db.execute(
          `UPDATE products SET 
           stock_quantity = stock_quantity + ?,
           stock_status = CASE 
             WHEN stock_quantity + ? > 10 THEN 'in_stock'
             WHEN stock_quantity + ? > 0 THEN 'low_stock'
             ELSE 'out_of_stock'
           END
           WHERE id = ?`,
          [item.quantity, item.quantity, item.quantity, item.product_id]
        );
      }
    }

    // Update order status
    await db.execute(
      `UPDATE orders SET status = ?${additionalUpdates}, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );

    // Add status history
    await db.execute(
      `INSERT INTO order_status_history (order_id, status, note, changed_by)
       VALUES (?, ?, ?, ?)`,
      [id, status, note || null, req.user.id]
    );

    const [updatedOrder] = await db.execute('SELECT * FROM orders WHERE id = ?', [id]);

    res.json({ order: updatedOrder[0] });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Update payment status (Admin only)
router.patch('/:id/payment', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(payment_status)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    await db.execute(
      'UPDATE orders SET payment_status = ?, updated_at = NOW() WHERE id = ?',
      [payment_status, id]
    );

    const [updatedOrder] = await db.execute('SELECT * FROM orders WHERE id = ?', [id]);

    res.json({ order: updatedOrder[0] });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// Add admin note (Admin only)
router.patch('/:id/note', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_note } = req.body;

    await db.execute(
      'UPDATE orders SET admin_note = ?, updated_at = NOW() WHERE id = ?',
      [admin_note, id]
    );

    const [updatedOrder] = await db.execute('SELECT * FROM orders WHERE id = ?', [id]);

    res.json({ order: updatedOrder[0] });
  } catch (error) {
    console.error('Update admin note error:', error);
    res.status(500).json({ error: 'Failed to update admin note' });
  }
});

// Cancel order (Customer - only if pending)
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get order
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];
    
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be cancelled' });
    }

    // Restore stock
    const [items] = await db.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [id]
    );
    
    for (const item of items) {
      await db.execute(
        `UPDATE products SET 
         stock_quantity = stock_quantity + ?,
         stock_status = 'in_stock'
         WHERE id = ?`,
        [item.quantity, item.product_id]
      );
    }

    // Update order
    await db.execute(
      `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = ?`,
      [id]
    );

    // Add status history
    await db.execute(
      `INSERT INTO order_status_history (order_id, status, note, changed_by)
       VALUES (?, 'cancelled', 'Cancelled by customer', ?)`,
      [id, req.user.id]
    );

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Get courier services list
router.get('/couriers', authenticateToken, async (req, res) => {
  try {
    const [couriers] = await db.execute(
      'SELECT * FROM courier_services WHERE is_active = 1 ORDER BY display_order ASC'
    );
    res.json({ couriers });
  } catch (error) {
    console.error('Get couriers error:', error);
    // Return default couriers if table doesn't exist
    res.json({
      couriers: [
        { id: 1, name: 'Sundarban Courier', name_bn: 'সুন্দরবন কুরিয়ার', tracking_url_template: null },
        { id: 2, name: 'SA Paribahan', name_bn: 'এসএ পরিবহন', tracking_url_template: null },
        { id: 3, name: 'Pathao Courier', name_bn: 'পাঠাও কুরিয়ার', tracking_url_template: null },
        { id: 4, name: 'RedX', name_bn: 'রেডএক্স', tracking_url_template: null },
        { id: 5, name: 'Steadfast', name_bn: 'স্টেডফাস্ট', tracking_url_template: null },
        { id: 6, name: 'eCourier', name_bn: 'ইকুরিয়ার', tracking_url_template: null },
        { id: 7, name: 'Paperfly', name_bn: 'পেপারফ্লাই', tracking_url_template: null },
        { id: 8, name: 'Other', name_bn: 'অন্যান্য', tracking_url_template: null }
      ]
    });
  }
});

// Update shipment/tracking info (Admin only)
router.patch('/:id/shipping', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { courier_name, tracking_number, tracking_url, estimated_delivery } = req.body;

    // Build update query dynamically
    const updates = [];
    const params = [];
    
    if (courier_name !== undefined) {
      updates.push('courier_name = ?');
      params.push(courier_name || null);
    }
    if (tracking_number !== undefined) {
      updates.push('tracking_number = ?');
      params.push(tracking_number || null);
    }
    if (tracking_url !== undefined) {
      updates.push('tracking_url = ?');
      params.push(tracking_url || null);
    }
    if (estimated_delivery !== undefined) {
      updates.push('estimated_delivery = ?');
      params.push(estimated_delivery || null);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No shipping data provided' });
    }
    
    updates.push('updated_at = NOW()');
    params.push(id);

    await db.execute(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Add status history note for tracking update
    if (tracking_number) {
      await db.execute(
        `INSERT INTO order_status_history (order_id, status, note, changed_by)
         VALUES (?, (SELECT status FROM orders WHERE id = ?), ?, ?)`,
        [id, id, `ট্র্যাকিং নম্বর যোগ করা হয়েছে: ${tracking_number}`, req.user.id]
      );
    }

    const [updatedOrder] = await db.execute('SELECT * FROM orders WHERE id = ?', [id]);

    res.json({ order: updatedOrder[0] });
  } catch (error) {
    console.error('Update shipping info error:', error);
    res.status(500).json({ error: 'Failed to update shipping info' });
  }
});

// Get order statistics (Admin only)
router.get('/stats/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Total orders by status
    const [statusStats] = await db.execute(`
      SELECT status, COUNT(*) as count, SUM(total_amount) as total_amount
      FROM orders
      GROUP BY status
    `);

    // Today's orders
    const [todayStats] = await db.execute(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total_amount
      FROM orders
      WHERE DATE(created_at) = CURDATE()
    `);

    // This month's orders
    const [monthStats] = await db.execute(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total_amount
      FROM orders
      WHERE YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())
    `);

    // Recent orders
    const [recentOrders] = await db.execute(`
      SELECT o.*, u.full_name as customer_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    // Low stock products
    const [lowStock] = await db.execute(`
      SELECT id, name, stock_quantity, stock_status
      FROM products
      WHERE stock_status IN ('low_stock', 'out_of_stock')
      ORDER BY stock_quantity ASC
      LIMIT 10
    `);

    res.json({
      status_summary: statusStats,
      today: todayStats[0],
      this_month: monthStats[0],
      recent_orders: recentOrders,
      low_stock_products: lowStock
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ error: 'Failed to fetch order statistics' });
  }
});

module.exports = router;
