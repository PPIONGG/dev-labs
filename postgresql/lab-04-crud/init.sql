-- Lab 04: ข้อมูลเริ่มต้นสำหรับฝึก CRUD

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  age INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ข้อมูลตัวอย่าง
INSERT INTO users (name, email, age) VALUES
  ('สมชาย', 'somchai@mail.com', 25),
  ('สมหญิง', 'somying@mail.com', 30),
  ('สมศักดิ์', 'somsak@mail.com', 28),
  ('สมใจ', 'somjai@mail.com', 22),
  ('มานี', 'manee@mail.com', 35);
