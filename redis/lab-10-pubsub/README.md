# Lab 10 — Pub/Sub

## เป้าหมาย

เข้าใจและใช้งาน Redis Pub/Sub สำหรับการสื่อสารแบบ real-time ระหว่าง publishers และ subscribers

## ทำไมต้องรู้?

- **Real-time Notifications** — ส่งแจ้งเตือนทันทีที่เกิด event
- **Chat Systems** — ส่งข้อความระหว่าง users แบบ real-time
- **Event Broadcasting** — กระจาย event ไปยัง services หลายตัว
- **Microservices Communication** — service A ส่ง event ให้ service B, C, D รับพร้อมกัน
- เป็นพื้นฐานของ event-driven architecture

## สิ่งที่ต้องมีก่อน

- [Lab 09](../lab-09-project-leaderboard/) — ใช้ Redis กับ Node.js ได้
- Docker & Docker Compose
- Node.js พื้นฐาน

## โครงสร้างโปรเจค

```
lab-10-pubsub/
├── docker-compose.yml
├── publisher.js
├── subscriber.js
└── README.md
```

## เนื้อหา

### 1. Pub/Sub คืออะไร?

```
Publisher/Subscriber Pattern:

┌────────────┐     PUBLISH "news"      ┌─────────────┐
│ Publisher A │ ──────────────────────→ │  Channel:   │
└────────────┘                         │   "news"    │
                                       └──────┬──────┘
                                              │
                            ┌─────────────────┼─────────────────┐
                            │                 │                 │
                            ▼                 ▼                 ▼
                    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
                    │ Subscriber 1 │  │ Subscriber 2 │  │ Subscriber 3 │
                    └──────────────┘  └──────────────┘  └──────────────┘
```

- **Publisher** ส่งข้อความไปที่ channel
- **Subscriber** ลงทะเบียนรับข้อความจาก channel
- ข้อความส่งแบบ **fire-and-forget** — ถ้า subscriber offline จะไม่ได้รับ
- หนึ่ง channel มีหลาย subscribers ได้

### 2. ทดลองผ่าน redis-cli

เปิด terminal 2 หน้าต่าง:

**Terminal 1 — Subscriber:**
```bash
docker exec -it redis redis-cli

# SUBSCRIBE — ลงทะเบียนรับข้อความจาก channel
SUBSCRIBE news
# Reading messages... (press Ctrl+C to quit)
```

**Terminal 2 — Publisher:**
```bash
docker exec -it redis redis-cli

# PUBLISH — ส่งข้อความไปที่ channel
PUBLISH news "Breaking: Redis is awesome!"
# (integer) 1  ← จำนวน subscribers ที่ได้รับ

PUBLISH news "Update: New version released"
# (integer) 1
```

Terminal 1 จะแสดง:
```
1) "message"
2) "news"
3) "Breaking: Redis is awesome!"

1) "message"
2) "news"
3) "Update: New version released"
```

### 3. SUBSCRIBE หลาย channels

```bash
# Subscriber สามารถ subscribe หลาย channels
SUBSCRIBE news sports weather

# จะได้รับข้อความจากทั้ง 3 channels
```

### 4. PSUBSCRIBE — Pattern Subscribe

```bash
# PSUBSCRIBE — subscribe ด้วย pattern
PSUBSCRIBE news:*
# จะได้รับจาก news:sports, news:tech, news:politics ฯลฯ

PSUBSCRIBE chat:room:*
# จะได้รับจากทุก chat room

# ทดสอบ
# Terminal อื่น:
PUBLISH news:sports "Goal!"
PUBLISH news:tech "New iPhone released"
PUBLISH chat:room:123 "Hello!"
```

### 5. UNSUBSCRIBE — ยกเลิกการ subscribe

```bash
# ยกเลิก subscribe จาก channel เฉพาะ
UNSUBSCRIBE news

# ยกเลิกทุก channel
UNSUBSCRIBE

# ยกเลิก pattern subscribe
PUNSUBSCRIBE news:*
```

### 6. ใช้ Node.js — Publisher

ดูไฟล์ `publisher.js`:

```javascript
// publisher สร้าง Redis connection ปกติ
// แล้วใช้ redis.publish(channel, message) ส่งข้อความ
// สามารถทำงานอื่นด้วยได้ (SET, GET, etc.)
```

### 7. ใช้ Node.js — Subscriber

ดูไฟล์ `subscriber.js`:

```javascript
// subscriber ต้องใช้ connection แยก (dedicated)
// เพราะเมื่อ subscribe แล้ว connection จะถูกล็อค
// ไม่สามารถใช้คำสั่งอื่นได้
```

### 8. รัน Publisher & Subscriber

```bash
# Start Redis
docker compose up -d

# Terminal 1 — รัน subscriber ก่อน
docker compose exec app node subscriber.js

# Terminal 2 — รัน publisher
docker compose exec app node publisher.js
```

### 9. ข้อจำกัดของ Pub/Sub

```
ข้อจำกัดที่ต้องรู้:
1. Fire-and-forget — ข้อความไม่ถูกเก็บ ถ้า subscriber offline จะพลาด
2. ไม่มี message queue — ไม่มีการรอ ส่งแล้วจบ
3. ไม่มี acknowledgment — ไม่รู้ว่า subscriber ประมวลผลสำเร็จไหม
4. Connection ถูกล็อค — subscriber ใช้ connection นั้นทำอย่างอื่นไม่ได้

ถ้าต้องการ:
- Message persistence → ใช้ Redis Streams (Lab 11)
- Message queue → ใช้ Redis Streams หรือ RabbitMQ
- Guaranteed delivery → ใช้ Redis Streams + Consumer Groups
```

## แบบฝึกหัด

1. เพิ่ม channel `alerts` ใน subscriber ให้แสดงข้อความสีแดง (เพิ่ม prefix `[ALERT]`)
2. แก้ publisher ให้รับ input จาก user (ใช้ `readline`) แล้ว publish ไป channel ที่เลือก
3. ใช้ `PSUBSCRIBE` เพื่อ subscribe ทุก channel ที่ขึ้นต้นด้วย `system:`
4. สร้าง publisher ที่ส่ง JSON message (เช่น `{"type": "order", "id": 123, "total": 500}`)
5. สร้าง subscriber ที่ parse JSON แล้วแสดงผลแต่ละ field

## Checklist

- [ ] ใช้ SUBSCRIBE / PUBLISH ผ่าน redis-cli ได้
- [ ] ใช้ PSUBSCRIBE กับ pattern ได้
- [ ] รัน publisher.js ส่งข้อความได้
- [ ] รัน subscriber.js รับข้อความ real-time ได้
- [ ] เข้าใจว่า subscriber ต้องใช้ connection แยก
- [ ] เข้าใจข้อจำกัดของ Pub/Sub (fire-and-forget)

## สรุป

- **Pub/Sub** เป็นรูปแบบการสื่อสารแบบ real-time — publisher ส่ง, subscribers รับ
- `SUBSCRIBE` — ลงทะเบียนรับจาก channel
- `PUBLISH` — ส่งข้อความไปที่ channel (return จำนวน subscribers ที่ได้รับ)
- `PSUBSCRIBE` — subscribe ด้วย pattern (เช่น `news:*`)
- ข้อจำกัด: fire-and-forget, ไม่มี persistence, connection ถูกล็อค
- ถ้าต้องการ reliable messaging → ใช้ Redis Streams

## ต่อไป

[Lab 11 — Streams →](../lab-11-streams/)
