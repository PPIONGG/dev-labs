# Lab 11 — Change Streams: ติดตามการเปลี่ยนแปลงข้อมูลแบบ Real-time

## เป้าหมาย

เข้าใจ Change Streams คืออะไร ใช้ `watch()` ติดตามการเปลี่ยนแปลงข้อมูลแบบ real-time ใช้ resume token กลับมาดูต่อจากจุดที่หยุดได้

## ทำไมต้องรู้?

ในระบบจริง หลายอย่างต้องตอบสนองทันทีเมื่อข้อมูลเปลี่ยน:

- **Real-time notifications:** แจ้งเตือนเมื่อมี comment ใหม่
- **Audit log:** บันทึกทุกการเปลี่ยนแปลง
- **Data sync:** sync ข้อมูลไปยังระบบอื่น (Elasticsearch, Cache)
- **Dashboard:** อัปเดตข้อมูลแบบ live

Change Streams ทำให้เราทำสิ่งเหล่านี้ได้โดย **ไม่ต้อง poll** (ถามซ้ำๆ ว่ามีอะไรเปลี่ยนไหม)

```
Polling (แบบเก่า):                  Change Streams (แบบใหม่):
┌──────────┐                        ┌──────────┐
│   App    │ ──→ มีอะไรใหม่ไหม?      │   App    │
│          │ ←── ไม่มี               │          │ ←── มีข้อมูลใหม่!
│          │ ──→ มีอะไรใหม่ไหม?      │          │ ←── มีการ update!
│          │ ←── ไม่มี               │          │     (แจ้งเมื่อมีจริง)
│          │ ──→ มีอะไรใหม่ไหม?      └──────────┘
│          │ ←── มี! (ช้าไป)
└──────────┘
```

## สิ่งที่ต้องมีก่อน

- [Lab 10](../lab-10-transactions/) — เข้าใจ Replica Set
- Node.js พื้นฐาน

## โครงสร้างโปรเจค

```
lab-11-change-streams/
├── docker-compose.yml
├── watcher.js        ← script ที่ watch การเปลี่ยนแปลง
└── writer.js         ← script ที่สร้าง/แก้ไข/ลบข้อมูล
```

## เนื้อหา

### 1. Change Streams คืออะไร?

Change Stream คือ **ท่อ (stream)** ที่ส่ง event มาทุกครั้งที่ข้อมูลเปลี่ยน:

```
MongoDB Collection
┌────────────────────────────────────┐
│  insert → { operationType: "insert", fullDocument: {...} }
│  update → { operationType: "update", updateDescription: {...} }
│  delete → { operationType: "delete", documentKey: {...} }
│  replace → { operationType: "replace", fullDocument: {...} }
└────────────────────────────────────┘
         │
         ▼
    Change Stream (watcher)
```

**ต้องใช้ Replica Set** เหมือน transactions

### 2. Change Event Types

| Event Type | เมื่อไหร่ | ข้อมูลที่ได้ |
|------------|----------|-------------|
| `insert` | เพิ่ม document ใหม่ | `fullDocument` |
| `update` | แก้ไข document | `updateDescription` (fields ที่เปลี่ยน) |
| `replace` | replace ทั้ง document | `fullDocument` ใหม่ |
| `delete` | ลบ document | `documentKey` (_id ที่ลบ) |

### 3. วิธีใช้งาน

```bash
# เริ่ม MongoDB replica set
docker compose up -d

# รอจน replica set พร้อม
docker compose logs -f mongo
# รอเห็น "replica set initialized"

# Terminal 1: รัน watcher (เปิดค้างไว้)
docker compose exec mongo mongosh --file /scripts/watcher.js

# Terminal 2: รัน writer (อีก terminal)
docker compose exec mongo mongosh --file /scripts/writer.js
```

**สำคัญ:** ต้องรัน watcher ก่อน แล้วค่อยรัน writer ใน terminal อื่น

### 4. watch() พื้นฐาน

```javascript
const changeStream = db.collection('messages').watch();

changeStream.on('change', (change) => {
  console.log('Change detected:', change.operationType);
  console.log('Document:', change.fullDocument);
});
```

### 5. Filtering Changes (Pipeline)

```javascript
// ดูเฉพาะ insert events
const pipeline = [
  { $match: { operationType: "insert" } }
];
const changeStream = db.collection('messages').watch(pipeline);

// ดูเฉพาะ update ที่แก้ field "status"
const pipeline2 = [
  { $match: {
    operationType: "update",
    "updateDescription.updatedFields.status": { $exists: true }
  }}
];

// ดูเฉพาะ document ที่มี priority = "high"
const pipeline3 = [
  { $match: {
    "fullDocument.priority": "high"
  }}
];
```

### 6. Resume Token

Resume Token ช่วยให้กลับมา watch ต่อจากจุดที่หยุดได้:

```javascript
let lastResumeToken = null;

const changeStream = db.collection('messages').watch();

changeStream.on('change', (change) => {
  // เก็บ resume token
  lastResumeToken = change._id;
  console.log('Processing:', change.operationType);
});

// เมื่อต้องการกลับมาดูต่อ
const resumedStream = db.collection('messages').watch([], {
  resumeAfter: lastResumeToken
});
```

### 7. ตัวอย่าง Use Cases

**Audit Log:**
```javascript
const auditStream = db.collection('users').watch();

auditStream.on('change', async (change) => {
  await db.collection('audit_log').insertOne({
    collection: 'users',
    operation: change.operationType,
    documentId: change.documentKey._id,
    timestamp: new Date(),
    changes: change.updateDescription || null
  });
});
```

**Real-time Notification:**
```javascript
const notifStream = db.collection('orders').watch([
  { $match: { operationType: "insert" } }
]);

notifStream.on('change', (change) => {
  const order = change.fullDocument;
  sendNotification(order.userId, `คำสั่งซื้อ #${order._id} ถูกสร้างแล้ว`);
});
```

## แบบฝึกหัด

- [ ] รัน `docker compose up -d` และรอ replica set พร้อม
- [ ] เปิด 2 terminals: terminal 1 รัน watcher, terminal 2 รัน writer
- [ ] สังเกต event types ต่างๆ (insert, update, delete)
- [ ] ลองแก้ watcher.js ให้ filter เฉพาะ insert events
- [ ] ลองเพิ่ม audit log: เมื่อมีการเปลี่ยนแปลง ให้บันทึกลง collection `audit_log`
- [ ] ลองเพิ่ม resume token: บันทึก token แล้วเมื่อ restart watcher ให้ดูต่อจากจุดเดิม

## สรุป

- **Change Streams** ช่วยติดตามการเปลี่ยนแปลงแบบ real-time
- ใช้ `watch()` เพื่อเปิด change stream
- รองรับ events: **insert, update, delete, replace**
- ใช้ **pipeline** เพื่อ filter events ที่สนใจ
- ใช้ **resume token** เพื่อกลับมาดูต่อจากจุดที่หยุด
- ต้องใช้ **replica set**

## ต่อไป

- [Lab 12 — Schema Validation](../lab-12-schema-validation/)
