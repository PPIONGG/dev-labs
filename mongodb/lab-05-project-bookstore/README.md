# Lab 05 -- Project: Bookstore Database

## เป้าหมาย

รวม concept จาก Level 1 ทั้งหมด สร้าง Bookstore REST API ที่เชื่อมต่อ MongoDB จริงผ่าน Node.js

## ทำไมต้องทำ?

ถึงเวลาเอาทุกอย่างที่เรียนมาใช้กับแอปจริง! Lab นี้จะสร้าง REST API ที่ทำ CRUD กับ MongoDB โดยตรง พร้อม filter, search, pagination และ embedded reviews

## สิ่งที่ต้องมีก่อน

- [Lab 01](../lab-01-what-is-nosql/) ถึง [Lab 04](../lab-04-query-operators/) -- ทุก concept ใน Level 1

## สิ่งที่จะใช้

- insertOne, find, findOne, updateOne, deleteOne (Lab 03)
- Query operators: $regex, $gte, $lte (Lab 04)
- Projection, sort, skip, limit (Lab 04)
- $push สำหรับ embedded subdocuments (Lab 03)
- Docker Compose (จาก Docker labs)

## โจทย์

สร้าง **Bookstore API** ที่:

| Endpoint | Method | คำอธิบาย | MongoDB ที่ใช้ |
|----------|--------|---------|---------------|
| `/books` | GET | ดูหนังสือทั้งหมด (filter, search, paginate) | find + sort + skip + limit |
| `/books/:id` | GET | ดูหนังสือ 1 เล่มพร้อม reviews | findOne |
| `/books` | POST | เพิ่มหนังสือใหม่ | insertOne |
| `/books/:id` | PUT | แก้ไขหนังสือ | findOneAndUpdate + $set |
| `/books/:id` | DELETE | ลบหนังสือ | findOneAndDelete |
| `/books/:id/reviews` | POST | เพิ่ม review | findOneAndUpdate + $push |

### Query Parameters สำหรับ GET /books

| Parameter | ตัวอย่าง | คำอธิบาย |
|-----------|---------|---------|
| `author` | `?author=James Clear` | กรองตามผู้เขียน |
| `genre` | `?genre=programming` | กรองตามหมวดหมู่ |
| `minPrice` | `?minPrice=500` | ราคาขั้นต่ำ |
| `maxPrice` | `?maxPrice=1000` | ราคาสูงสุด |
| `search` | `?search=clean` | ค้นหาชื่อหนังสือ |
| `sort` | `?sort=price` | เรียงตาม field |
| `order` | `?order=asc` | ASC หรือ DESC |
| `page` | `?page=2` | หน้าที่ |
| `limit` | `?limit=5` | จำนวนต่อหน้า |

## โครงสร้างโปรเจค

```
lab-05-project-bookstore/
├── README.md
├── docker-compose.yml
├── init.js                  # ข้อมูลตัวอย่าง
└── app/
    ├── Dockerfile
    ├── .dockerignore
    ├── package.json
    └── index.js             # Express API
```

## เริ่มต้น

```bash
# รัน MongoDB + App
docker compose up -d

# ดู logs ของ app
docker compose logs -f app

# เมื่อเห็น "Bookstore API running on http://localhost:3000" = พร้อมใช้งาน
```

## ทดสอบ API

### ดูหนังสือทั้งหมด

```bash
curl http://localhost:3000/books
```

### ค้นหาหนังสือ

```bash
# ค้นหาชื่อ
curl "http://localhost:3000/books?search=clean"

# กรองตาม genre
curl "http://localhost:3000/books?genre=programming"

# กรองตามราคา
curl "http://localhost:3000/books?minPrice=500&maxPrice=1000"

# กรองตามผู้เขียน
curl "http://localhost:3000/books?author=James%20Clear"

# เรียงตามราคาจากน้อยไปมาก
curl "http://localhost:3000/books?sort=price&order=asc"

# Pagination หน้าที่ 2 (หน้าละ 3 เล่ม)
curl "http://localhost:3000/books?page=2&limit=3"
```

### ดูหนังสือ 1 เล่มพร้อม reviews

```bash
# แทน <id> ด้วย _id ที่ได้จาก GET /books
curl http://localhost:3000/books/<id>
```

### เพิ่มหนังสือใหม่

```bash
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "You Don'\''t Know JS",
    "author": "Kyle Simpson",
    "genre": "programming",
    "price": 750,
    "pages": 278,
    "description": "Deep dive into JavaScript"
  }'
```

### แก้ไขหนังสือ

```bash
curl -X PUT http://localhost:3000/books/<id> \
  -H "Content-Type: application/json" \
  -d '{
    "price": 699,
    "inStock": true
  }'
```

### ลบหนังสือ

```bash
curl -X DELETE http://localhost:3000/books/<id>
```

### เพิ่ม review

```bash
curl -X POST http://localhost:3000/books/<id>/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "user": "สมชาย",
    "rating": 5,
    "comment": "หนังสือดีมาก แนะนำ!"
  }'
```

## อธิบาย Code

### 1. เชื่อมต่อ MongoDB

```javascript
const { MongoClient, ObjectId } = require("mongodb");
const client = new MongoClient(MONGO_URL);
await client.connect();
db = client.db("bookstore");
```

- ใช้ MongoDB Node.js Driver (ไม่ใช้ Mongoose)
- `MongoClient` สำหรับเชื่อมต่อ
- `ObjectId` สำหรับแปลง string ID เป็น ObjectId

### 2. Filter จาก Query Parameters

```javascript
const filter = {};
if (author) filter.author = author;
if (genre) filter.genre = genre;
if (search) filter.title = { $regex: search, $options: "i" };
```

- สร้าง filter object ตาม query parameters ที่ส่งมา
- `$regex` + `$options: "i"` = case-insensitive search

### 3. Pagination

```javascript
const skip = (pageNum - 1) * limitNum;
db.collection("books")
  .find(filter)
  .sort(sortObj)
  .skip(skip)
  .limit(limitNum)
  .toArray();
```

- `skip` = ข้ามกี่ documents
- `limit` = แสดงกี่ documents
- `toArray()` = แปลง cursor เป็น array

### 4. Embedded Reviews ($push)

```javascript
db.collection("books").findOneAndUpdate(
  { _id },
  { $push: { reviews: review } },
  { returnDocument: "after" }
);
```

- `$push` เพิ่ม review เข้าไปใน array `reviews`
- `returnDocument: "after"` = return document หลัง update

## แบบฝึกหัด

- [ ] รัน API แล้วทดสอบทุก endpoint ด้วย curl
- [ ] เพิ่มหนังสือใหม่ 3 เล่ม
- [ ] ค้นหาหนังสือด้วย genre และ price range
- [ ] เพิ่ม review ให้หนังสือ
- [ ] ลองแก้ไข code เพิ่ม endpoint `GET /books/:id/reviews` ที่แสดงเฉพาะ reviews
- [ ] ลองเพิ่ม field `averageRating` ที่คำนวณจาก reviews

## สรุป

- ใช้ MongoDB Node.js Driver เชื่อมต่อ MongoDB จาก Node.js
- สร้าง REST API ครบ CRUD: insertOne, find, findOneAndUpdate, findOneAndDelete
- ใช้ Query Operators ($regex, $gte, $lte) สำหรับ filter/search
- ใช้ $push เพิ่ม embedded subdocument (reviews)
- ใช้ skip/limit สำหรับ pagination

## ต่อไป

[Lab 06 -- Schema Design -->](../lab-06-schema-design/)
