# Lab 11 — Indexing: ทำให้ Query เร็วขึ้นด้วย Index

## เป้าหมาย

เข้าใจ Index คืออะไร ทำไมทำให้ query เร็วขึ้น และสร้าง index ได้อย่างเหมาะสม

## ทำไมต้องรู้?

ถ้าไม่มี index ทุกครั้งที่ query ข้อมูล PostgreSQL ต้อง **scan ทุกแถว** ในตาราง (Full Table Scan):

- ตาราง 100 แถว → ไม่เห็นความแตกต่าง
- ตาราง 1,000,000 แถว → ช้ามาก!
- ระบบจริงมีข้อมูลหลายล้านแถว → **ต้องมี index**

## สิ่งที่ต้องมีก่อน

- [Lab 10](../lab-10-project-ecommerce/) — ใช้ SQL ได้คล่อง

## เนื้อหา

### 1. Index คืออะไร?

Index เปรียบเหมือน **สารบัญหนังสือ**:

- **ไม่มี index** = เปิดหนังสือทีละหน้าเพื่อหาคำที่ต้องการ
- **มี index** = เปิดสารบัญ → เจอเลขหน้า → ไปตรงนั้นเลย

```
ไม่มี Index (Seq Scan):
┌───────────────────────────────┐
│  แถว 1 → ตรวจ → ไม่ใช่       │
│  แถว 2 → ตรวจ → ไม่ใช่       │
│  แถว 3 → ตรวจ → ✓ เจอ!       │
│  แถว 4 → ตรวจ → ไม่ใช่       │  ← ต้องดูทุกแถว
│  ...                          │
│  แถว 2000 → ตรวจ → ไม่ใช่    │
└───────────────────────────────┘

มี Index (Index Scan):
┌──────────┐     ┌───────────────┐
│  Index   │ ──→ │  แถว 3 ✓ เจอ! │  ← ไปตรงเป้าเลย
└──────────┘     └───────────────┘
```

### 2. CREATE INDEX พื้นฐาน

```sql
-- สร้าง index บน column เดียว
CREATE INDEX idx_products_category ON products(category);

-- สร้าง index พร้อมตั้งชื่อ (convention: idx_ตาราง_คอลัมน์)
CREATE INDEX idx_orders_status ON orders(status);

-- ลบ index
DROP INDEX idx_orders_status;
```

### 3. ประเภท Index

PostgreSQL รองรับ index หลายประเภท:

```sql
-- B-tree (default) — ใช้กับ =, <, >, <=, >=, BETWEEN
CREATE INDEX idx_products_price ON products(price);

-- Hash — ใช้กับ = เท่านั้น (เร็วกว่า B-tree สำหรับ equality)
CREATE INDEX idx_orders_status_hash ON orders USING HASH (status);

-- GIN — ใช้กับ full-text search, array, JSONB
-- CREATE INDEX idx_products_tags ON products USING GIN (tags);

-- GiST — ใช้กับ geometric data, full-text search
-- CREATE INDEX idx_locations_point ON locations USING GiST (point);
```

**สรุป:**

| ประเภท | ใช้กับ | ตัวอย่าง |
|--------|--------|----------|
| B-tree | `=`, `<`, `>`, `BETWEEN`, `ORDER BY` | ราคา, วันที่ |
| Hash | `=` เท่านั้น | status, category |
| GIN | array, JSONB, full-text | tags, metadata |
| GiST | geometric, range | ตำแหน่ง, ช่วงเวลา |

### 4. Single vs Composite Index

```sql
-- Single index — 1 column
CREATE INDEX idx_orders_status ON orders(status);

-- Composite index — หลาย columns (ลำดับสำคัญ!)
CREATE INDEX idx_orders_status_date ON orders(status, created_at);
```

**หลักการ:** Composite index ใช้ได้เมื่อ query ใช้ columns **จากซ้ายไปขวา**:

```sql
-- ✅ ใช้ idx_orders_status_date ได้
SELECT * FROM orders WHERE status = 'completed';
SELECT * FROM orders WHERE status = 'completed' AND created_at > '2024-01-01';

-- ❌ ใช้ idx_orders_status_date ไม่ได้ (ข้าม column แรก)
SELECT * FROM orders WHERE created_at > '2024-01-01';
```

### 5. UNIQUE Index

```sql
-- UNIQUE index = ห้ามค่าซ้ำ + เร็วขึ้นตอน query
CREATE UNIQUE INDEX idx_products_name_unique ON products(name);

-- ถ้า INSERT ค่าซ้ำ → ERROR
-- INSERT INTO products (name, price, category, stock)
-- VALUES ('Product 1', 9999, 'phone', 10);
-- ERROR: duplicate key value violates unique constraint
```

> **หมายเหตุ:** `PRIMARY KEY` และ `UNIQUE` constraint สร้าง unique index ให้อัตโนมัติ

### 6. Partial Index (Index แบบมีเงื่อนไข)

