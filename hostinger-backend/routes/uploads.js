const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  uploadProductImage, uploadAvatar, uploadGeneral,
  uploadBucket, PUBLIC_BUCKETS, PRIVATE_BUCKETS, bucketRoot,
} = require('../middleware/upload');

const router = express.Router();

const getBaseUrl = (req) => {
  return process.env.UPLOAD_BASE_URL || `${req.protocol}://${req.get('host')}`;
};

const publicUrlFor = (req, bucket, filename) =>
  `${getBaseUrl(req)}/uploads/${bucket}/${filename}`;

const privateUrlFor = (req, bucket, filename, expiresIn = 3600) => {
  const token = jwt.sign(
    { b: bucket, f: filename, k: 'storage-read' },
    process.env.JWT_SECRET,
    { expiresIn }
  );
  return `${getBaseUrl(req)}/api/upload/signed?token=${token}`;
};

// ============= GENERIC BUCKET API (Supabase-Storage compatible) =============
// POST /api/upload/bucket/:bucket/*   → upload (multipart "file")
// GET  /api/upload/bucket/:bucket/list?prefix=…
// DELETE /api/upload/bucket/:bucket/*
// GET  /api/upload/signed?token=…     → stream private file
// POST /api/upload/signed-url         → issue signed URL for a private object

router.post(
  '/bucket/:bucket/*?',
  authenticateToken,
  (req, res, next) => uploadBucket.single('file')(req, res, next),
  async (req, res) => {
    try {
      const { bucket } = req.params;
      if (!PUBLIC_BUCKETS.has(bucket) && !PRIVATE_BUCKETS.has(bucket)) {
        return res.status(400).json({ error: 'Unknown bucket' });
      }
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      // subpath relative to bucket root
      const root = bucketRoot(bucket);
      const relPath = path.relative(root, req.file.path).split(path.sep).join('/');
      const publicUrl = PUBLIC_BUCKETS.has(bucket)
        ? publicUrlFor(req, bucket, relPath)
        : privateUrlFor(req, bucket, relPath);

      res.status(201).json({
        data: { path: relPath, bucket, publicUrl, fullPath: `${bucket}/${relPath}` },
        publicUrl,
        path: relPath,
      });
    } catch (e) {
      console.error('Bucket upload error:', e);
      res.status(500).json({ error: e.message || 'Upload failed' });
    }
  }
);

// List objects in a bucket (admin only)
router.get('/bucket/:bucket/list', authenticateToken, requireAdmin, (req, res) => {
  const { bucket } = req.params;
  const prefix = (req.query.prefix || '').toString().replace(/\.\.+/g, '');
  const root = bucketRoot(bucket);
  if (!root) return res.status(400).json({ error: 'Unknown bucket' });
  const dir = path.join(root, prefix);
  if (!fs.existsSync(dir)) return res.json({ data: [] });

  const walk = (d, base = '') => {
    const out = [];
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const rel = base ? `${base}/${entry.name}` : entry.name;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) out.push(...walk(full, rel));
      else {
        const stat = fs.statSync(full);
        out.push({ name: rel, size: stat.size, updated_at: stat.mtime });
      }
    }
    return out;
  };
  res.json({ data: walk(dir) });
});

// Delete object(s)
router.delete('/bucket/:bucket/*', authenticateToken, requireAdmin, (req, res) => {
  const { bucket } = req.params;
  const root = bucketRoot(bucket);
  if (!root) return res.status(400).json({ error: 'Unknown bucket' });
  const rel = (req.params[0] || '').replace(/\.\.+/g, '');
  const full = path.join(root, rel);
  if (!full.startsWith(root)) return res.status(400).json({ error: 'Bad path' });
  if (fs.existsSync(full)) fs.unlinkSync(full);
  res.json({ data: { removed: rel } });
});

// Issue signed URL for private object
router.post('/signed-url', authenticateToken, (req, res) => {
  const { bucket, path: filePath, expiresIn = 3600 } = req.body || {};
  if (!bucket || !filePath) return res.status(400).json({ error: 'bucket & path required' });
  if (!PRIVATE_BUCKETS.has(bucket) && !PUBLIC_BUCKETS.has(bucket)) {
    return res.status(400).json({ error: 'Unknown bucket' });
  }
  const signedUrl = privateUrlFor(req, bucket, filePath, Math.min(expiresIn, 86400));
  res.json({ data: { signedUrl }, signedUrl });
});

// Stream a private file when signed token is valid
router.get('/signed', (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).send('missing token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.k !== 'storage-read') return res.status(403).send('bad token');
    const root = bucketRoot(decoded.b);
    if (!root) return res.status(400).send('bad bucket');
    const full = path.join(root, decoded.f);
    if (!full.startsWith(root) || !fs.existsSync(full)) return res.status(404).send('not found');
    res.sendFile(full);
  } catch (e) {
    res.status(401).send('unauthorized');
  }
});

// ============= SUPABASE → LOCAL STORAGE MIGRATION =============
// POST /api/upload/migrate-from-supabase  { bucket, publicBaseUrl?, files: [{path, url}] }
// Frontend enumerates files via supabase.storage.list(), then POSTs URLs to import.
router.post('/migrate-from-supabase', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { bucket, files } = req.body || {};
    if (!bucket || !Array.isArray(files)) {
      return res.status(400).json({ error: 'bucket + files[] required' });
    }
    if (!PUBLIC_BUCKETS.has(bucket) && !PRIVATE_BUCKETS.has(bucket)) {
      return res.status(400).json({ error: 'Unknown bucket' });
    }
    const root = bucketRoot(bucket);
    const results = [];
    for (const f of files) {
      try {
        const rel = (f.path || '').replace(/\.\.+/g, '').replace(/^\/+/, '');
        if (!rel || !f.url) { results.push({ path: f.path, ok: false, error: 'bad entry' }); continue; }
        const full = path.join(root, rel);
        const dir = path.dirname(full);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const resp = await fetch(f.url);
        if (!resp.ok) { results.push({ path: rel, ok: false, error: `fetch ${resp.status}` }); continue; }
        const buf = Buffer.from(await resp.arrayBuffer());
        fs.writeFileSync(full, buf);
        results.push({
          path: rel, ok: true, size: buf.length,
          newUrl: PUBLIC_BUCKETS.has(bucket)
            ? publicUrlFor(req, bucket, rel)
            : `${bucket}/${rel}`,
        });
      } catch (err) {
        results.push({ path: f.path, ok: false, error: err.message });
      }
    }
    res.json({
      data: {
        bucket,
        total: files.length,
        succeeded: results.filter(r => r.ok).length,
        failed: results.filter(r => !r.ok).length,
        results,
      },
    });
  } catch (e) {
    console.error('Migration error:', e);
    res.status(500).json({ error: e.message });
  }
});

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
