# Lab 01 -- NoSQL & Document Database คืออะไร?

## เป้าหมาย

เข้าใจว่า NoSQL คืออะไร มีกี่ประเภท ทำไม MongoDB ถึงเป็น Document Database ที่นิยมที่สุด และเปรียบเทียบกับ SQL database

## ทำไมต้องรู้?

ไม่ใช่ทุกข้อมูลที่เหมาะกับตาราง (table) แบบ SQL:
- **โพสต์ในโซเชียลมีเดีย** -- แต่ละโพสต์มีโครงสร้างต่างกัน (บางอันมีรูป, วิดีโอ, poll)
- **สินค้าใน e-commerce** -- เสื้อผ้ามี size/color แต่โทรศัพท์มี RAM/storage
- **Log ของระบบ** -- ข้อมูลมหาศาลที่เปลี่ยนโครงสร้างบ่อย

NoSQL database ออกแบบมาเพื่อรองรับข้อมูลแบบนี้โดยเฉพาะ

## เนื้อหา

### 1. NoSQL คืออะไร?

NoSQL ย่อมาจาก **"Not Only SQL"** -- หมายความว่าไม่ได้ใช้ SQL เป็นภาษาหลักในการ query ข้อมูล

```
SQL Database:                    NoSQL Database:
+------------------+            +------------------+
| ข้อมูลเป็นตาราง    |            | ข้อมูลหลายรูปแบบ   |
| โครงสร้างตายตัว    |            | โครงสร้างยืดหยุ่น    |
| ใช้ภาษา SQL      |            | ใช้ภาษาเฉพาะตัว    |
| เน้น consistency  |            | เน้น scalability   |
+------------------+            +------------------+
```

### 2. ประเภทของ NoSQL Database

#### Document Database
เก็บข้อมูลเป็น **document** (JSON/BSON) แต่ละ document มีโครงสร้างต่างกันได้

```json
{
  "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
  "name": "iPhone 15",
  "price": 35900,
  "specs": {
    "storage": "256GB",
    "color": "Blue"
  },
  "tags": ["smartphone", "apple", "5g"]
}
```

ตัวอย่าง: **MongoDB**, CouchDB

#### Key-Value Store
เก็บข้อมูลเป็น **key-value** เหมือน dictionary -- เร็วมากแต่ query ซับซ้อนไม่ได้

```
"user:1001"     -> {"name": "สมชาย", "age": 25}
"session:abc"   -> {"userId": 1001, "token": "xyz"}
"cache:home"    -> "<html>...</html>"
```

ตัวอย่าง: **Redis**, DynamoDB

#### Column-Family Store
เก็บข้อมูลเป็น **column families** -- เหมาะกับข้อมูลมหาศาล (Big Data)

```
Row Key    | Column Family: profile     | Column Family: activity
-----------+---------------------------+-------------------------
user:1001  | name:"สมชาย" age:25       | last_login:"2024-01-15"
user:1002  | name:"สมหญิง"             | last_login:"2024-01-14" posts:42
```

ตัวอย่าง: **Cassandra**, HBase

#### Graph Database
เก็บข้อมูลเป็น **nodes** และ **edges** (ความสัมพันธ์) -- เหมาะกับ social network, recommendation

```
[สมชาย] --FOLLOWS--> [สมหญิง]
[สมชาย] --LIKES----> [โพสต์ A]
[สมหญิง] --WROTE----> [โพสต์ A]
```

ตัวอย่าง: **Neo4j**, ArangoDB

### 3. ทำไม MongoDB?

MongoDB เป็น Document Database ที่ **นิยมที่สุดในโลก** เพราะ:

1. **ยืดหยุ่น** -- ไม่ต้องกำหนด schema ล่วงหน้า เพิ่ม field ใหม่ได้ทันที
2. **เรียนรู้ง่าย** -- ใช้ JSON ที่นักพัฒนาคุ้นเคยอยู่แล้ว
3. **Scale ได้ง่าย** -- รองรับ horizontal scaling (sharding) ในตัว
4. **Community ใหญ่** -- มีเอกสาร, tutorial, และ community มากมาย
5. **ฟรี & Open Source** -- Community Edition ไม่มีค่าใช้จ่าย
6. **Atlas** -- มี cloud service ใช้งานได้ฟรี (Free Tier)

### 4. Document Model (JSON/BSON)

MongoDB เก็บข้อมูลในรูปแบบ **BSON** (Binary JSON) ซึ่งเป็น JSON ที่ถูกแปลงเป็น binary เพื่อประสิทธิภาพ

