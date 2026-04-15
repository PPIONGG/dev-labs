# Lab 09 — Environment Variables & Secrets

## เป้าหมาย

จัดการ configuration และข้อมูลลับ (passwords, API keys) ใน Docker อย่างปลอดภัย

## ทำไมต้องรู้?

แอปจริงต้องมี config ที่ต่างกันในแต่ละ environment:
- Development: ใช้ database ใน localhost
- Production: ใช้ database ใน cloud

และต้องจัดการข้อมูลลับอย่าง password, API key โดย **ห้าม hardcode** ลงในโค้ด

## สิ่งที่ต้องมีก่อน

- [Lab 08](../lab-08-compose-basics/) — ใช้ Docker Compose ได้

## เนื้อหา

### 1. Environment Variables ใน Docker

#### วิธีที่ 1: ส่งผ่าน docker run
```bash
docker run -e NODE_ENV=production -e PORT=3000 my-app
```

#### วิธีที่ 2: ใน Dockerfile
```dockerfile
ENV NODE_ENV=production
ENV PORT=3000
```

#### วิธีที่ 3: ใน docker-compose.yml
```yaml
services:
  api:
    build: .
    environment:
      - NODE_ENV=production
      - PORT=3000
```

### 2. ใช้ไฟล์ .env

สร้างไฟล์ `.env`:
```env
NODE_ENV=development
PORT=3000
DB_HOST=db
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=secret123
```

ใช้ใน `docker-compose.yml`:
```yaml
services:
  api:
    build: .
    env_file:
      - .env
    ports:
      - "${PORT}:${PORT}"
```

### 3. ลำดับความสำคัญของ Environment Variables

จากสำคัญมากไปน้อย:
1. `docker compose run -e` (command line)
2. `environment:` ใน compose file
3. `env_file:` ใน compose file
4. `ENV` ใน Dockerfile

### 4. แยก .env ตาม Environment

```
project/
├── .env                  # ค่า default
├── .env.development      # สำหรับ dev
├── .env.production       # สำหรับ production
└── docker-compose.yml
```

```yaml
services:
  api:
    build: .
    env_file:
      - .env
      - .env.${APP_ENV:-development}
```

```bash
# รันแบบ development
docker compose up

# รันแบบ production
APP_ENV=production docker compose up
```

### 5. Docker Secrets (แนะนำสำหรับ production)

สำหรับข้อมูลที่ละเอียดอ่อนมาก:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

### 6. สิ่งที่ห้ามทำ

```dockerfile
# ห้าม! hardcode secrets ใน Dockerfile
ENV DB_PASSWORD=my_secret_password

# ห้าม! เก็บ .env ไว้ใน git
# ต้องใส่ .env ใน .gitignore เสมอ
```

`.gitignore`:
```
.env
.env.*
!.env.example
secrets/
```

สร้าง `.env.example` เป็น template:
```env
NODE_ENV=development
PORT=3000
DB_HOST=db
DB_PASSWORD=  # ใส่ค่าเอง
```

## แบบฝึกหัด

### ฝึก 1: ใช้ Environment Variables
1. สร้าง Node.js app ที่อ่านค่าจาก `process.env`
2. ส่ง env vars ผ่าน `docker run -e`
3. ยืนยันว่าค่าถูกต้อง

### ฝึก 2: ใช้ .env กับ Compose
1. สร้างไฟล์ `.env` พร้อมค่า config
2. ใช้ `env_file` ใน docker-compose.yml
3. ยืนยันว่า container อ่านค่าได้

### ฝึก 3: แยก Environment
1. สร้าง `.env.development` และ `.env.production`
2. รันด้วย environment ต่างกัน
3. ยืนยันว่าค่าเปลี่ยนตาม environment

## สรุป

- ใช้ environment variables แทนการ hardcode config
- ใช้ `.env` file สำหรับจัดการ config หลายค่า
- **ห้าม** commit `.env` ลง git — สร้าง `.env.example` แทน
- ใช้ Docker Secrets สำหรับข้อมูลละเอียดอ่อนใน production
- แยก `.env` ตาม environment (dev, staging, production)

## ต่อไป

[Lab 10 — Healthchecks & Dependencies →](../lab-10-healthchecks/)
