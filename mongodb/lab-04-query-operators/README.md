# Lab 04 -- Query Operators

## เป้าหมาย

เรียนรู้ operator ต่างๆ ของ MongoDB เพื่อค้นหาข้อมูลได้อย่างยืดหยุ่น ทั้ง comparison, logical, element, array operators และการเรียงลำดับ/แบ่งหน้า

## ทำไมต้องรู้?

แอปจริงไม่ได้แค่ `find()` ดูข้อมูลทั้งหมด แต่ต้อง:
- **กรอง** -- สินค้าราคา 5000-10000
- **ค้นหา** -- สินค้ายี่ห้อ Apple หรือ Samsung
- **เรียงลำดับ** -- ราคาถูกสุดก่อน
- **แบ่งหน้า** -- แสดงทีละ 10 รายการ

## สิ่งที่ต้องมีก่อน

- [Lab 03](../lab-03-crud/) -- ใช้ CRUD ได้

## เริ่มต้น

```bash
# รัน MongoDB พร้อมข้อมูลตัวอย่าง
docker compose up -d

# เข้า mongosh
docker exec -it lab-04-query-operators-mongo-1 mongosh -u admin -p secret

# เลือก database
use learn_mongo

# ตรวจว่ามีข้อมูล
db.products.countDocuments()
// 12
db.orders.countDocuments()
// 5
```

## เนื้อหา

### 1. Comparison Operators (เปรียบเทียบ)

| Operator | ความหมาย | ตัวอย่าง |
|----------|---------|---------|
| `$eq` | เท่ากับ (=) | `{ price: { $eq: 100 } }` |
| `$ne` | ไม่เท่ากับ (!=) | `{ status: { $ne: "sold" } }` |
| `$gt` | มากกว่า (>) | `{ price: { $gt: 1000 } }` |
| `$gte` | มากกว่าหรือเท่ากับ (>=) | `{ age: { $gte: 18 } }` |
| `$lt` | น้อยกว่า (<) | `{ stock: { $lt: 10 } }` |
| `$lte` | น้อยกว่าหรือเท่ากับ (<=) | `{ rating: { $lte: 3 } }` |
| `$in` | อยู่ในรายการ | `{ brand: { $in: ["A","B"] } }` |
| `$nin` | ไม่อยู่ในรายการ | `{ brand: { $nin: ["A","B"] } }` |

```javascript
// ราคามากกว่า 40000
db.products.find({ price: { $gt: 40000 } })

// ราคาระหว่าง 10000-30000
db.products.find({ price: { $gte: 10000, $lte: 30000 } })

// แบรนด์ Apple หรือ Samsung
db.products.find({ brand: { $in: ["Apple", "Samsung"] } })

// ทุกแบรนด์ยกเว้น Apple
db.products.find({ brand: { $nin: ["Apple"] } })

// สินค้าที่หมดสต็อก (stock = 0)
db.products.find({ stock: { $eq: 0 } })
// หรือเขียนสั้นๆ
db.products.find({ stock: 0 })
```

### 2. Logical Operators (ตรรกะ)

| Operator | ความหมาย | วิธีใช้ |
|----------|---------|--------|
| `$and` | ทุกเงื่อนไขเป็นจริง | `{ $and: [{...}, {...}] }` |
| `$or` | เงื่อนไขใดเงื่อนไขหนึ่งเป็นจริง | `{ $or: [{...}, {...}] }` |
| `$not` | กลับเงื่อนไข | `{ field: { $not: {...} } }` |
| `$nor` | ทุกเงื่อนไขเป็นเท็จ | `{ $nor: [{...}, {...}] }` |

```javascript
// $and -- Apple และราคาน้อยกว่า 30000
db.products.find({
  $and: [
    { brand: "Apple" },
    { price: { $lt: 30000 } }
  ]
})
// เขียนสั้นๆ ได้ (MongoDB ทำ $and อัตโนมัติ)
db.products.find({ brand: "Apple", price: { $lt: 30000 } })

// $or -- laptop หรือ tablet
db.products.find({
  $or: [
    { category: "laptop" },
    { category: "tablet" }
  ]
})

// $not -- rating ไม่มากกว่า 4.5
db.products.find({
  rating: { $not: { $gt: 4.5 } }
})

// $nor -- ไม่ใช่ smartphone และไม่ใช่ laptop
db.products.find({
  $nor: [
    { category: "smartphone" },
    { category: "laptop" }
  ]
})

// ผสมกัน: (Apple หรือ Samsung) และราคาน้อยกว่า 35000
db.products.find({
  $and: [
    { $or: [{ brand: "Apple" }, { brand: "Samsung" }] },
    { price: { $lt: 35000 } }
  ]
})
```

### 3. Element Operators (ตรวจสอบ field)

| Operator | ความหมาย | ตัวอย่าง |
|----------|---------|---------|
| `$exists` | field มีอยู่หรือไม่ | `{ field: { $exists: true } }` |
| `$type` | ประเภทข้อมูลของ field | `{ field: { $type: "string" } }` |

```javascript
// สินค้าที่มี field specs.ram
db.products.find({ "specs.ram": { $exists: true } })

// สินค้าที่ไม่มี field specs.battery
db.products.find({ "specs.battery": { $exists: false } })

// field ที่เป็น string
db.products.find({ price: { $type: "double" } })
// types: "string", "int", "double", "bool", "date", "array", "object"
```

### 4. Array Operators (ค้นหาใน array)

