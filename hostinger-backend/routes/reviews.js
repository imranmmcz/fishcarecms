const express = require('express');
const db = require('../config/database');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get reviews for a product (Public)
router.get('/product/:productId', optionalAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 10, offset = 0, sort = 'newest' } = req.query;

    let orderBy = 'pr.created_at DESC';
    if (sort === 'oldest') orderBy = 'pr.created_at ASC';
    if (sort === 'highest') orderBy = 'pr.rating DESC, pr.created_at DESC';
    if (sort === 'lowest') orderBy = 'pr.rating ASC, pr.created_at DESC';
    if (sort === 'helpful') orderBy = 'pr.helpful_count DESC, pr.created_at DESC';

    const [reviews] = await db.execute(
      `SELECT 
        pr.id, pr.product_id, pr.user_id, pr.rating, pr.title,
        COALESCE(pr.comment, pr.review_text) AS review_text,
        pr.is_verified_purchase, pr.is_approved, pr.helpful_count, pr.created_at, pr.updated_at,
        COALESCE(pr.user_name, u.full_name) as user_name, u.avatar_url as user_avatar
      FROM product_reviews pr
      LEFT JOIN users u ON pr.user_id = u.id
      WHERE pr.product_id = ? AND pr.is_approved = TRUE
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?`,
      [productId, parseInt(limit), parseInt(offset)]
    );

    // Get review stats
    const [stats] = await db.execute(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM product_reviews
      WHERE product_id = ? AND is_approved = TRUE`,
      [productId]
    );

    // Check if current user has reviewed this product
    let userReview = null;
    if (req.user) {
      const [userReviewResult] = await db.execute(
        `SELECT id, rating, title, review_text, created_at 
         FROM product_reviews 
         WHERE product_id = ? AND user_id = ?`,
        [productId, req.user.id]
      );
      if (userReviewResult.length > 0) {
        userReview = userReviewResult[0];
      }
    }

    res.json({
      reviews,
      stats: {
        total_reviews: parseInt(stats[0].total_reviews) || 0,
        average_rating: parseFloat(stats[0].average_rating) || 0,
        rating_breakdown: {
          5: parseInt(stats[0].five_star) || 0,
          4: parseInt(stats[0].four_star) || 0,
          3: parseInt(stats[0].three_star) || 0,
          2: parseInt(stats[0].two_star) || 0,
          1: parseInt(stats[0].one_star) || 0,
        }
      },
      user_review: userReview,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create a review (Authenticated users)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, rating, title, review_text } = req.body;
    const userId = req.user.id;

    if (!product_id || !rating) {
      return res.status(400).json({ error: 'Product ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if user already reviewed this product
    const [existing] = await db.execute(
      'SELECT id FROM product_reviews WHERE product_id = ? AND user_id = ?',
      [product_id, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    // Check if user purchased this product
    const [orders] = await db.execute(
      `SELECT o.id FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'`,
      [userId, product_id]
    );
    const isVerifiedPurchase = orders.length > 0;

    const [result] = await db.execute(
      `INSERT INTO product_reviews (product_id, user_id, rating, title, review_text, is_verified_purchase)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [product_id, userId, rating, title || null, review_text || null, isVerifiedPurchase]
    );

    const [newReview] = await db.execute(
      `SELECT pr.*, u.full_name as user_name, u.avatar_url as user_avatar
       FROM product_reviews pr
       LEFT JOIN users u ON pr.user_id = u.id
       WHERE pr.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ review: newReview[0] });
  } catch (error) {
    console.error('Create review error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Update a review (Owner only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, review_text } = req.body;
    const userId = req.user.id;

    // Check ownership
    const [review] = await db.execute(
      'SELECT id, user_id FROM product_reviews WHERE id = ?',
      [id]
    );

    if (review.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review[0].user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }

    const updates = [];
    const params = [];

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
      updates.push('rating = ?');
      params.push(rating);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (review_text !== undefined) {
      updates.push('review_text = ?');
      params.push(review_text);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    await db.execute(`UPDATE product_reviews SET ${updates.join(', ')} WHERE id = ?`, params);

    const [updatedReview] = await db.execute(
      `SELECT pr.*, u.full_name as user_name, u.avatar_url as user_avatar
       FROM product_reviews pr
       LEFT JOIN users u ON pr.user_id = u.id
       WHERE pr.id = ?`,
      [id]
    );

    res.json({ review: updatedReview[0] });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete a review (Owner or Admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [review] = await db.execute(
      'SELECT id, user_id FROM product_reviews WHERE id = ?',
      [id]
    );

    if (review.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review[0].user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    await db.execute('DELETE FROM product_reviews WHERE id = ?', [id]);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Mark review as helpful (Authenticated users)
router.post('/:id/helpful', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_helpful } = req.body;
    const userId = req.user.id;

    // Check if already voted
    const [existingVote] = await db.execute(
      'SELECT id, is_helpful FROM review_helpful_votes WHERE review_id = ? AND user_id = ?',
      [id, userId]
    );

    if (existingVote.length > 0) {
      // Update existing vote
      if (existingVote[0].is_helpful !== is_helpful) {
        await db.execute(
          'UPDATE review_helpful_votes SET is_helpful = ? WHERE id = ?',
          [is_helpful, existingVote[0].id]
        );
        
        // Update helpful count
        const countChange = is_helpful ? 2 : -2; // +2 or -2 because we're flipping the vote
        await db.execute(
          'UPDATE product_reviews SET helpful_count = helpful_count + ? WHERE id = ?',
          [countChange, id]
        );
      }
    } else {
      // Create new vote
      await db.execute(
        'INSERT INTO review_helpful_votes (review_id, user_id, is_helpful) VALUES (?, ?, ?)',
        [id, userId, is_helpful]
      );
      
      // Update helpful count
      const countChange = is_helpful ? 1 : 0;
      if (is_helpful) {
        await db.execute(
          'UPDATE product_reviews SET helpful_count = helpful_count + 1 WHERE id = ?',
          [id]
        );
      }
    }

    res.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    console.error('Helpful vote error:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Admin: Get all reviews with filters
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { product_id, user_id, is_approved, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT pr.*, u.full_name as user_name, u.email as user_email, p.name as product_name
      FROM product_reviews pr
      LEFT JOIN users u ON pr.user_id = u.id
      LEFT JOIN products p ON pr.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (product_id) {
      query += ' AND pr.product_id = ?';
      params.push(product_id);
    }
    if (user_id) {
      query += ' AND pr.user_id = ?';
      params.push(user_id);
    }
    if (is_approved !== undefined) {
      query += ' AND pr.is_approved = ?';
      params.push(is_approved === 'true');
    }

    query += ' ORDER BY pr.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [reviews] = await db.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM product_reviews WHERE 1=1';
    const countParams = [];
    if (product_id) {
      countQuery += ' AND product_id = ?';
      countParams.push(product_id);
    }
    if (is_approved !== undefined) {
      countQuery += ' AND is_approved = ?';
      countParams.push(is_approved === 'true');
    }

    const [countResult] = await db.execute(countQuery, countParams);

    res.json({
      reviews,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Admin get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Admin: Approve/Reject review
router.patch('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved } = req.body;

    await db.execute(
      'UPDATE product_reviews SET is_approved = ? WHERE id = ?',
      [is_approved, id]
    );

    res.json({ message: is_approved ? 'Review approved' : 'Review rejected' });
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({ error: 'Failed to update review status' });
  }
});

module.exports = router;
