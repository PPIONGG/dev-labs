# Lab 11 — Project: Fullstack App (Node + PostgreSQL + Redis)

## เป้าหมาย

สร้างแอปพลิเคชัน fullstack ที่มีหลาย services ทำงานร่วมกันผ่าน Docker Compose

## ทำไมต้องทำ?

นี่คือสถานการณ์จริงที่พบบ่อยที่สุด — แอปที่มี API server, database, และ cache ทำงานร่วมกัน Lab นี้จะรวม concept จาก Level 2 ทั้งหมด

## สิ่งที่ต้องมีก่อน

- [Lab 08](../lab-08-compose-basics/) ถึง [Lab 10](../lab-10-healthchecks/) — ทุก concept ใน Level 2

## สิ่งที่จะใช้ในโปรเจคนี้

- Docker Compose (Lab 08)
- Environment Variables (Lab 09)
- Healthchecks & Dependencies (Lab 10)
- Volumes สำหรับ database (Lab 05)
- Networking (Lab 06)

## โจทย์

สร้าง **Todo API** ที่ประกอบด้วย:

| Service | Technology | หน้าที่ |
|---------|-----------|---------|
| `api` | Node.js + Express | REST API |
| `db` | PostgreSQL | เก็บข้อมูล |
| `redis` | Redis | Cache |

### API Endpoints

| Method | Path | คำอธิบาย |
|--------|------|----------|
| `GET` | `/todos` | ดู todos ทั้งหมด (cache ด้วย Redis) |
| `POST` | `/todos` | สร้าง todo ใหม่ |
| `PUT` | `/todos/:id` | แก้ไข todo |
| `DELETE` | `/todos/:id` | ลบ todo |
| `GET` | `/health` | ตรวจสถานะทุก services |

## โครงสร้างโปรเจค

```
lab-11-project-fullstack/
├── docker-compose.yml
├── .env
├── .env.example
├── api/
│   ├── Dockerfile
│   ├── package.json
│   ├── index.js
│   └── .dockerignore
└── README.md
```

## ขั้นตอน

### Step 1: สร้าง docker-compose.yml

```yaml
services:
  api:
    build: ./api
    ports:
      - "${API_PORT:-3000}:3000"
    env_file:
      - .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME:-todos}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-secret}
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  db-data:
```

### Step 2: สร้าง .env

```env
API_PORT=3000
DB_NAME=todos
DB_USER=postgres
DB_PASSWORD=secret
DB_HOST=db
DB_PORT=5432
REDIS_HOST=redis
REDIS_PORT=6379
```

### Step 3: สร้าง API

สิ่งที่ต้องทำ:
1. สร้าง Express app ที่เชื่อมต่อ PostgreSQL และ Redis
2. สร้าง CRUD endpoints สำหรับ todos
3. ใช้ Redis cache ผลลัพธ์ของ `GET /todos`
4. สร้าง `/health` endpoint ที่ตรวจสอบทุก services

### Step 4: ทดสอบ

```bash
# เริ่มทุก services
docker compose up --build

# ทดสอบ API
curl http://localhost:3000/health
curl -X POST http://localhost:3000/todos -H "Content-Type: application/json" -d '{"title":"Learn Docker"}'
curl http://localhost:3000/todos

# ดู logs
docker compose logs api

# หยุดทุกอย่าง
docker compose down

# หยุดและลบ data
docker compose down -v
```

## Checklist

- [ ] `docker compose up` แล้วทุก services ขึ้นมาสำเร็จ
- [ ] API เชื่อมต่อ PostgreSQL ได้
- [ ] API เชื่อมต่อ Redis ได้
- [ ] CRUD todos ทำงานถูกต้อง
- [ ] `/health` ตรวจสอบทุก services
- [ ] data ไม่หายเมื่อ `docker compose down` (ไม่ใส่ `-v`)
- [ ] `.env` ไม่ถูก commit ลง git

## สรุป

คุณเพิ่งสร้าง multi-service application ด้วย Docker Compose! สิ่งที่ได้เรียนรู้:
- จัดการ 3 services (API + DB + Cache) ด้วย Compose
- ใช้ healthchecks และ depends_on ให้ services เริ่มถูกลำดับ
- ใช้ environment variables จัดการ config
- ใช้ named volumes เก็บข้อมูล database

## ต่อไป

[Lab 12 — Multi-stage Builds →](../lab-12-multistage-builds/)
