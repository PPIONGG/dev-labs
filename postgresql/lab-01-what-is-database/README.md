# Lab 01 — Database คืออะไร? SQL vs NoSQL

## เป้าหมาย

เข้าใจว่า Database คืออะไร ทำไมต้องใช้ และความแตกต่างระหว่าง SQL กับ NoSQL

## ทำไมต้องรู้?

ทุกแอปที่คุณใช้งานเก็บข้อมูลอยู่ใน database:
- Facebook เก็บโปรไฟล์ โพสต์ คอมเมนต์
- Shopee เก็บสินค้า ออเดอร์ ข้อมูลลูกค้า
- LINE เก็บข้อความ รูปภาพ ข้อมูลผู้ใช้

ถ้าไม่มี database ทุกข้อมูลจะหายเมื่อปิดแอป — เหมือนเขียนอะไรลงกระดาษแล้วกระดาษหาย

## เนื้อหา

### 1. Database คืออะไร?

Database คือ **ที่เก็บข้อมูลอย่างเป็นระบบ** ที่สามารถ:
- **Create** — สร้างข้อมูลใหม่
- **Read** — อ่านข้อมูลที่มีอยู่
- **Update** — แก้ไขข้อมูล
- **Delete** — ลบข้อมูล

(รวมเรียกว่า **CRUD**)

### 2. ทำไมไม่เก็บลงไฟล์ JSON?

```
ไฟล์ JSON:                    Database:
+------------------+          +------------------+
| อ่าน/เขียนทั้งไฟล์  |        | อ่าน/เขียนเฉพาะส่วน |
| ไม่มี query       |          | query ได้เลย     |
| ไม่ปลอดภัย        |          | มี authentication |
| ไม่รองรับหลาย users|         | หลาย users พร้อมกัน|
| ข้อมูลน้อยๆ OK    |          | ข้อมูลมหาศาลก็ OK |
+------------------+          +------------------+
```

### 3. ประเภทของ Database

#### SQL (Relational Database)
เก็บข้อมูลเป็น **ตาราง** (table) ที่มี rows และ columns เหมือน Excel

```
ตาราง users:
+----+----------+------------------+
| id | name     | email            |
+----+----------+------------------+
| 1  | สมชาย    | somchai@mail.com |
| 2  | สมหญิง   | somying@mail.com |
+----+----------+------------------+
```

ตัวอย่าง: **PostgreSQL**, MySQL, SQLite

#### NoSQL (Non-relational Database)

##### Document Database
เก็บข้อมูลเป็น **เอกสาร** (document) รูปแบบ JSON

```json
{
  "_id": "1",
  "name": "สมชาย",
  "email": "somchai@mail.com",
  "addresses": [
    { "type": "home", "city": "กรุงเทพ" },
    { "type": "work", "city": "นนทบุรี" }
  ]
}
```

ตัวอย่าง: **MongoDB**

##### Key-Value Store
เก็บข้อมูลเป็น **key-value** เหมือน dictionary

```
"user:1"       → "สมชาย"
"session:abc"  → "{userId: 1, loggedIn: true}"
"page:views"   → 42
```

ตัวอย่าง: **Redis**

### 4. SQL vs NoSQL เปรียบเทียบ

| | SQL (PostgreSQL) | Document (MongoDB) | Key-Value (Redis) |
|---|-----------------|-------------------|-------------------|
| โครงสร้าง | ตายตัว (schema) | ยืดหยุ่น | ไม่มีโครงสร้าง |
| ภาษา | SQL | JavaScript-like | คำสั่งเฉพาะ |
| Relationships | เชื่อมตารางได้ (JOIN) | ซ้อนข้อมูลได้ (embed) | ไม่รองรับ |
| เหมาะกับ | ข้อมูลที่มีความสัมพันธ์ | ข้อมูลที่เปลี่ยนโครงสร้างบ่อย | cache, session, queue |
| ความเร็ว | เร็ว | เร็ว | เร็วมาก (in-memory) |
| ตัวอย่างใช้งาน | บัญชี, ออเดอร์, สินค้า | blog posts, logs | cache, leaderboard |

### 5. ทำไมเริ่มด้วย PostgreSQL?

1. **เป็นพื้นฐาน** — SQL เป็นภาษาที่ใช้กับ database เกือบทุกตัว
2. **เข้มงวดเรื่องข้อมูล** — schema บังคับให้ข้อมูลถูกต้อง ลดบัคได้
3. **ทรงพลัง** — รองรับ JSON ด้วย ทำให้ได้ทั้ง SQL + NoSQL ในตัวเดียว
4. **นิยมมาก** — บริษัทส่วนใหญ่ใช้ PostgreSQL หรือ MySQL
5. **ฟรี & Open Source** — ไม่มีค่าใช้จ่าย

### 6. คำศัพท์พื้นฐาน

| คำ | ความหมาย | ตัวอย่าง |
|----|---------|---------|
| Database | ที่เก็บข้อมูลทั้งหมด | `my_app_db` |
| Table | ตารางเก็บข้อมูลประเภทหนึ่ง | `users`, `products` |
| Row | แถว = ข้อมูล 1 รายการ | ผู้ใช้ 1 คน |
| Column | คอลัมน์ = ประเภทข้อมูล | `name`, `email` |
| Primary Key | ตัวระบุข้อมูลไม่ซ้ำ | `id` |
| Foreign Key | ตัวเชื่อมไปตารางอื่น | `user_id` |
| Query | คำสั่งถามข้อมูล | `SELECT * FROM users` |
| Schema | โครงสร้างของตาราง | columns, types, constraints |

## สรุป

- Database คือที่เก็บข้อมูลอย่างเป็นระบบ รองรับ CRUD
- SQL database (PostgreSQL) เก็บข้อมูลเป็นตาราง มีโครงสร้างชัดเจน
- NoSQL มีหลายแบบ — Document (MongoDB), Key-Value (Redis)
- เริ่มเรียน PostgreSQL ก่อน เพราะ SQL เป็นพื้นฐานของ database ทุกประเภท

## ต่อไป

[Lab 02 — ติดตั้ง PostgreSQL & เครื่องมือ →](../lab-02-setup-and-tools/)
