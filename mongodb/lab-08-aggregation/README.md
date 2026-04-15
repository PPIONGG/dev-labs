# Lab 08 — Aggregation Pipeline: วิเคราะห์ข้อมูลด้วย MongoDB

## เป้าหมาย

เข้าใจ Aggregation Pipeline ของ MongoDB ใช้ `$match`, `$group`, `$sort`, `$project`, `$lookup`, `$unwind`, `$facet` ได้ และนำไปวิเคราะห์ข้อมูลจริงได้

## ทำไมต้องรู้?

Aggregation Pipeline คือหัวใจของ MongoDB สำหรับ **วิเคราะห์ข้อมูล** — เปรียบได้กับ `GROUP BY`, `JOIN`, `HAVING` ใน SQL แต่ทรงพลังกว่ามาก:

- **รายงานยอดขายรายเดือน** — `$group` + `$sort`
- **สินค้าขายดี Top 10** — `$group` + `$sort` + `$limit`
- **JOIN ข้าม collection** — `$lookup`
- **วิเคราะห์หลายมิติพร้อมกัน** — `$facet`

ถ้าไม่รู้ Aggregation → วิเคราะห์ข้อมูลได้แค่ใน application code ซึ่งช้าและไม่ scale

## สิ่งที่ต้องมีก่อน

- [Lab 07](../lab-07-indexing/) — เข้าใจ Indexing
- Docker ติดตั้งแล้ว
- รู้จัก JavaScript เบื้องต้น

## เนื้อหา

### 1. Aggregation Pipeline คืออะไร?

Pipeline คือ **ชุดของ stage** ที่ประมวลผล document ทีละขั้น — output ของ stage หนึ่งเป็น input ของ stage ถัดไป:

```
Collection → [$match] → [$group] → [$sort] → [$limit] → Result
```

```javascript
db.collection.aggregate([
  { $match: { ... } },    // Stage 1: กรองข้อมูล
  { $group: { ... } },    // Stage 2: จัดกลุ่ม
  { $sort: { ... } },     // Stage 3: เรียงลำดับ
  { $limit: 10 }          // Stage 4: จำกัดผลลัพธ์
])
```

### 2. Stage ที่ใช้บ่อย

| Stage | หน้าที่ | SQL เทียบเท่า |
|-------|---------|--------------|
| `$match` | กรองข้อมูล | `WHERE` |
| `$group` | จัดกลุ่ม + aggregate | `GROUP BY` |
| `$sort` | เรียงลำดับ | `ORDER BY` |
| `$limit` | จำกัดจำนวน | `LIMIT` |
| `$skip` | ข้ามไป N รายการ | `OFFSET` |
| `$project` | เลือก/แปลง field | `SELECT` |
| `$lookup` | join collection | `JOIN` |
| `$unwind` | แตก array ออกเป็น documents | — |
| `$addFields` | เพิ่ม/แก้ไข field | computed column |
| `$count` | นับจำนวน | `COUNT(*)` |
| `$facet` | หลาย pipeline พร้อมกัน | — |

### 3. $group — จัดกลุ่มข้อมูล

```javascript
// ยอดขายรวมแต่ละหมวดสินค้า
db.sales.aggregate([
  {
    $group: {
      _id: "$category",          // groupBy field
      totalRevenue: { $sum: "$total" },
      avgOrder: { $avg: "$total" },
      orderCount: { $sum: 1 },
      maxOrder: { $max: "$total" },
      minOrder: { $min: "$total" }
    }
  },
  { $sort: { totalRevenue: -1 } }
])
```

Accumulator operators ที่ใช้ใน `$group`:
- `$sum` — รวม
- `$avg` — ค่าเฉลี่ย
- `$min` / `$max` — ต่ำสุด/สูงสุด
- `$count` — นับ (MongoDB 5.0+)
- `$push` — รวม values เป็น array
- `$addToSet` — รวม unique values เป็น array
- `$first` / `$last` — ค่าแรก/สุดท้าย

### 4. $project — เลือกและแปลง Field

```javascript
db.sales.aggregate([
  {
    $project: {
      _id: 0,                              // ซ่อน _id
      productName: "$product",            // rename field
      category: 1,                         // แสดง field
      total: 1,
      month: { $month: "$date" },          // แปลง date เป็น month
      year: { $year: "$date" },
      // คำนวณ field ใหม่
      vat: { $multiply: ["$total", 0.07] },
      profit: { $multiply: ["$total", 0.3] }
    }
  }
])
```