สร้าง index เฉพาะบางแถว — ประหยัดพื้นที่ + เร็วขึ้น:

```sql
-- Index เฉพาะ orders ที่ยังไม่เสร็จ
CREATE INDEX idx_orders_pending ON orders(created_at)
WHERE status = 'pending';

-- Index เฉพาะสินค้าที่ยังขายอยู่
CREATE INDEX idx_products_available ON products(price)
WHERE is_available = true;
```

**ทำไมถึงดี?** ถ้ามี orders 1,000,000 แถว แต่ pending แค่ 1,000 แถว → index เล็กมาก เร็วมาก

### 7. EXPLAIN ANALYZE — ดู Query Plan

EXPLAIN ANALYZE บอกว่า PostgreSQL ทำงานยังไง:

```sql
-- Seq Scan (ไม่มี index) — ช้า
EXPLAIN ANALYZE
SELECT * FROM products WHERE category = 'phone';

-- ผลลัพธ์:
-- Seq Scan on products  (cost=0.00..42.50 rows=400 width=...)
--   Filter: (category = 'phone')
--   Rows Removed by Filter: 1600
--   Planning Time: 0.085 ms
--   Execution Time: 0.543 ms   ← ดูตรงนี้
```

```sql
-- สร้าง index
CREATE INDEX idx_products_category ON products(category);

-- Index Scan (มี index) — เร็ว
EXPLAIN ANALYZE
SELECT * FROM products WHERE category = 'phone';

-- ผลลัพธ์:
-- Bitmap Index Scan on idx_products_category  (...)
--   Index Cond: (category = 'phone')
--   Planning Time: 0.120 ms
--   Execution Time: 0.210 ms   ← เร็วขึ้น!
```

**อ่าน EXPLAIN ANALYZE:**

| ข้อมูล | ความหมาย |
|--------|----------|
| Seq Scan | Scan ทุกแถว (ช้า) |
| Index Scan | ใช้ index (เร็ว) |
| Bitmap Index Scan | ใช้ index แบบ bitmap (เร็ว) |
| Execution Time | เวลาจริงที่ใช้ |
| rows | จำนวนแถวที่ได้ |

### 8. เมื่อไหร่ควร/ไม่ควรสร้าง Index

**ควรสร้าง Index:**
- Column ที่ใช้ใน `WHERE` บ่อย
- Column ที่ใช้ใน `JOIN` (`ON` clause)
- Column ที่ใช้ใน `ORDER BY` บ่อย
- Column ที่มีค่าหลากหลาย (high cardinality) เช่น email, id

**ไม่ควรสร้าง Index:**
- ตารางเล็ก (ไม่กี่ร้อยแถว) — Seq Scan เร็วพอ
- Column ที่มีค่าซ้ำเยอะ (low cardinality) เช่น gender (M/F)
- ตารางที่ INSERT/UPDATE บ่อยมาก — index ทำให้ write ช้าลง
- Column ที่ไม่ค่อยใช้ค้นหา

```
สร้าง Index = แลก:
  ✅ query เร็วขึ้น (read)
  ❌ insert/update ช้าลง (write) — ต้อง update index ด้วย
  ❌ ใช้พื้นที่เพิ่ม (disk space)
```

## แบบฝึกหัด

ใช้ข้อมูลจาก init.sql (products 2,000 rows, orders 5,000 rows):

1. ใช้ `EXPLAIN ANALYZE` ดู query plan ของ `SELECT * FROM products WHERE category = 'phone'` (ก่อนสร้าง index)
2. สร้าง index บน `products.category` แล้วรัน `EXPLAIN ANALYZE` อีกครั้ง — เปรียบเทียบ execution time
3. สร้าง composite index บน `orders(status, created_at)` แล้วทดสอบ query ที่ใช้ทั้งสอง columns
4. ลองสร้าง UNIQUE index บน `orders.user_email` — จะเกิดอะไรขึ้น? ทำไม?
5. สร้าง partial index สำหรับ orders ที่ status = 'pending' แล้วทดสอบด้วย `EXPLAIN ANALYZE`
6. ดู index ทั้งหมดที่มีอยู่ในตาราง products (ใช้ `pg_indexes`)

## สรุป

- **Index** ทำให้ query เร็วขึ้น โดยสร้างโครงสร้างข้อมูลสำหรับค้นหา
- **B-tree** เป็น index ที่ใช้บ่อยที่สุด (default)
- **Composite index** ใช้ได้เมื่อ query ใช้ columns จากซ้ายไปขวา
- **UNIQUE index** ป้องกันค่าซ้ำ + เร็วขึ้น
- **Partial index** สร้าง index เฉพาะบางแถว ประหยัดพื้นที่
- **EXPLAIN ANALYZE** ช่วยดูว่า query ใช้ index หรือไม่
- index มี trade-off: read เร็วขึ้น แต่ write ช้าลง

## ต่อไป

[Lab 12 — Transactions & ACID →](../lab-12-transactions/)
