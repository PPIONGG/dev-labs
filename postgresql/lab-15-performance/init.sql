-- Lab 15: ข้อมูลสำหรับฝึก Performance Tuning
-- สร้างข้อมูล 100,000+ rows เพื่อให้เห็นผลของ performance tuning ชัดเจน

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  city VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  stock INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  total NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10,2) NOT NULL
);

-- สร้าง customers 100,000 rows
INSERT INTO customers (name, email, city, phone, created_at)
SELECT
  'Customer ' || i,
  'user' || i || '@mail.com',
  CASE (i % 10)
    WHEN 0 THEN 'Bangkok'
    WHEN 1 THEN 'Chiang Mai'
    WHEN 2 THEN 'Phuket'
    WHEN 3 THEN 'Pattaya'
    WHEN 4 THEN 'Khon Kaen'
    WHEN 5 THEN 'Bangkok'
    WHEN 6 THEN 'Bangkok'
    WHEN 7 THEN 'Chiang Mai'
    WHEN 8 THEN 'Nakhon Ratchasima'
    WHEN 9 THEN 'Hat Yai'
  END,
  '08' || LPAD((FLOOR(RANDOM() * 100000000))::TEXT, 8, '0'),
  NOW() - (RANDOM() * INTERVAL '730 days')
FROM generate_series(1, 100000) AS i;

-- สร้าง products 5,000 rows
INSERT INTO products (name, price, category, stock, is_available, created_at)
SELECT
  'Product ' || i,
  ROUND((RANDOM() * 99000 + 100)::NUMERIC, 2),
  CASE (i % 8)
    WHEN 0 THEN 'phone'
    WHEN 1 THEN 'laptop'
    WHEN 2 THEN 'audio'
    WHEN 3 THEN 'tablet'
    WHEN 4 THEN 'watch'
    WHEN 5 THEN 'accessory'
    WHEN 6 THEN 'camera'
    WHEN 7 THEN 'gaming'
  END,
  FLOOR(RANDOM() * 500),
  CASE WHEN RANDOM() > 0.05 THEN true ELSE false END,
  NOW() - (RANDOM() * INTERVAL '365 days')
FROM generate_series(1, 5000) AS i;

-- สร้าง orders 200,000 rows
INSERT INTO orders (customer_id, total, status, created_at)
SELECT
  FLOOR(RANDOM() * 100000) + 1,
  ROUND((RANDOM() * 50000 + 100)::NUMERIC, 2),
  CASE (i % 5)
    WHEN 0 THEN 'pending'
    WHEN 1 THEN 'confirmed'
    WHEN 2 THEN 'completed'
    WHEN 3 THEN 'completed'
    WHEN 4 THEN 'cancelled'
  END,
  NOW() - (RANDOM() * INTERVAL '365 days')
FROM generate_series(1, 200000) AS i;

-- สร้าง order_items 400,000 rows
INSERT INTO order_items (order_id, product_id, quantity, price)
SELECT
  FLOOR(RANDOM() * 200000) + 1,
  FLOOR(RANDOM() * 5000) + 1,
  FLOOR(RANDOM() * 5) + 1,
  ROUND((RANDOM() * 50000 + 100)::NUMERIC, 2)
FROM generate_series(1, 400000) AS i;

-- อัปเดต statistics หลัง insert ข้อมูลจำนวนมาก
ANALYZE customers;
ANALYZE products;
ANALYZE orders;
ANALYZE order_items;
