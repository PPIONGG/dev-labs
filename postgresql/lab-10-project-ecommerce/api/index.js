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
  database: process.env.DB_NAME || 'ecommerce',
});

// GET /products — สินค้าทั้งหมด + ชื่อหมวด (JOIN)
app.get('/products', async (req, res) => {
  try {
    const { category, search, sort = 'id', order = 'asc' } = req.query;
    const conditions = [];
    const values = [];
    let i = 1;

    if (category) { conditions.push(`c.name = $${i++}`); values.push(category); }
    if (search) { conditions.push(`p.name ILIKE $${i++}`); values.push(`%${search}%`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const allowed = ['id', 'name', 'price', 'stock'];
    const col = allowed.includes(sort) ? `p.${sort}` : 'p.id';
    const dir = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const result = await pool.query(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${where}
      ORDER BY ${col} ${dir}
    `, values);

    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /orders/:id — ออเดอร์ + ลูกค้า + รายการสินค้า (JOIN หลายตาราง)
app.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const orderResult = await pool.query(`
      SELECT o.*, u.name AS customer_name, u.email AS customer_email
      FROM orders o
      INNER JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `, [id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const itemsResult = await pool.query(`
      SELECT oi.quantity, oi.price, p.name AS product_name, c.name AS category
      FROM order_items oi
      INNER JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE oi.order_id = $1
    `, [id]);

    res.json({
      ...orderResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /orders — สร้างออเดอร์ใหม่ (Transaction)
app.post('/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    const { user_id, items } = req.body;
    if (!user_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'user_id and items are required' });
    }

    await client.query('BEGIN');

    // คำนวณยอดรวมและตรวจ stock
    let total = 0;
    for (const item of items) {
      const product = await client.query('SELECT price, stock FROM products WHERE id = $1', [item.product_id]);
      if (product.rows.length === 0) throw new Error(`Product ${item.product_id} not found`);
      if (product.rows[0].stock < item.quantity) throw new Error(`Product ${item.product_id} out of stock`);
      item.price = product.rows[0].price;
      total += item.price * item.quantity;
    }

    // สร้าง order
    const order = await client.query(
      'INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING *',
      [user_id, total]
    );

    // สร้าง order items + ลด stock
    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [order.rows[0].id, item.product_id, item.quantity, item.price]
      );
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(order.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /stats/top-products — สินค้าขายดี (GROUP BY + SUM)
app.get('/stats/top-products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.name, c.name AS category, SUM(oi.quantity) AS total_sold, SUM(oi.price * oi.quantity) AS revenue
      FROM order_items oi
      INNER JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      GROUP BY p.id, p.name, c.name
      ORDER BY total_sold DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /stats/top-customers — ลูกค้า VIP (CTE)
app.get('/stats/top-customers', async (req, res) => {
  try {
    const result = await pool.query(`
      WITH customer_stats AS (
        SELECT u.id, u.name, u.email,
               COUNT(o.id) AS order_count,
               COALESCE(SUM(o.total), 0) AS total_spent
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'completed'
        GROUP BY u.id, u.name, u.email
      )
      SELECT * FROM customer_stats
      ORDER BY total_spent DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /stats/monthly-sales — ยอดขายรายเดือน
app.get('/stats/monthly-sales', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') AS month,
        COUNT(*) AS order_count,
        SUM(total) AS total_sales,
        ROUND(AVG(total), 2) AS avg_order_value
      FROM orders
      WHERE status IN ('completed', 'shipped')
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`E-commerce API running on port ${PORT}`));
