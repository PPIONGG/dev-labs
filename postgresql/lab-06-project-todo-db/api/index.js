const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const PORT = 3000;

// เชื่อมต่อ PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'secret',
  database: process.env.DB_NAME || 'todo_app',
});

// GET /todos — ดู todos ทั้งหมด (filter, sort, paginate)
app.get('/todos', async (req, res) => {
  try {
    const {
      status,
      search,
      sort = 'created_at',
      order = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    // สร้าง query แบบ dynamic
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // กรองตาม status
    if (status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    // ค้นหาชื่อ
    if (search) {
      conditions.push(`title ILIKE $${paramIndex}`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    // สร้าง WHERE clause
    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // ป้องกัน SQL injection สำหรับ sort column
    const allowedSortColumns = ['id', 'title', 'status', 'priority', 'created_at', 'updated_at'];
    const sortColumn = allowedSortColumns.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Query หลัก
    const query = `
      SELECT * FROM todos
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const result = await pool.query(query, values);

    // นับจำนวนทั้งหมด (สำหรับ pagination info)
    const countQuery = `SELECT COUNT(*) FROM todos ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /todos/:id — ดู todo 1 รายการ
app.get('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /todos — สร้าง todo ใหม่
app.post('/todos', async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const result = await pool.query(
      'INSERT INTO todos (title, description, priority) VALUES ($1, $2, $3) RETURNING *',
      [title, description || null, priority || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /todos/:id — แก้ไข todo
app.put('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority } = req.body;

    const result = await pool.query(
      `UPDATE todos
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, description, status, priority, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /todos/:id — ลบ todo
app.delete('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM todos WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Todo API running on port ${PORT}`);
});
