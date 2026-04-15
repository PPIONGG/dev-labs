-- Lab 12: ข้อมูลสำหรับฝึก Transactions & ACID

CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT positive_balance CHECK (balance >= 0)
);

CREATE TABLE transfer_log (
  id SERIAL PRIMARY KEY,
  from_account_id INTEGER REFERENCES accounts(id),
  to_account_id INTEGER REFERENCES accounts(id),
  amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'completed',
  transferred_at TIMESTAMPTZ DEFAULT NOW()
);

-- บัญชีตัวอย่าง
INSERT INTO accounts (name, balance) VALUES
  ('สมชาย', 50000.00),
  ('สมหญิง', 30000.00),
  ('สมศักดิ์', 10000.00),
  ('สมใจ', 80000.00),
  ('มานี', 5000.00);

-- ประวัติโอนเงิน
INSERT INTO transfer_log (from_account_id, to_account_id, amount, transferred_at) VALUES
  (1, 2, 5000.00, '2024-01-15 10:30:00+07'),
  (4, 1, 10000.00, '2024-01-20 14:00:00+07'),
  (2, 3, 2000.00, '2024-02-01 09:15:00+07');
