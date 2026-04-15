# Lab 07 -- Indexing & Performance

## เป้าหมาย

เรียนรู้วิธีสร้าง index เพื่อทำให้ query เร็วขึ้น, ใช้ explain() วิเคราะห์ query plan, และเลือกประเภท index ที่เหมาะสม

## ทำไมต้องรู้?

ถ้าไม่มี index MongoDB ต้อง **scan ทุก document** ในการค้นหา (COLLSCAN):
- 100 documents --> เร็วมาก ไม่มีปัญหา
- 10,000 documents --> เริ่มช้า
- 1,000,000 documents --> ช้ามาก!

Index ทำให้ MongoDB **ค้นหาได้เร็ว** โดยไม่ต้อง scan ทุก document -- เหมือนสารบัญหนังสือ

## สิ่งที่ต้องมีก่อน

- [Lab 04](../lab-04-query-operators/) -- ใช้ query operators ได้

## เริ่มต้น

```bash
# รัน MongoDB พร้อมข้อมูล 10,000 documents
docker compose up -d

# เข้า mongosh
docker exec -it lab-07-indexing-mongo-1 mongosh -u admin -p secret

# เลือก database
use learn_mongo

# ตรวจว่ามีข้อมูล
db.customers.countDocuments()
// 10000
```

## เนื้อหา

### 1. Index คืออะไร?

Index คือ **โครงสร้างข้อมูลพิเศษ** ที่ MongoDB สร้างเพิ่มเติม เพื่อค้นหาได้เร็วขึ้น

```
ไม่มี Index (COLLSCAN):        มี Index (IXSCAN):
+---+---+---+---+---+          +---+
| 1 | 2 | 3 | 4 | 5 |         | B |
+---+---+---+---+---+         / | \
| 6 | 7 | 8 | 9 |10 |       /  |  \
+---+---+---+---+---+      A   B   C
| scan ทุก document |       |   |   |
| เพื่อหาที่ต้องการ   |      doc doc doc
+---+---+---+---+---+      (ไปตรงที่ต้องการเลย)
```

### 2. explain() -- ดู Query Plan

```javascript
// ดูว่า MongoDB ทำอะไรกับ query นี้
db.customers.find({ city: "กรุงเทพ" }).explain()

// ดูพร้อมสถิติการ execute
db.customers.find({ city: "กรุงเทพ" }).explain("executionStats")
```

**สิ่งที่ต้องดูใน explain:**

| Field | ความหมาย | ค่าที่ดี |
|-------|---------|---------|
| `winningPlan.stage` | วิธีค้นหา | `IXSCAN` (ใช้ index) |
| `totalDocsExamined` | จำนวน documents ที่ scan | ยิ่งน้อยยิ่งดี |
| `totalKeysExamined` | จำนวน index keys ที่ scan | ใกล้เคียง nReturned |
| `nReturned` | จำนวน results | - |
| `executionTimeMillis` | เวลาที่ใช้ (ms) | ยิ่งน้อยยิ่งดี |

```javascript
// ตัวอย่าง: ก่อนสร้าง index
// stage: COLLSCAN, totalDocsExamined: 10000

// ตัวอย่าง: หลังสร้าง index
// stage: IXSCAN, totalDocsExamined: 650 (เฉพาะที่ตรง)
```

### 3. Single Field Index

```javascript
// สร้าง index บน field เดียว
db.customers.createIndex({ city: 1 })    // 1 = ascending
db.customers.createIndex({ score: -1 })  // -1 = descending

// สร้าง unique index (ค่าห้ามซ้ำ)
db.customers.createIndex({ email: 1 }, { unique: true })

// ทดสอบ -- ก่อน vs หลัง index
// ก่อน: COLLSCAN, docsExamined: 10000, time: 15ms
// หลัง: IXSCAN,   docsExamined: 650,   time: 2ms
```

### 4. Compound Index

Index ที่ประกอบด้วย **หลาย fields** -- ลำดับสำคัญ!

```javascript
// สร้าง compound index: city + plan
db.customers.createIndex({ city: 1, plan: 1 })

// Query ที่ใช้ compound index ได้:
db.customers.find({ city: "กรุงเทพ" })                    // ใช้ได้ (prefix)
db.customers.find({ city: "กรุงเทพ", plan: "premium" })   // ใช้ได้ (ทั้ง 2 fields)

// Query ที่ใช้ไม่ได้:
db.customers.find({ plan: "premium" })   // ใช้ไม่ได้! (ข้าม city)
```

**กฎ Prefix**: Compound index ใช้ได้เฉพาะเมื่อ query มี **prefix** ของ index fields

```
Index: { city: 1, plan: 1, age: 1 }

ใช้ได้:
  { city: "กรุงเทพ" }                          -- prefix: city
  { city: "กรุงเทพ", plan: "premium" }         -- prefix: city, plan
  { city: "กรุงเทพ", plan: "premium", age: 25 } -- ครบทุก field

ใช้ไม่ได้:
  { plan: "premium" }                           -- ข้าม city
  { age: 25 }                                   -- ข้าม city, plan
  { plan: "premium", age: 25 }                  -- ข้าม city
```

