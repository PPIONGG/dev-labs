# Lab 14 — Backup, Restore & Replication: สำรองข้อมูลและ Replica Set

## เป้าหมาย

เข้าใจ mongodump/mongorestore, mongoexport/mongoimport, Replica Set concepts, rs.status(), read preference, automatic failover

## ทำไมต้องรู้?

ในระบบ production:

- **ข้อมูลหาย = หายนะ** → ต้องมี backup strategy
- **Server ล่ม = ระบบหยุด** → ต้องมี replica set (high availability)
- **ต้องย้ายข้อมูล** → ต้องรู้ export/import tools

```
Backup Strategy:
┌─────────────────────────────────────────┐
│  mongodump      → binary backup (เร็ว)   │
│  mongoexport    → JSON/CSV (อ่านได้)     │
│  Replica Set    → real-time backup       │
│  Snapshot       → disk-level backup      │
└─────────────────────────────────────────┘

Replica Set (High Availability):
┌──────────┐
│ Primary  │ ← รับ read/write
└────┬─────┘
     │ replicate
  ┌──┴───┐
  ▼      ▼
┌────┐ ┌────┐
│Sec1│ │Sec2│ ← สำเนา (read only)
└────┘ └────┘

Primary ล่ม? → Secondary ขึ้นเป็น Primary อัตโนมัติ!
```

## สิ่งที่ต้องมีก่อน

- [Lab 13](../lab-13-performance/) — Performance
- เข้าใจ Docker Compose

## เนื้อหา

### 1. Backup Tools เปรียบเทียบ

| เครื่องมือ | Format | ใช้เมื่อ | ข้อดี | ข้อเสีย |
|-----------|--------|---------|------|---------|
| `mongodump` | BSON (binary) | Full backup | เร็ว, รักษา types | อ่านไม่ได้ |
| `mongoexport` | JSON/CSV | แชร์ข้อมูล | อ่านได้, แปลงง่าย | ช้ากว่า, อาจเสีย types |
| Replica Set | Real-time | High availability | automatic failover | ใช้ resources มากขึ้น |

### 2. mongodump & mongorestore

```bash
# Backup ทั้ง database
docker compose exec mongo1 mongodump \
  --host localhost:27017 \
  --db mydb \
  --out /backup/

# Backup เฉพาะ collection
docker compose exec mongo1 mongodump \
  --host localhost:27017 \
  --db mydb \
  --collection users \
  --out /backup/

# Restore
docker compose exec mongo1 mongorestore \
  --host localhost:27017 \
  --db mydb \
  /backup/mydb/

# Restore เฉพาะ collection
docker compose exec mongo1 mongorestore \
  --host localhost:27017 \
  --db mydb \
  --collection users \
  /backup/mydb/users.bson

# Restore แบบ drop collection เดิมก่อน
docker compose exec mongo1 mongorestore \
  --host localhost:27017 \
  --db mydb \
  --drop \
  /backup/mydb/
```

### 3. mongoexport & mongoimport

```bash
# Export เป็น JSON
docker compose exec mongo1 mongoexport \
  --host localhost:27017 \
  --db mydb \
  --collection users \
  --out /backup/users.json

# Export เป็น CSV
docker compose exec mongo1 mongoexport \
  --host localhost:27017 \
  --db mydb \
  --collection users \
  --type=csv \
  --fields="name,email,age" \
  --out /backup/users.csv

# Export ด้วย query
docker compose exec mongo1 mongoexport \
  --host localhost:27017 \
  --db mydb \
  --collection users \
  --query='{"role": "admin"}' \
  --out /backup/admins.json

# Import จาก JSON
docker compose exec mongo1 mongoimport \
  --host localhost:27017 \
  --db mydb \
  --collection users \
  --file /backup/users.json

# Import จาก CSV
docker compose exec mongo1 mongoimport \
  --host localhost:27017 \
  --db mydb \
  --collection users \
  --type=csv \
  --headerline \
  --file /backup/users.csv
```

### 4. Replica Set Concepts

```
Replica Set Architecture:
┌───────────────────────────────────────────┐
│                                           │
│  ┌──────────┐   replication   ┌────────┐  │
│  │ Primary  │ ──────────────→ │ Sec #1 │  │
│  │          │                 └────────┘  │
│  │  Read ✓  │                             │
│  │  Write ✓ │   replication   ┌────────┐  │
│  │          │ ──────────────→ │ Sec #2 │  │
│  └──────────┘                 └────────┘  │
│                                           │
│  Election: ถ้า Primary ล่ม                  │
│  Secondary จะ vote เลือก Primary ใหม่       │
│                                           │
│  Arbiter: ไม่เก็บข้อมูล แค่ช่วย vote        │
│  (ใช้เมื่อมี 2 nodes เพื่อให้เป็นเลขคี่)      │
└───────────────────────────────────────────┘
```

**Members:**
- **Primary:** รับ write ทั้งหมด, อ่านได้ (default)
- **Secondary:** สำเนาข้อมูลจาก primary, อ่านได้ (ถ้าตั้งค่า)
- **Arbiter:** ไม่เก็บข้อมูล, ช่วย vote เลือก primary

### 5. rs.status() — ดูสถานะ Replica Set

