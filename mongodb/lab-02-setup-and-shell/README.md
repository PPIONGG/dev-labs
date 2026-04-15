# Lab 02 -- ติดตั้ง MongoDB & Shell

## เป้าหมาย

รัน MongoDB ผ่าน Docker, เชื่อมต่อด้วย mongosh, และใช้ Mongo Express GUI เพื่อดูข้อมูล

## ทำไมต้องรู้?

ก่อนจะเขียน query ได้ ต้องรู้วิธีเปิด MongoDB และเชื่อมต่อเข้าไปก่อน Lab นี้จะติดตั้งทุกอย่างผ่าน Docker -- ไม่ต้องติดตั้งลงเครื่องจริง

## สิ่งที่ต้องมีก่อน

- [Docker Learning Path](../../docker/) -- ต้องใช้ Docker Compose ได้
- [Lab 01](../lab-01-what-is-nosql/) -- เข้าใจ concept ของ NoSQL

## เนื้อหา

### 1. รัน MongoDB ด้วย Docker Compose

```bash
# เข้าโฟลเดอร์ lab นี้
cd lab-02-setup-and-shell

# รัน MongoDB + Mongo Express
docker compose up -d

# ดูว่า container รันอยู่
docker compose ps
```

**docker-compose.yml ในโปรเจคนี้มี:**
- **mongo** -- MongoDB server (port 27017)
- **mongo-express** -- Web GUI สำหรับดูข้อมูล (port 8081)

### 2. เชื่อมต่อด้วย mongosh

```bash
# เข้า mongosh ผ่าน docker
docker exec -it lab-02-setup-and-shell-mongo-1 mongosh -u admin -p secret

# หรือถ้าติดตั้ง mongosh ในเครื่อง
mongosh "mongodb://admin:secret@localhost:27017"
```

เมื่อเชื่อมต่อสำเร็จจะเห็น:

```
Current Mongosh Log ID: 64a1b2c3d4e5f6a7b8c9d0e1
Connecting to:          mongodb://<credentials>@localhost:27017/
Using MongoDB:          7.x.x
Using Mongosh:          2.x.x

test>
```

### 3. คำสั่ง mongosh พื้นฐาน

#### ดู databases ทั้งหมด

```javascript
// แสดง databases ทั้งหมด
show dbs
// admin    40.00 KiB
// config   60.00 KiB
// local    40.00 KiB
```

#### สร้าง/เลือก database

```javascript
// เลือก database (ถ้ายังไม่มีจะสร้างอัตโนมัติเมื่อเพิ่มข้อมูล)
use learn_mongo

// ดูว่าอยู่ database ไหน
db
// learn_mongo
```

#### ดู collections ทั้งหมด

```javascript
// แสดง collections ใน database ปัจจุบัน
show collections
// (ยังว่างเพราะยังไม่ได้สร้าง)
```

#### สร้าง collection และเพิ่มข้อมูล

```javascript
// เพิ่มข้อมูล 1 รายการ (สร้าง collection อัตโนมัติ)
db.users.insertOne({
  name: "สมชาย",
  email: "somchai@mail.com",
  age: 25
})

// ดู collections อีกครั้ง
show collections
// users

// เพิ่มหลายรายการ
db.users.insertMany([
  { name: "สมหญิง", email: "somying@mail.com", age: 30 },
  { name: "สมศักดิ์", email: "somsak@mail.com", age: 28 }
])
```

#### ดูข้อมูล

```javascript
// ดูข้อมูลทั้งหมดใน collection
db.users.find()

// ดูแบบสวยๆ (formatted)
db.users.find().pretty()

// ดูรายการแรก
db.users.findOne()

// นับจำนวน documents
db.users.countDocuments()
// 3
```

#### ดูข้อมูล database

```javascript
// ดูสถิติของ database
db.stats()

// ดูสถิติของ collection
db.users.stats()
```

### 4. คำสั่ง mongosh ที่ใช้บ่อย

| คำสั่ง | คำอธิบาย |
|--------|---------|
| `show dbs` | แสดง databases ทั้งหมด |
| `use <db>` | เลือก/สร้าง database |
| `db` | แสดง database ปัจจุบัน |
| `show collections` | แสดง collections ทั้งหมด |
| `db.<col>.find()` | ดูข้อมูลทั้งหมดใน collection |
| `db.<col>.findOne()` | ดูข้อมูลรายการแรก |
| `db.<col>.countDocuments()` | นับจำนวน documents |
| `db.<col>.insertOne({...})` | เพิ่มข้อมูล 1 รายการ |
| `db.<col>.drop()` | ลบ collection |
| `db.dropDatabase()` | ลบ database ปัจจุบัน |
| `cls` | ล้างหน้าจอ |
| `exit` | ออกจาก mongosh |

### 5. Mongo Express GUI

เปิดเบราว์เซอร์ไปที่ **http://localhost:8081**

Mongo Express ช่วยให้:
- ดู databases และ collections ผ่าน web
- ดู/เพิ่ม/แก้ไข/ลบ documents แบบ GUI
- ดูโครงสร้างของ database
- Export/Import ข้อมูล

```
+---------------------------------------------+
|  Mongo Express                               |
|---------------------------------------------|
|  Databases:                                  |
|    admin                                     |
|    config                                    |
|    learn_mongo                               |
|      └ users (3 documents)                   |
|    local                                     |
+---------------------------------------------+
```

**ลองใช้:**
1. คลิกที่ database `learn_mongo`
2. คลิกที่ collection `users`
3. จะเห็นข้อมูลทั้ง 3 documents ที่เพิ่งเพิ่มไป
4. ลองคลิก "New Document" เพื่อเพิ่มข้อมูลผ่าน GUI

### 6. หยุด MongoDB

```bash
# หยุด containers
docker compose down

# หยุดและลบ data ทั้งหมด
docker compose down -v
```

## แบบฝึกหัด

1. รัน MongoDB ด้วย `docker compose up -d`
2. เชื่อมต่อด้วย `mongosh`
3. สร้าง database ชื่อ `myapp`
4. เพิ่มข้อมูล 3 รายการใน collection `products`
5. ใช้ `find()` ดูข้อมูลทั้งหมด
6. นับจำนวน documents ด้วย `countDocuments()`
7. เปิด Mongo Express (http://localhost:8081) แล้วดูข้อมูลที่เพิ่ง

## สรุป

- ใช้ Docker Compose รัน MongoDB ได้ทันที ไม่ต้องติดตั้งเอง
- `mongosh` คือ shell สำหรับเขียนคำสั่ง MongoDB
- คำสั่งพื้นฐาน: `show dbs`, `use <db>`, `show collections`, `db.collection.find()`
- Mongo Express เป็น GUI สำหรับจัดการข้อมูลผ่าน web browser (port 8081)

## ต่อไป

[Lab 03 -- CRUD Operations -->](../lab-03-crud/)
