-- Lab 13: ข้อมูลสำหรับฝึก Views, Functions, Triggers (e-commerce schema)

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  category VARCHAR(50),
  stock INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
INSERT INTO users (name, email) VALUES
  ('สมชาย', 'somchai@mail.com'),
  ('สมหญิง', 'somying@mail.com'),
  ('สมศักดิ์', 'somsak@mail.com'),
  ('สมใจ', 'somjai@mail.com'),
  ('มานี', 'manee@mail.com');

-- Products
INSERT INTO products (name, price, category, stock) VALUES
  ('iPhone 15', 35900, 'phone', 50),
  ('iPhone 15 Pro', 42900, 'phone', 30),
  ('Samsung Galaxy S24', 29900, 'phone', 45),
  ('AirPods Pro', 8990, 'audio', 100),
  ('AirPods Max', 19900, 'audio', 20),
  ('JBL Flip 6', 3990, 'audio', 90),
  ('MacBook Air', 42900, 'laptop', 25),
  ('MacBook Pro', 69900, 'laptop', 10),
  ('iPad Air', 22900, 'tablet', 20),
  ('iPad Pro', 38900, 'tablet', 15),
  ('Apple Watch SE', 9900, 'watch', 60),
  ('Apple Watch Ultra', 31900, 'watch', 12);

-- Orders
INSERT INTO orders (user_id, total, status, created_at) VALUES
  (1, 44890, 'completed', '2024-01-15'),
  (1, 22900, 'completed', '2024-01-20'),
  (2, 35900, 'completed', '2024-02-10'),
  (2, 8990, 'completed', '2024-02-15'),
  (3, 52800, 'completed', '2024-02-20'),
  (1, 69900, 'completed', '2024-03-05'),
  (4, 9900, 'pending', '2024-03-10'),
  (5, 42900, 'shipped', '2024-03-15'),
  (3, 3990, 'cancelled', '2024-03-20');

-- Order Items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
  (1, 1, 1, 35900), (1, 4, 1, 8990),
  (2, 9, 1, 22900),
  (3, 1, 1, 35900),
  (4, 4, 1, 8990),
  (5, 7, 1, 42900), (5, 11, 1, 9900),
  (6, 8, 1, 69900),
  (7, 11, 1, 9900),
  (8, 7, 1, 42900),
  (9, 6, 1, 3990);
