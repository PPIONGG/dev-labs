-- ==============================================
-- Lab 11: แบบฝึกหัด Indexing
-- ==============================================

-- ฝึก 1: ใช้ EXPLAIN ANALYZE ดู query plan ของ
--         SELECT * FROM products WHERE category = 'phone';
--         (ก่อนสร้าง index — ควรเห็น Seq Scan)



-- ฝึก 2: สร้าง index บน products.category แล้วรัน EXPLAIN ANALYZE อีกครั้ง
--         เปรียบเทียบ execution time



-- ฝึก 3: สร้าง composite index บน orders (status, created_at)
--         แล้วทดสอบ query:
--         SELECT * FROM orders WHERE status = 'completed' AND created_at > NOW() - INTERVAL '30 days';



-- ฝึก 4: สร้าง UNIQUE index บน orders.user_email
--         (จะเกิดอะไรขึ้น? ทำไม?)



-- ฝึก 5: สร้าง partial index เฉพาะ orders ที่ status = 'pending'
--         แล้วทดสอบด้วย EXPLAIN ANALYZE



-- ฝึก 6: ดู index ทั้งหมดที่มีอยู่ในตาราง products
--         (Hint: ใช้ \di หรือ query จาก pg_indexes)



-- ==============================================
-- เฉลย
-- ==============================================

/*
-- ฝึก 1: ก่อนมี index → Seq Scan
EXPLAIN ANALYZE
SELECT * FROM products WHERE category = 'phone';
-- จะเห็น: Seq Scan on products ... rows=~400

-- ฝึก 2: สร้าง index แล้วทดสอบ
CREATE INDEX idx_products_category ON products(category);

EXPLAIN ANALYZE
SELECT * FROM products WHERE category = 'phone';
-- จะเห็น: Bitmap Index Scan หรือ Index Scan ... เร็วขึ้น

-- ฝึก 3: Composite index
CREATE INDEX idx_orders_status_created ON orders(status, created_at);

EXPLAIN ANALYZE
SELECT * FROM orders
WHERE status = 'completed'
  AND created_at > NOW() - INTERVAL '30 days';

-- ฝึก 4: UNIQUE index บน user_email
-- จะ ERROR เพราะ user_email มีค่าซ้ำ (หลาย orders จาก email เดียวกัน)
-- CREATE UNIQUE INDEX idx_orders_email_unique ON orders(user_email);
-- ERROR: could not create unique index ... duplicate key

-- ฝึก 5: Partial index
CREATE INDEX idx_orders_pending ON orders(created_at)
WHERE status = 'pending';

EXPLAIN ANALYZE
SELECT * FROM orders
WHERE status = 'pending'
  AND created_at > NOW() - INTERVAL '7 days';
-- จะเห็น: Index Scan using idx_orders_pending

-- ฝึก 6: ดู index ทั้งหมด
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'products';
*/
