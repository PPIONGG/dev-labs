-- Lab 07: ข้อมูลสำหรับฝึก JOIN

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  category VARCHAR(50)
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
  quantity INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL
);

-- Users
INSERT INTO users (name, email) VALUES
  ('สมชาย', 'somchai@mail.com'),
  ('สมหญิง', 'somying@mail.com'),
  ('สมศักดิ์', 'somsak@mail.com'),
  ('สมใจ', 'somjai@mail.com'),
  ('มานี', 'manee@mail.com');

-- Products
INSERT INTO products (name, price, category) VALUES
  ('iPhone 15', 35900, 'phone'),
  ('AirPods Pro', 8990, 'audio'),
  ('MacBook Air', 42900, 'laptop'),
  ('iPad Air', 22900, 'tablet'),
  ('Apple Watch', 9900, 'watch');

-- Orders
INSERT INTO orders (user_id, total, status) VALUES
  (1, 44890, 'completed'),
  (1, 22900, 'completed'),
  (2, 35900, 'completed'),
  (2, 8990, 'pending'),
  (5, 52800, 'completed');

-- Order Items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
  (1, 1, 1, 35900),
  (1, 2, 1, 8990),
  (2, 4, 1, 22900),
  (3, 1, 1, 35900),
  (4, 2, 1, 8990),
  (5, 3, 1, 42900),
  (5, 5, 1, 9900);
