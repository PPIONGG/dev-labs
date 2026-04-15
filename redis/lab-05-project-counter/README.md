# Lab 05 -- Project: Hit Counter & Rate Limiter

## เป้าหมาย

สร้าง API จริงด้วย Node.js + Redis ที่มีระบบนับ page views และ rate limiting

## ทำไมต้องรู้?

นี่คือ use case จริงที่พบในทุกเว็บแอป:
- **Hit Counter** -- นับจำนวนผู้เข้าชมเว็บ (ใช้ INCR)
- **Rate Limiter** -- จำกัดจำนวน API calls ต่อ IP (ใช้ INCR + EXPIRE)

ทั้งสองอย่างนี้ต้องเร็วมากและรองรับ concurrent requests -- Redis เหมาะที่สุด

## สิ่งที่ต้องมีก่อน

- [Lab 03](../lab-03-strings/) -- ใช้ INCR ได้
- [Lab 04](../lab-04-expiration/) -- เข้าใจ TTL และ EXPIRE
- [Docker Lab 07](../../docker/lab-07-compose-multi/) -- ใช้ Docker Compose ได้

## เนื้อหา

### 1. สิ่งที่จะสร้าง

API ที่มี 4 endpoints:

| Method | Path | คำอธิบาย |
|--------|------|---------|
| GET | `/hit` | เพิ่ม page view counter +1 |
| GET | `/stats` | ดูจำนวน hits ทั้งหมด |
| POST | `/api/data` | endpoint ที่มี rate limit (10 req/min/IP) |
| GET | `/health` | ตรวจสอบสถานะ server |

### 2. โครงสร้างไฟล์

```
lab-05-project-counter/
├── docker-compose.yml      # Redis + API
├── app/
│   ├── Dockerfile          # สร้าง image สำหรับ API
│   ├── .dockerignore
│   ├── package.json
│   └── index.js            # API code
└── README.md
```

### 3. รันโปรเจกต์

```bash
cd lab-05-project-counter
docker compose up -d
```

รอสักครู่แล้วทดสอบ:

```bash
# ตรวจสอบสถานะ
curl http://localhost:3000/health

# เพิ่ม page view
curl http://localhost:3000/hit

# ดูสถิติ
curl http://localhost:3000/stats

# ทดสอบ rate limit (เรียกซ้ำ 11 ครั้ง)
for i in {1..11}; do
  echo "Request $i:"
  curl -s -X POST http://localhost:3000/api/data | jq .
done
```

### 4. อธิบาย Code

#### 4.1 Hit Counter (INCR)

```javascript
// GET /hit -- นับ page view
app.get('/hit', async (req, res) => {
  const hits = await redis.incr('page:hits');
  res.json({ hits });
});
```

ทุกครั้งที่เรียก `/hit`:
1. `INCR page:hits` -- เพิ่มค่า +1 (atomic)
2. ถ้า key ยังไม่มี Redis จะสร้างให้อัตโนมัติ (เริ่มจาก 0)
3. คืนค่าจำนวน hits ปัจจุบัน

#### 4.2 Stats (GET)

```javascript
// GET /stats -- ดูสถิติ
app.get('/stats', async (req, res) => {
  const hits = await redis.get('page:hits');
  res.json({ total_hits: parseInt(hits) || 0 });
});
```

#### 4.3 Rate Limiter (INCR + EXPIRE)

```javascript
// POST /api/data -- rate limited endpoint
app.post('/api/data', async (req, res) => {
  const ip = req.ip;
  const key = `rate:${ip}`;
  const limit = 10;       // max 10 requests
  const window = 60;      // per 60 seconds

  const current = await redis.incr(key);

  // ครั้งแรก → ตั้ง expiration
  if (current === 1) {
    await redis.expire(key, window);
  }

  // เกิน limit → ปฏิเสธ
  if (current > limit) {
    const ttl = await redis.ttl(key);
    return res.status(429).json({
      error: 'Too many requests',
      retry_after: ttl
    });
  }

  res.json({
    data: 'success',
    requests_remaining: limit - current
  });
});
```

วิธีทำงาน:
1. ใช้ IP ของ client เป็น key: `rate:192.168.1.1`
2. `INCR` เพิ่ม counter +1 ทุกครั้งที่เรียก
3. ถ้าเป็นการเรียกครั้งแรก (counter = 1) ตั้ง `EXPIRE 60` วินาที
4. ถ้า counter > 10 → ส่ง HTTP 429 (Too Many Requests)
5. เมื่อ key หมดอายุ (60 วินาที) counter จะ reset เอง

```
Timeline:
0s   → INCR rate:ip = 1, EXPIRE 60
1s   → INCR rate:ip = 2
...
5s   → INCR rate:ip = 10  (สุดท้ายที่อนุญาต)
6s   → INCR rate:ip = 11  (ปฏิเสธ! 429)
...
60s  → key หมดอายุ → reset
61s  → INCR rate:ip = 1   (เริ่มนับใหม่)
```

### 5. ทดสอบด้วย curl

```bash
# 1. Health check
curl http://localhost:3000/health
# {"status":"ok","redis":"connected"}

# 2. Hit counter
curl http://localhost:3000/hit
# {"hits":1}
curl http://localhost:3000/hit
# {"hits":2}
curl http://localhost:3000/hit
# {"hits":3}

# 3. Stats
curl http://localhost:3000/stats
# {"total_hits":3}

# 4. Rate limiting -- เรียก 10 ครั้งจะผ่าน
curl -X POST http://localhost:3000/api/data
# {"data":"success","requests_remaining":9}

# 5. ครั้งที่ 11 จะโดน rate limit
# {"error":"Too many requests","retry_after":45}
```

### 6. ดูข้อมูลใน Redis

```bash
# เข้า redis-cli
docker exec -it redis-lab05 redis-cli

# ดู keys ทั้งหมด
KEYS *
# 1) "page:hits"
# 2) "rate:::ffff:172.18.0.1"

# ดูจำนวน hits
GET page:hits
# "3"

# ดู rate limit counter
GET rate:::ffff:172.18.0.1
# "11"

# ดู TTL ที่เหลือ
TTL rate:::ffff:172.18.0.1
# (integer) 42
```

## Checklist

- [ ] รัน `docker compose up -d` ได้สำเร็จ
- [ ] เรียก `/health` ได้ `{"status":"ok","redis":"connected"}`
- [ ] เรียก `/hit` แล้ว counter เพิ่มขึ้น
- [ ] เรียก `/stats` เห็นจำนวน hits รวม
- [ ] เรียก `/api/data` 10 ครั้งผ่าน ครั้งที่ 11 ได้ 429
- [ ] เปิด redis-cli ดู keys ที่ถูกสร้างขึ้น
- [ ] รอ 60 วินาที แล้วเรียก `/api/data` ได้อีกครั้ง

## สรุป

- `INCR` เหมาะสำหรับ counter เพราะเป็น atomic operation
- `INCR` + `EXPIRE` เป็นสูตรพื้นฐานของ rate limiter
- Redis เร็วพอสำหรับ rate limiting ที่ต้องตรวจสอบทุก request
- ใช้ IP เป็น key สำหรับ rate limiting (production อาจใช้ user ID หรือ API key)

## ต่อไป

[Lab 06 -- Lists -->](../lab-06-lists/)
