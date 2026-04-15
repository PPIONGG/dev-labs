# Lab 15 — Project: Content Management System (CMS)

## เป้าหมาย

สร้าง CMS API ที่รวมทุกอย่างที่เรียนมา: Schema Validation, Aggregation, Text Search, Transactions, Change Streams, Indexes

## ทำไมต้องรู้?

CMS เป็นตัวอย่างที่ดีที่สุดของการรวมทุก feature ของ MongoDB:

- **Schema Validation** — ข้อมูลบทความต้องถูกต้อง
- **Aggregation Pipeline** — สถิติบทความ, popular tags
- **Text Search** — ค้นหาบทความ
- **Transactions** — publish บทความ (เปลี่ยน status + สร้าง notification)
- **Change Streams** — แจ้งเตือน real-time เมื่อมีบทความใหม่
- **Indexes** — ทำให้ query เร็ว
- **Versioning** — เก็บประวัติการแก้ไข

```
CMS Architecture:
┌────────────────────────────────────────────┐
│                   API                       │
│                                            │
│  Articles ──→ Schema Validation            │
│           ──→ Text Search (title, content)  │
│           ──→ Aggregation (stats)           │
│                                            │
│  Publish  ──→ Transaction                  │
│           ──→ (update status + notify)      │
│                                            │
│  Changes  ──→ Change Stream               │
│           ──→ (real-time updates)           │
│                                            │
│  Indexes  ──→ Performance                  │
└────────────────────────────────────────────┘
```

## สิ่งที่ต้องมีก่อน

- [Lab 14](../lab-14-backup-and-replication/) — Backup & Replication
- ความรู้ทั้งหมดจาก Lab 09-14

## โครงสร้างโปรเจค

```
lab-15-project-cms/
├── docker-compose.yml    (replica set)
├── init.js               (schema + ข้อมูลเริ่มต้น)
└── app/
    ├── Dockerfile
    ├── .dockerignore
    ├── package.json
    └── index.js
```

## เนื้อหา

### 1. Data Model

```
Users Collection:
┌────────────────────────────────────┐
│ {                                  │
│   username, email, role,           │
│   displayName, avatar,             │
│   createdAt                        │
│ }                                  │
└────────────────────────────────────┘

Articles Collection:
┌────────────────────────────────────┐
│ {                                  │
│   title, slug, content,            │
│   author: {              ← embed   │
│     userId, name, avatar           │
│   },                               │
│   category, tags: [...],  ← array  │
│   status: "draft|published|...",   │
│   metadata: {            ← flexible│
│     readTime, wordCount,           │
│     featuredImage, seoTitle         │
│   },                               │
│   comments: [            ← embed   │
│     { userId, name, text, ... }    │
│   ],                               │
│   version: 1,            ← version │
│   publishedAt, createdAt           │
│ }                                  │
└────────────────────────────────────┘

Categories Collection:
┌────────────────────────────────────┐
│ {                                  │
│   name, slug, description,         │
│   parent, articleCount             │
│ }                                  │
└────────────────────────────────────┘

Notifications Collection:
┌────────────────────────────────────┐
│ {                                  │
│   type, message,                   │
│   articleId, userId,               │
│   read, createdAt                  │
│ }                                  │
└────────────────────────────────────┘
```

### 2. API Endpoints

| Method | Endpoint | คำอธิบาย | Features ที่ใช้ |
|--------|----------|----------|----------------|
| GET | `/articles` | รายการบทความ | Pagination, Index |
| GET | `/articles/:id` | บทความเดียว | Index |
| POST | `/articles` | สร้างบทความ | Schema Validation |
| PUT | `/articles/:id` | แก้ไขบทความ | Versioning |
| DELETE | `/articles/:id` | ลบบทความ | |
| GET | `/articles/search?q=...` | ค้นหาบทความ | Text Search |
| POST | `/articles/:id/publish` | เผยแพร่บทความ | Transaction |
| POST | `/articles/:id/unpublish` | ยกเลิกเผยแพร่ | Transaction |
| POST | `/articles/:id/comments` | เพิ่ม comment | Embedded |
| GET | `/stats` | สถิติ | Aggregation |
| GET | `/categories` | รายการหมวดหมู่ | |
| POST | `/categories` | สร้างหมวดหมู่ | |

