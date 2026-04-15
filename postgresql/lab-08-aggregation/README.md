# Lab 08 — Aggregate Functions: COUNT, SUM, AVG, GROUP BY

## เป้าหมาย

ใช้ aggregate functions เพื่อสรุปและวิเคราะห์ข้อมูล

## ทำไมต้องรู้?

ในงานจริงต้องตอบคำถามเช่น:
- มีลูกค้ากี่คน? → `COUNT`
- ยอดขายรวมเท่าไหร่? → `SUM`
- ราคาสินค้าเฉลี่ยเท่าไหร่? → `AVG`
- แต่ละหมวดมีสินค้ากี่ชิ้น? → `GROUP BY`

## สิ่งที่ต้องมีก่อน

- [Lab 07](../lab-07-joins/) — ใช้ JOIN ได้

## เนื้อหา

### 1. Aggregate Functions พื้นฐาน

```sql
-- COUNT — นับจำนวน
SELECT COUNT(*) FROM products;               -- นับทุกแถว
SELECT COUNT(category) FROM products;        -- นับเฉพาะที่ไม่ NULL
SELECT COUNT(DISTINCT category) FROM products; -- นับไม่ซ้ำ

-- SUM — รวม
SELECT SUM(price) FROM products;
SELECT SUM(stock) FROM products WHERE category = 'phone';

-- AVG — เฉลี่ย
SELECT AVG(price) FROM products;
SELECT ROUND(AVG(price), 2) FROM products;   -- ปัดทศนิยม 2 ตำแหน่ง

-- MIN / MAX — ค่าต่ำสุด / สูงสุด
SELECT MIN(price), MAX(price) FROM products;
```

### 2. GROUP BY — จัดกลุ่ม

```sql
-- นับสินค้าแต่ละหมวด
SELECT category, COUNT(*) AS count
FROM products
GROUP BY category;

-- ผลลัพธ์:
-- category  | count
-- ----------+------
-- phone     | 3
-- laptop    | 2
-- audio     | 3
-- ...

-- ยอดขายรวมแต่ละหมวด
SELECT category, SUM(price) AS total, AVG(price) AS avg_price
FROM products
GROUP BY category
ORDER BY total DESC;
```

### 3. HAVING — กรองหลัง GROUP BY

`WHERE` กรองก่อนจัดกลุ่ม, `HAVING` กรองหลังจัดกลุ่ม

```sql
-- หาหมวดที่มีสินค้ามากกว่า 2 ชิ้น
SELECT category, COUNT(*) AS count
FROM products
GROUP BY category
HAVING COUNT(*) > 2;

-- หาหมวดที่ยอดรวมเกิน 50,000
SELECT category, SUM(price) AS total
FROM products
GROUP BY category
HAVING SUM(price) > 50000;
```

### 4. WHERE vs HAVING

```sql
-- WHERE กรอง rows ก่อน GROUP BY
-- HAVING กรอง groups หลัง GROUP BY

SELECT category, AVG(price) AS avg_price
FROM products
WHERE is_available = true          -- กรอง rows ก่อน
GROUP BY category
HAVING AVG(price) > 10000          -- กรอง groups หลัง
ORDER BY avg_price DESC;
```

```
ลำดับการทำงาน:
1. FROM products
2. WHERE is_available = true     ← กรอง rows
3. GROUP BY category             ← จัดกลุ่ม
4. HAVING AVG(price) > 10000     ← กรอง groups
5. SELECT category, AVG(price)   ← เลือก columns
6. ORDER BY avg_price DESC       ← เรียงลำดับ
```

### 5. GROUP BY กับ JOIN

```sql
-- ยอดสั่งซื้อรวมของแต่ละลูกค้า
SELECT u.name, COUNT(o.id) AS order_count, SUM(o.total) AS total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name
ORDER BY total_spent DESC NULLS LAST;

-- สินค้าขายดี (จำนวนชิ้น) แต่ละหมวด
SELECT p.category, p.name, SUM(oi.quantity) AS total_sold
FROM products p
INNER JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.category, p.name
ORDER BY total_sold DESC;
```

### 6. ฟังก์ชันช่วยอื่นๆ

```sql
-- ROUND — ปัดทศนิยม
SELECT ROUND(AVG(price), 2) FROM products;

-- COALESCE — แทน NULL ด้วยค่าอื่น
SELECT name, COALESCE(description, 'ไม่มีคำอธิบาย') FROM products;

-- STRING_AGG — รวม string
SELECT category, STRING_AGG(name, ', ') AS product_list
FROM products
GROUP BY category;
```

## แบบฝึกหัด

ใช้ข้อมูลจาก init.sql (เหมือน Lab 07 + เพิ่มข้อมูล):

1. นับจำนวนสินค้าทั้งหมดและจำนวนหมวดหมู่ที่ไม่ซ้ำ
2. หาราคาสินค้าเฉลี่ย ต่ำสุด สูงสุด
3. นับจำนวนสินค้าแต่ละหมวด เรียงจากมากไปน้อย
4. หาหมวดที่ราคาเฉลี่ยสูงกว่า 20,000
5. หาลูกค้าที่สั่งซื้อมากกว่า 1 ออเดอร์
6. หายอดขายรวมแต่ละเดือน

## สรุป

- `COUNT`, `SUM`, `AVG`, `MIN`, `MAX` — aggregate functions พื้นฐาน
- `GROUP BY` จัดกลุ่มข้อมูลก่อนคำนวณ
- `HAVING` กรอง **หลัง** GROUP BY (ใช้กับ aggregate results)
- `WHERE` กรอง **ก่อน** GROUP BY (ใช้กับ raw rows)
- รวมกับ JOIN ได้ เพื่อวิเคราะห์ข้อมูลข้ามตาราง

## ต่อไป

[Lab 09 — Subqueries & CTE →](../lab-09-subqueries-and-cte/)
