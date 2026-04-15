# Lab 06 — Project: Todo App Database

## เป้าหมาย

รวม concept จาก Level 1 ทั้งหมด สร้าง Todo App ที่เชื่อมต่อ PostgreSQL จริงผ่าน Node.js

## ทำไมต้องทำ?

ถึงเวลาเอาทุกอย่างที่เรียนมาใช้กับแอปจริง! Lab นี้จะสร้าง REST API ที่ทำ CRUD กับ PostgreSQL โดยตรง

## สิ่งที่ต้องมีก่อน

- [Lab 01](../lab-01-what-is-database/) ถึง [Lab 05](../lab-05-filtering-and-sorting/) — ทุก concept ใน Level 1

## สิ่งที่จะใช้

- CREATE TABLE, Data Types, Constraints (Lab 03)
- INSERT, SELECT, UPDATE, DELETE (Lab 04)
- WHERE, ORDER BY, LIMIT (Lab 05)
- Docker Compose (จาก Docker labs)

## โจทย์

สร้าง **Todo API** ที่:

| Endpoint | Method | คำอธิบาย | SQL ที่ใช้ |
|----------|--------|---------|-----------|
| `/todos` | GET | ดู todos ทั้งหมด (filter, sort, paginate) | SELECT + WHERE + ORDER BY + LIMIT |
| `/todos/:id` | GET | ดู todo 1 รายการ | SELECT + WHERE |
| `/todos` | POST | สร้าง todo ใหม่ | INSERT + RETURNING |
| `/todos/:id` | PUT | แก้ไข todo | UPDATE + WHERE + RETURNING |
| `/todos/:id` | DELETE | ลบ todo | DELETE + WHERE + RETURNING |

### Query Parameters สำหรับ GET /todos

| Parameter | ตัวอย่าง | คำอธิบาย |
|-----------|---------|---------|
| `status` | `?status=completed` | กรองตามสถานะ |
| `search` | `?search=docker` | ค้นหาชื่อ |
| `sort` | `?sort=created_at` | เรียงตาม column |
| `order` | `?order=desc` | ASC หรือ DESC |
| `page` | `?page=2` | หน้าที่ |
| `limit` | `?limit=10` | จำนวนต่อหน้า |

## โครงสร้างโปรเจค

```
lab-06-project-todo-db/
├── README.md
├── docker-compose.yml
├── .env
├── init.sql
└── api/
    ├── package.json
    ├── index.js
    ├── Dockerfile
    └── .dockerignore
```

## วิธีรัน

```bash
docker compose up --build

# ทดสอบ
curl http://localhost:3000/todos
curl -X POST http://localhost:3000/todos -H "Content-Type: application/json" -d '{"title":"Learn SQL"}'
curl http://localhost:3000/todos?status=pending&sort=created_at&order=desc
```

## Checklist

- [ ] `docker compose up` แล้วทุก services ขึ้นมา
- [ ] GET /todos แสดง todos ทั้งหมด
- [ ] POST /todos สร้าง todo ใหม่ได้
- [ ] PUT /todos/:id แก้ไข todo ได้
- [ ] DELETE /todos/:id ลบ todo ได้
- [ ] กรอง filter ด้วย status ได้
- [ ] ค้นหาด้วย search ได้
- [ ] เรียงลำดับด้วย sort + order ได้
- [ ] แบ่งหน้าด้วย page + limit ได้

## สรุป

คุณเพิ่งสร้าง API ที่เชื่อมต่อ PostgreSQL จริง! สิ่งที่ได้เรียนรู้:
- ใช้ `pg` library เชื่อมต่อ PostgreSQL จาก Node.js
- เขียน SQL queries ที่รับ parameters อย่างปลอดภัย (parameterized queries)
- สร้าง API ที่ filter, sort, paginate ข้อมูลจาก database

## ต่อไป

[Lab 07 — JOIN →](../lab-07-joins/)
