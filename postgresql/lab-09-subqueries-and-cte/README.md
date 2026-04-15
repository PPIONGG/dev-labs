# Lab 09 — Subqueries & Common Table Expressions (CTE)

## เป้าหมาย

เขียน query ซ้อน query (subquery) และใช้ CTE เพื่อให้ query ซับซ้อนอ่านง่ายขึ้น

## ทำไมต้องรู้?

บาง query ตอบด้วย SELECT เดียวไม่ได้ เช่น:
- "หาสินค้าที่ราคาสูงกว่าค่าเฉลี่ย" → ต้องหาค่าเฉลี่ยก่อน แล้วค่อยกรอง
- "หาลูกค้าที่ซื้อมากที่สุด" → ต้องรวมยอดก่อน แล้วค่อยเรียงลำดับ

Subquery และ CTE ช่วยแก้ปัญหานี้

## สิ่งที่ต้องมีก่อน

- [Lab 08](../lab-08-aggregation/) — Aggregate functions และ GROUP BY

## เนื้อหา

### 1. Subquery คืออะไร?

Subquery = query ที่อยู่ข้างใน query อื่น

```sql
-- หาสินค้าที่ราคาสูงกว่าค่าเฉลี่ย
SELECT name, price
FROM products
WHERE price > (SELECT AVG(price) FROM products);
--              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
--              นี่คือ subquery — คำนวณค่าเฉลี่ยก่อน
```

### 2. Subquery ใน WHERE

```sql
-- หาสินค้าที่เคยถูกสั่งซื้อ
SELECT name FROM products
WHERE id IN (SELECT DISTINCT product_id FROM order_items);

-- หาลูกค้าที่ไม่เคยสั่งซื้อ
SELECT name FROM users
WHERE id NOT IN (SELECT DISTINCT user_id FROM orders);

-- หาสินค้าที่ราคาสูงกว่าทุกสินค้าในหมวด 'audio'
SELECT name, price FROM products
WHERE price > ALL (SELECT price FROM products WHERE category = 'audio');

-- หาสินค้าที่ราคาสูงกว่าสินค้า 'audio' ตัวใดตัวหนึ่ง
SELECT name, price FROM products
WHERE price > ANY (SELECT price FROM products WHERE category = 'audio');
```

### 3. Subquery ใน SELECT

```sql
-- แสดงสินค้าพร้อมราคาเฉลี่ยของหมวด
SELECT
  name,
  price,
  category,
  (SELECT ROUND(AVG(price), 2) FROM products p2 WHERE p2.category = p.category) AS category_avg
FROM products p;
```

### 4. Subquery ใน FROM (Derived Table)

```sql
-- หาลูกค้า top spender
SELECT name, total_spent
FROM (
  SELECT u.name, SUM(o.total) AS total_spent
  FROM users u
  INNER JOIN orders o ON u.id = o.user_id
  GROUP BY u.id, u.name
) AS customer_totals
WHERE total_spent > 50000;
```

### 5. EXISTS — เช็คว่ามีข้อมูลหรือไม่

```sql
-- หาลูกค้าที่เคยสั่งซื้อ (เร็วกว่า IN สำหรับข้อมูลเยอะ)
SELECT name FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
);

-- หาลูกค้าที่ไม่เคยสั่งซื้อ
SELECT name FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
);
```

### 6. CTE (Common Table Expression) — WITH clause

CTE ช่วยให้ query ซับซ้อนอ่านง่ายขึ้น เหมือนแบ่งเป็นขั้นตอน

```sql
-- แบบ subquery (อ่านยาก)
SELECT name, total_spent FROM (
  SELECT u.name, SUM(o.total) AS total_spent
  FROM users u INNER JOIN orders o ON u.id = o.user_id
  GROUP BY u.id, u.name
) sub WHERE total_spent > 50000;

-- แบบ CTE (อ่านง่าย!)
WITH customer_totals AS (
  SELECT u.name, SUM(o.total) AS total_spent
  FROM users u
  INNER JOIN orders o ON u.id = o.user_id
  GROUP BY u.id, u.name
)
SELECT name, total_spent
FROM customer_totals
WHERE total_spent > 50000;
```

### 7. CTE หลายตัว

```sql
WITH
  -- ขั้นที่ 1: ยอดแต่ละลูกค้า
  customer_totals AS (
    SELECT user_id, SUM(total) AS total_spent, COUNT(*) AS order_count
    FROM orders
    GROUP BY user_id
  ),
  -- ขั้นที่ 2: หาค่าเฉลี่ย
  avg_spending AS (
    SELECT AVG(total_spent) AS avg_total FROM customer_totals
  )
-- ขั้นที่ 3: เอาลูกค้าที่สูงกว่าค่าเฉลี่ย
SELECT u.name, ct.total_spent, ct.order_count
FROM customer_totals ct
INNER JOIN users u ON ct.user_id = u.id
WHERE ct.total_spent > (SELECT avg_total FROM avg_spending);
```

### 8. Subquery vs CTE vs JOIN

| วิธี | ใช้เมื่อ |
|------|---------|
| Subquery | query ง่ายๆ ใน WHERE |
| CTE | query ซับซ้อน ต้องอ่านง่าย |
| JOIN | เชื่อมตารางจริงๆ ไม่ใช่ผลลัพธ์ |

## แบบฝึกหัด

1. หาสินค้าที่ราคาสูงกว่าค่าเฉลี่ย (subquery)
2. หาลูกค้าที่ซื้อสินค้าในหมวด 'phone' (subquery + IN)
3. หาลูกค้าที่ไม่เคยสั่งซื้อ (EXISTS)
4. เขียน CTE หาลูกค้าที่ซื้อมากที่สุด 3 อันดับ
5. เขียน CTE หลายตัว วิเคราะห์ยอดขายแต่ละหมวดเทียบกับค่าเฉลี่ย

## สรุป

- **Subquery** = query ข้างใน query — ใช้ใน WHERE, SELECT, FROM
- **EXISTS** = เช็คว่ามีข้อมูลหรือไม่ — เร็วกว่า IN สำหรับข้อมูลเยอะ
- **CTE (WITH)** = แบ่ง query ซับซ้อนเป็นขั้นตอน อ่านง่ายขึ้น
- CTE + CTE ซ้อนกันได้หลายตัว

## ต่อไป

[Lab 10 — Project: E-commerce Database →](../lab-10-project-ecommerce/)
