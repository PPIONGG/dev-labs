# Lab 06 -- Schema Design Patterns

## เป้าหมาย

เรียนรู้วิธีออกแบบ schema ใน MongoDB -- Embedding vs Referencing, ความสัมพันธ์แบบต่างๆ (1:1, 1:N, N:N) และ design patterns ที่ใช้บ่อย

## ทำไมต้องรู้?

MongoDB ไม่ได้บังคับ schema แต่ **schema ที่ดีทำให้แอปเร็วขึ้น 10-100 เท่า** ส่วน schema ที่แย่ทำให้ query ช้า ข้อมูลซ้ำซ้อน และ scale ไม่ได้

## สิ่งที่ต้องมีก่อน

- [Lab 03](../lab-03-crud/) ถึง [Lab 04](../lab-04-query-operators/) -- ใช้ CRUD และ query ได้

## เริ่มต้น

```bash
# รัน MongoDB
docker compose up -d

# เข้า mongosh
docker exec -it lab-06-schema-design-mongo-1 mongosh -u admin -p secret

# เลือก database
use learn_mongo
```

ลองรันตัวอย่างทั้งหมด:
```bash
# copy examples.js เข้า container แล้วรัน
docker cp examples.js lab-06-schema-design-mongo-1:/examples.js
docker exec -it lab-06-schema-design-mongo-1 mongosh -u admin -p secret --eval 'load("/examples.js")'
```

## เนื้อหา

### 1. Embedding vs Referencing

MongoDB มี 2 วิธีหลักในการเชื่อมข้อมูล:

#### Embedding (ซ้อนข้อมูล)
เก็บข้อมูลที่เกี่ยวข้องไว้ใน document เดียวกัน

```javascript
// Embedding: address อยู่ใน user document
{
  name: "สมชาย",
  email: "somchai@mail.com",
  address: {
    street: "123 ถนนสุขุมวิท",
    city: "กรุงเทพ",
    zipcode: "10100"
  }
}
```

#### Referencing (อ้างอิง)
แยก collection แล้วใช้ ID เชื่อมกัน (เหมือน Foreign Key ใน SQL)

```javascript
// Referencing: แยก 2 collections
// users collection
{ _id: ObjectId("user1"), name: "สมชาย", addressId: ObjectId("addr1") }

// addresses collection
{ _id: ObjectId("addr1"), street: "123 ถนนสุขุมวิท", city: "กรุงเทพ" }
```

#### เปรียบเทียบ

| | Embedding | Referencing |
|---|-----------|-------------|
| ข้อดี | อ่านเร็ว (1 query) | ข้อมูลไม่ซ้ำซ้อน |
| ข้อดี | ไม่ต้อง JOIN | document ไม่ใหญ่เกินไป |
| ข้อเสีย | ข้อมูลอาจซ้ำซ้อน | ต้อง query หลายครั้ง ($lookup) |
| ข้อเสีย | document อาจใหญ่เกินไป | ช้ากว่า embedding |

### 2. เมื่อไรควร Embed?

ใช้ Embedding เมื่อ:

1. **ข้อมูลถูกเข้าถึงพร้อมกันเสมอ** -- ดู user ต้องเห็น address ด้วย
2. **ข้อมูลย่อยมีจำนวนน้อย** -- reviews ไม่เกิน 100 อัน
3. **ข้อมูลย่อยไม่ค่อยเปลี่ยน** -- ที่อยู่, โปรไฟล์
4. **ข้อมูลย่อยเป็นของ parent เท่านั้น** -- address เป็นของ user คนเดียว

```javascript
// ดี: embed profile ใน user (1:1, เข้าถึงพร้อมกัน)
{
  name: "สมชาย",
  profile: { bio: "Developer", avatar: "pic.jpg" }
}

// ดี: embed reviews ใน product (1:N, จำนวนน้อย)
{
  name: "iPhone 15",
  reviews: [
    { user: "สมชาย", rating: 5 },
    { user: "สมหญิง", rating: 4 }
  ]
}
```