### 5. $lookup — JOIN ข้าม Collection

```javascript
// JOIN orders กับ customers
db.orders.aggregate([
  {
    $lookup: {
      from: "customers",          // collection ที่ join
      localField: "customerId",   // field ใน orders
      foreignField: "_id",        // field ใน customers
      as: "customer"              // ชื่อ field ที่ได้
    }
  },
  { $unwind: "$customer" },       // แตก array ออก (ถ้า 1-to-1)
  {
    $project: {
      orderId: "$_id",
      customerName: "$customer.name",
      total: 1
    }
  }
])
```

### 6. $unwind — แตก Array

```javascript
// document มี tags เป็น array
// { name: "iPhone", tags: ["mobile", "apple", "5G"] }

db.products.aggregate([
  { $unwind: "$tags" },  // แตกเป็น 3 documents แยก
  { $group: { _id: "$tags", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
// ผล: นับว่า tag ไหนถูกใช้กี่ครั้ง
```

### 7. $facet — หลาย Pipeline พร้อมกัน

```javascript
// ดึง stats หลายอย่างใน query เดียว
db.sales.aggregate([
  { $match: { date: { $gte: new Date("2024-01-01") } } },
  {
    $facet: {
      // pipeline 1: Top categories
      byCategory: [
        { $group: { _id: "$category", total: { $sum: "$total" } } },
        { $sort: { total: -1 } },
        { $limit: 5 }
      ],
      // pipeline 2: Monthly trend
      byMonth: [
        { $group: {
          _id: { $month: "$date" },
          revenue: { $sum: "$total" }
        }},
        { $sort: { _id: 1 } }
      ],
      // pipeline 3: Summary stats
      summary: [
        { $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          orderCount: { $sum: 1 },
          avgOrder: { $avg: "$total" }
        }}
      ]
    }
  }
])
```

### 8. Aggregation Expression Operators

```javascript
// Arithmetic
{ $add: ["$price", "$tax"] }
{ $subtract: ["$total", "$discount"] }
{ $multiply: ["$price", "$quantity"] }
{ $divide: ["$total", "$count"] }
{ $mod: ["$total", 100] }
{ $round: ["$price", 2] }

// String
{ $concat: ["$firstName", " ", "$lastName"] }
{ $toUpper: "$category" }
{ $toLower: "$email" }
{ $substr: ["$name", 0, 5] }

// Date
{ $year: "$createdAt" }
{ $month: "$createdAt" }
{ $dayOfMonth: "$createdAt" }
{ $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }

// Conditional
{ $cond: { if: { $gt: ["$total", 10000] }, then: "high", else: "low" } }
{ $ifNull: ["$discount", 0] }
{ $switch: {
  branches: [
    { case: { $gt: ["$score", 90] }, then: "A" },
    { case: { $gt: ["$score", 80] }, then: "B" }
  ],
  default: "C"
}}
```

## การเตรียม Environment

```bash
# เริ่ม MongoDB
cd lab-08-aggregation
docker compose up -d

# สร้างข้อมูลตัวอย่าง
docker compose exec mongo mongosh --file /scripts/init.js

# เปิด mongosh
docker compose exec mongo mongosh
```

## แบบฝึกหัด

รันแบบฝึกหัดใน mongosh:

```bash
docker compose exec mongo mongosh --file /scripts/exercises.js
```

หรือ copy-paste ทีละ exercise เพื่อดูผล

## ทำความเข้าใจ Data

Lab นี้ใช้ collection `sales` ใน database `learn_mongo` ที่มีข้อมูล:
- **sales** — รายการขาย (product, category, quantity, total, date, store)
- **customers_agg** — ข้อมูลลูกค้า
- **products_agg** — ข้อมูลสินค้า

## สิ่งที่ต้องทำได้หลังจบ Lab

- [ ] ใช้ `$group` กับ accumulator operators ได้
- [ ] ใช้ `$project` เลือก/แปลง field ได้
- [ ] ใช้ `$lookup` JOIN ข้าม collection ได้
- [ ] ใช้ `$unwind` แตก array ได้
- [ ] ใช้ `$facet` ดึงข้อมูลหลายมิติพร้อมกันได้
- [ ] เข้าใจ Expression Operators พื้นฐาน
- [ ] ออกแบบ pipeline วิเคราะห์ข้อมูลได้

## ต่อไป

[Lab 09 →](../lab-09-project-social-media/) — **Project: Social Media API** (รวม Level 2 ทั้งหมด)
