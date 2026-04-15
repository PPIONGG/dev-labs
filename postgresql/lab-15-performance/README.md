# Lab 15 — Performance Tuning: ทำ Query ให้เร็วขึ้น

## เป้าหมาย

วิเคราะห์และปรับปรุง query ให้เร็วขึ้น ด้วย EXPLAIN, ANALYZE, Index และเทคนิคต่าง ๆ

## ทำไมต้องรู้?

Query ช้า = ผู้ใช้รอนาน = เสียลูกค้า:
- หน้าเว็บโหลด 3 วินาที → ผู้ใช้ 53% ปิดทิ้ง
- Query ที่ scan 1 ล้าน rows ทั้งหมด ทั้งที่ต้องการแค่ 10 rows
- ปัญหาที่ตรวจไม่เจอในข้อมูลน้อย แต่ระเบิดเมื่อข้อมูลโตขึ้น

การอ่าน query plan และแก้ปัญหา performance เป็น skill สำคัญของ developer

## สิ่งที่ต้องมีก่อน

- [Lab 14](../lab-14-json/) — JSON/JSONB
- [Lab 11](../lab-11-indexing/) — Indexing พื้นฐาน

## เนื้อหา

### 1. EXPLAIN -- ดู Query Plan

`EXPLAIN` แสดงว่า PostgreSQL จะรัน query อย่างไร **โดยไม่รัน query จริง**

```sql
EXPLAIN SELECT * FROM customers WHERE email = 'user500@mail.com';
```

ผลลัพธ์:
```
Seq Scan on customers  (cost=0.00..2041.00 rows=1 width=55)
  Filter: ((email)::text = 'user500@mail.com'::text)
```

**อ่าน query plan:**
- `Seq Scan` — scan ทุกแถวในตาราง (ช้า)
- `cost=0.00..2041.00` — ค่าประมาณ (startup..total)
- `rows=1` — จำนวน rows ที่คาดว่าจะได้
- `width=55` — ขนาดเฉลี่ยต่อ row (bytes)

### 2. EXPLAIN ANALYZE -- ดู Query Plan + เวลาจริง

`EXPLAIN ANALYZE` รัน query จริงและแสดงเวลา

```sql
EXPLAIN ANALYZE SELECT * FROM customers WHERE email = 'user500@mail.com';
```

ผลลัพธ์:
```
Seq Scan on customers  (cost=0.00..2041.00 rows=1 width=55)
                       (actual time=5.123..12.456 rows=1 loops=1)
  Filter: ((email)::text = 'user500@mail.com'::text)
  Rows Removed by Filter: 99999
Planning Time: 0.085 ms
Execution Time: 12.501 ms
```

**ข้อมูลเพิ่มเติม:**
- `actual time=5.123..12.456` — เวลาจริง (ms)
- `rows=1` — จำนวน rows จริงที่ได้
- `Rows Removed by Filter: 99999` — scan 99,999 rows ทิ้ง!
- `Execution Time: 12.501 ms` — เวลารวม

### 3. อ่าน Query Plan -- ประเภทต่าง ๆ

#### Scan Types

| ประเภท | คำอธิบาย | ความเร็ว |
|-------|---------|---------|
| Seq Scan | scan ทุกแถว | ช้า (ข้อมูลมาก) |
| Index Scan | ใช้ index หา แล้วไป table | เร็ว |
| Index Only Scan | ใช้ index อย่างเดียว ไม่ไป table | เร็วมาก |
| Bitmap Index Scan | ใช้ index สร้าง bitmap แล้ว scan | เร็ว (หลาย rows) |

```sql
-- Seq Scan (ไม่มี index)
EXPLAIN ANALYZE SELECT * FROM customers WHERE city = 'Bangkok';

-- สร้าง index
CREATE INDEX idx_customers_city ON customers(city);

-- Index Scan (มี index แล้ว)
EXPLAIN ANALYZE SELECT * FROM customers WHERE city = 'Bangkok';
```

#### Join Types

| ประเภท | คำอธิบาย | เหมาะกับ |
|-------|---------|---------|
| Nested Loop | วน loop ซ้อน | ข้อมูลน้อย |
| Hash Join | สร้าง hash table แล้ว match | ข้อมูลปานกลาง |
| Merge Join | sort ก่อนแล้ว merge | ข้อมูลมาก + sorted |

```sql
-- ดู join plan
EXPLAIN ANALYZE
SELECT c.name, o.total
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id
WHERE o.total > 5000;
```

### 4. ปัญหาที่พบบ่อย

#### 4.1 Missing Index

```sql
-- ปัญหา: Seq Scan ทุกครั้ง
EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'pending';
-- Seq Scan on orders ... Execution Time: 50ms

-- แก้: เพิ่ม index
CREATE INDEX idx_orders_status ON orders(status);
EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'pending';
-- Index Scan ... Execution Time: 0.5ms  ← เร็วขึ้น 100 เท่า!
```

#### 4.2 SELECT * (ดึงทุกคอลัมน์)

```sql
-- ปัญหา: ดึงทุกคอลัมน์ทั้งที่ต้องการแค่ 2
SELECT * FROM customers WHERE city = 'Bangkok';

-- แก้: เลือกเฉพาะที่ต้องการ
SELECT name, email FROM customers WHERE city = 'Bangkok';
-- ได้ Index Only Scan ถ้า index ครอบคลุม
```

