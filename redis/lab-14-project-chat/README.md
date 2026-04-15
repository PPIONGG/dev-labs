# Lab 14 — Project: Real-time Chat Backend

## เป้าหมาย

สร้าง REST API สำหรับระบบ Chat แบบ real-time ด้วย Node.js + Express + Redis โดยใช้ Hashes (rooms), Streams (messages), Pub/Sub (notifications), และ rate limiting

## ทำไมต้องรู้?

- รวมความรู้ Redis ทั้งหมดที่เรียนมา (Hashes, Streams, Pub/Sub, TTL)
- เข้าใจการออกแบบ real-time messaging system
- ฝึก rate limiting pattern ที่ใช้ในงานจริง
- เห็นว่า Redis data structures แต่ละตัวแก้ปัญหาอะไร

## สิ่งที่ต้องมีก่อน

- [Lab 13](../lab-13-caching-patterns/) — เข้าใจ caching patterns
- เข้าใจ Hashes, Streams, Pub/Sub
- Docker & Docker Compose
- Node.js พื้นฐาน

## โครงสร้างโปรเจค

```
lab-14-project-chat/
├── docker-compose.yml
├── app/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── index.js
└── README.md
```

## Redis Data Model

```
┌─────────────────────────────────────────────────────────┐
│                    Redis Keys                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  room:{id}              (Hash)     — ข้อมูลห้อง          │
│    ├── name             — ชื่อห้อง                       │
│    ├── description      — คำอธิบาย                      │
│    └── createdAt        — วันที่สร้าง                    │
│                                                          │
│  messages:{roomId}      (Stream)   — ข้อความในห้อง       │
│    └── entries: user, text, timestamp                    │
│                                                          │
│  rate:{roomId}:{user}   (String)   — rate limit counter  │
│    └── TTL: 60 seconds                                   │
│                                                          │
│  channel: chat:{roomId} (Pub/Sub)  — real-time notify    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## เนื้อหา

### 1. API Endpoints

| Method | Path | Description | Redis |
|--------|------|-------------|-------|
| POST | `/rooms` | สร้างห้องแชท | `HSET` |
| GET | `/rooms` | แสดงรายการห้อง | `SCAN` + `HGETALL` |
| POST | `/rooms/:id/messages` | ส่งข้อความ | `XADD` + `PUBLISH` + rate limit |
| GET | `/rooms/:id/messages` | ดูข้อความ | `XRANGE` |
| GET | `/rooms/:id/messages/latest` | poll ข้อความใหม่ | `XREAD BLOCK` |

### 2. สร้างและรัน

```bash
docker compose up -d
```

### 3. ทดสอบ API

```bash
# === สร้างห้องแชท ===

curl -X POST http://localhost:3000/rooms \
  -H "Content-Type: application/json" \
  -d '{"name": "general", "description": "ห้องพูดคุยทั่วไป"}' | jq

curl -X POST http://localhost:3000/rooms \
  -H "Content-Type: application/json" \
  -d '{"name": "random", "description": "ห้องคุยเล่น"}' | jq

curl -X POST http://localhost:3000/rooms \
  -H "Content-Type: application/json" \
  -d '{"name": "tech", "description": "พูดคุยเรื่อง technology"}' | jq

# === ดูรายการห้อง ===

curl http://localhost:3000/rooms | jq

# === ส่งข้อความ ===

# จด roomId จากผลลัพธ์ข้างบน แล้วใช้แทน :id

curl -X POST http://localhost:3000/rooms/:id/messages \
  -H "Content-Type: application/json" \
  -d '{"user": "alice", "text": "สวัสดีครับ!"}' | jq

curl -X POST http://localhost:3000/rooms/:id/messages \
  -H "Content-Type: application/json" \
  -d '{"user": "bob", "text": "สวัสดีค่ะ! ยินดีที่ได้รู้จัก"}' | jq

curl -X POST http://localhost:3000/rooms/:id/messages \
  -H "Content-Type: application/json" \
  -d '{"user": "alice", "text": "วันนี้เรียน Redis กัน"}' | jq

# === ดูข้อความ ===

# ดูทั้งหมด
curl "http://localhost:3000/rooms/:id/messages" | jq

# ดูแค่ 2 ข้อความล่าสุด
curl "http://localhost:3000/rooms/:id/messages?count=2" | jq

# === Poll ข้อความใหม่ (Blocking) ===
# Terminal 1: รอข้อความใหม่ (timeout 10 วินาที)
curl "http://localhost:3000/rooms/:id/messages/latest?timeout=10" | jq

