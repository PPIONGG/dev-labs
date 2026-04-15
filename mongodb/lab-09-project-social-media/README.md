# Lab 09 — Project: Social Media Database

## เป้าหมาย

สร้าง REST API สำหรับระบบ Social Media ด้วย Node.js + Express + MongoDB เพื่อรวมความรู้ทั้งหมดที่เรียนมา ตั้งแต่ CRUD, Embedded Documents, Aggregation Pipeline และ Text Search

## ทำไมต้องรู้?

Social Media เป็นตัวอย่างที่ดีของการออกแบบ MongoDB schema:

- **Users** มี profile + settings ที่เหมาะกับ embedded document
- **Posts** มี comments, tags, likes ที่ต้องคิดเรื่อง data modeling
- ต้องใช้ **aggregation** สำหรับสถิติ
- ต้องใช้ **text search** สำหรับค้นหาโพสต์
- ต้องใช้ **pagination** สำหรับ feed

## สิ่งที่ต้องมีก่อน

- [Lab 08](../lab-08-aggregation/) — Aggregation Pipeline
- Docker & Docker Compose
- Node.js พื้นฐาน

## โครงสร้างโปรเจค

```
lab-09-project-social-media/
├── docker-compose.yml
├── init.js
└── app/
    ├── Dockerfile
    ├── .dockerignore
    ├── package.json
    └── index.js
```

## เนื้อหา

### 1. ออกแบบ Data Model

```
Users Collection:
┌──────────────────────────────────────┐
│ {                                    │
│   _id: ObjectId,                     │
│   username: "somchai",               │
│   email: "somchai@example.com",      │
│   displayName: "สมชาย",              │
│   bio: "รักการเขียนโค้ด",             │
│   avatar: "https://...",             │
│   settings: {              ← embedded│
│     theme: "dark",                   │
│     notifications: true,             │
│     language: "th"                   │
│   },                                 │
│   createdAt: ISODate                 │
│ }                                    │
└──────────────────────────────────────┘

Posts Collection:
┌──────────────────────────────────────┐
│ {                                    │
│   _id: ObjectId,                     │
│   authorId: ObjectId,                │
│   authorName: "somchai",   ← denorm  │
│   content: "วันนี้เรียน MongoDB",     │
│   tags: ["mongodb", "dev"],← array   │
│   likes: 42,               ← counter │
│   comments: [              ← embedded│
│     {                                │
│       userId: ObjectId,              │
│       username: "somsri",            │
│       text: "เจ๋งมาก!",              │
│       createdAt: ISODate             │
│     }                                │
│   ],                                 │
│   createdAt: ISODate                 │
│ }                                    │
└──────────────────────────────────────┘
```

### 2. เริ่มต้นโปรเจค

```bash
docker compose up -d
```

รอจน MongoDB และ API พร้อมใช้งาน:

```bash
docker compose logs -f api
```

### 3. API Endpoints

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | `/users/:id` | ดู user profile |
| GET | `/feed` | ดู posts feed (pagination) |
| POST | `/posts` | สร้างโพสต์ใหม่ |
| POST | `/posts/:id/comments` | เพิ่ม comment |
| POST | `/posts/:id/like` | กดไลค์ |
| GET | `/posts/search?q=...` | ค้นหาโพสต์ |
| GET | `/stats/popular` | โพสต์ยอดนิยม |

### 4. ทดสอบ API

**สร้างโพสต์:**

```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "authorId": "USER_ID_HERE",
    "content": "เรียน MongoDB สนุกมาก!",
    "tags": ["mongodb", "learning"]
  }'
```

**ดู Feed:**

```bash
# หน้าแรก
curl http://localhost:3000/feed

# หน้าที่ 2
curl "http://localhost:3000/feed?page=2&limit=5"
```

**เพิ่ม Comment:**

```bash
curl -X POST http://localhost:3000/posts/POST_ID_HERE/comments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE",
    "username": "somsri",
    "text": "โพสต์ดีมาก!"
  }'
```

**กดไลค์:**

```bash
curl -X POST http://localhost:3000/posts/POST_ID_HERE/like
```

**ค้นหา:**

```bash
curl "http://localhost:3000/posts/search?q=MongoDB"
```

**ดูสถิติ:**

```bash
curl http://localhost:3000/stats/popular
```

### 5. จุดสำคัญในโค้ด

**Pagination ด้วย skip + limit:**

```javascript
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;

const posts = await db.collection('posts')
  .find()
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .toArray();
```

**Embedded Comments ด้วย $push:**

```javascript
await db.collection('posts').updateOne(
  { _id: new ObjectId(postId) },
  { $push: { comments: newComment } }
);
```

**Increment Likes ด้วย $inc:**

```javascript
await db.collection('posts').updateOne(
  { _id: new ObjectId(postId) },
  { $inc: { likes: 1 } }
);
```

**Text Search:**

```javascript
// สร้าง text index (ใน init.js)
db.posts.createIndex({ content: "text", tags: "text" });

// ค้นหา
const results = await db.collection('posts')
  .find({ $text: { $search: query } })
  .sort({ score: { $meta: "textScore" } })
  .toArray();
```

**Aggregation สำหรับ Popular Posts:**

```javascript
const popular = await db.collection('posts').aggregate([
  { $sort: { likes: -1 } },
  { $limit: 10 },
  { $project: {
    content: 1,
    authorName: 1,
    likes: 1,
    commentCount: { $size: "$comments" },
    tags: 1
  }}
]).toArray();
```

## แบบฝึกหัด

- [ ] ลอง `docker compose up -d` แล้วทดสอบทุก endpoint
- [ ] สร้างโพสต์ 5 โพสต์ด้วย curl หรือ Postman
- [ ] เพิ่ม comments ในโพสต์
- [ ] ค้นหาโพสต์ด้วย text search
- [ ] ดู popular posts
- [ ] ลองเพิ่ม endpoint: `DELETE /posts/:id`
- [ ] ลองเพิ่ม endpoint: `GET /users/:id/posts` (โพสต์ของ user คนนั้น)
- [ ] ลองเพิ่ม feature: unlike (ลด likes ลง 1 แต่ไม่ต่ำกว่า 0)

## สรุป

ในแล็บนี้เราได้สร้าง Social Media API ที่ใช้ความรู้หลายอย่างร่วมกัน:

- **Embedded documents** สำหรับ settings และ comments
- **Array fields** สำหรับ tags
- **$inc operator** สำหรับ likes counter
- **$push operator** สำหรับเพิ่ม comment
- **Text index + $text search** สำหรับค้นหา
- **Aggregation pipeline** สำหรับสถิติ
- **Pagination** ด้วย skip + limit

## ต่อไป

- [Lab 10 — Transactions](../lab-10-transactions/)
