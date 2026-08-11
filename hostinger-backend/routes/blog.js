const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function parseTags(row) {
  if (!row) return row;
  let tags = row.tags;
  if (typeof tags === 'string') {
    try { tags = JSON.parse(tags); } catch { tags = []; }
  }
  return { ...row, tags: Array.isArray(tags) ? tags : [], is_pinned: !!row.is_pinned, is_comments_locked: !!row.is_comments_locked };
}

async function attachImages(posts) {
  if (!posts.length) return posts;
  const ids = posts.map((p) => p.id);
  const [images] = await db.query(
    `SELECT * FROM blog_images WHERE post_id IN (${ids.map(() => '?').join(',')}) ORDER BY display_order ASC`,
    ids
  );
  const map = {};
  images.forEach((img) => {
    (map[img.post_id] = map[img.post_id] || []).push(img);
  });
  return posts.map((p) => ({ ...p, images: map[p.id] || [] }));
}

// ---------------- POSTS ----------------
router.get('/posts', async (req, res) => {
  try {
    const { category, search, sort, status = 'approved', limit = 100, offset = 0 } = req.query;
    let sql = 'SELECT * FROM blog_posts WHERE 1=1';
    const params = [];
    if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (search) {
      sql += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    let order = 'created_at DESC';
    if (sort === 'most-commented') order = 'comment_count DESC';
    else if (sort === 'most-viewed') order = 'view_count DESC';
    sql += ` ORDER BY is_pinned DESC, ${order} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    const [rows] = await db.query(sql, params);
    const posts = await attachImages(rows.map(parseTags));
    res.json({ posts });
  } catch (error) {
    console.error('Blog posts list error:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

router.get('/posts/slug/:slug', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM blog_posts WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!rows.length) return res.status(404).json({ error: 'Post not found' });
    await db.execute('UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ?', [rows[0].id]);
    const [withImages] = await attachImages([parseTags(rows[0])]);
    res.json({ post: withImages });
  } catch (error) {
    console.error('Blog post fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

router.post('/posts', authenticateToken, async (req, res) => {
  try {
    const b = req.body || {};
    const id = b.id || require('crypto').randomUUID();
    await db.execute(
      `INSERT INTO blog_posts (id, user_id, title, slug, content, category, tags, status, author_name, author_role, meta_title, meta_description, og_image)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, b.user_id || null, b.title, b.slug, b.content || null, b.category || 'general',
       JSON.stringify(b.tags || []), b.status || 'pending', b.author_name || null,
       b.author_role || 'farmer', b.meta_title || null, b.meta_description || null, b.og_image || null]
    );
    const [rows] = await db.execute('SELECT * FROM blog_posts WHERE id = ?', [id]);
    res.status(201).json({ post: parseTags(rows[0]) });
  } catch (error) {
    console.error('Blog post create error:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

router.put('/posts/:id', authenticateToken, async (req, res) => {
  try {
    const allowed = ['title', 'slug', 'content', 'category', 'tags', 'status', 'is_pinned',
      'is_comments_locked', 'view_count', 'author_name', 'meta_title', 'meta_description', 'og_image'];
    const sets = [];
    const params = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        sets.push(`${key} = ?`);
        params.push(key === 'tags' ? JSON.stringify(req.body[key]) : req.body[key]);
      }
    }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);
    await db.execute(`UPDATE blog_posts SET ${sets.join(', ')} WHERE id = ?`, params);
    const [rows] = await db.execute('SELECT * FROM blog_posts WHERE id = ?', [req.params.id]);
    res.json({ post: rows.length ? parseTags(rows[0]) : null });
  } catch (error) {
    console.error('Blog post update error:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

router.delete('/posts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM blog_comments WHERE post_id = ?', [req.params.id]);
    await db.execute('DELETE FROM blog_images WHERE post_id = ?', [req.params.id]);
    await db.execute('DELETE FROM blog_posts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Blog post delete error:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

// ---------------- IMAGES ----------------
router.post('/images', authenticateToken, async (req, res) => {
  try {
    const b = req.body || {};
    const id = require('crypto').randomUUID();
    await db.execute(
      'INSERT INTO blog_images (id, post_id, image_url, thumbnail_url, alt_text, display_order) VALUES (?,?,?,?,?,?)',
      [id, b.post_id, b.image_url, b.thumbnail_url || null, b.alt_text || null, b.display_order || 0]
    );
    const [rows] = await db.execute('SELECT * FROM blog_images WHERE id = ?', [id]);
    res.status(201).json({ image: rows[0] });
  } catch (error) {
    console.error('Blog image create error:', error);
    res.status(500).json({ error: 'Failed to add blog image' });
  }
});

// ---------------- COMMENTS ----------------
router.get('/comments', async (req, res) => {
  try {
    const { post_id, status = 'approved' } = req.query;
    if (!post_id) return res.status(400).json({ error: 'post_id is required' });
    const params = [post_id];
    let sql = 'SELECT * FROM blog_comments WHERE post_id = ?';
    if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY created_at ASC';
    const [rows] = await db.execute(sql, params);
    res.json({ comments: rows });
  } catch (error) {
    console.error('Blog comments list error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/comments', authenticateToken, async (req, res) => {
  try {
    const b = req.body || {};
    const id = require('crypto').randomUUID();
    await db.execute(
      `INSERT INTO blog_comments (id, post_id, user_id, parent_id, author_name, author_role, comment_text, image_url, status)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, b.post_id, b.user_id || null, b.parent_id || null, b.author_name || 'Anonymous',
       b.author_role || 'farmer', b.comment_text, b.image_url || null, b.status || 'approved']
    );
    await db.execute('UPDATE blog_posts SET comment_count = comment_count + 1 WHERE id = ?', [b.post_id]);
    const [rows] = await db.execute('SELECT * FROM blog_comments WHERE id = ?', [id]);
    res.status(201).json({ comment: rows[0] });
  } catch (error) {
    console.error('Blog comment create error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

router.delete('/comments/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT post_id FROM blog_comments WHERE id = ?', [req.params.id]);
    await db.execute('DELETE FROM blog_comments WHERE id = ?', [req.params.id]);
    if (rows.length) {
      await db.execute('UPDATE blog_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = ?', [rows[0].post_id]);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Blog comment delete error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