# Terminal 2: ส่งข้อความใหม่ (Terminal 1 จะได้รับ)
curl -X POST http://localhost:3000/rooms/:id/messages \
  -H "Content-Type: application/json" \
  -d '{"user": "charlie", "text": "ฉันมาแล้ว!"}' | jq

# === ทดสอบ Rate Limiting ===
# ส่งข้อความเร็วๆ มากกว่า 20 ครั้งใน 1 นาที
for i in $(seq 1 25); do
  curl -s -X POST http://localhost:3000/rooms/:id/messages \
    -H "Content-Type: application/json" \
    -d "{\"user\": \"spammer\", \"text\": \"message $i\"}" | jq .error
done
# ข้อความที่ 21+ จะโดน rate limit
```

### 4. อธิบาย Code สำคัญ

#### Room Management (Hashes)

```javascript
// สร้างห้อง — HSET เก็บข้อมูลห้อง
const roomId = crypto.randomUUID();
await redis.hset(`room:${roomId}`, {
  name, description,
  createdAt: new Date().toISOString()
});

// ดูรายการห้อง — SCAN หา keys + HGETALL อ่านข้อมูล
// SCAN ดีกว่า KEYS เพราะไม่ block server
const keys = []; // จาก SCAN
for (const key of keys) {
  const room = await redis.hgetall(key);
}
```

#### Messages (Streams)

```javascript
// ส่งข้อความ — XADD เพิ่ม entry ลง stream
await redis.xadd(`messages:${roomId}`, '*',
  'user', user, 'text', text, 'timestamp', Date.now()
);

// ดูข้อความ — XRANGE อ่าน entries
const messages = await redis.xrange(`messages:${roomId}`, '-', '+');

// Poll ข้อความใหม่ — XREAD BLOCK
const result = await redis.xread(
  'BLOCK', timeout, 'COUNT', 10,
  'STREAMS', `messages:${roomId}`, '$'
);
```

#### Real-time Notification (Pub/Sub)

```javascript
// ส่ง notification เมื่อมีข้อความใหม่
await redis.publish(`chat:${roomId}`, JSON.stringify({
  user, text, timestamp
}));
```

#### Rate Limiting

```javascript
// ใช้ INCR + EXPIRE จำกัด 20 ข้อความ/นาที/user/room
const rateKey = `rate:${roomId}:${user}`;
const count = await redis.incr(rateKey);
if (count === 1) await redis.expire(rateKey, 60);
if (count > 20) return res.status(429).json({ error: 'Rate limit exceeded' });
```

## แบบฝึกหัด

1. เพิ่ม endpoint `DELETE /rooms/:id` ลบห้องแชทพร้อม messages ทั้งหมด
2. เพิ่ม endpoint `GET /rooms/:id/info` แสดงข้อมูลห้อง + จำนวนข้อความ (`XLEN`)
3. เพิ่ม field `lastMessageAt` ใน room hash ที่อัพเดททุกครั้งที่มีข้อความใหม่
4. เพิ่ม endpoint `GET /rooms/:id/messages/search?q=keyword` ค้นหาข้อความ
5. สร้าง subscriber.js ที่ subscribe `chat:*` แล้วแสดง messages แบบ real-time

## Checklist

- [ ] `docker compose up -d` แล้วทุก service ขึ้นปกติ
- [ ] POST `/rooms` สร้างห้องได้
- [ ] GET `/rooms` แสดงรายการห้องได้
- [ ] POST `/rooms/:id/messages` ส่งข้อความได้
- [ ] GET `/rooms/:id/messages` อ่านข้อความได้
- [ ] GET `/rooms/:id/messages/latest` poll ข้อความใหม่ได้ (blocking)
- [ ] Rate limiting ทำงาน (max 20/min)
- [ ] Pub/Sub notification ถูกส่งเมื่อมีข้อความใหม่

## สรุป

- **Hashes** เหมาะกับ room metadata — HSET, HGETALL
- **Streams** เหมาะกับ message history — XADD (append), XRANGE (read), XREAD BLOCK (poll)
- **Pub/Sub** เหมาะกับ real-time notification — PUBLISH เมื่อมี message ใหม่
- **Rate Limiting** ด้วย INCR + EXPIRE — จำกัดจำนวน actions ต่อช่วงเวลา
- **SCAN** ดีกว่า KEYS สำหรับ production — ไม่ block Redis server
- Redis เป็น building block ที่ทรงพลังสำหรับ real-time applications
