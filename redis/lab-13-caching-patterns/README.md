# Lab 13 — Caching Patterns

## เป้าหมาย

เข้าใจ caching patterns ที่ใช้บ่อยในการพัฒนา application — Cache-aside, Write-through, Write-behind, Cache invalidation, TTL-based expiry, และ Cache stampede prevention พร้อมสร้าง API ตัวอย่างที่ใช้ cache-aside pattern

## ทำไมต้องรู้?

- **Performance** — Cache ลดเวลาตอบ request จากหลายร้อย ms เหลือไม่กี่ ms
- **Scalability** — ลด load บน database ทำให้รองรับ users ได้มากขึ้น
- **Cost** — ลดจำนวน queries ไปที่ database = ลดค่าใช้จ่าย
- **เลือก pattern ให้ถูก** — แต่ละ pattern เหมาะกับ use case ต่างกัน
- ต้องรู้ปัญหา cache stampede และวิธีป้องกัน

## สิ่งที่ต้องมีก่อน

- [Lab 12](../lab-12-persistence/) — เข้าใจ Redis persistence
- Docker & Docker Compose
- Node.js พื้นฐาน

## โครงสร้างโปรเจค

```
lab-13-caching-patterns/
├── docker-compose.yml
├── app/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── index.js
└── README.md
```

## เนื้อหา

### 1. Cache-aside (Lazy Loading)

```
Pattern ที่ใช้บ่อยที่สุด:

1. App ถาม Cache ก่อน
2. ถ้ามี (cache hit) → ส่งกลับเลย
3. ถ้าไม่มี (cache miss) → ถาม DB → เก็บใน Cache → ส่งกลับ

┌──────┐     1. GET     ┌─────────┐
│ App  │ ──────────────→│  Cache  │
│      │←── 2a. HIT ────│ (Redis) │
│      │                └─────────┘
│      │
│      │  2b. MISS
│      │──────────────→ ┌─────────┐
│      │←── 3. data ────│   DB    │
│      │──── 4. SET ───→│         │
│      │                └─────────┘
└──────┘

ข้อดี:
✅ Cache เฉพาะข้อมูลที่ถูกเรียกใช้จริง
✅ Cache failure ไม่ทำให้ app พัง (fallback ไป DB)
✅ ง่ายต่อการ implement

ข้อเสีย:
❌ Request แรกช้าเสมอ (cache miss)
❌ ข้อมูลอาจ stale (ไม่ตรงกับ DB)
```

### 2. Write-through

```
เขียนทั้ง Cache และ DB พร้อมกัน:

┌──────┐  1. WRITE  ┌─────────┐  2. WRITE  ┌─────────┐
│ App  │──────────→ │  Cache  │───────────→│   DB    │
│      │            │ (Redis) │            │         │
└──────┘            └─────────┘            └─────────┘

ข้อดี:
✅ Cache กับ DB ตรงกันเสมอ
✅ อ่านเร็วเพราะ cache มีข้อมูลพร้อม

ข้อเสีย:
❌ เขียนช้ากว่า (ต้องเขียน 2 ที่)
❌ Cache อาจเต็มด้วยข้อมูลที่ไม่ค่อยถูกอ่าน
```

### 3. Write-behind (Write-back)

```
เขียน Cache ก่อน แล้วค่อยเขียน DB ทีหลัง (async):

┌──────┐  1. WRITE  ┌─────────┐
│ App  │──────────→ │  Cache  │
│      │            │ (Redis) │
└──────┘            └────┬────┘
                         │ 2. async WRITE (batch)
                         ▼
                    ┌─────────┐
                    │   DB    │
                    └─────────┘

ข้อดี:
✅ เขียนเร็วมาก (เขียนแค่ Cache)
✅ ลด write load บน DB (batch writes)

ข้อเสีย:
❌ ซับซ้อนในการ implement
❌ อาจเสียข้อมูลถ้า Cache crash ก่อนเขียน DB
```

### 4. Cache Invalidation Strategies

```
วิธีจัดการเมื่อข้อมูลใน DB เปลี่ยน:

1. TTL-based — ตั้งเวลาหมดอายุ → ง่ายสุด แต่อาจ stale ช่วงสั้นๆ
2. Event-based — ลบ cache เมื่อ DB update → ข้อมูล fresh แต่ซับซ้อนกว่า
3. Version-based — เพิ่ม version ใน cache key → ง่ายต่อการ invalidate ทั้งหมด
```

### 5. TTL-based Expiry

```bash
# ตั้ง TTL ตอน SET
SET product:101 '{"name":"iPhone","price":35900}' EX 300
# หมดอายุใน 300 วินาที (5 นาที)

# ตั้ง TTL ทีหลัง
EXPIRE product:101 300

# ตรวจสอบ TTL ที่เหลือ
TTL product:101

# เลือก TTL ให้เหมาะกับข้อมูล:
# - User session: 30 นาที
# - Product data: 5 นาที
# - Static config: 1 ชม.
# - Search results: 1 นาที
```