#### 4.3 N+1 Queries

```sql
-- ปัญหา: ดึง orders ก่อน แล้ว loop ดึง customer ทีละคน
-- Query 1: SELECT * FROM orders;          → 1000 rows
-- Query 2-1001: SELECT * FROM customers WHERE id = ?  → 1000 queries!

-- แก้: ใช้ JOIN
SELECT o.*, c.name AS customer_name
FROM orders o
INNER JOIN customers c ON o.customer_id = c.id;
-- 1 query แทน 1001 queries!
```

#### 4.4 ใช้ function กับ indexed column

```sql
-- ปัญหา: index ใช้ไม่ได้ เพราะ LOWER() ครอบ column
SELECT * FROM customers WHERE LOWER(email) = 'user500@mail.com';
-- Seq Scan!

-- แก้ 1: สร้าง expression index
CREATE INDEX idx_customers_email_lower ON customers(LOWER(email));

-- แก้ 2: ใช้ ILIKE แทน (ถ้าเหมาะสม)
SELECT * FROM customers WHERE email ILIKE 'user500@mail.com';
```

### 5. วิธีแก้ปัญหา -- เพิ่ม Index ที่เหมาะสม

```sql
-- Composite index สำหรับ query ที่กรองหลาย column
CREATE INDEX idx_orders_status_date ON orders(status, created_at);

-- ทดสอบ
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE status = 'completed' AND created_at > '2024-06-01';

-- Partial index สำหรับข้อมูลที่ query บ่อย
CREATE INDEX idx_orders_pending ON orders(created_at)
WHERE status = 'pending';

-- Covering index (INCLUDE) — ไม่ต้องไป table
CREATE INDEX idx_customers_city_cover ON customers(city) INCLUDE (name, email);
EXPLAIN ANALYZE SELECT name, email FROM customers WHERE city = 'Bangkok';
-- Index Only Scan!
```

### 6. VACUUM & ANALYZE

PostgreSQL ไม่ลบข้อมูลจริง ๆ เมื่อ DELETE/UPDATE — แค่ mark ว่าไม่ใช้แล้ว

```sql
-- VACUUM: ทำความสะอาด dead tuples
VACUUM customers;

-- VACUUM VERBOSE: แสดงรายละเอียด
VACUUM VERBOSE customers;

-- VACUUM FULL: compact table (ล็อคตาราง!)
VACUUM FULL customers;

-- ANALYZE: อัปเดต statistics สำหรับ query planner
ANALYZE customers;

-- VACUUM + ANALYZE พร้อมกัน
VACUUM ANALYZE customers;
```

**เมื่อไหร่ต้อง VACUUM/ANALYZE:**
- หลัง DELETE/UPDATE ข้อมูลจำนวนมาก
- เมื่อ query plan ไม่ตรงกับความจริง
- PostgreSQL รัน autovacuum อยู่แล้ว แต่บางทีไม่ทัน

### 7. Connection Pooling

ปัญหา: เปิด connection ใหม่ทุกครั้ง → ช้า (PostgreSQL fork process ใหม่ทุก connection)

```
ไม่มี pooling:                    มี pooling:
App → [conn1] → DB               App → [pool] → DB
App → [conn2] → DB                 pool มี conn สำรองไว้
App → [conn3] → DB                 reuse conn เดิม
...สร้างใหม่ทุกครั้ง               ...เร็วกว่ามาก
```

**ใน Node.js (pg library):**

```javascript
// ใช้ Pool แทน Client
const { Pool } = require('pg');
const pool = new Pool({
  max: 20,                // connection สูงสุด
  idleTimeoutMillis: 30000,  // ปิด idle connection หลัง 30 วินาที
  connectionTimeoutMillis: 2000, // timeout 2 วินาที
});
```

**เครื่องมือ Connection Pooling:**
- **PgBouncer** — ใช้มากที่สุด lightweight
- **pgpool-II** — มี load balancing ด้วย

## แบบฝึกหัด

ไฟล์ `exercises.sql` — ฝึกวิเคราะห์และปรับปรุง performance:

1. ใช้ EXPLAIN ANALYZE ดู query plan ของ query ที่ไม่มี index
2. สร้าง index แล้วเปรียบเทียบ Execution Time
3. หา query ที่ใช้ Seq Scan แล้วแก้ให้ใช้ Index Scan
4. สร้าง composite index สำหรับ query ที่กรองหลาย column
5. ใช้ VACUUM ANALYZE แล้วดูผลต่าง
6. แก้ปัญหา function ครอบ indexed column

## สรุป

- `EXPLAIN` ดู query plan, `EXPLAIN ANALYZE` ดู query plan + เวลาจริง
- `Seq Scan` = ช้า (ข้อมูลมาก), `Index Scan` = เร็ว
- ปัญหาที่พบบ่อย: missing index, SELECT *, N+1 queries
- ใช้ composite index, partial index, covering index ตามสถานการณ์
- `VACUUM` ทำความสะอาด, `ANALYZE` อัปเดต statistics
- ใช้ connection pooling ลด overhead

## ต่อไป

[Lab 16 — Backup, Restore & Migrations →](../lab-16-backup-and-migrations/)
