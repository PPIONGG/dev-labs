# Lab 13 — Performance: วิเคราะห์และปรับปรุงประสิทธิภาพ

## เป้าหมาย

เข้าใจการใช้ `explain()` อ่าน query plan ระบุ slow queries สร้าง covered queries ใช้ profiler ติดตาม performance ได้

## ทำไมต้องรู้?

เมื่อข้อมูลมีหลายแสนหรือล้าน documents:

- **Query ที่ช้า** → user รอนาน → ระบบใช้งานไม่ได้
- **ไม่มี index ที่เหมาะสม** → MongoDB ต้อง scan ทุก document
- **ไม่รู้จัก explain()** → ไม่รู้ว่า query ช้าเพราะอะไร

```
ข้อมูล 100,000 documents:

ไม่มี Index:
  find({ status: "active" })
  → COLLSCAN (scan ทุก doc) → 100ms+

มี Index:
  find({ status: "active" })
  → IXSCAN (ใช้ index) → 1ms
```

## สิ่งที่ต้องมีก่อน

- [Lab 12](../lab-12-schema-validation/) — Schema Validation
- เข้าใจ Index พื้นฐาน

## เนื้อหา

### 1. explain() — อ่าน Query Plan

explain() มี 3 modes:

| Mode | คำอธิบาย | ข้อมูลที่ได้ |
|------|----------|-------------|
| `"queryPlanner"` | แสดง plan ที่เลือก | winning plan |
| `"executionStats"` | รัน query จริง + สถิติ | เวลา, docs scanned |
| `"allPlansExecution"` | แสดงทุก plan + สถิติ | เปรียบเทียบ plans |

```javascript
// queryPlanner (default)
db.orders.find({ status: "completed" }).explain("queryPlanner");

// executionStats (ใช้บ่อยสุด)
db.orders.find({ status: "completed" }).explain("executionStats");

// allPlansExecution
db.orders.find({ status: "completed" }).explain("allPlansExecution");
```

### 2. อ่าน explain output

```javascript
// ผลจาก explain("executionStats")
{
  executionStats: {
    executionSuccess: true,
    nReturned: 500,           // จำนวน docs ที่ return
    executionTimeMillis: 85,  // เวลาทั้งหมด (ms)
    totalKeysExamined: 0,     // จำนวน index keys ที่ตรวจ
    totalDocsExamined: 100000,// จำนวน docs ที่ scan ← ถ้าสูง = ช้า!
    executionStages: {
      stage: "COLLSCAN",     // ← COLLSCAN = ไม่ใช้ index = ช้า!
      // ...
    }
  }
}
```

**สิ่งที่ต้องดู:**

```
ดี (ใช้ Index):
  stage: "IXSCAN"
  totalDocsExamined ≈ nReturned    ← scan เท่าที่ return

ไม่ดี (ไม่ใช้ Index):
  stage: "COLLSCAN"
  totalDocsExamined >> nReturned   ← scan ทุก doc เพื่อหาไม่กี่ doc
```

### 3. Covered Queries

Covered query = query ที่ตอบได้จาก index โดยไม่ต้องอ่าน document เลย:

```javascript
// สร้าง compound index
db.orders.createIndex({ status: 1, total: 1 });

// Covered query — projection ใช้แค่ field ที่อยู่ใน index
db.orders.find(
  { status: "completed" },
  { _id: 0, status: 1, total: 1 }  // เฉพาะ field ใน index
).explain("executionStats");

// ผล: totalDocsExamined = 0  ← ไม่ต้องอ่าน document เลย!
```

### 4. Query Optimization Techniques

```javascript
// 1. ใช้ projection — ดึงเฉพาะ field ที่ต้องการ
db.orders.find({ status: "active" }, { total: 1, createdAt: 1 });

// 2. ใช้ limit — จำกัดผลลัพธ์
db.orders.find({ status: "active" }).limit(10);

// 3. ใช้ hint — บังคับใช้ index ที่ต้องการ
db.orders.find({ status: "active" }).hint({ status: 1, createdAt: -1 });

// 4. Compound index ที่มีลำดับถูกต้อง (ESR Rule)
// E = Equality, S = Sort, R = Range
db.orders.createIndex({ status: 1, createdAt: -1, total: 1 });
//                      ^^^^^^^^   ^^^^^^^^^^^^^   ^^^^^^^^^
//                      Equality   Sort            Range

// 5. หลีกเลี่ยง $regex ที่ไม่ขึ้นต้นด้วยค่าคงที่
db.orders.find({ name: /^Som/ });    // ดี — ใช้ index ได้
db.orders.find({ name: /som/i });    // ไม่ดี — ใช้ index ไม่ได้
```

### 5. Database Profiler

```javascript
// เปิด profiler — level 2 = log ทุก query
db.setProfilingLevel(2);

// เปิด profiler — level 1 = log เฉพาะ slow queries (> threshold ms)
db.setProfilingLevel(1, { slowms: 100 });

// ปิด profiler
db.setProfilingLevel(0);

// ดู profiler status
db.getProfilingStatus();

// ดู slow queries
db.system.profile.find().sort({ ts: -1 }).limit(5).pretty();

// ดูเฉพาะ query ที่ช้ากว่า 50ms
db.system.profile.find(
  { millis: { $gt: 50 } }
).sort({ millis: -1 });
```

### 6. currentOp() และ Collection Stats

```javascript
// ดู operations ที่กำลังรันอยู่
db.currentOp();

// ดูเฉพาะ query ที่รันนานกว่า 1 วินาที
db.currentOp({
  "active": true,
  "secs_running": { "$gt": 1 }
});

// ดูสถิติ collection
db.orders.stats();

// ข้อมูลที่สำคัญ:
// - count: จำนวน documents
// - size: ขนาดข้อมูล (bytes)
// - avgObjSize: ขนาดเฉลี่ยต่อ document
// - totalIndexSize: ขนาด indexes ทั้งหมด
// - indexSizes: ขนาดแต่ละ index
```

### 7. เริ่มลองทำ

```bash
docker compose up -d

# สร้าง dataset ใหญ่ (100,000+ docs)
docker compose exec mongo mongosh --file /scripts/init.js

# รัน exercises
docker compose exec mongo mongosh --file /scripts/exercises.js
```

## แบบฝึกหัด

- [ ] รัน init.js แล้วรอจน insert ข้อมูลเสร็จ
- [ ] รัน exercises.js แล้วเปรียบเทียบ explain output ก่อนและหลังสร้าง index
- [ ] ลองสร้าง compound index สำหรับ query ที่มีทั้ง filter + sort
- [ ] ลองทำ covered query ที่ totalDocsExamined = 0
- [ ] เปิด profiler แล้วรัน query ต่างๆ จากนั้นดู system.profile
- [ ] ลองใช้ hint() เพื่อบังคับให้ MongoDB ใช้ index ที่ต้องการ
- [ ] ดู db.orders.stats() แล้ววิเคราะห์ขนาด collection และ indexes

## สรุป

- **explain()** เป็นเครื่องมือสำคัญสุดสำหรับ performance tuning
- ดู **stage** (COLLSCAN vs IXSCAN) และ **totalDocsExamined vs nReturned**
- **Covered query** = ไม่ต้องอ่าน document เลย (เร็วมาก)
- **ESR Rule** = Equality, Sort, Range สำหรับลำดับ compound index
- **Profiler** ช่วยหา slow queries ในระบบจริง
- **currentOp()** ดู operations ที่กำลังรัน
- **stats()** ดูขนาด collection และ indexes

## ต่อไป

- [Lab 14 — Backup & Replication](../lab-14-backup-and-replication/)
