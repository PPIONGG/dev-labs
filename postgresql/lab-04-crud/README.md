# Lab 04 — CRUD: INSERT, SELECT, UPDATE, DELETE

## เป้าหมาย

เรียนรู้ 4 คำสั่งหลักของ SQL — สร้าง อ่าน แก้ไข และลบข้อมูล

## ทำไมต้องรู้?

CRUD คือ 4 สิ่งที่ทำกับข้อมูลได้ ทุกแอปในโลกทำแค่ 4 อย่างนี้:
- **C**reate → `INSERT` — สมัครสมาชิก, สร้างโพสต์
- **R**ead → `SELECT` — ดูโปรไฟล์, ค้นหาสินค้า
- **U**pdate → `UPDATE` — แก้ชื่อ, เปลี่ยน password
- **D**elete → `DELETE` — ลบบัญชี, ลบโพสต์

## สิ่งที่ต้องมีก่อน

- [Lab 03](../lab-03-create-table/) — สร้างตารางได้

## เนื้อหา

### 1. INSERT — เพิ่มข้อมูล

```sql
-- เพิ่ม 1 แถว
INSERT INTO users (name, email, age)
VALUES ('สมชาย', 'somchai@mail.com', 25);

-- เพิ่มหลายแถวพร้อมกัน
INSERT INTO users (name, email, age)
VALUES
  ('สมหญิง', 'somying@mail.com', 30),
  ('สมศักดิ์', 'somsak@mail.com', 28),
  ('สมใจ', 'somjai@mail.com', 22);

-- เพิ่มแล้วดูข้อมูลที่เพิ่ม
INSERT INTO users (name, email, age)
VALUES ('มานี', 'manee@mail.com', 26)
RETURNING *;

-- เพิ่มแล้วดูแค่ id
INSERT INTO users (name, email)
VALUES ('มานะ', 'mana@mail.com')
RETURNING id;
```

### 2. SELECT — อ่านข้อมูล

```sql
-- ดูทั้งหมด
SELECT * FROM users;

-- เลือกเฉพาะ columns
SELECT name, email FROM users;

-- ตั้งชื่อ column ใหม่ (alias)
SELECT name AS ชื่อ, email AS อีเมล FROM users;

-- ดูข้อมูลไม่ซ้ำ
SELECT DISTINCT age FROM users;

-- นับจำนวนแถว
SELECT COUNT(*) FROM users;
```

### 3. UPDATE — แก้ไขข้อมูล

```sql
-- แก้ไข 1 แถว (ใช้ WHERE ระบุ)
UPDATE users
SET age = 26
WHERE id = 1;

-- แก้ไขหลาย columns
UPDATE users
SET name = 'สมชาย ใจดี', age = 27
WHERE id = 1;

-- แก้ไขแล้วดูผลลัพธ์
UPDATE users
SET is_active = false
WHERE id = 3
RETURNING *;

-- ⚠️ อันตราย! ไม่มี WHERE = แก้ทุกแถว!
UPDATE users SET is_active = false;
-- ทุกคนจะกลายเป็น inactive!
```

### 4. DELETE — ลบข้อมูล

```sql
-- ลบ 1 แถว
DELETE FROM users WHERE id = 5;

-- ลบแล้วดูข้อมูลที่ลบ
DELETE FROM users WHERE id = 4 RETURNING *;

-- ⚠️ อันตราย! ไม่มี WHERE = ลบทุกแถว!
DELETE FROM users;
-- ข้อมูลทั้งหมดจะหายไป!

-- ลบทุกแถว (เร็วกว่า DELETE)
TRUNCATE TABLE users;
```

### 5. กฎทอง: UPDATE/DELETE ต้องมี WHERE เสมอ

```sql
-- ✅ ดี — ระบุ WHERE ชัดเจน
UPDATE users SET name = 'ชื่อใหม่' WHERE id = 1;
DELETE FROM users WHERE id = 1;

-- ❌ อันตราย — ไม่มี WHERE
UPDATE users SET name = 'ชื่อใหม่';  -- แก้ทุกคน!
DELETE FROM users;                    -- ลบทุกคน!
```

**เคล็ดลับ**: ก่อน UPDATE/DELETE ให้ลอง SELECT ด้วย WHERE เดียวกันก่อน เพื่อดูว่าจะกระทบกี่แถว

```sql
-- ลอง SELECT ก่อน
SELECT * FROM users WHERE age > 30;
-- เห็นว่ามี 3 แถว — โอเค ลบได้

-- แล้วค่อย DELETE
DELETE FROM users WHERE age > 30;
```

### 6. UPSERT (INSERT ... ON CONFLICT)

แทรกข้อมูลใหม่ แต่ถ้ามีอยู่แล้วให้แก้ไขแทน:

```sql
INSERT INTO users (name, email, age)
VALUES ('สมชาย', 'somchai@mail.com', 30)
ON CONFLICT (email)
DO UPDATE SET name = EXCLUDED.name, age = EXCLUDED.age;
```

## แบบฝึกหัด

ไฟล์ `exercises.sql` มีแบบฝึกหัดพร้อมใช้:

1. เพิ่มผู้ใช้ 5 คน
2. ดูผู้ใช้ทั้งหมด
3. ดูเฉพาะชื่อและ email
4. แก้ไขอายุของผู้ใช้ id = 1
5. ลบผู้ใช้ id = 5 แล้วดูข้อมูลที่ลบ
6. ใช้ UPSERT เพิ่ม/แก้ไขผู้ใช้ด้วย email ซ้ำ

## สรุป

- `INSERT INTO ... VALUES` เพิ่มข้อมูล
- `SELECT ... FROM` อ่านข้อมูล
- `UPDATE ... SET ... WHERE` แก้ไขข้อมูล
- `DELETE FROM ... WHERE` ลบข้อมูล
- **UPDATE/DELETE ต้องมี WHERE เสมอ** — ไม่งั้นจะกระทบทุกแถว
- ใช้ `RETURNING *` เพื่อดูข้อมูลที่เพิ่ง INSERT/UPDATE/DELETE

## ต่อไป

[Lab 05 — WHERE, ORDER BY, LIMIT →](../lab-05-filtering-and-sorting/)