```bash
# เข้า mongosh ที่ primary
docker compose exec mongo1 mongosh

# ดูสถานะ
rs.status()
```

```javascript
// ข้อมูลสำคัญใน rs.status()
{
  set: "rs0",                    // ชื่อ replica set
  members: [
    {
      _id: 0,
      name: "mongo1:27017",
      stateStr: "PRIMARY",      // ← Primary
      health: 1,                // 1 = healthy
      uptime: 3600
    },
    {
      _id: 1,
      name: "mongo2:27017",
      stateStr: "SECONDARY",    // ← Secondary
      health: 1,
      syncSourceHost: "mongo1:27017"  // sync จาก primary
    },
    {
      _id: 2,
      name: "mongo3:27017",
      stateStr: "SECONDARY",    // ← Secondary
      health: 1
    }
  ]
}
```

### 6. Read Preference

กำหนดว่าจะอ่านข้อมูลจากไหน:

| Read Preference | อ่านจาก | ใช้เมื่อ |
|----------------|---------|---------|
| `primary` | Primary เท่านั้น | ต้องการข้อมูลล่าสุดเสมอ (default) |
| `primaryPreferred` | Primary (ถ้ามี), ไม่งั้น Secondary | ต้องการล่าสุด แต่ยอมรับ stale ได้ |
| `secondary` | Secondary เท่านั้น | ลด load จาก primary |
| `secondaryPreferred` | Secondary (ถ้ามี), ไม่งั้น Primary | ลด load + fallback |
| `nearest` | Node ที่ใกล้สุด (latency) | ต้องการ response เร็วที่สุด |

```javascript
// ใน mongosh
db.getMongo().setReadPref("secondaryPreferred");

// ใน Node.js driver
const client = new MongoClient(uri, {
  readPreference: "secondaryPreferred"
});
```

### 7. Automatic Failover

```
Failover Process:
┌──────────┐
│ Primary  │ ← ล่ม!
│  (DOWN)  │
└──────────┘

     ↓ heartbeat timeout (10 วินาที)

┌────────┐    vote    ┌────────┐
│ Sec #1 │ ←────────→ │ Sec #2 │
│        │            │        │
│ ชนะ! ✓  │            │ แพ้    │
└────────┘            └────────┘

     ↓ election

┌──────────┐          ┌────────┐
│ PRIMARY  │ ← ใหม่!  │ Sec #2 │
│ (Sec #1) │          │        │
└──────────┘          └────────┘
```

### 8. ทดลองใช้งาน

```bash
# เริ่ม 3-node replica set
docker compose up -d

# รอ replica set พร้อม
docker compose logs -f mongo1
# รอเห็น "replica set initialized"

# ดูสถานะ
docker compose exec mongo1 mongosh --eval "rs.status().members.forEach(m => print(m.name + ' → ' + m.stateStr))"

# ทดลอง backup
docker compose exec mongo1 mongosh --eval '
  db = db.getSiblingDB("backup_test");
  db.users.insertMany([
    { name: "Alice", email: "alice@example.com" },
    { name: "Bob", email: "bob@example.com" },
    { name: "Charlie", email: "charlie@example.com" }
  ]);
  print("Inserted " + db.users.countDocuments() + " users");
'

# mongodump
docker compose exec mongo1 mongodump --db backup_test --out /tmp/backup/
docker compose exec mongo1 ls /tmp/backup/backup_test/

# mongoexport
docker compose exec mongo1 mongoexport --db backup_test --collection users --out /tmp/users.json
docker compose exec mongo1 cat /tmp/users.json

# ทดลอง failover — หยุด primary
docker compose stop mongo1

# ดูสถานะ (จาก node อื่น)
docker compose exec mongo2 mongosh --eval "rs.status().members.forEach(m => print(m.name + ' → ' + m.stateStr))"

# กลับมา
docker compose start mongo1
```

## แบบฝึกหัด

- [ ] รัน `docker compose up -d` แล้วรอให้ replica set พร้อม
- [ ] ใช้ `rs.status()` ดูสถานะ members
- [ ] Insert ข้อมูลที่ primary แล้วอ่านจาก secondary
- [ ] ทดลอง `mongodump` แล้ว `mongorestore`
- [ ] ทดลอง `mongoexport` เป็น JSON และ CSV
- [ ] ทดลอง failover: หยุด primary แล้วดูว่ามี primary ใหม่ไหม
- [ ] ลองตั้ง read preference เป็น `secondaryPreferred`
- [ ] ลอง `mongoimport` ข้อมูลจาก JSON file

## สรุป

- **mongodump/mongorestore** สำหรับ binary backup (เร็ว, รักษา types)
- **mongoexport/mongoimport** สำหรับ JSON/CSV (อ่านได้, แชร์ง่าย)
- **Replica Set** = high availability + automatic failover
- **Primary** รับ write, **Secondary** เป็นสำเนา
- **rs.status()** ดูสถานะ replica set
- **Read Preference** กำหนดว่าจะอ่านจาก primary หรือ secondary
- **Failover** เกิดอัตโนมัติเมื่อ primary ล่ม

## ต่อไป

- [Lab 15 — Project: Content Management System](../lab-15-project-cms/)
