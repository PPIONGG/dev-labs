# Lab 09 — Project: Leaderboard & Session Manager

## เป้าหมาย

สร้าง REST API ด้วย Node.js + Express ที่ใช้ Redis Sorted Sets ทำระบบ Leaderboard และใช้ Hashes ทำระบบ Session Management

## ทำไมต้องรู้?

- **Leaderboard** เป็น use case คลาสสิกของ Sorted Sets — เกม, แอปกีฬา, ระบบ ranking ใช้หมด
- **Session Management** เป็น use case คลาสสิกของ Hashes — เก็บข้อมูล session ที่ต้องหมดอายุ
- ได้ฝึกใช้ Redis กับ application จริง ไม่ใช่แค่ CLI
- เข้าใจการออกแบบ API ที่ใช้ Redis เป็น data store

## สิ่งที่ต้องมีก่อน

- [Lab 08](../lab-08-hashes/) — เข้าใจ Hashes
- เข้าใจ Sorted Sets (ZADD, ZREVRANGE, ZREVRANK)
- Docker & Docker Compose
- Node.js พื้นฐาน

## โครงสร้างโปรเจค

```
lab-09-project-leaderboard/
├── docker-compose.yml
├── app/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── index.js
└── README.md
```

## เนื้อหา

### 1. สร้างโปรเจค

```bash
docker compose up -d
```

Docker Compose จะ build และ start ทั้ง Redis และ App ให้

### 2. API Endpoints

#### Leaderboard API

| Method | Path | Description | Redis Command |
|--------|------|-------------|---------------|
| POST | `/players/:name/score` | เพิ่ม/อัพเดทคะแนน | `ZADD` |
| GET | `/leaderboard` | Top 10 ผู้เล่น | `ZREVRANGE WITHSCORES` |
| GET | `/players/:name/rank` | อันดับของผู้เล่น | `ZREVRANK` |

#### Session API

| Method | Path | Description | Redis Command |
|--------|------|-------------|---------------|
| POST | `/sessions` | สร้าง session | `HSET` + `EXPIRE` |
| GET | `/sessions/:id` | ดูข้อมูล session | `HGETALL` |
| DELETE | `/sessions/:id` | ลบ session (logout) | `DEL` |

### 3. ทดสอบ API

```bash
# === Leaderboard ===

# เพิ่มคะแนนผู้เล่น
curl -X POST http://localhost:3000/players/alice/score \
  -H "Content-Type: application/json" \
  -d '{"score": 1500}'

curl -X POST http://localhost:3000/players/bob/score \
  -H "Content-Type: application/json" \
  -d '{"score": 2200}'

curl -X POST http://localhost:3000/players/charlie/score \
  -H "Content-Type: application/json" \
  -d '{"score": 1800}'

curl -X POST http://localhost:3000/players/diana/score \
  -H "Content-Type: application/json" \
  -d '{"score": 3100}'

curl -X POST http://localhost:3000/players/eve/score \
  -H "Content-Type: application/json" \
  -d '{"score": 2700}'

# ดู Leaderboard top 10
curl http://localhost:3000/leaderboard | jq

# ดูอันดับของผู้เล่น
curl http://localhost:3000/players/bob/rank | jq

# อัพเดทคะแนน (ZADD จะ overwrite ค่าเดิม)
curl -X POST http://localhost:3000/players/alice/score \
  -H "Content-Type: application/json" \
  -d '{"score": 5000}'

# ดู Leaderboard อีกครั้ง (alice ควรขึ้นอันดับ 1)
curl http://localhost:3000/leaderboard | jq

# === Session Management ===

# สร้าง session
curl -X POST http://localhost:3000/sessions \
  -H "Content-Type: application/json" \
  -d '{"userId": "1001", "username": "somchai", "role": "admin"}' | jq

# จด sessionId ที่ได้ แล้วใช้แทน :id
curl http://localhost:3000/sessions/:id | jq

# ลบ session (logout)
curl -X DELETE http://localhost:3000/sessions/:id | jq
```

### 4. อธิบาย Code สำคัญ

#### Sorted Set สำหรับ Leaderboard

```javascript
// ZADD — เพิ่ม/อัพเดทคะแนน (score เป็นตัวจัดอันดับ)
await redis.zadd('leaderboard', score, playerName);

// ZREVRANGE WITHSCORES — เรียงจากมากไปน้อย พร้อมคะแนน
const top10 = await redis.zrevrange('leaderboard', 0, 9, 'WITHSCORES');

// ZREVRANK — อันดับ (0 = อันดับ 1)
const rank = await redis.zrevrank('leaderboard', playerName);
```

#### Hash + EXPIRE สำหรับ Session

```javascript
// สร้าง session ID แบบ random
const sessionId = crypto.randomUUID();

// HSET — เก็บข้อมูล session
await redis.hset(`session:${sessionId}`, {
  userId, username, role,
  createdAt: new Date().toISOString()
});

// EXPIRE — ตั้งเวลาหมดอายุ 30 นาที
await redis.expire(`session:${sessionId}`, 1800);

// HGETALL — อ่านข้อมูล session
const session = await redis.hgetall(`session:${sessionId}`);

// DEL — ลบ session (logout)
await redis.del(`session:${sessionId}`);
```

## แบบฝึกหัด

1. เพิ่ม endpoint `DELETE /players/:name` ลบผู้เล่นออกจาก leaderboard (`ZREM`)
2. เพิ่ม endpoint `GET /leaderboard/range?min=100&max=500` หาผู้เล่นที่คะแนนอยู่ในช่วง (`ZRANGEBYSCORE`)
3. เพิ่ม endpoint `GET /leaderboard/count` นับจำนวนผู้เล่นทั้งหมด (`ZCARD`)
4. เพิ่ม endpoint `POST /players/:name/score/increment` เพิ่มคะแนนทีละน้อย (`ZINCRBY`)
5. เพิ่ม field `lastActive` ใน session ที่อัพเดททุกครั้งที่ GET session

## Checklist

- [ ] `docker compose up -d` แล้วทุก service ขึ้นปกติ
- [ ] POST `/players/:name/score` เพิ่มคะแนนได้
- [ ] GET `/leaderboard` แสดง top 10 เรียงจากมากไปน้อย
- [ ] GET `/players/:name/rank` แสดงอันดับถูกต้อง
- [ ] POST `/sessions` สร้าง session ได้ พร้อม TTL
- [ ] GET `/sessions/:id` อ่านข้อมูล session ได้
- [ ] DELETE `/sessions/:id` ลบ session ได้
- [ ] session หมดอายุอัตโนมัติหลังจาก TTL

## สรุป

- **Sorted Sets** เหมาะกับ Leaderboard — `ZADD` เพิ่มคะแนน, `ZREVRANGE` เรียงอันดับ, `ZREVRANK` หาอันดับ
- **Hashes + EXPIRE** เหมาะกับ Session — `HSET` เก็บข้อมูล, `EXPIRE` ตั้งหมดอายุ, `HGETALL` อ่าน, `DEL` ลบ
- Redis เร็วมากสำหรับ ranking operations — O(log N) สำหรับ ZADD/ZRANK

## ต่อไป

[Lab 10 — Pub/Sub →](../lab-10-pubsub/)
