-- Lab 10: E-commerce Schema

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  label VARCHAR(50) DEFAULT 'home',
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(10)
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  category_id INTEGER REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  total NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'completed', 'cancelled')),
  shipping_address_id INTEGER REFERENCES addresses(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL
);

-- Sample data
INSERT INTO users (name, email) VALUES
  ('สมชาย ใจดี', 'somchai@mail.com'),
  ('สมหญิง รักเรียน', 'somying@mail.com'),
  ('มานะ ตั้งใจ', 'mana@mail.com'),
  ('มานี มีสุข', 'manee@mail.com'),
  ('วิชัย เก่งมาก', 'wichai@mail.com');

INSERT INTO addresses (user_id, label, address, city, postal_code) VALUES
  (1, 'home', '123 ถนนสุขุมวิท', 'กรุงเทพ', '10110'),
  (1, 'work', '456 ถนนสีลม', 'กรุงเทพ', '10500'),
  (2, 'home', '789 ถนนเชียงใหม่', 'เชียงใหม่', '50200'),
  (3, 'home', '321 ถนนภูเก็ต', 'ภูเก็ต', '83000');

INSERT INTO categories (name, description) VALUES
  ('phone', 'สมาร์ทโฟน'),
  ('laptop', 'โน้ตบุ๊ก'),
  ('audio', 'อุปกรณ์เสียง'),
  ('tablet', 'แท็บเล็ต'),
  ('accessory', 'อุปกรณ์เสริม');

INSERT INTO products (name, description, price, stock, category_id) VALUES
  ('iPhone 15', 'Apple iPhone 15 128GB', 35900, 50, 1),
  ('iPhone 15 Pro', 'Apple iPhone 15 Pro 256GB', 42900, 30, 1),
  ('Samsung Galaxy S24', 'Samsung Galaxy S24 256GB', 29900, 45, 1),
  ('MacBook Air M3', 'Apple MacBook Air 13" M3', 42900, 25, 2),
  ('MacBook Pro 14"', 'Apple MacBook Pro 14" M3 Pro', 69900, 10, 2),
  ('AirPods Pro', 'Apple AirPods Pro 2nd Gen', 8990, 100, 3),
  ('Sony WH-1000XM5', 'Sony Wireless Headphones', 12900, 55, 3),
  ('iPad Air', 'Apple iPad Air M1', 22900, 20, 4),
  ('USB-C Cable', 'USB-C to USB-C 2m', 690, 200, 5),
  ('Phone Case', 'Clear Case for iPhone 15', 390, 500, 5);

INSERT INTO orders (user_id, total, status, shipping_address_id, created_at) VALUES
  (1, 44890, 'completed', 1, '2024-01-15'),
  (1, 42900, 'completed', 2, '2024-02-10'),
  (2, 35900, 'completed', 3, '2024-02-14'),
  (2, 8990, 'shipped', 3, '2024-03-01'),
  (3, 52800, 'completed', 4, '2024-03-05'),
  (1, 690, 'pending', 1, '2024-03-20'),
  (4, 22900, 'completed', NULL, '2024-03-25'),
  (5, 69900, 'completed', NULL, '2024-04-01');

INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
  (1, 1, 1, 35900), (1, 6, 1, 8990),
  (2, 4, 1, 42900),
  (3, 1, 1, 35900),
  (4, 6, 1, 8990),
  (5, 4, 1, 42900), (5, 11, 1, 9900),
  (6, 9, 1, 690),
  (7, 8, 1, 22900),
  (8, 5, 1, 69900);

-- Fix order 5 reference (product 11 doesn't exist, use product 7)
UPDATE order_items SET product_id = 7, price = 12900 WHERE order_id = 5 AND product_id = 11;
UPDATE orders SET total = 55800 WHERE id = 5;
