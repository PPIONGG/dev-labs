# Lab 03 -- CRUD Operations

## เป้าหมาย

เรียนรู้ 4 คำสั่งหลักของ MongoDB -- สร้าง อ่าน แก้ไข และลบข้อมูลใน collection

## ทำไมต้องรู้?

CRUD คือพื้นฐานที่สำคัญที่สุด ทุกแอปทำแค่ 4 อย่างนี้:
- **C**reate --> `insertOne / insertMany` -- สมัครสมาชิก, สร้างโพสต์
- **R**ead --> `find / findOne` -- ดูโปรไฟล์, ค้นหาสินค้า
- **U**pdate --> `updateOne / updateMany` -- แก้ชื่อ, เปลี่ยน password
- **D**elete --> `deleteOne / deleteMany` -- ลบบัญชี, ลบโพสต์

## สิ่งที่ต้องมีก่อน

- [Lab 02](../lab-02-setup-and-shell/) -- เชื่อมต่อ MongoDB ด้วย mongosh ได้

## เริ่มต้น

```bash
# รัน MongoDB พร้อมข้อมูลตัวอย่าง
docker compose up -d

# เข้า mongosh
docker exec -it lab-03-crud-mongo-1 mongosh -u admin -p secret

# เลือก database
use learn_mongo

# ตรวจว่ามีข้อมูล
db.employees.countDocuments()
// 12
```

## เนื้อหา

### 1. insertOne -- เพิ่มข้อมูล 1 รายการ

```javascript
// เพิ่มพนักงาน 1 คน
db.employees.insertOne({
  name: "ทดสอบ ใหม่",
  email: "test@company.com",
  department: "IT",
  position: "Intern",
  salary: 15000,
  skills: ["HTML", "CSS"],
  isActive: true,
  joinDate: new Date()
})

// ผลลัพธ์:
// {
//   acknowledged: true,
//   insertedId: ObjectId('...')   <-- MongoDB สร้าง _id ให้อัตโนมัติ
// }
```

### 2. insertMany -- เพิ่มข้อมูลหลายรายการ

```javascript
// เพิ่มพนักงาน 3 คนพร้อมกัน
db.employees.insertMany([
  {
    name: "คนที่ 1",
    email: "one@company.com",
    department: "HR",
    salary: 30000,
    skills: ["Recruitment"],
    isActive: true,
    joinDate: new Date()
  },
  {
    name: "คนที่ 2",
    email: "two@company.com",
    department: "Sales",
    salary: 28000,
    skills: ["Negotiation"],
    isActive: true,
    joinDate: new Date()
  },
  {
    name: "คนที่ 3",
    email: "three@company.com",
    department: "Engineering",
    salary: 45000,
    skills: ["Python"],
    isActive: true,
    joinDate: new Date()
  }
])

// ผลลัพธ์:
// {
//   acknowledged: true,
//   insertedIds: {
//     '0': ObjectId('...'),
//     '1': ObjectId('...'),
//     '2': ObjectId('...')
//   }
// }
```

### 3. find -- ค้นหาข้อมูลหลายรายการ

```javascript
// ดูทั้งหมด
db.employees.find()

// ค้นหาตามเงื่อนไข
db.employees.find({ department: "Engineering" })

// ค้นหาเงินเดือนมากกว่า 50000
db.employees.find({ salary: { $gt: 50000 } })

// เลือกแสดงเฉพาะบาง fields (projection)
db.employees.find(
  { department: "Engineering" },
  { name: 1, salary: 1, _id: 0 }
)
// { name: "สมชาย ใจดี", salary: 65000 }
// { name: "สมหญิง รักเรียน", salary: 35000 }
// ...
```

### 4. findOne -- ค้นหาข้อมูล 1 รายการ

```javascript
// หาคนแรกที่เจอ
db.employees.findOne()

// หาตาม email
db.employees.findOne({ email: "somchai@company.com" })

// หาตาม _id
db.employees.findOne({ _id: ObjectId("...ใส่ id ที่ได้...") })
```

### 5. updateOne -- แก้ไข 1 รายการ

```javascript
// $set -- ตั้งค่า field (ถ้าไม่มีจะเพิ่มให้)
db.employees.updateOne(
  { name: "สมชาย ใจดี" },       // filter: หาคนนี้
  { $set: { salary: 70000 } }   // update: เปลี่ยนเงินเดือน
)

// $inc -- เพิ่ม/ลดค่าตัวเลข
db.employees.updateOne(
  { name: "สมหญิง รักเรียน" },
  { $inc: { salary: 5000 } }    // เพิ่มเงินเดือน 5000
)

// $push -- เพิ่มสมาชิกใน array
db.employees.updateOne(
  { name: "สมชาย ใจดี" },
  { $push: { skills: "TypeScript" } }
)

// $pull -- ลบสมาชิกจาก array
db.employees.updateOne(
  { name: "สมชาย ใจดี" },
  { $pull: { skills: "TypeScript" } }
)

// $unset -- ลบ field ออก
db.employees.updateOne(
  { name: "สมชาย ใจดี" },
  { $unset: { position: "" } }
)
```

