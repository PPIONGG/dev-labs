const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
const PORT = 3000;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'secret',
  database: process.env.DB_NAME || 'blog_platform',
});

// GET /posts — บทความทั้งหมด (JOIN + JSONB)
app.get('/posts', async (req, res) => {
  try {
    const { category, status = 'published', sort = 'created_at', order = 'desc' } = req.query;
    const conditions = [`p.status = $1`];
    const values = [status];
    let i = 2;

    if (category) {
      conditions.push(`c.slug = $${i++}`);
      values.push(category);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const allowed = ['created_at', 'title', 'view_count'];
    const col = allowed.includes(sort) ? `p.${sort}` : 'p.created_at';
    const dir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const result = await pool.query(`
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.tags,
        p.view_count, p.created_at,
        u.name AS author,
        c.name AS category
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${where}
      ORDER BY ${col} ${dir}
    `, values);

    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /posts — สร้างบทความใหม่ (INSERT + JSONB)
app.post('/posts', async (req, res) => {
  try {
    const { title, slug, body, excerpt, author_id, category_id, tags = [] } = req.body;

    if (!title || !slug || !body || !author_id) {
      return res.status(400).json({ error: 'title, slug, body, and author_id are required' });
    }

    const result = await pool.query(`
      INSERT INTO posts (title, slug, body, excerpt, author_id, category_id, tags, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'published')
      RETURNING *
    `, [title, slug, body, excerpt, author_id, category_id, JSON.stringify(tags)]);

    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /posts/search?q=... — Full-text Search (tsvector, tsquery, ts_rank)
app.get('/posts/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'query parameter q is required' });
    }

    const result = await pool.query(`
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.tags,
        u.name AS author,
        ts_rank(p.search_vector, plainto_tsquery('english', $1)) AS rank
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.search_vector @@ plainto_tsquery('english', $1)
        AND p.status = 'published'
      ORDER BY rank DESC
    `, [q]);

    res.json({
      query: q,
      count: result.rows.length,
      results: result.rows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /posts/tag/:tag — บทความตาม tag (JSONB @>)
app.get('/posts/tag/:tag', async (req, res) => {
  try {
    const { tag } = req.params;

    const result = await pool.query(`
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.tags,
        p.view_count, p.created_at,
        u.name AS author,
        c.name AS category
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.tags @> $1
        AND p.status = 'published'
      ORDER BY p.created_at DESC
    `, [JSON.stringify([tag])]);

    res.json({
      tag,
      count: result.rows.length,
      posts: result.rows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /posts/:id — บทความ + comments (JOIN หลายตาราง)
app.get('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // อัปเดต view count
    await pool.query('UPDATE posts SET view_count = view_count + 1 WHERE id = $1', [id]);

    const postResult = await pool.query(`
      SELECT
        p.*,
        u.name AS author_name, u.email AS author_email, u.bio AS author_bio,
        c.name AS category_name, c.slug AS category_slug
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [id]);

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const commentsResult = await pool.query(`
      SELECT c.id, c.body, c.created_at, u.name AS user_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [id]);

    res.json({
      ...postResult.rows[0],
      comments: commentsResult.rows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /posts/:id/comments — เพิ่มความคิดเห็น
app.post('/posts/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, body } = req.body;

    if (!user_id || !body) {
      return res.status(400).json({ error: 'user_id and body are required' });
    }

    // ตรวจว่า post มีอยู่
    const postCheck = await pool.query('SELECT id FROM posts WHERE id = $1', [id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const result = await pool.query(`
      INSERT INTO comments (post_id, user_id, body)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [id, user_id, body]);

    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /stats — สถิติรวม (Views + Functions)
app.get('/stats', async (req, res) => {
  try {
    // Dashboard stats จาก view
    const dashboardResult = await pool.query('SELECT * FROM dashboard_stats');

    // Top posts by views
    const topPostsResult = await pool.query(`
      SELECT id, title, view_count, tags
      FROM posts
      WHERE status = 'published'
      ORDER BY view_count DESC
      LIMIT 5
    `);

    // Top authors by post count
    const topAuthorsResult = await pool.query(`
      SELECT u.name, COUNT(p.id) AS post_count, COALESCE(SUM(p.view_count), 0) AS total_views
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id AND p.status = 'published'
      GROUP BY u.id, u.name
      HAVING COUNT(p.id) > 0
      ORDER BY total_views DESC
    `);

    // Popular tags
    const tagsResult = await pool.query(`
      SELECT tag, COUNT(*) AS count
      FROM posts, jsonb_array_elements_text(tags) AS tag
      WHERE status = 'published'
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({
      dashboard: dashboardResult.rows[0],
      top_posts: topPostsResult.rows,
      top_authors: topAuthorsResult.rows,
      popular_tags: tagsResult.rows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`Blog Platform API running on port ${PORT}`));
