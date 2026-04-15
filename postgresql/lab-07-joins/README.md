# Lab 07 — JOIN: เชื่อมตาราง

## เป้าหมาย

เข้าใจ JOIN ทุกประเภท สำหรับดึงข้อมูลจากหลายตารางพร้อมกัน

## ทำไมต้องรู้?

ในงานจริง ข้อมูลไม่ได้อยู่ในตารางเดียว — ต้องเชื่อมหลายตารางเข้าด้วยกัน เช่น:
- ดู "ออเดอร์ของลูกค้าคนนี้" → เชื่อม `orders` กับ `users`
- ดู "สินค้าในออเดอร์" → เชื่อม `order_items` กับ `products`

JOIN คือคำสั่งที่ทำให้ดึงข้อมูลข้ามตารางได้

## สิ่งที่ต้องมีก่อน

- [Lab 06](../lab-06-project-todo-db/) — ใช้ CRUD และ filtering ได้

## เนื้อหา

### 1. ตัวอย่างข้อมูล

```
ตาราง users:                     ตาราง orders:
+----+----------+                +----+---------+--------+
| id | name     |                | id | user_id | total  |
+----+----------+                +----+---------+--------+
| 1  | สมชาย    |                | 1  | 1       | 500    |
| 2  | สมหญิง   |                | 2  | 1       | 300    |
| 3  | สมศักดิ์  |                | 3  | 2       | 800    |
| 4  | สมใจ     |                | 4  | 99      | 100    |
+----+----------+                +----+---------+--------+
          ↑ id                            ↑ user_id (FK)
```

สมชาย (id=1) มี 2 ออเดอร์, สมหญิง (id=2) มี 1, สมศักดิ์ (id=3) ไม่มีเลย, สมใจ (id=4) ไม่มี, ออเดอร์ id=4 ชี้ไป user_id=99 ที่ไม่มีอยู่

### 2. INNER JOIN — เอาเฉพาะที่ตรงกัน

```sql
SELECT users.name, orders.total
FROM users
INNER JOIN orders ON users.id = orders.user_id;
```

ผลลัพธ์: เฉพาะ users ที่มี orders

```
+----------+-------+
| name     | total |
+----------+-------+
| สมชาย    | 500   |
| สมชาย    | 300   |
| สมหญิง   | 800   |
+----------+-------+
```

สมศักดิ์และสมใจ **ไม่แสดง** (ไม่มี order), ออเดอร์ user_id=99 **ไม่แสดง** (ไม่มี user)

### 3. LEFT JOIN — เอา users ทั้งหมด

```sql
SELECT users.name, orders.total
FROM users
LEFT JOIN orders ON users.id = orders.user_id;
```

ผลลัพธ์: users ทุกคน แม้ไม่มี order (แสดง NULL)

```
+----------+-------+
| name     | total |
+----------+-------+
| สมชาย    | 500   |
| สมชาย    | 300   |
| สมหญิง   | 800   |
| สมศักดิ์  | NULL  |  ← ไม่มี order
| สมใจ     | NULL  |  ← ไม่มี order
+----------+-------+
```

### 4. RIGHT JOIN — เอา orders ทั้งหมด

```sql
SELECT users.name, orders.total
FROM users
RIGHT JOIN orders ON users.id = orders.user_id;
```

ผลลัพธ์: orders ทั้งหมด แม้ไม่มี user

```
+----------+-------+
| name     | total |
+----------+-------+
| สมชาย    | 500   |
| สมชาย    | 300   |
| สมหญิง   | 800   |
| NULL     | 100   |  ← user_id=99 ไม่มี user
+----------+-------+
```

### 5. FULL OUTER JOIN — เอาทั้งหมด

```sql
SELECT users.name, orders.total
FROM users
FULL OUTER JOIN orders ON users.id = orders.user_id;
```

ผลลัพธ์: ทุกแถวจากทั้งสองตาราง

```
+----------+-------+
| name     | total |
+----------+-------+
| สมชาย    | 500   |
| สมชาย    | 300   |
| สมหญิง   | 800   |
| สมศักดิ์  | NULL  |
| สมใจ     | NULL  |
| NULL     | 100   |
+----------+-------+
```

### 6. สรุปภาพรวม

```
INNER JOIN:        LEFT JOIN:         RIGHT JOIN:       FULL OUTER JOIN:
  +---+              +---+              +---+              +---+
 /     \            /|    \            /    |\            /|    |\
| A ∩ B |          | A | ∩ B|          |A ∩ | B |        | A | ∩ | B |
 \     /            \|    /            \    |/            \|    |/
  +---+              +---+              +---+              +---+
เฉพาะที่ตรงกัน     ซ้ายทั้งหมด        ขวาทั้งหมด        ทั้งหมด
```

### 7. Table Aliases (ชื่อย่อ)

```sql
-- ยาวเกินไป
SELECT users.name, orders.total FROM users INNER JOIN orders ON users.id = orders.user_id;

-- ใช้ alias ให้สั้นลง
SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id;
```

### 8. JOIN หลายตาราง

```sql
-- เชื่อม 3 ตาราง: users → orders → order_items → products
SELECT
  u.name AS customer,
  p.name AS product,
  oi.quantity,
  oi.price
FROM users u
INNER JOIN orders o ON u.id = o.user_id
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id;
```

### 9. JOIN กับ WHERE, ORDER BY

```sql
-- ดูออเดอร์ของสมชาย เรียงตามราคา
SELECT u.name, o.total, o.created_at
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE u.name = 'สมชาย'
ORDER BY o.total DESC;
```

## แบบฝึกหัด

ไฟล์ `exercises.sql` มีข้อมูล users, orders, products, order_items:

1. แสดงชื่อลูกค้าและยอดออเดอร์ทั้งหมด (INNER JOIN)
2. แสดงลูกค้าทุกคน รวมคนที่ไม่มีออเดอร์ (LEFT JOIN)
3. แสดงรายการสินค้าในแต่ละออเดอร์ (JOIN 3 ตาราง)
4. หาลูกค้าที่ไม่เคยสั่งซื้อเลย (LEFT JOIN + WHERE IS NULL)
5. หาสินค้าขายดีที่สุด (JOIN + GROUP BY + ORDER BY)

## สรุป

- `INNER JOIN` — เอาเฉพาะที่ตรงกันทั้งสองตาราง
- `LEFT JOIN` — เอาซ้ายทั้งหมด + ขวาที่ตรงกัน
- `RIGHT JOIN` — เอาขวาทั้งหมด + ซ้ายที่ตรงกัน
- `FULL OUTER JOIN` — เอาทั้งหมดจากทั้งสองตาราง
- ใช้ alias (u, o, p) ให้ query อ่านง่ายขึ้น
- JOIN ได้หลายตารางพร้อมกัน

## ต่อไป

[Lab 08 — Aggregate Functions →](../lab-08-aggregation/)