### 6. updateMany -- แก้ไขหลายรายการ

```javascript
// เพิ่มเงินเดือนพนักงาน Engineering ทุกคน 3000 บาท
db.employees.updateMany(
  { department: "Engineering" },
  { $inc: { salary: 3000 } }
)
// { matchedCount: 6, modifiedCount: 6 }

// เพิ่ม field ใหม่ให้ทุกคน
db.employees.updateMany(
  {},                            // {} = ทุก document
  { $set: { company: "TechCorp" } }
)
```

### 7. replaceOne -- แทนที่ document ทั้งหมด

```javascript
// แทนที่ document ทั้งหมด (ยกเว้น _id)
// ⚠️ ระวัง! field ที่ไม่ได้ใส่จะหายไป
db.employees.replaceOne(
  { email: "test@company.com" },
  {
    name: "ทดสอบ ถูกแทนที่",
    email: "test@company.com",
    department: "IT",
    salary: 20000,
    isActive: true
    // skills หายไป! เพราะไม่ได้ใส่
  }
)
```

**ความแตกต่าง updateOne vs replaceOne:**

| | updateOne | replaceOne |
|---|----------|------------|
| วิธีทำงาน | แก้เฉพาะ field ที่ระบุ | แทนที่ทั้ง document |
| ใช้ operator | ต้องใช้ $set, $inc, ... | ห้ามใช้ operator |
| field อื่นๆ | ยังอยู่ | หายไป (ถ้าไม่ใส่) |
| เหมาะกับ | แก้ไขบาง field | เปลี่ยนโครงสร้างทั้งหมด |

### 8. deleteOne -- ลบ 1 รายการ

```javascript
// ลบคนที่ email เป็น test@company.com
db.employees.deleteOne({ email: "test@company.com" })
// { deletedCount: 1 }

// ⚠️ ถ้า filter ตรงหลายรายการ จะลบแค่รายการแรก
db.employees.deleteOne({ department: "Engineering" })
// ลบแค่ 1 คน ไม่ใช่ทุกคน
```

### 9. deleteMany -- ลบหลายรายการ

```javascript
// ลบพนักงานที่ไม่ active ทั้งหมด
db.employees.deleteMany({ isActive: false })
// { deletedCount: 1 }

// ⚠️ อันตราย! ลบทุก document
db.employees.deleteMany({})
// ข้อมูลทั้งหมดหายไป!
```

### 10. Update Operators สรุป

| Operator | คำอธิบาย | ตัวอย่าง |
|----------|---------|---------|
| `$set` | ตั้งค่า field | `{ $set: { name: "ใหม่" } }` |
| `$unset` | ลบ field | `{ $unset: { field: "" } }` |
| `$inc` | เพิ่ม/ลดตัวเลข | `{ $inc: { salary: 5000 } }` |
| `$mul` | คูณตัวเลข | `{ $mul: { price: 1.1 } }` |
| `$rename` | เปลี่ยนชื่อ field | `{ $rename: { old: "new" } }` |
| `$push` | เพิ่มสมาชิกใน array | `{ $push: { tags: "new" } }` |
| `$pull` | ลบสมาชิกจาก array | `{ $pull: { tags: "old" } }` |
| `$addToSet` | เพิ่มใน array (ไม่ซ้ำ) | `{ $addToSet: { tags: "x" } }` |

## แบบฝึกหัด

ไฟล์ `exercises.js` มีแบบฝึกหัดพร้อมเฉลย:

1. เพิ่มพนักงานใหม่ 1 คน ด้วย `insertOne`
2. เพิ่มพนักงานใหม่ 3 คน ด้วย `insertMany`
3. ค้นหาพนักงานแผนก Engineering
4. ค้นหาพนักงานเงินเดือนมากกว่า 50000
5. เปลี่ยนเงินเดือนของพนักงานคนหนึ่ง
6. เพิ่ม skill ให้พนักงาน
7. เพิ่มเงินเดือนพนักงาน Engineering ทุกคน
8. ลบพนักงานที่ไม่ active

## สรุป

- `insertOne` / `insertMany` เพิ่มข้อมูล
- `find` / `findOne` ค้นหาข้อมูล
- `updateOne` / `updateMany` แก้ไขข้อมูลด้วย operators ($set, $inc, $push, ...)
- `replaceOne` แทนที่ document ทั้งหมด
- `deleteOne` / `deleteMany` ลบข้อมูล
- ใช้ `{}` เป็น filter = ทุก document -- **ระวังกับ updateMany/deleteMany!**

## ต่อไป

[Lab 04 -- Query Operators -->](../lab-04-query-operators/)
