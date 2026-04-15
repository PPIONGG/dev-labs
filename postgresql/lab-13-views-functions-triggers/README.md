# Lab 13 — Views, Functions & Triggers: ลดงานซ้ำ ทำงานอัตโนมัติ

## เป้าหมาย

สร้าง Views, Functions, และ Triggers เพื่อลดการเขียน query ซ้ำ และทำงานอัตโนมัติ

## ทำไมต้องรู้?

ในระบบจริง:

- **Views** — query ที่ใช้บ่อย ไม่ต้องเขียนซ้ำทุกครั้ง (เช่น รายงานยอดขาย)
- **Functions** — logic ที่ใช้ซ้ำ เรียกได้จากทุกที่ (เช่น คำนวณส่วนลด)
- **Triggers** — ทำงานอัตโนมัติเมื่อข้อมูลเปลี่ยน (เช่น อัปเดต updated_at, ลด stock)

## สิ่งที่ต้องมีก่อน

- [Lab 12](../lab-12-transactions/) — เข้าใจ Transactions

## เนื้อหา

### 1. Views — query ที่บันทึกไว้

View คือ **query ที่บันทึกเป็นชื่อ** — เรียกใช้ได้เหมือนตาราง:

```sql
-- สร้าง View
CREATE VIEW v_order_summary AS
SELECT
  o.id AS order_id,
  u.name AS customer_name,
  o.total,
  o.status,
  o.created_at
FROM orders o
JOIN users u ON o.user_id = u.id;

-- ใช้งานเหมือนตาราง
SELECT * FROM v_order_summary;
SELECT * FROM v_order_summary WHERE status = 'completed';
SELECT customer_name, SUM(total) FROM v_order_summary GROUP BY customer_name;
```

**ข้อดีของ View:**
- ไม่ต้องเขียน JOIN ซ้ำ
- ซ่อน query ที่ซับซ้อน
- ควบคุมสิทธิ์การเข้าถึงข้อมูล

```sql
-- แก้ไข View
CREATE OR REPLACE VIEW v_order_summary AS
SELECT
  o.id AS order_id,
  u.name AS customer_name,
  COUNT(oi.id) AS item_count,  -- เพิ่ม column
  o.total,
  o.status
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, u.name, o.total, o.status;

-- ลบ View
DROP VIEW v_order_summary;
```

#### Materialized View — View ที่เก็บข้อมูลจริง

View ปกติ **รัน query ทุกครั้ง** ที่เรียก. Materialized View **เก็บผลลัพธ์ไว้** — เร็วกว่า แต่ต้อง refresh เอง:

```sql
-- สร้าง Materialized View
CREATE MATERIALIZED VIEW mv_monthly_sales AS
SELECT
  TO_CHAR(created_at, 'YYYY-MM') AS month,
  COUNT(*) AS order_count,
  SUM(total) AS total_sales
FROM orders
WHERE status = 'completed'
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month;

-- ใช้งาน (เร็วมาก เพราะข้อมูลถูกเก็บไว้แล้ว)
SELECT * FROM mv_monthly_sales;

-- อัปเดตข้อมูล (เมื่อมี orders ใหม่)
REFRESH MATERIALIZED VIEW mv_monthly_sales;
```

```
View ปกติ:
SELECT * FROM v_order_summary
  → รัน query จริงทุกครั้ง → ข้อมูลใหม่เสมอ → ช้ากว่า

Materialized View:
SELECT * FROM mv_monthly_sales
  → อ่านจากข้อมูลที่เก็บไว้ → เร็วมาก → ต้อง REFRESH เอง
```

### 2. Functions — PL/pgSQL

Function คือ **โค้ดที่เก็บไว้ใน database** — รับ parameter, คำนวณ, คืนค่า:

#### Function ที่คืนค่าเดียว

```sql
-- สร้าง function: คำนวณยอดซื้อรวมของ user
CREATE OR REPLACE FUNCTION get_user_total_spent(p_user_id INTEGER)
RETURNS NUMERIC AS $$
DECLARE
  total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(o.total), 0) INTO total
  FROM orders o
  WHERE o.user_id = p_user_id
    AND o.status = 'completed';
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- เรียกใช้
SELECT get_user_total_spent(1);  -- ยอดรวมของสมชาย

-- ใช้ใน query ได้
SELECT name, get_user_total_spent(id) AS total_spent
FROM users
ORDER BY total_spent DESC;
```

#### Function ที่คืน TABLE

```sql
-- Function คืนหลายแถว
CREATE OR REPLACE FUNCTION get_products_by_category(cat VARCHAR)
RETURNS TABLE (id INTEGER, name VARCHAR, price NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.price
  FROM products p
  WHERE p.category = cat
  ORDER BY p.price;
END;
$$ LANGUAGE plpgsql;

-- เรียกใช้
SELECT * FROM get_products_by_category('phone');
SELECT * FROM get_products_by_category('audio');
```

#### Function กับ IF/ELSE

```sql
-- Function คำนวณส่วนลดตามยอดซื้อ
CREATE OR REPLACE FUNCTION calculate_discount(amount NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  IF amount >= 50000 THEN
    RETURN amount * 0.10;  -- ลด 10%
  ELSIF amount >= 20000 THEN
    RETURN amount * 0.05;  -- ลด 5%
  ELSE
    RETURN 0;              -- ไม่ลด
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ทดสอบ
SELECT calculate_discount(60000);  -- 6000
SELECT calculate_discount(30000);  -- 1500
SELECT calculate_discount(5000);   -- 0
```

