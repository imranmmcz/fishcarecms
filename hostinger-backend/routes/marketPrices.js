const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all market prices (Public)
router.get('/', async (req, res) => {
  try {
    const { division, district, upazila, search, limit = 100, offset = 0 } = req.query;

    let query = 'SELECT * FROM market_prices WHERE 1=1';
    const params = [];

    if (division) {
      query += ' AND division = ?';
      params.push(division);
    }

    if (district) {
      query += ' AND district = ?';
      params.push(district);
    }

    if (upazila) {
      query += ' AND upazila = ?';
      params.push(upazila);
    }

    if (search) {
      query += ' AND (fish_name LIKE ? OR fish_name_bn LIKE ? OR market_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY price_date DESC, fish_name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [prices] = await db.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM market_prices WHERE 1=1';
    const countParams = [];
    
    if (division) {
      countQuery += ' AND division = ?';
      countParams.push(division);
    }
    if (district) {
      countQuery += ' AND district = ?';
      countParams.push(district);
    }
    if (upazila) {
      countQuery += ' AND upazila = ?';
      countParams.push(upazila);
    }
    if (search) {
      countQuery += ' AND (fish_name LIKE ? OR fish_name_bn LIKE ? OR market_name LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await db.execute(countQuery, countParams);

    res.json({
      prices,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get market prices error:', error);
    res.status(500).json({ error: 'Failed to fetch market prices' });
  }
});

// Get market price by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [prices] = await db.execute('SELECT * FROM market_prices WHERE id = ?', [id]);

    if (prices.length === 0) {
      return res.status(404).json({ error: 'Market price not found' });
    }

    res.json({ price: prices[0] });
  } catch (error) {
    console.error('Get market price error:', error);
    res.status(500).json({ error: 'Failed to fetch market price' });
  }
});

// Create market price (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      fish_name, fish_name_bn, price_per_kg, min_price, max_price,
      division, district, upazila, market_name, price_date
    } = req.body;

    if (!fish_name || !fish_name_bn || !price_per_kg || !division || !district || !upazila) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const [result] = await db.execute(
      `INSERT INTO market_prices 
       (fish_name, fish_name_bn, price_per_kg, min_price, max_price, division, district, upazila, market_name, price_date, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [fish_name, fish_name_bn, price_per_kg, min_price || null, max_price || null, division, district, upazila, market_name || null, price_date || new Date().toISOString().split('T')[0]]
    );

    const [newPrice] = await db.execute('SELECT * FROM market_prices WHERE id = ?', [result.insertId]);

    res.status(201).json({ price: newPrice[0] });
  } catch (error) {
    console.error('Create market price error:', error);
    res.status(500).json({ error: 'Failed to create market price' });
  }
});

// Update market price (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fish_name, fish_name_bn, price_per_kg, min_price, max_price,
      division, district, upazila, market_name, price_date
    } = req.body;

    const updates = [];
    const params = [];

    if (fish_name !== undefined) {
      updates.push('fish_name = ?');
      params.push(fish_name);
    }
    if (fish_name_bn !== undefined) {
      updates.push('fish_name_bn = ?');
      params.push(fish_name_bn);
    }
    if (price_per_kg !== undefined) {
      updates.push('price_per_kg = ?');
      params.push(price_per_kg);
    }
    if (min_price !== undefined) {
      updates.push('min_price = ?');
      params.push(min_price);
    }
    if (max_price !== undefined) {
      updates.push('max_price = ?');
      params.push(max_price);
    }
    if (division !== undefined) {
      updates.push('division = ?');
      params.push(division);
    }
    if (district !== undefined) {
      updates.push('district = ?');
      params.push(district);
    }
    if (upazila !== undefined) {
      updates.push('upazila = ?');
      params.push(upazila);
    }
    if (market_name !== undefined) {
      updates.push('market_name = ?');
      params.push(market_name);
    }
    if (price_date !== undefined) {
      updates.push('price_date = ?');
      params.push(price_date);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await db.execute(`UPDATE market_prices SET ${updates.join(', ')} WHERE id = ?`, params);

    const [updatedPrice] = await db.execute('SELECT * FROM market_prices WHERE id = ?', [id]);

    res.json({ price: updatedPrice[0] });
  } catch (error) {
    console.error('Update market price error:', error);
    res.status(500).json({ error: 'Failed to update market price' });
  }
});

// Delete market price (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute('DELETE FROM market_prices WHERE id = ?', [id]);

    res.json({ message: 'Market price deleted successfully' });
  } catch (error) {
    console.error('Delete market price error:', error);
    res.status(500).json({ error: 'Failed to delete market price' });
  }
});

// Get available locations
router.get('/meta/locations', async (req, res) => {
  try {
    const [divisions] = await db.execute('SELECT DISTINCT division FROM market_prices ORDER BY division');
    const [districts] = await db.execute('SELECT DISTINCT district FROM market_prices ORDER BY district');
    const [upazilas] = await db.execute('SELECT DISTINCT upazila FROM market_prices ORDER BY upazila');

    res.json({
      divisions: divisions.map(d => d.division),
      districts: districts.map(d => d.district),
      upazilas: upazilas.map(u => u.upazila)
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

module.exports = router;
