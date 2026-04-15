# Lab 05 — WHERE, ORDER BY, LIMIT, OFFSET

## เป้าหมาย

กรอง เรียงลำดับ และแบ่งหน้าข้อมูลจาก database

## ทำไมต้องรู้?

ในงานจริง ไม่มีใคร `SELECT *` แล้วเอาข้อมูลทั้งหมดมาแสดง ต้อง:
- **กรอง** — แสดงเฉพาะสินค้าราคาต่ำกว่า 1000 บาท
- **เรียงลำดับ** — เรียงจากใหม่ไปเก่า
- **แบ่งหน้า** — แสดงทีละ 20 รายการ (pagination)

## สิ่งที่ต้องมีก่อน

- [Lab 04](../lab-04-crud/) — ใช้ CRUD ได้

## เนื้อหา

### 1. WHERE — กรองข้อมูล

```sql
-- เท่ากับ
SELECT * FROM users WHERE age = 25;

-- ไม่เท่ากับ
SELECT * FROM users WHERE age != 25;
SELECT * FROM users WHERE age <> 25;

-- มากกว่า / น้อยกว่า
SELECT * FROM users WHERE age > 25;
SELECT * FROM users WHERE age >= 25;
SELECT * FROM users WHERE age < 30;
SELECT * FROM users WHERE age <= 30;

-- ช่วง
SELECT * FROM users WHERE age BETWEEN 20 AND 30;

-- อยู่ในรายการ
SELECT * FROM users WHERE age IN (22, 25, 30);

-- เป็น NULL / ไม่เป็น NULL
SELECT * FROM users WHERE age IS NULL;
SELECT * FROM users WHERE age IS NOT NULL;
```

### 2. AND, OR, NOT — เงื่อนไขหลายตัว

```sql
-- AND — ต้องเป็นจริงทั้งคู่
SELECT * FROM users WHERE age > 25 AND is_active = true;

-- OR — อย่างใดอย่างหนึ่งเป็นจริง
SELECT * FROM users WHERE age < 22 OR age > 35;

-- NOT — กลับเงื่อนไข
SELECT * FROM users WHERE NOT is_active;

-- รวมกัน (ใช้วงเล็บเพื่อความชัดเจน)
SELECT * FROM users
WHERE (age > 25 OR is_active = false) AND name LIKE 'สม%';
```

### 3. LIKE — ค้นหาข้อความ

```sql
-- ขึ้นต้นด้วย 'สม'
SELECT * FROM users WHERE name LIKE 'สม%';

-- ลงท้ายด้วย 'com'
SELECT * FROM users WHERE email LIKE '%com';

-- มีคำว่า 'mail' อยู่
SELECT * FROM users WHERE email LIKE '%mail%';

-- ILIKE — ไม่สนตัวพิมพ์เล็ก/ใหญ่
SELECT * FROM users WHERE email ILIKE '%MAIL%';

-- _ = ตัวอักษร 1 ตัว
SELECT * FROM users WHERE name LIKE 'สม___';  -- สม + 3 ตัวอักษร
```

| Pattern | ความหมาย | ตัวอย่าง |
|---------|---------|---------|
| `%` | ตัวอักษรกี่ตัวก็ได้ (รวม 0) | `'สม%'` → สมชาย, สมศักดิ์ |
| `_` | ตัวอักษร 1 ตัว | `'_m'` → am, bm |

### 4. ORDER BY — เรียงลำดับ

```sql
-- เรียงตามอายุน้อยไปมาก (ascending — default)
SELECT * FROM users ORDER BY age ASC;

-- เรียงตามอายุมากไปน้อย (descending)
SELECT * FROM users ORDER BY age DESC;

-- เรียงหลาย columns
SELECT * FROM users ORDER BY is_active DESC, age ASC;

-- เรียงตาม column ที่อาจเป็น NULL (NULL อยู่ท้าย)
SELECT * FROM users ORDER BY age ASC NULLS LAST;
```

### 5. LIMIT & OFFSET — แบ่งหน้า

```sql
-- ดูแค่ 3 แถวแรก
SELECT * FROM users LIMIT 3;

-- ข้าม 3 แถวแรก ดู 3 แถวถัดไป
SELECT * FROM users LIMIT 3 OFFSET 3;

-- Pagination pattern:
-- หน้า 1: LIMIT 10 OFFSET 0
-- หน้า 2: LIMIT 10 OFFSET 10
-- หน้า 3: LIMIT 10 OFFSET 20
-- สูตร: OFFSET = (page - 1) * limit
```

### 6. รวมทุกอย่างเข้าด้วยกัน

```sql
-- ค้นหาผู้ใช้ที่:
-- - อายุ 20-30 ปี
-- - ยังใช้งานอยู่
-- - เรียงตามอายุมากไปน้อย
-- - แสดงหน้าละ 5 คน (หน้าแรก)
SELECT name, email, age
FROM users
WHERE age BETWEEN 20 AND 30
  AND is_active = true
ORDER BY age DESC
LIMIT 5 OFFSET 0;
```

ลำดับการเขียน:
```
SELECT columns
FROM table
WHERE conditions
ORDER BY column
LIMIT n
OFFSET n
```

## แบบฝึกหัด

ไฟล์ `exercises.sql` มีข้อมูลสินค้า 20 รายการ พร้อมแบบฝึกหัด:

1. หาสินค้าที่ราคามากกว่า 500 บาท
2. หาสินค้าที่ชื่อมีคำว่า "phone"
3. หาสินค้าที่ราคา 100-500 บาท เรียงจากถูกไปแพง
4. แสดงสินค้าหน้าที่ 2 (หน้าละ 5 รายการ)
5. หาสินค้าที่ stock หมด (stock = 0) หรือ ราคาเกิน 1000

## สรุป

- `WHERE` กรองข้อมูล — ใช้ `=`, `>`, `<`, `BETWEEN`, `IN`, `IS NULL`
- `AND`, `OR`, `NOT` รวมเงื่อนไขหลายตัว
- `LIKE` / `ILIKE` ค้นหาข้อความ (`%` = กี่ตัวก็ได้, `_` = 1 ตัว)
- `ORDER BY` เรียงลำดับ (`ASC` น้อย→มาก, `DESC` มาก→น้อย)
- `LIMIT` + `OFFSET` แบ่งหน้า (pagination)

## ต่อไป

[Lab 06 — Project: Todo App Database →](../lab-06-project-todo-db/)