### 5. Compound Index กับ Sort

```javascript
// สร้าง index สำหรับ query + sort
db.customers.createIndex({ city: 1, totalSpent: -1 })

// query ตาม city แล้ว sort ตาม totalSpent (มาก -> น้อย)
db.customers
  .find({ city: "กรุงเทพ" })
  .sort({ totalSpent: -1 })
  .limit(10)
// ใช้ index ทั้ง filter และ sort -- เร็วมาก!
```

### 6. Multikey Index (Array)

MongoDB สร้าง index ให้ **สมาชิกทุกตัว** ใน array อัตโนมัติ

```javascript
// สร้าง index บน field tags (array)
db.customers.createIndex({ tags: 1 })

// ค้นหาลูกค้าที่มี tag "vip"
db.customers.find({ tags: "vip" })
// ใช้ IXSCAN แทน COLLSCAN
```

### 7. Text Index

```javascript
// สร้าง text index สำหรับค้นหาข้อความ
db.customers.createIndex({ name: "text" })

// ค้นหาด้วย $text
db.customers.find({ $text: { $search: "สมชาย" } })

// ค้นหาหลายคำ (OR)
db.customers.find({ $text: { $search: "สมชาย มานี" } })

// ค้นหาวลี (exact phrase)
db.customers.find({ $text: { $search: '"สมชาย ใจดี"' } })
```

**ข้อจำกัด**: collection หนึ่งมีได้ **แค่ 1 text index**

### 8. ดูและลบ Index

```javascript
// ดู indexes ทั้งหมด
db.customers.getIndexes()

// ลบ index ด้วย field spec
db.customers.dropIndex({ city: 1 })

// ลบ index ด้วยชื่อ
db.customers.dropIndex("city_1")

// ลบ indexes ทั้งหมด (ยกเว้น _id)
db.customers.dropIndexes()
```

### 9. Index Strategies

#### ควรสร้าง index เมื่อ:
- Field ถูกใช้ใน **filter** (`find({ field: ... })`) บ่อย
- Field ถูกใช้ใน **sort** บ่อย
- Field มี **ค่าหลากหลาย** (high cardinality) -- เช่น email, userId

#### ไม่ควรสร้าง index เมื่อ:
- Collection มีข้อมูล **น้อยมาก** (< 100 documents)
- Field มี **ค่าซ้ำมาก** (low cardinality) -- เช่น boolean, gender
- Field ถูก **write บ่อยกว่า read** -- index ทำให้ write ช้าลง

#### ESR Rule (Equality, Sort, Range):
ลำดับ fields ใน compound index ควรเป็น:
1. **Equality** fields ก่อน (`city = "กรุงเทพ"`)
2. **Sort** fields ตามมา (`sort({ score: -1 })`)
3. **Range** fields สุดท้าย (`age > 20, age < 40`)

```javascript
// ตัวอย่าง ESR:
// Query: city = "กรุงเทพ", sort by score, age > 20
db.customers.createIndex({ city: 1, score: -1, age: 1 })
//                         E         S          R
```

### 10. สรุปประเภท Index

| ประเภท | วิธีสร้าง | เหมาะกับ |
|--------|----------|---------|
| Single Field | `{ field: 1 }` | query ตาม field เดียว |
| Compound | `{ a: 1, b: 1 }` | query หลาย fields |
| Multikey | `{ arrayField: 1 }` | query ใน array |
| Text | `{ field: "text" }` | ค้นหาข้อความ |
| Unique | `{ field: 1 }, { unique: true }` | ค่าห้ามซ้ำ |

## แบบฝึกหัด

ไฟล์ `exercises.js` มีแบบฝึกหัดพร้อมเฉลย:

1. ใช้ `explain()` ดู query plan ก่อนสร้าง index
2. สร้าง single field index บน city
3. สร้าง unique index บน email
4. สร้าง compound index: city + plan
5. สร้าง multikey index บน tags
6. สร้าง text index บน name
7. เปรียบเทียบ performance ก่อน-หลัง index

## สรุป

- **Index** = โครงสร้างข้อมูลที่ทำให้ query เร็วขึ้น (IXSCAN แทน COLLSCAN)
- **explain("executionStats")** = ดูว่า query ใช้ index หรือไม่ และ performance เป็นอย่างไร
- **Single Field Index** = index บน 1 field
- **Compound Index** = index บนหลาย fields (ลำดับสำคัญ ต้องใช้ prefix)
- **Multikey Index** = index สำหรับ array fields
- **Text Index** = index สำหรับค้นหาข้อความ
- **ESR Rule**: เรียง compound index เป็น Equality -> Sort -> Range
- Index ทำให้ **read เร็วขึ้น** แต่ **write ช้าลง** -- สร้างเฉพาะที่จำเป็น

## ต่อไป

[Lab 08 -- Aggregation Pipeline -->](../lab-08-aggregation/)
