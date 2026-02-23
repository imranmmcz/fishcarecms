const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { uploadProductImage, uploadAvatar, uploadGeneral } = require('../middleware/upload');

const router = express.Router();

const getBaseUrl = (req) => {
  return process.env.UPLOAD_BASE_URL || `${req.protocol}://${req.get('host')}`;
};

// ===================== PRODUCT IMAGE UPLOAD =====================

// Upload single product image
router.post('/product-image', authenticateToken, requireAdmin, uploadProductImage.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'কোনো ফাইল আপলোড হয়নি' });
    }

    const imageUrl = `${getBaseUrl(req)}/uploads/products/${req.file.filename}`;
    const { product_id, alt_text, display_order, is_primary } = req.body;

    // If product_id provided, save to product_images table
    if (product_id) {
      const [result] = await db.execute(
        'INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES (?, ?, ?, ?, ?)',
        [product_id, imageUrl, alt_text || null, parseInt(display_order) || 0, is_primary === 'true' || is_primary === '1']
      );
      const [img] = await db.execute('SELECT * FROM product_images WHERE id = ?', [result.insertId]);
      return res.status(201).json({ data: img[0], url: imageUrl });
    }

    res.status(201).json({ url: imageUrl, filename: req.file.filename });
  } catch (error) {
    console.error('Product image upload error:', error);
    res.status(500).json({ error: 'ইমেজ আপলোড ব্যর্থ হয়েছে' });
  }
});

// Upload multiple product images
router.post('/product-images', authenticateToken, requireAdmin, uploadProductImage.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'কোনো ফাইল আপলোড হয়নি' });
    }

    const { product_id } = req.body;
    const baseUrl = getBaseUrl(req);
    const uploaded = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const imageUrl = `${baseUrl}/uploads/products/${file.filename}`;

      if (product_id) {
        const [result] = await db.execute(
          'INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES (?, ?, ?, ?, ?)',
          [product_id, imageUrl, null, i, i === 0]
        );
        const [img] = await db.execute('SELECT * FROM product_images WHERE id = ?', [result.insertId]);
        uploaded.push(img[0]);
      } else {
        uploaded.push({ url: imageUrl, filename: file.filename });
      }
    }

    res.status(201).json({ data: uploaded });
  } catch (error) {
    console.error('Product images upload error:', error);
    res.status(500).json({ error: 'ইমেজ আপলোড ব্যর্থ হয়েছে' });
  }
});

// Update product main image via upload
router.post('/product-main-image/:productId', authenticateToken, requireAdmin, uploadProductImage.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'কোনো ফাইল আপলোড হয়নি' });
    }

    const imageUrl = `${getBaseUrl(req)}/uploads/products/${req.file.filename}`;
    const { productId } = req.params;

    await db.execute('UPDATE products SET image_url = ?, updated_at = NOW() WHERE id = ?', [imageUrl, productId]);
    const [product] = await db.execute('SELECT * FROM products WHERE id = ?', [productId]);

    res.json({ data: product[0], url: imageUrl });
  } catch (error) {
    console.error('Product main image upload error:', error);
    res.status(500).json({ error: 'ইমেজ আপলোড ব্যর্থ হয়েছে' });
  }
});

// ===================== AVATAR UPLOAD =====================

router.post('/avatar', authenticateToken, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'কোনো ফাইল আপলোড হয়নি' });
    }

    const avatarUrl = `${getBaseUrl(req)}/uploads/avatars/${req.file.filename}`;

    // Update user profile
    await db.execute('UPDATE profiles SET avatar_url = ?, updated_at = NOW() WHERE user_id = ?', [avatarUrl, req.user.id]);

    res.json({ url: avatarUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'অ্যাভাটার আপলোড ব্যর্থ হয়েছে' });
  }
});

// ===================== GENERAL IMAGE UPLOAD =====================

router.post('/image', authenticateToken, requireAdmin, uploadGeneral.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'কোনো ফাইল আপলোড হয়নি' });
    }

    const imageUrl = `${getBaseUrl(req)}/uploads/general/${req.file.filename}`;
    res.status(201).json({ url: imageUrl, filename: req.file.filename });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'ইমেজ আপলোড ব্যর্থ হয়েছে' });
  }
});

// ===================== DELETE UPLOADED FILE =====================

router.delete('/file', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL প্রয়োজন' });

    // Extract file path from URL
    const urlPath = new URL(url).pathname;
    const filePath = path.join(__dirname, '..', urlPath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'ফাইল মুছে ফেলা হয়েছে' });
  } catch (error) {
    console.error('File delete error:', error);
    res.status(500).json({ error: 'ফাইল মুছতে ব্যর্থ হয়েছে' });
  }
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'ফাইলের সাইজ সীমা অতিক্রম করেছে' });
  }
  if (err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
