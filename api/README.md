# Dev Labs API

Backend API สำหรับเว็บ dev-labs — Express + TypeScript + Prisma + PostgreSQL

## Prerequisites

- Node.js 20+ (ทดสอบกับ 24)
- Docker (สำหรับรัน PostgreSQL)

## Setup ครั้งแรก

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. copy env
cp .env.example .env
# แก้ JWT_SECRET ให้เป็นค่าสุ่ม — สร้างด้วย:
#   openssl rand -base64 32

# 3. Start Postgres ผ่าน Docker (ที่ root ของ repo)
cd ..
docker compose up -d
cd api

# 4. Run migrations สร้าง tables
npm run db:migrate
```

## Development

```bash
npm run dev
```

API จะรันที่ `http://localhost:3000` พร้อม hot reload

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | รัน dev server (tsx watch) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | รัน production build |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | สร้าง + apply migration ใหม่ |
| `npm run db:studio` | เปิด Prisma Studio (GUI ดู DB) |
| `npm run db:reset` | ⚠️ ล้าง DB แล้วรัน migrations ใหม่ |

## API Endpoints (Slice 0)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | ❌ | Health check |
| POST | `/auth/register` | ❌ | สร้างบัญชีใหม่ + login ทันที |
| POST | `/auth/login` | ❌ | Login ด้วย email + password |
| POST | `/auth/logout` | ❌ | เคลียร์ auth cookie |
| GET | `/auth/me` | ✅ | คืน user ปัจจุบัน |

Auth ใช้ **JWT ใน httpOnly cookie** — frontend ไม่ต้องจัดการ token เอง แค่ส่ง request พร้อม `credentials: 'include'`

### Request / Response ตัวอย่าง

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234","displayName":"Tester"}' \
  -c cookies.txt

# → 201 { "user": { "id", "email", "displayName", "createdAt" } }
# + Set-Cookie: dev_labs_auth=...

# Me (ใช้ cookie ที่เพิ่ง set)
curl http://localhost:3000/auth/me -b cookies.txt
# → 200 { "user": {...} }
```

## Error codes

| Code | HTTP | ความหมาย |
|------|------|----------|
| `VALIDATION` | 400 | ข้อมูล body ไม่ถูกต้อง (ดู `details`) |
| `EMAIL_TAKEN` | 409 | อีเมลถูกใช้แล้ว (register) |
| `INVALID_CREDENTIALS` | 401 | email / password ผิด (login) |
| `UNAUTHENTICATED` | 401 | ไม่มี cookie หรือ JWT invalid |
| `USER_NOT_FOUND` | 401 | JWT valid แต่ user ถูกลบแล้ว |
| `NOT_FOUND` | 404 | path ไม่มี route handler |
| `INTERNAL_ERROR` | 500 | error ที่ server ไม่ได้ handle |

## โครงสร้าง

```
api/
├── prisma/
│   ├── schema.prisma      # Data model
│   └── migrations/        # SQL migrations
├── src/
│   ├── lib/               # env, prisma, password, jwt
│   ├── middleware/        # auth (attachUser, requireAuth)
│   ├── routes/            # auth routes
│   └── index.ts           # Express app entry
├── .env.example
└── tsconfig.json
```