### 3. เมื่อไรควร Reference?

ใช้ Referencing เมื่อ:

1. **ข้อมูลย่อยมีจำนวนมาก** -- user มีโพสต์หลายพัน
2. **ข้อมูลย่อยถูกเข้าถึงแยกกัน** -- ดูรายการ books โดยไม่ต้องดู author
3. **Many-to-Many** -- student ลงหลาย courses, course มีหลาย students
4. **ข้อมูลย่อยเปลี่ยนบ่อย** -- stock, status

```javascript
// ดี: reference books จาก author (1:N, จำนวนมาก)
// authors collection
{ _id: ObjectId("a1"), name: "Robert C. Martin" }

// books collection
{ title: "Clean Code", authorId: ObjectId("a1") }
{ title: "Clean Architecture", authorId: ObjectId("a1") }
```

### 4. ความสัมพันธ์ 1:1

```javascript
// วิธีที่ 1: Embed (แนะนำ ถ้าเข้าถึงพร้อมกัน)
{
  name: "สมชาย",
  profile: {
    bio: "Full-stack developer",
    avatar: "https://example.com/pic.jpg"
  }
}

// วิธีที่ 2: Reference (ถ้า profile ไม่ค่อยถูกเข้าถึง)
// users: { _id: "u1", name: "สมชาย", profileId: "p1" }
// profiles: { _id: "p1", bio: "Full-stack developer" }
```

### 5. ความสัมพันธ์ 1:N (One-to-Many)

#### N น้อย (< 100) --> Embed

```javascript
// Post มี comments ไม่กี่อัน
{
  title: "MongoDB 101",
  content: "เรียนรู้ MongoDB...",
  comments: [
    { user: "สมหญิง", text: "ดีมากค่ะ" },
    { user: "มานะ", text: "ขอบคุณครับ" }
  ]
}
```

#### N มาก (100+) --> Reference

```javascript
// Author มีหนังสือหลายร้อยเล่ม
// authors: { _id: "a1", name: "Stephen King" }
// books: { title: "It", authorId: "a1" }
// books: { title: "The Shining", authorId: "a1" }
```

### 6. ความสัมพันธ์ N:N (Many-to-Many)

```javascript
// Students <-> Courses
// เก็บ array ของ IDs ไว้ฝั่งใดฝั่งหนึ่ง (หรือทั้งสองฝั่ง)

// students collection
{
  name: "สมชาย",
  courseIds: [ObjectId("c1"), ObjectId("c2")]
}

// courses collection
{
  _id: ObjectId("c1"),
  name: "MongoDB 101",
  studentCount: 25  // denormalized count
}
```

### 7. Denormalization (ข้อมูลซ้ำซ้อนเพื่อความเร็ว)

บางครั้งจงใจเก็บข้อมูลซ้ำเพื่อให้อ่านเร็วขึ้น:

```javascript
// แทนที่จะเก็บแค่ authorId แล้วต้อง $lookup ทุกครั้ง
// เก็บ authorName ด้วยเลย (denormalize)
{
  title: "Clean Code",
  authorId: ObjectId("a1"),
  authorName: "Robert C. Martin"   // ซ้ำกับ authors collection
}
```

**ข้อดี**: อ่านเร็ว ไม่ต้อง JOIN
**ข้อเสีย**: ถ้า author เปลี่ยนชื่อ ต้อง update ทุก book

**กฎ**: Denormalize field ที่ **เปลี่ยนน้อย** แต่ **อ่านบ่อย**

### 8. Schema Design Patterns

#### Subset Pattern
เก็บข้อมูลบางส่วนใน document หลัก ส่วนที่เหลือแยก collection