```json
// JSON ที่เราเขียน
{
  "name": "สมชาย",
  "age": 25,
  "email": "somchai@mail.com",
  "addresses": [
    {
      "type": "home",
      "city": "กรุงเทพ",
      "zipcode": "10100"
    },
    {
      "type": "work",
      "city": "นนทบุรี",
      "zipcode": "11000"
    }
  ],
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**ข้อดีของ Document Model:**
- ข้อมูลที่เกี่ยวข้องอยู่ด้วยกัน (ไม่ต้อง JOIN)
- แต่ละ document มีโครงสร้างต่างกันได้
- ซ้อน (nest) ข้อมูลได้หลายชั้น
- รองรับ array ในตัว

**BSON vs JSON:**

| | JSON | BSON |
|---|------|------|
| รูปแบบ | Text | Binary |
| ขนาด | เล็กกว่า | ใหญ่กว่าเล็กน้อย |
| ความเร็ว | parse ช้ากว่า | parse เร็วกว่า |
| Data types | string, number, boolean, null, array, object | เพิ่ม Date, ObjectId, Int32, Int64, Decimal128, Binary |
| ใช้ตอน | ส่งข้อมูล, เขียน query | MongoDB เก็บข้อมูลภายใน |

### 5. MongoDB vs PostgreSQL

| | MongoDB | PostgreSQL |
|---|---------|------------|
| ประเภท | Document Database (NoSQL) | Relational Database (SQL) |
| ภาษา Query | JavaScript-like (MQL) | SQL |
| โครงสร้าง | Flexible schema | Fixed schema |
| ข้อมูลซ้อน | Embed subdocuments | ต้อง JOIN หลายตาราง |
| Scale | Horizontal (Sharding) | Vertical (เพิ่ม RAM/CPU) |
| Transactions | รองรับ (ตั้งแต่ v4.0) | รองรับเต็มรูปแบบ |
| เหมาะกับ | Content, Catalog, IoT, Real-time | Banking, ERP, ข้อมูลที่มีความสัมพันธ์ซับซ้อน |

**ตัวอย่างเก็บข้อมูลเดียวกัน:**

PostgreSQL (ต้อง 3 ตาราง + JOIN):
```sql
-- ตาราง users
CREATE TABLE users (id SERIAL, name TEXT, email TEXT);

-- ตาราง addresses
CREATE TABLE addresses (id SERIAL, user_id INT, city TEXT);

-- ต้อง JOIN เพื่อดูข้อมูลครบ
SELECT u.name, a.city FROM users u JOIN addresses a ON u.id = a.user_id;
```

MongoDB (document เดียว):
```javascript
// ข้อมูลทั้งหมดอยู่ใน document เดียว
db.users.findOne({ name: "สมชาย" })
// {
//   name: "สมชาย",
//   email: "somchai@mail.com",
//   addresses: [
//     { city: "กรุงเทพ" },
//     { city: "นนทบุรี" }
//   ]
// }
```

### 6. คำศัพท์เปรียบเทียบ

| PostgreSQL (SQL) | MongoDB (NoSQL) | คำอธิบาย |
|-----------------|-----------------|---------|
| Database | Database | ที่เก็บข้อมูลทั้งหมด |
| Table | **Collection** | กลุ่มของข้อมูลประเภทเดียวกัน |
| Row | **Document** | ข้อมูล 1 รายการ (JSON object) |
| Column | **Field** | ชื่อ property ใน document |
| Primary Key | **_id** | ตัวระบุไม่ซ้ำ (ObjectId) |
| Foreign Key | **Reference / Embed** | เชื่อมข้อมูลด้วย reference หรือ embed |
| JOIN | **$lookup / Embed** | ดึงข้อมูลจากหลาย collection |
| Schema | **Flexible (optional)** | ไม่บังคับ แต่ใช้ validation ได้ |

```
PostgreSQL:                      MongoDB:
+-----------+                    +-----------------+
| Database  |                    | Database        |
|  └ Table  |     ───────>      |  └ Collection   |
|    └ Row  |                    |    └ Document   |
|      └ Col|                    |      └ Field    |
+-----------+                    +-----------------+
```

### 7. ObjectId คืออะไร?

ทุก document ใน MongoDB มี field `_id` ที่เป็น **ObjectId** -- ตัวระบุไม่ซ้ำ 12 bytes

```
ObjectId("64a1b2c3d4e5f6a7b8c9d0e1")
         |------|--|--|------|
         timestamp |  |  counter
              machine pid
```

- **4 bytes** -- timestamp (วันเวลาที่สร้าง)
- **5 bytes** -- random value (unique per machine/process)
- **3 bytes** -- counter (เพิ่มขึ้นทีละ 1)

ถ้าไม่กำหนด `_id` เอง MongoDB จะสร้าง ObjectId ให้อัตโนมัติ

## Checklist

- [ ] อธิบายความแตกต่างระหว่าง SQL กับ NoSQL ได้
- [ ] บอกได้ว่า NoSQL มี 4 ประเภทอะไรบ้าง
- [ ] อธิบายได้ว่า Document Database เก็บข้อมูลอย่างไร
- [ ] แปลงคำศัพท์ SQL เป็น MongoDB ได้ (table -> collection, row -> document)
- [ ] อธิบายข้อดีของ MongoDB เทียบกับ SQL ได้

## สรุป

- NoSQL = "Not Only SQL" มี 4 ประเภท: Document, Key-Value, Column-Family, Graph
- MongoDB เป็น Document Database ที่นิยมที่สุด เก็บข้อมูลเป็น JSON/BSON
- Document model ยืดหยุ่น -- ข้อมูลที่เกี่ยวข้องอยู่ด้วยกันใน document เดียว
- Table = Collection, Row = Document, Column = Field, Primary Key = _id

## ต่อไป

[Lab 02 -- ติดตั้ง MongoDB & Shell -->](../lab-02-setup-and-shell/)