### 6. Cache Stampede Prevention

```
Cache Stampede = หลาย requests พร้อมกันเจอ cache miss
→ ทุก request ไปถาม DB → DB ล่ม!

วิธีป้องกัน:

1. Mutex Lock — request แรกล็อค ที่เหลือรอ
   SET lock:product:101 1 NX EX 10  ← lock 10 วินาที
   ถ้าได้ lock → ไปถาม DB → set cache → ปล่อย lock
   ถ้าไม่ได้ lock → รอ → อ่าน cache

2. Early Expiry — refresh cache ก่อนหมดอายุจริง
   TTL จริง = 300 วินาที
   refresh เมื่อ TTL < 60 วินาที (ยัง serve ค่าเดิมได้)

3. Stale-while-revalidate — ส่งค่าเก่ากลับ + refresh background
```

### 7. ทดสอบ API

```bash
# Start
docker compose up -d

# === ทดสอบ Cache-aside Pattern ===

# Request แรก → cache miss → ช้า (~2 วินาที จำลอง DB ช้า)
curl http://localhost:3000/products/101 | jq
# {
#   "source": "database",    ← จาก "database" (ช้า)
#   "data": {...},
#   "responseTime": "2005ms"
# }

# Request ที่ 2 → cache hit → เร็ว
curl http://localhost:3000/products/101 | jq
# {
#   "source": "cache",       ← จาก cache (เร็ว!)
#   "data": {...},
#   "responseTime": "3ms"
# }

# อัพเดทข้อมูล → ลบ cache (invalidation)
curl -X PUT http://localhost:3000/products/101 \
  -H "Content-Type: application/json" \
  -d '{"name": "iPhone 16 Pro", "price": 41900}' | jq

# Request ถัดไป → cache miss → ได้ข้อมูลใหม่
curl http://localhost:3000/products/101 | jq

# === ทดสอบ Cache Stats ===
curl http://localhost:3000/cache/stats | jq

# === ลบ cache ทั้งหมด ===
curl -X DELETE http://localhost:3000/cache/flush | jq
```

### 8. อธิบาย Code สำคัญ

```javascript
// Cache-aside pattern
async function getProduct(id) {
  // 1. ถาม Cache ก่อน
  const cached = await redis.get(`product:${id}`);
  if (cached) return { source: 'cache', data: JSON.parse(cached) };

  // 2. Cache miss → ถาม "DB" (จำลอง)
  const data = await fakeDatabase.getProduct(id);

  // 3. เก็บใน Cache + TTL
  await redis.set(`product:${id}`, JSON.stringify(data), 'EX', 300);

  return { source: 'database', data };
}

// Cache invalidation เมื่อ update
async function updateProduct(id, updates) {
  await fakeDatabase.updateProduct(id, updates);
  await redis.del(`product:${id}`);  // ลบ cache
}
```

## แบบฝึกหัด

1. ทดสอบ API แล้วสังเกตความแตกต่างของ response time ระหว่าง cache hit กับ miss
2. ลองเรียก `/cache/stats` แล้วดูอัตรา hit/miss
3. เพิ่ม endpoint `GET /products` (list) ที่ cache รายการสินค้าทั้งหมด พร้อม TTL 60 วินาที
4. เพิ่ม cache stampede prevention ด้วย mutex lock (ใช้ `SET key NX EX`)
5. เพิ่ม endpoint `GET /products/:id/reviews` ที่ใช้ TTL สั้น (30 วินาที) เพราะ reviews เปลี่ยนบ่อย

## Checklist

- [ ] เข้าใจ Cache-aside pattern (ข้อดี/ข้อเสีย)
- [ ] เข้าใจ Write-through pattern
- [ ] เข้าใจ Write-behind pattern
- [ ] ใช้ TTL-based cache expiry ได้
- [ ] เข้าใจ cache invalidation strategies
- [ ] เข้าใจ cache stampede และวิธีป้องกัน
- [ ] ทดสอบ API แล้วเห็นความแตกต่างของ cache hit/miss

## สรุป

- **Cache-aside** — pattern ที่ใช้บ่อยสุด: อ่าน cache ก่อน, miss ค่อยไป DB
- **Write-through** — เขียนทั้ง cache + DB พร้อมกัน (consistency สูง)
- **Write-behind** — เขียน cache ก่อน, DB ทีหลัง (write เร็วมาก)
- **TTL** — วิธีง่ายที่สุดในการ invalidate cache
- **Cache stampede** — ปัญหาเมื่อหลาย requests miss พร้อมกัน → ใช้ mutex lock ป้องกัน
- เลือก TTL ให้เหมาะกับข้อมูล (session 30 นาที, product 5 นาที, config 1 ชม.)

## ต่อไป

[Lab 14 — Project: Real-time Chat Backend →](../lab-14-project-chat/)
