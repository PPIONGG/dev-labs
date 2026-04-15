# Lab 17 — Project: Blog Platform + Full-text Search

## เป้าหมาย

สร้าง Blog Platform ที่ใช้ PostgreSQL features ขั้นสูง: JSONB, Full-text Search, Views, Triggers, Indexes

## ทำไมต้องทำ?

Lab นี้รวมทุก concept จาก Level 3 ไว้ในโปรเจกต์เดียว:
- **JSONB** — เก็บ tags ของบทความ
- **Full-text Search** — ค้นหาบทความด้วย tsvector/tsquery
- **Views** — สร้าง stats view สำหรับ dashboard
- **Triggers** — อัปเดต updated_at อัตโนมัติ
- **Indexes** — ใช้ GIN index สำหรับ full-text search และ JSONB

## สิ่งที่ต้องมีก่อน

- [Lab 14](../lab-14-json/) ถึง [Lab 16](../lab-16-backup-and-migrations/) — ทุก concept ใน Level 3

## Database Schema

```
users ──────→ posts ←────── categories
                ↓
            comments
```

| ตาราง | คำอธิบาย | Features |
|-------|---------|---------|
| `users` | ผู้เขียน | พื้นฐาน |
| `categories` | หมวดหมู่ | พื้นฐาน |
| `posts` | บทความ | JSONB tags, tsvector search |
| `comments` | ความคิดเห็น | FK to posts + users |

**posts table พิเศษ:**
- `tags JSONB` — เก็บ tags เป็น array เช่น `["postgresql", "database"]`
- `search_vector TSVECTOR` — สำหรับ full-text search
- Trigger อัปเดต `updated_at` อัตโนมัติ
- Trigger อัปเดต `search_vector` อัตโนมัติ

## API Endpoints

| Method | Path | คำอธิบาย | SQL Features |
|--------|------|---------|-------------|
| GET | `/posts` | ดูบทความทั้งหมด | JOIN, JSONB |
| POST | `/posts` | สร้างบทความใหม่ | INSERT JSONB |
| GET | `/posts/search?q=...` | ค้นหาบทความ | Full-text Search |
| GET | `/posts/:id` | ดูบทความ + comments | JOIN หลายตาราง |
| GET | `/posts/tag/:tag` | ดูบทความตาม tag | JSONB @> |
| POST | `/posts/:id/comments` | เพิ่มความคิดเห็น | INSERT |
| GET | `/stats` | สถิติรวม | Views, Functions |

## วิธีรัน

```bash
docker compose up --build

# ทดสอบ
curl http://localhost:3000/posts
curl http://localhost:3000/posts/search?q=postgresql
curl http://localhost:3000/posts/1
curl http://localhost:3000/posts/tag/database
curl http://localhost:3000/stats
```

## Checklist

- [ ] Schema สร้างถูกต้อง มี JSONB tags, tsvector search
- [ ] ดูบทความทั้งหมดพร้อมชื่อผู้เขียนและหมวด (JOIN)
- [ ] สร้างบทความใหม่พร้อม tags (JSONB)
- [ ] ค้นหาบทความ (Full-text Search: to_tsvector, to_tsquery, ts_rank)
- [ ] ดูบทความพร้อม comments (JOIN หลายตาราง)
- [ ] กรองบทความตาม tag (JSONB @>)
- [ ] ดูสถิติ (Views + Aggregate)
- [ ] Trigger อัปเดต updated_at อัตโนมัติ
- [ ] Trigger อัปเดต search_vector อัตโนมัติ
- [ ] GIN Index สำหรับ full-text search + JSONB

## สรุป

คุณเพิ่งสร้าง Blog Platform ที่ใช้ PostgreSQL features ขั้นสูง! สิ่งที่ได้เรียนรู้:
- ใช้ **JSONB** เก็บ tags ที่ยืดหยุ่น
- ใช้ **Full-text Search** ค้นหาบทความโดยไม่ต้องพึ่ง Elasticsearch
- ใช้ **Views** สรุปข้อมูลสำหรับ dashboard
- ใช้ **Triggers** อัปเดตข้อมูลอัตโนมัติ
- ใช้ **GIN Index** ทำให้ search และ JSONB query เร็ว
- รวม SQL + NoSQL features ในตัวเดียว

## ต่อไป

ยินดีด้วย! คุณจบ PostgreSQL Learning Labs ทั้งหมดแล้ว
