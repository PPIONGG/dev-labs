const express = require('express');
const { Pool } = require('pg');
const { createClient } = require('redis');

const app = express();
app.use(express.json());

const PORT = 3000;

// --- PostgreSQL ---
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'todos',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'secret',
});

// --- Redis ---
const redis = createClient({
  url: `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`,
});
// redis.connect() จะถูกเรียกใน startup flow ด้านล่าง

// สร้างตาราง todos ถ้ายังไม่มี
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      completed BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('Database initialized');
}

// --- Routes ---

// Health check — ตรวจสอบทุก services
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    await redis.ping();
    res.json({ status: 'ok', db: 'connected', redis: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /todos — ดึง todos ทั้งหมด (มี cache)
app.get('/todos', async (req, res) => {
  try {
    // ลองอ่านจาก cache ก่อน
    const cached = await redis.get('todos');
    if (cached) {
      return res.json({ source: 'cache', data: JSON.parse(cached) });
    }

    // ถ้าไม่มี cache → query จาก database
    const result = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');

    // เก็บ cache ไว้ 60 วินาที
    await redis.setEx('todos', 60, JSON.stringify(result.rows));

    res.json({ source: 'database', data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /todos — สร้าง todo ใหม่
app.post('/todos', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const result = await pool.query(
      'INSERT INTO todos (title) VALUES ($1) RETURNING *',
      [title]
    );

    // ลบ cache เพราะข้อมูลเปลี่ยน
    await redis.del('todos');

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /todos/:id — แก้ไข todo
app.put('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    const result = await pool.query(
      'UPDATE todos SET title = COALESCE($1, title), completed = COALESCE($2, completed) WHERE id = $3 RETURNING *',
      [title, completed, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    await redis.del('todos');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /todos/:id — ลบ todo
app.delete('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    await redis.del('todos');
    res.json({ deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Start ---
async function start() {
  await redis.connect();
  console.log('Redis connected');

  await initDB();

  app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
