# Lab 14 — JSON/JSONB: SQL + NoSQL ในตัวเดียว

## เป้าหมาย

ใช้ JSON/JSONB ใน PostgreSQL เก็บข้อมูลที่ไม่มีโครงสร้างตายตัว ควบคู่กับข้อมูล relational ปกติ

## ทำไมต้องรู้?

บางข้อมูลไม่มีโครงสร้างที่แน่นอน เช่น:
- **Settings ของผู้ใช้** — แต่ละคนมี settings ไม่เหมือนกัน
- **Metadata ของสินค้า** — มือถือมี RAM/storage แต่เสื้อผ้ามี size/color
- **API responses** — เก็บ raw response จาก third-party API

JSONB ทำให้ PostgreSQL เป็นทั้ง SQL database + NoSQL ในตัวเดียว ไม่ต้องใช้ MongoDB แยก

## สิ่งที่ต้องมีก่อน

- [Lab 13](../lab-13-views-functions-triggers/) — Views, Functions, Triggers

## เนื้อหา

### 1. JSON vs JSONB

PostgreSQL มี 2 ชนิดสำหรับเก็บ JSON:

| | JSON | JSONB |
|---|------|-------|
| เก็บข้อมูล | เก็บเป็น text ตามที่ใส่ | แปลงเป็น binary format |
| ความเร็ว query | ช้า (ต้อง parse ทุกครั้ง) | เร็ว (parse แล้ว) |
| Index | ไม่ได้ | ใช้ GIN index ได้ |
| เก็บ key ซ้ำ | ได้ | ไม่ได้ (เก็บ key สุดท้าย) |
| เรียงลำดับ key | คงตามที่ใส่ | เรียงใหม่ |
| แนะนำ | ไม่แนะนำ | **ใช้ JSONB เกือบทุกกรณี** |

```sql
-- JSON: เก็บตามที่ใส่
SELECT '{"name": "สมชาย", "name": "สมหญิง"}'::JSON;
-- ผลลัพธ์: {"name": "สมชาย", "name": "สมหญิง"} (เก็บ key ซ้ำ)

-- JSONB: แปลงเป็น binary
SELECT '{"name": "สมชาย", "name": "สมหญิง"}'::JSONB;
-- ผลลัพธ์: {"name": "สมหญิง"} (เก็บ key สุดท้าย)
```

**สรุป: ใช้ JSONB เกือบทุกกรณี**

### 2. สร้างคอลัมน์ JSONB

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  category VARCHAR(50),
  specs JSONB DEFAULT '{}'    -- ← คอลัมน์ JSONB
);

CREATE TABLE user_settings (
  id SERIAL PRIMARY KEY,
  user_name VARCHAR(100) NOT NULL,
  settings JSONB DEFAULT '{}'  -- ← settings เป็น JSONB
);
```

### 3. Insert JSON data

```sql
-- Insert สินค้าพร้อม specs
INSERT INTO products (name, price, category, specs) VALUES
  ('iPhone 15', 35900, 'phone', '{
    "brand": "Apple",
    "storage": "128GB",
    "ram": "6GB",
    "colors": ["black", "blue", "pink"],
    "display": {"size": 6.1, "type": "OLED"}
  }');

-- Insert settings
INSERT INTO user_settings (user_name, settings) VALUES
  ('สมชาย', '{
    "theme": "dark",
    "language": "th",
    "notifications": {"email": true, "sms": false, "push": true},
    "favorites": ["laptop", "phone"]
  }');
```

### 4. Query JSON -- operators

| Operator | คำอธิบาย | ผลลัพธ์ |
|----------|---------|--------|
| `->` | ดึงค่าเป็น JSON | JSON |
| `->>` | ดึงค่าเป็น text | TEXT |
| `#>` | ดึงค่าตาม path เป็น JSON | JSON |
| `#>>` | ดึงค่าตาม path เป็น text | TEXT |
| `@>` | มี JSON นี้อยู่ไหม? | BOOLEAN |
| `?` | มี key นี้ไหม? | BOOLEAN |
| `?|` | มี key ใดก็ได้ในนี้ไหม? | BOOLEAN |
| `?&` | มีทุก key ในนี้ไหม? | BOOLEAN |

```sql
-- -> ดึงค่าเป็น JSON
SELECT name, specs->'brand' AS brand FROM products;
-- ผลลัพธ์: "Apple" (มี quotes = JSON)

-- ->> ดึงค่าเป็น text
SELECT name, specs->>'brand' AS brand FROM products;
-- ผลลัพธ์: Apple (ไม่มี quotes = text)

-- #> ดึงค่า nested path เป็น JSON
SELECT name, specs#>'{display,type}' AS display_type FROM products;
-- ผลลัพธ์: "OLED"

-- #>> ดึงค่า nested path เป็น text
SELECT name, specs#>>'{display,size}' AS display_size FROM products;
-- ผลลัพธ์: 6.1

-- @> มี JSON นี้อยู่ไหม (containment)
SELECT name FROM products WHERE specs @> '{"brand": "Apple"}';

-- ? มี key นี้ไหม
SELECT name FROM products WHERE specs ? 'brand';

-- ?| มี key ใดก็ได้
SELECT name FROM products WHERE specs ?| ARRAY['ram', 'storage'];

-- ?& มีทุก key
SELECT name FROM products WHERE specs ?& ARRAY['ram', 'storage'];
```

### 5. WHERE กับ JSON data

