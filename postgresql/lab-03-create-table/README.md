# Lab 03 — CREATE TABLE & Data Types

## เป้าหมาย

สร้างตารางใน PostgreSQL และเข้าใจ data types ที่ใช้บ่อย

## ทำไมต้องรู้?

Table คือหัวใจของ SQL database — ทุกอย่างเริ่มจากการออกแบบ table ที่ดี ถ้า table ออกแบบไม่ดี จะแก้ยากในภายหลัง

## สิ่งที่ต้องมีก่อน

- [Lab 02](../lab-02-setup-and-tools/) — เชื่อมต่อ PostgreSQL ได้

## เนื้อหา

### 1. CREATE TABLE พื้นฐาน

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  age INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

แต่ละส่วน:
- `id SERIAL PRIMARY KEY` — ตัวเลขที่เพิ่มเองอัตโนมัติ ไม่ซ้ำ
- `VARCHAR(100)` — ข้อความยาวไม่เกิน 100 ตัวอักษร
- `NOT NULL` — ห้ามเป็นค่าว่าง
- `UNIQUE` — ห้ามซ้ำ
- `DEFAULT true` — ค่าเริ่มต้นถ้าไม่ระบุ

### 2. Data Types ที่ใช้บ่อย

#### ตัวเลข
| Type | ขนาด | ช่วง | ใช้เมื่อ |
|------|------|------|---------|
| `SERIAL` | 4 bytes | 1 → 2 พันล้าน | auto-increment id |
| `INTEGER` | 4 bytes | ±2 พันล้าน | อายุ, จำนวน |
| `BIGINT` | 8 bytes | ±9 ล้านล้านล้าน | id ระบบใหญ่ |
| `NUMERIC(10,2)` | ไม่จำกัด | กำหนดเอง | ราคา, เงิน |
| `REAL` | 4 bytes | ทศนิยม ~6 หลัก | คะแนน |

#### ข้อความ
| Type | คำอธิบาย | ใช้เมื่อ |
|------|---------|---------|
| `VARCHAR(n)` | ข้อความจำกัดความยาว | ชื่อ, email |
| `TEXT` | ข้อความไม่จำกัดความยาว | คำอธิบาย, เนื้อหา |
| `CHAR(n)` | ข้อความความยาวตายตัว | รหัสประเทศ (TH) |

#### วันที่/เวลา
| Type | คำอธิบาย | ตัวอย่าง |
|------|---------|---------|
| `DATE` | วันที่ | 2024-01-15 |
| `TIME` | เวลา | 14:30:00 |
| `TIMESTAMP` | วันที่ + เวลา | 2024-01-15 14:30:00 |
| `TIMESTAMPTZ` | + timezone (แนะนำ) | 2024-01-15 14:30:00+07 |

#### อื่นๆ
| Type | คำอธิบาย | ตัวอย่าง |
|------|---------|---------|
| `BOOLEAN` | จริง/เท็จ | true, false |
| `UUID` | ID แบบ unique | a0eebc99-9c0b-4ef8-bb6d... |
| `JSONB` | ข้อมูล JSON | {"key": "value"} |
| `ARRAY` | อาร์เรย์ | {1, 2, 3} |

### 3. Constraints (ข้อจำกัด)

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,              -- ตัวระบุหลัก
  name VARCHAR(200) NOT NULL,         -- ห้ามว่าง
  sku VARCHAR(50) UNIQUE NOT NULL,    -- ห้ามซ้ำ ห้ามว่าง
  price NUMERIC(10,2) CHECK (price >= 0),  -- ราคาต้อง >= 0
  stock INTEGER DEFAULT 0,            -- ค่าเริ่มต้น 0
  category_id INTEGER REFERENCES categories(id)  -- foreign key
);
```

| Constraint | หน้าที่ |
|-----------|---------|
| `PRIMARY KEY` | ระบุแถวไม่ซ้ำ (มีได้ 1 ต่อ table) |
| `NOT NULL` | ห้ามเป็นค่าว่าง |
| `UNIQUE` | ห้ามซ้ำกับแถวอื่น |
| `CHECK` | ตรวจเงื่อนไข |
| `DEFAULT` | ค่าเริ่มต้น |
| `REFERENCES` | Foreign key ชี้ไปตารางอื่น |

### 4. แก้ไข Table (ALTER TABLE)

```sql
-- เพิ่ม column
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- ลบ column
ALTER TABLE users DROP COLUMN phone;

-- เปลี่ยนชนิดข้อมูล
ALTER TABLE users ALTER COLUMN age TYPE SMALLINT;

-- เพิ่ม constraint
ALTER TABLE users ADD CONSTRAINT email_unique UNIQUE (email);

-- เปลี่ยนชื่อ column
ALTER TABLE users RENAME COLUMN name TO full_name;

-- เปลี่ยนชื่อ table
ALTER TABLE users RENAME TO members;
```

### 5. ลบ Table (DROP TABLE)

```sql
-- ลบ table (error ถ้าไม่มี)
DROP TABLE products;

-- ลบ table (ไม่ error ถ้าไม่มี)
DROP TABLE IF EXISTS products;

-- ลบข้อมูลทั้งหมดแต่เก็บ table ไว้
TRUNCATE TABLE products;
```

### 6. เคล็ดลับการตั้งชื่อ

```sql
-- ดี — ใช้ snake_case, พหูพจน์, ชื่อชัดเจน
CREATE TABLE user_profiles (...);
CREATE TABLE order_items (...);

-- ไม่ดี
CREATE TABLE UserProfile (...);   -- ไม่ใช่ snake_case
CREATE TABLE tbl_usr (...);       -- ชื่อย่อเกินไป
CREATE TABLE data (...);          -- ไม่สื่อ
```

## แบบฝึกหัด

ไฟล์ `exercises.sql` มีแบบฝึกหัดพร้อมใช้:

1. สร้างตาราง `students` ที่มี id, name, email, age, grade, enrolled_at
2. สร้างตาราง `courses` ที่มี id, title, description, credits
3. เพิ่ม column `phone` ให้ตาราง `students`
4. เปลี่ยน column `grade` เป็น `CHAR(1)` พร้อม CHECK ว่าต้องเป็น A-F
5. ลบตารางทั้งหมดที่สร้าง

## สรุป

- `CREATE TABLE` สร้างตาราง — ต้องกำหนด columns และ data types
- เลือก data type ให้เหมาะ: `VARCHAR` สำหรับข้อความ, `INTEGER` สำหรับตัวเลข, `TIMESTAMPTZ` สำหรับเวลา
- Constraints ช่วยรักษาความถูกต้องของข้อมูล
- `ALTER TABLE` แก้ไข, `DROP TABLE` ลบ
- ตั้งชื่อด้วย snake_case พหูพจน์ และชื่อที่สื่อความหมาย

## ต่อไป

[Lab 04 — CRUD →](../lab-04-crud/)
