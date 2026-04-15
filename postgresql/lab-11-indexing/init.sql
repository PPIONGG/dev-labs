-- Lab 11: ข้อมูลสำหรับฝึก Indexing (ใช้ generate_series สร้างข้อมูลจำนวนมาก)

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  category VARCHAR(50),
  stock INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  total NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- สร้าง products 2,000 rows
INSERT INTO products (name, price, category, stock, is_available, created_at)
SELECT
  'Product ' || i,
  ROUND((RANDOM() * 99000 + 1000)::NUMERIC, 2),
  CASE (i % 5)
    WHEN 0 THEN 'phone'
    WHEN 1 THEN 'laptop'
    WHEN 2 THEN 'audio'
    WHEN 3 THEN 'tablet'
    WHEN 4 THEN 'watch'
  END,
  FLOOR(RANDOM() * 200),
  CASE WHEN RANDOM() > 0.1 THEN true ELSE false END,
  NOW() - (RANDOM() * INTERVAL '365 days')
FROM generate_series(1, 2000) AS i;

-- สร้าง orders 5,000 rows
INSERT INTO orders (user_email, product_id, quantity, total, status, created_at)
SELECT
  'user' || (FLOOR(RANDOM() * 500) + 1) || '@mail.com',
  FLOOR(RANDOM() * 2000) + 1,
  FLOOR(RANDOM() * 5) + 1,
  ROUND((RANDOM() * 50000 + 500)::NUMERIC, 2),
  CASE (i % 4)
    WHEN 0 THEN 'pending'
    WHEN 1 THEN 'completed'
    WHEN 2 THEN 'completed'
    WHEN 3 THEN 'cancelled'
  END,
  NOW() - (RANDOM() * INTERVAL '180 days')
FROM generate_series(1, 5000) AS i;
