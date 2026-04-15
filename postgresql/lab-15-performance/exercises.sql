-- ==============================================
-- Lab 15: แบบฝึกหัด Performance Tuning
-- ==============================================

-- ฝึก 1: ใช้ EXPLAIN ANALYZE ดู query plan ของ query ที่ไม่มี index
--         หาลูกค้าที่อยู่ Bangkok — สังเกต Seq Scan


-- ฝึก 2: สร้าง index บน city แล้ว EXPLAIN ANALYZE อีกครั้ง
--         เปรียบเทียบ Execution Time ก่อน/หลัง


-- ฝึก 3: ดู query plan ของ JOIN ระหว่าง orders กับ customers
--         สังเกต join type (Hash Join, Nested Loop, etc.)


-- ฝึก 4: หา orders ที่ status = 'pending' — สร้าง index แล้วเปรียบเทียบ


-- ฝึก 5: สร้าง composite index สำหรับ query ที่กรอง status + created_at


-- ฝึก 6: ใช้ EXPLAIN ANALYZE กับ SELECT * vs SELECT เฉพาะ column
--         สังเกตความแตกต่าง


-- ฝึก 7: สร้าง partial index สำหรับ orders ที่ status = 'pending'
--         เปรียบเทียบขนาด index กับ full index


-- ฝึก 8: รัน VACUUM ANALYZE แล้วดูผลต่าง


-- ==============================================
-- เฉลย
-- ==============================================

/*
-- ฝึก 1: ก่อนสร้าง index
EXPLAIN ANALYZE SELECT * FROM customers WHERE city = 'Bangkok';
-- ผลลัพธ์: Seq Scan on customers ... Execution Time: ~20-50ms

-- ฝึก 2: สร้าง index แล้วลองอีกครั้ง
CREATE INDEX idx_customers_city ON customers(city);
EXPLAIN ANALYZE SELECT * FROM customers WHERE city = 'Bangkok';
-- ผลลัพธ์: Bitmap Index Scan ... Execution Time: ~2-5ms

-- ฝึก 3: JOIN query plan
EXPLAIN ANALYZE
SELECT c.name, o.total, o.status
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id
WHERE c.city = 'Bangkok' AND o.status = 'completed';
-- สังเกต: Hash Join หรือ Nested Loop

-- ฝึก 4: index บน status
EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'pending';
-- ก่อน: Seq Scan

CREATE INDEX idx_orders_status ON orders(status);
EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'pending';
-- หลัง: Bitmap Index Scan

-- ฝึก 5: composite index
CREATE INDEX idx_orders_status_date ON orders(status, created_at);
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE status = 'completed'
  AND created_at > NOW() - INTERVAL '30 days';
-- ใช้ Index Scan บน idx_orders_status_date

-- ฝึก 6: SELECT * vs SELECT เฉพาะ column
EXPLAIN ANALYZE SELECT * FROM customers WHERE city = 'Phuket';
EXPLAIN ANALYZE SELECT name, email FROM customers WHERE city = 'Phuket';
-- สังเกต width ต่างกัน

-- สร้าง covering index
CREATE INDEX idx_customers_city_cover ON customers(city) INCLUDE (name, email);
EXPLAIN ANALYZE SELECT name, email FROM customers WHERE city = 'Phuket';
-- Index Only Scan!

-- ฝึก 7: partial index
CREATE INDEX idx_orders_pending ON orders(created_at) WHERE status = 'pending';
EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'pending' AND created_at > NOW() - INTERVAL '7 days';
-- ใช้ partial index — เล็กกว่า full index

-- ดูขนาด index
SELECT indexname, pg_size_pretty(pg_relation_size(indexname::regclass)) AS size
FROM pg_indexes
WHERE tablename = 'orders';

-- ฝึก 8:
VACUUM ANALYZE orders;
VACUUM ANALYZE customers;
-- ตรวจสอบ dead tuples:
SELECT relname, n_live_tup, n_dead_tup
FROM pg_stat_user_tables
WHERE relname IN ('orders', 'customers');
*/