| Operator | ความหมาย | ตัวอย่าง |
|----------|---------|---------|
| `$elemMatch` | สมาชิกตรงเงื่อนไขทั้งหมด | `{ arr: { $elemMatch: {...} } }` |
| `$all` | มีสมาชิกทุกตัวที่ระบุ | `{ arr: { $all: ["a","b"] } }` |
| `$size` | ขนาด array เท่ากับ | `{ arr: { $size: 3 } }` |

```javascript
// หาสินค้าที่มี tag "premium"
db.products.find({ tags: "premium" })

// หาสินค้าที่มีทั้ง tag "5g" และ "camera"
db.products.find({ tags: { $all: ["5g", "camera"] } })

// หาสินค้าที่มี 3 tags พอดี
db.products.find({ tags: { $size: 3 } })

// หาสินค้าที่มีสีพอดี 1 สี
db.products.find({ colors: { $size: 1 } })

// $elemMatch -- หา orders ที่มี item ราคามากกว่า 40000
db.orders.find({
  items: { $elemMatch: { price: { $gt: 40000 } } }
})

// $elemMatch -- หา orders ที่มี item จำนวนมากกว่า 1 ชิ้น
db.orders.find({
  items: { $elemMatch: { quantity: { $gt: 1 } } }
})
```

### 5. Query บน Nested Documents

```javascript
// ค้นหาด้วย dot notation
db.products.find({ "specs.ram": "8GB" })
db.products.find({ "specs.screen": { $gte: 14.0 } })

// ค้นหาใน nested object ของ orders
db.orders.find({ "customer.name": "สมชาย" })
db.orders.find({ "customer.email": "somying@mail.com" })
```

### 6. Projection -- เลือก fields ที่จะแสดง

```javascript
// แสดงเฉพาะ name และ price (1 = แสดง, 0 = ซ่อน)
db.products.find({}, { name: 1, price: 1, _id: 0 })

// ซ่อนเฉพาะ specs และ colors
db.products.find({}, { specs: 0, colors: 0 })

// ผสมกับ filter
db.products.find(
  { brand: "Apple" },
  { name: 1, price: 1, rating: 1, _id: 0 }
)
```

**กฎ Projection:**
- ใช้ 1 (include) หรือ 0 (exclude) -- **ห้ามผสมกัน** (ยกเว้น `_id`)
- `_id` แสดงเสมอ ถ้าไม่อยากแสดงต้องใส่ `_id: 0`

### 7. sort() -- เรียงลำดับ

```javascript
// เรียงตามราคา จากน้อยไปมาก (ascending)
db.products.find().sort({ price: 1 })

// เรียงตามราคา จากมากไปน้อย (descending)
db.products.find().sort({ price: -1 })

// เรียงตาม rating (มาก->น้อย) แล้วตาม price (น้อย->มาก)
db.products.find().sort({ rating: -1, price: 1 })
```

### 8. limit() และ skip() -- แบ่งหน้า (Pagination)

```javascript
// แสดงแค่ 5 รายการแรก
db.products.find().limit(5)

// ข้าม 5 รายการแรก แสดงรายการที่ 6 เป็นต้นไป
db.products.find().skip(5)

// Pagination: หน้าที่ 1 (แสดง 3 รายการ)
db.products.find().sort({ price: -1 }).skip(0).limit(3)

// Pagination: หน้าที่ 2
db.products.find().sort({ price: -1 }).skip(3).limit(3)

// Pagination: หน้าที่ 3
db.products.find().sort({ price: -1 }).skip(6).limit(3)

// สูตร: skip = (page - 1) * limit
```

### 9. รวมทุกอย่างเข้าด้วยกัน

```javascript
// ค้นหาสินค้า Apple ที่ราคา 10000-50000
// เรียงตาม rating จากมากไปน้อย
// แสดงเฉพาะ name, price, rating
// แสดงแค่ 3 รายการแรก
db.products
  .find(
    {
      brand: "Apple",
      price: { $gte: 10000, $lte: 50000 }
    },
    { name: 1, price: 1, rating: 1, _id: 0 }
  )
  .sort({ rating: -1 })
  .limit(3)
```

## แบบฝึกหัด

ไฟล์ `exercises.js` มีแบบฝึกหัดพร้อมเฉลย:

1. หาสินค้าราคา 12900 บาทพอดี
2. หาสินค้าราคามากกว่า 40000
3. หาสินค้าราคาระหว่าง 10000-30000
4. หาสินค้าแบรนด์ Apple หรือ Samsung
5. หาสินค้า Apple ที่ราคาน้อยกว่า 30000
6. หาสินค้า laptop หรือ tablet
7. หาสินค้าที่มี tag "premium"
8. หาสินค้าที่มี tag ทั้ง "5g" และ "camera"
9. แสดงเฉพาะ name และ price เรียงตามราคา
10. Pagination หน้าที่ 2 (หน้าละ 3 รายการ)

## สรุป

- **Comparison**: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`
- **Logical**: `$and`, `$or`, `$not`, `$nor`
- **Element**: `$exists`, `$type`
- **Array**: `$elemMatch`, `$all`, `$size`
- **Projection**: เลือก fields ที่จะแสดง (1 = include, 0 = exclude)
- **sort()**: เรียงลำดับ (1 = ascending, -1 = descending)
- **limit() / skip()**: แบ่งหน้า -- `skip((page-1) * limit).limit(limit)`

## ต่อไป

[Lab 05 -- Project: Bookstore Database -->](../lab-05-project-bookstore/)
