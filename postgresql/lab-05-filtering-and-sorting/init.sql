-- Lab 05: ข้อมูลสินค้าสำหรับฝึก filtering & sorting

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO products (name, category, price, stock) VALUES
  ('iPhone 15', 'phone', 35900.00, 50),
  ('iPhone 15 Pro', 'phone', 42900.00, 30),
  ('Samsung Galaxy S24', 'phone', 29900.00, 45),
  ('iPad Air', 'tablet', 22900.00, 20),
  ('iPad Pro', 'tablet', 38900.00, 15),
  ('MacBook Air M3', 'laptop', 42900.00, 25),
  ('MacBook Pro 14"', 'laptop', 69900.00, 10),
  ('AirPods Pro', 'audio', 8990.00, 100),
  ('AirPods Max', 'audio', 19900.00, 20),
  ('Apple Watch SE', 'watch', 9900.00, 60),
  ('Apple Watch Ultra', 'watch', 31900.00, 12),
  ('Magic Keyboard', 'accessory', 3490.00, 80),
  ('Magic Mouse', 'accessory', 2790.00, 70),
  ('USB-C Cable', 'accessory', 690.00, 200),
  ('Phone Case', 'accessory', 390.00, 500),
  ('Screen Protector', 'accessory', 290.00, 300),
  ('Samsung Galaxy Tab', 'tablet', 12900.00, 35),
  ('Pixel 8', 'phone', 24900.00, 40),
  ('Sony WH-1000XM5', 'audio', 12900.00, 55),
  ('JBL Flip 6', 'audio', 3990.00, 90);

-- ปิดสินค้าบางรายการ
UPDATE products SET is_available = false WHERE id IN (7, 11);
-- ของหมด
UPDATE products SET stock = 0 WHERE id IN (5, 12);
