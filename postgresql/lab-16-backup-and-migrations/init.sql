-- Lab 16: ข้อมูลสำหรับฝึก Backup, Restore & Migrations

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  total NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL
);

-- Sample Users
INSERT INTO users (name, email) VALUES
  ('สมชาย ใจดี', 'somchai@mail.com'),
  ('สมหญิง รักเรียน', 'somying@mail.com'),
  ('มานะ ตั้งใจ', 'mana@mail.com'),
  ('มานี มีสุข', 'manee@mail.com'),
  ('วิชัย เก่งมาก', 'wichai@mail.com');

-- Categories
INSERT INTO categories (name, description) VALUES
  ('phone', 'สมาร์ทโฟน'),
  ('laptop', 'โน้ตบุ๊ก'),
  ('audio', 'อุปกรณ์เสียง'),
  ('tablet', 'แท็บเล็ต'),
  ('accessory', 'อุปกรณ์เสริม');

-- Products
INSERT INTO products (name, price, category_id, stock) VALUES
  ('iPhone 15', 35900, 1, 50),
  ('MacBook Air M3', 42900, 2, 25),
  ('AirPods Pro', 8990, 3, 100),
  ('iPad Air', 22900, 4, 20),
  ('USB-C Cable', 690, 5, 200);

-- Orders
INSERT INTO orders (user_id, total, status, created_at) VALUES
  (1, 44890, 'completed', '2024-01-15'),
  (2, 35900, 'completed', '2024-02-14'),
  (3, 42900, 'completed', '2024-03-05'),
  (1, 8990, 'shipped', '2024-03-20'),
  (4, 22900, 'pending', '2024-04-01');

-- Order Items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
  (1, 1, 1, 35900),
  (1, 3, 1, 8990),
  (2, 1, 1, 35900),
  (3, 2, 1, 42900),
  (4, 3, 1, 8990),
  (5, 4, 1, 22900);