```sql
-- หาสินค้า Apple
SELECT name, price FROM products
WHERE specs->>'brand' = 'Apple';

-- หาสินค้าที่ RAM มากกว่า 4GB
SELECT name, specs->>'ram' AS ram FROM products
WHERE (specs->>'ram')::TEXT LIKE '%GB'
  AND REPLACE(specs->>'ram', 'GB', '')::INT > 4;

-- หาสินค้าที่หน้าจอใหญ่กว่า 6 นิ้ว
SELECT name, specs#>>'{display,size}' AS screen_size FROM products
WHERE (specs#>>'{display,size}')::NUMERIC > 6;

-- หาสินค้าที่มีสีดำ (ค้นหาใน array)
SELECT name FROM products
WHERE specs->'colors' @> '"black"';

-- หาผู้ใช้ที่เปิด dark mode
SELECT user_name FROM user_settings
WHERE settings->>'theme' = 'dark';

-- หาผู้ใช้ที่เปิด push notification
SELECT user_name FROM user_settings
WHERE settings#>>'{notifications,push}' = 'true';
```

### 6. Update JSON -- jsonb_set() และ || operator

```sql
-- jsonb_set(target, path, new_value, create_if_missing)

-- เปลี่ยน theme เป็น light
UPDATE user_settings
SET settings = jsonb_set(settings, '{theme}', '"light"')
WHERE user_name = 'สมชาย';

-- เปลี่ยน nested value: ปิด email notification
UPDATE user_settings
SET settings = jsonb_set(settings, '{notifications,email}', 'false')
WHERE user_name = 'สมชาย';

-- || operator: merge/เพิ่ม key ใหม่
UPDATE products
SET specs = specs || '{"waterproof": true}'
WHERE name = 'iPhone 15';

-- ลบ key ด้วย -
UPDATE products
SET specs = specs - 'waterproof'
WHERE name = 'iPhone 15';

-- ลบ nested key ด้วย #-
UPDATE user_settings
SET settings = settings #- '{notifications,sms}'
WHERE user_name = 'สมชาย';

-- เพิ่มค่าใน array
UPDATE products
SET specs = jsonb_set(
  specs,
  '{colors}',
  (specs->'colors') || '"green"'
)
WHERE name = 'iPhone 15';
```

### 7. Index สำหรับ JSONB (GIN index)

```sql
-- GIN index สำหรับ JSONB — รองรับ @>, ?, ?|, ?&
CREATE INDEX idx_products_specs ON products USING GIN (specs);

-- GIN index เฉพาะ path — เล็กกว่า เร็วกว่า
CREATE INDEX idx_products_specs_brand ON products USING GIN ((specs->'brand'));

-- B-tree index สำหรับ ->> (ค่าเฉพาะ)
CREATE INDEX idx_products_brand ON products ((specs->>'brand'));

-- ทดสอบ: ดู query plan
EXPLAIN ANALYZE SELECT * FROM products WHERE specs @> '{"brand": "Apple"}';
```

**เมื่อไหร่ใช้ index ไหน:**

| Index | Operators ที่รองรับ | เหมาะกับ |
|-------|-------------------|---------|
| GIN (specs) | @>, ?, ?&, ?\| | query หลายแบบ |
| GIN (specs->'key') | @> เฉพาะ key | query เฉพาะ key |
| B-tree (specs->>'key') | =, <, >, LIKE | เปรียบเทียบค่า text |

### 8. เมื่อไหร่ควร/ไม่ควรใช้ JSONB

**ควรใช้ JSONB:**
- ข้อมูลที่โครงสร้างไม่แน่นอน (settings, metadata)
- ข้อมูลที่แต่ละ row มี field ไม่เหมือนกัน
- เก็บ API response สำหรับ debug
- Tags, labels, attributes ที่เปลี่ยนบ่อย

**ไม่ควรใช้ JSONB:**
- ข้อมูลที่ต้อง JOIN กับตารางอื่น → ใช้ FK แทน
- ข้อมูลที่ต้องการ unique constraint → ใช้คอลัมน์ปกติ
- ข้อมูลที่ทุก row มีโครงสร้างเหมือนกัน → ใช้คอลัมน์ปกติ
- ข้อมูลที่ต้อง aggregate บ่อย → ใช้คอลัมน์ปกติ

**หลักการ:** ถ้าข้อมูลมีโครงสร้าง → ใช้คอลัมน์ปกติ, ถ้าไม่มีโครงสร้าง → ใช้ JSONB

## แบบฝึกหัด

ไฟล์ `exercises.sql` — ฝึกใช้ JSONB operators ทั้งหมด:

1. ดึงชื่อสินค้าและ brand (ใช้ ->>)
2. หาสินค้า Samsung ทั้งหมด (ใช้ @>)
3. หาสินค้าที่มี key "ram" (ใช้ ?)
4. ดึง display size ของทุกสินค้า (ใช้ #>>)
5. อัปเดต theme ของผู้ใช้เป็น "dark" (ใช้ jsonb_set)
6. เพิ่ม key ใหม่ให้สินค้า (ใช้ ||)
7. หาผู้ใช้ที่เปิด push notification (ใช้ #>>)
8. สร้าง GIN index และเปรียบเทียบ query plan

## สรุป

- `JSONB` เก็บข้อมูล JSON แบบ binary — เร็วกว่า JSON ธรรมดา
- `->` ดึงค่าเป็น JSON, `->>` ดึงค่าเป็น text
- `#>` / `#>>` ดึงค่า nested path
- `@>` ตรวจว่ามี JSON อยู่ไหม, `?` ตรวจว่ามี key ไหม
- `jsonb_set()` อัปเดตค่า, `||` merge ค่าใหม่, `-` ลบ key
- ใช้ GIN index สำหรับ JSONB ให้ query เร็ว
- ใช้ JSONB เมื่อข้อมูลไม่มีโครงสร้างตายตัว

## ต่อไป

[Lab 15 — Performance Tuning →](../lab-15-performance/)