```javascript
// Product document เก็บเฉพาะ 3 reviews ล่าสุด
{
  name: "iPhone 15 Pro",
  price: 42900,
  recentReviews: [/* 3 reviews ล่าสุด */],
  totalReviews: 500,
  averageRating: 4.5
}

// reviews collection เก็บ reviews ทั้ง 500 อัน
{ productId: ObjectId("..."), user: "...", rating: 5 }
```

#### Computed Pattern
คำนวณค่าไว้ล่วงหน้า ไม่ต้องคำนวณทุกครั้งที่ query

```javascript
// Order เก็บ total ไว้แล้ว ไม่ต้อง aggregate ทุกครั้ง
{
  orderNo: "ORD-001",
  items: [
    { product: "iPhone", quantity: 1, price: 42900 },
    { product: "AirPods", quantity: 2, price: 8990 }
  ],
  itemCount: 2,
  totalQuantity: 3,
  subtotal: 60880,
  total: 55880
}
```

#### Bucket Pattern
จัดกลุ่มข้อมูลที่มีจำนวนมากเป็น "ถัง" ตามช่วงเวลา

```javascript
// แทนที่ 1 reading = 1 document (ล้านๆ documents)
// จัดกลุ่มเป็น 1 ชั่วโมง = 1 document
{
  sensorId: "sensor-001",
  date: new Date("2024-03-15"),
  hour: 14,
  readings: [
    { minute: 0, temp: 25.1 },
    { minute: 5, temp: 25.2 },
    { minute: 10, temp: 25.0 }
  ],
  count: 3,
  avgTemp: 25.1
}
```

### 9. Flowchart: Embed หรือ Reference?

```
ข้อมูลถูกเข้าถึงพร้อม parent เสมอ?
├── ใช่ --> ข้อมูลมีจำนวนน้อย (< 100)?
│           ├── ใช่ --> ✅ Embed
│           └── ไม่ --> ข้อมูลมีขนาดใหญ่?
│                       ├── ใช่ --> 📎 Reference
│                       └── ไม่ --> 🔀 Subset Pattern
└── ไม่ --> ข้อมูลเป็น Many-to-Many?
            ├── ใช่ --> 📎 Reference (array of IDs)
            └── ไม่ --> ข้อมูลเปลี่ยนบ่อย?
                        ├── ใช่ --> 📎 Reference
                        └── ไม่ --> ✅ Embed
```

## แบบฝึกหัด

ไฟล์ `examples.js` มีตัวอย่างพร้อมรัน:

1. ออกแบบ schema สำหรับ **ร้านอาหาร** (menu + categories + reviews)
2. ออกแบบ schema สำหรับ **ระบบจองตั๋วหนัง** (movies + theaters + bookings)
3. ตัดสินใจว่าข้อมูลต่อไปนี้ควร embed หรือ reference:
   - User กับ Login History (เปลี่ยนบ่อย, จำนวนมาก)
   - Product กับ Category (เปลี่ยนน้อย, 1 product = 1 category)
   - Order กับ Items (เข้าถึงพร้อมกัน, จำนวนน้อย)

## สรุป

- **Embed** เมื่อข้อมูลเข้าถึงพร้อมกัน, จำนวนน้อย, ไม่ค่อยเปลี่ยน
- **Reference** เมื่อข้อมูลจำนวนมาก, Many-to-Many, เปลี่ยนบ่อย
- **Denormalization** = จงใจเก็บข้อมูลซ้ำเพื่อให้อ่านเร็วขึ้น
- **Subset Pattern** = เก็บข้อมูลบางส่วนใน document, ที่เหลือแยก collection
- **Computed Pattern** = คำนวณค่าไว้ล่วงหน้า
- **Bucket Pattern** = จัดกลุ่มข้อมูลมหาศาลเป็น "ถัง" ตามช่วงเวลา
- ไม่มี schema ที่ "ถูกต้องที่สุด" -- ขึ้นอยู่กับ **วิธีที่แอปเข้าถึงข้อมูล**

## ต่อไป

[Lab 07 -- Indexing -->](../lab-07-indexing/)