```sql
-- ลบ function
DROP FUNCTION get_user_total_spent(INTEGER);
```

### 3. Triggers — ทำงานอัตโนมัติ

Trigger คือ function ที่ **ทำงานอัตโนมัติ** เมื่อมี INSERT, UPDATE, หรือ DELETE:

```
เมื่อเกิดเหตุการณ์ (INSERT/UPDATE/DELETE)
  → Trigger ทำงาน (เรียก function)
  → เสร็จอัตโนมัติ ไม่ต้องเขียน code เอง
```

#### ตัวอย่าง: อัปเดต updated_at อัตโนมัติ

```sql
-- ขั้นตอนที่ 1: สร้าง trigger function
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ขั้นตอนที่ 2: สร้าง trigger (ผูกกับตาราง)
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_timestamp();
```

```sql
-- ทดสอบ
SELECT id, name, updated_at FROM products WHERE id = 1;
-- updated_at = 2024-01-01 00:00:00

UPDATE products SET price = 36900 WHERE id = 1;

SELECT id, name, updated_at FROM products WHERE id = 1;
-- updated_at = 2024-04-15 10:30:00   ← เปลี่ยนอัตโนมัติ!
```

#### BEFORE vs AFTER Trigger

```sql
-- BEFORE — ทำงาน "ก่อน" บันทึกข้อมูล (แก้ไขข้อมูลได้)
CREATE TRIGGER trg_before_example
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION fn_validate_order();

-- AFTER — ทำงาน "หลัง" บันทึกข้อมูล (ใช้สำหรับ side effects)
CREATE TRIGGER trg_after_example
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION fn_reduce_stock();
```

| ประเภท | เวลาทำงาน | ใช้ทำอะไร |
|--------|----------|----------|
| BEFORE INSERT | ก่อน insert | validate, แก้ไขข้อมูล |
| AFTER INSERT | หลัง insert | log, อัปเดตตารางอื่น |
| BEFORE UPDATE | ก่อน update | อัปเดต updated_at |
| AFTER UPDATE | หลัง update | audit log |
| BEFORE DELETE | ก่อน delete | ป้องกันการลบ |
| AFTER DELETE | หลัง delete | cleanup |

#### ตัวอย่าง: ลด stock อัตโนมัติเมื่อสั่งซื้อ

```sql
-- Trigger function
CREATE OR REPLACE FUNCTION fn_reduce_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;

  -- ตรวจสอบว่า stock ไม่ติดลบ
  IF (SELECT stock FROM products WHERE id = NEW.product_id) < 0 THEN
    RAISE EXCEPTION 'สินค้า id % มี stock ไม่เพียงพอ', NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trg_reduce_stock
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION fn_reduce_stock();
```

```sql
-- ทดสอบ
SELECT id, name, stock FROM products WHERE id = 1;  -- stock = 50

INSERT INTO order_items (order_id, product_id, quantity, price)
  VALUES (1, 1, 3, 35900);

SELECT id, name, stock FROM products WHERE id = 1;  -- stock = 47 (ลดอัตโนมัติ!)
```

#### NEW vs OLD ใน Trigger

```sql
-- NEW = ข้อมูลใหม่ (ใช้ใน INSERT, UPDATE)
-- OLD = ข้อมูลเก่า (ใช้ใน UPDATE, DELETE)

CREATE OR REPLACE FUNCTION fn_price_change_log()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price != OLD.price THEN
    RAISE NOTICE 'ราคา % เปลี่ยนจาก % เป็น %', OLD.name, OLD.price, NEW.price;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

```sql
-- ลบ trigger
DROP TRIGGER trg_products_updated_at ON products;
```

## แบบฝึกหัด

ใช้ข้อมูลจาก init.sql (e-commerce schema):

**Views:**
1. สร้าง VIEW `v_order_summary` แสดง order id, ชื่อลูกค้า, จำนวนสินค้า, ยอดรวม, status
2. สร้าง VIEW `v_product_stats` แสดง category, จำนวนสินค้า, ราคาเฉลี่ย, ราคาต่ำสุด/สูงสุด
3. สร้าง MATERIALIZED VIEW `mv_monthly_sales` แสดงยอดขายรายเดือน

**Functions:**
4. สร้าง function `get_user_total_spent(user_id)` คืนยอดซื้อรวม
5. สร้าง function `get_products_by_category(category)` คืน TABLE ของสินค้า

**Triggers:**
6. สร้าง trigger อัปเดต `updated_at` อัตโนมัติเมื่อ UPDATE ตาราง products
7. สร้าง trigger ลด stock อัตโนมัติเมื่อ INSERT ใน order_items

## สรุป

- **View** = query ที่บันทึกเป็นชื่อ ใช้ซ้ำได้ ไม่ต้องเขียนใหม่
- **Materialized View** = view ที่เก็บผลลัพธ์ไว้ เร็วกว่า แต่ต้อง REFRESH
- **Function (PL/pgSQL)** = โค้ดที่เก็บใน database รับ parameter คืนค่าได้
- **Trigger** = function ที่ทำงานอัตโนมัติเมื่อ INSERT/UPDATE/DELETE
- **BEFORE** trigger แก้ไขข้อมูลก่อนบันทึก, **AFTER** trigger ทำ side effects หลังบันทึก
- **NEW** = ข้อมูลใหม่, **OLD** = ข้อมูลเก่า

## ต่อไป

[Lab 14 — Performance Tuning & Best Practices →](../lab-14-performance-tuning/)