### 3. เริ่มต้นใช้งาน

```bash
docker compose up -d

# รอ replica set + API พร้อม
docker compose logs -f api
```

### 4. ทดสอบ API

**สร้างบทความ:**

```bash
curl -X POST http://localhost:3000/articles \
  -H "Content-Type: application/json" \
  -d '{
    "title": "เริ่มต้นเรียน MongoDB",
    "content": "MongoDB เป็น document database ที่ได้รับความนิยมมากที่สุด...",
    "authorId": "AUTHOR_ID",
    "category": "technology",
    "tags": ["mongodb", "database", "tutorial"]
  }'
```

**Publish บทความ (Transaction):**

```bash
curl -X POST http://localhost:3000/articles/ARTICLE_ID/publish
```

**ค้นหาบทความ:**

```bash
curl "http://localhost:3000/articles/search?q=MongoDB"
```

**ดูสถิติ (Aggregation):**

```bash
curl http://localhost:3000/stats
```

**สร้างหมวดหมู่:**

```bash
curl -X POST http://localhost:3000/categories \
  -H "Content-Type: application/json" \
  -d '{ "name": "Technology", "slug": "technology", "description": "บทความเทคโนโลยี" }'
```

### 5. Features ที่ใช้ในโปรเจค

**Schema Validation:**
```javascript
// articles collection มี validation สำหรับ
// - title (required, string)
// - content (required, string)
// - status (enum: draft, published, archived)
// - tags (array of strings)
```

**Transaction (Publish):**
```javascript
// เมื่อ publish บทความ:
// 1. อัปเดต article status → "published"
// 2. สร้าง notification
// 3. อัปเดต category articleCount
// ทั้ง 3 ต้องสำเร็จหมด หรือ rollback ทั้งหมด
```

**Aggregation (Stats):**
```javascript
// GET /stats returns:
// - จำนวนบทความตาม status
// - จำนวนบทความตาม category
// - popular tags
// - บทความล่าสุด
```

**Change Streams:**
```javascript
// Server เริ่ม watch articles collection
// เมื่อมี insert/update → log ใน console
// (ในระบบจริงอาจส่ง WebSocket ให้ frontend)
```

### 6. Versioning

```javascript
// เมื่อแก้ไขบทความ:
// 1. เก็บ version เดิมใน article_versions
// 2. อัปเดต article + เพิ่ม version number

// PUT /articles/:id
// → เก็บ snapshot เดิม
// → อัปเดตข้อมูลใหม่
// → version++
```

## แบบฝึกหัด / Checklist

- [ ] `docker compose up -d` แล้วรอจนทุก service พร้อม
- [ ] สร้างบทความ 3 บทความด้วย POST /articles
- [ ] Publish บทความด้วย POST /articles/:id/publish
- [ ] ค้นหาบทความด้วย GET /articles/search?q=...
- [ ] ดูสถิติด้วย GET /stats
- [ ] เพิ่ม comment ในบทความ
- [ ] แก้ไขบทความแล้วเช็คว่า version เพิ่มขึ้น
- [ ] Unpublish บทความแล้วเช็คว่า status กลับเป็น draft
- [ ] สร้างหมวดหมู่ใหม่
- [ ] ดู console logs ของ api container (change stream events)

## สรุป

ในโปรเจคนี้เราได้ใช้ MongoDB features ทั้งหมดที่เรียนมา:

| Feature | ใช้ใน |
|---------|------|
| Schema Validation | สร้าง articles collection |
| Text Search | ค้นหาบทความ |
| Aggregation Pipeline | สถิติบทความ |
| Transactions | Publish/Unpublish (multi-doc update) |
| Change Streams | Real-time logging |
| Indexes | Performance (text, compound) |
| Embedded Documents | Author info, Comments |
| Versioning | ประวัติการแก้ไขบทความ |

นี่คือ pattern ที่ใช้ในระบบจริง และเป็นพื้นฐานที่ดีสำหรับการพัฒนา application ด้วย MongoDB ต่อไป

## ต่อไป

ยินดีด้วย! คุณจบ MongoDB Learning Labs ทั้งหมดแล้ว ลองนำความรู้ไปใช้ในโปรเจคจริง!
