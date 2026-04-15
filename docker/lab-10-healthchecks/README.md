# Lab 10 — Healthchecks & Dependencies

## เป้าหมาย

ตั้งค่า healthcheck ให้ containers และจัดการลำดับการเริ่มต้นที่ถูกต้อง

## ทำไมต้องรู้?

ปัญหาที่พบบ่อย:
- App เริ่มก่อน database พร้อม → crash!
- Container รันอยู่แต่ app ข้างในตายไปแล้ว → ไม่มีใครรู้!

Healthcheck ช่วยให้ Docker รู้ว่า container **ทำงานได้จริง** ไม่ใช่แค่ process ยังอยู่

## สิ่งที่ต้องมีก่อน

- [Lab 09](../lab-09-env-and-secrets/) — จัดการ env vars ได้

## เนื้อหา

### 1. Healthcheck คืออะไร?

Healthcheck คือคำสั่งที่ Docker รันเป็นระยะเพื่อตรวจสอบว่า container ยังทำงานปกติหรือไม่

สถานะ:
- `starting` — กำลังเริ่ม ยังไม่ได้ตรวจ
- `healthy` — ทำงานปกติ
- `unhealthy` — มีปัญหา

### 2. Healthcheck ใน Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "index.js"]
```

| option | คำอธิบาย | default |
|--------|----------|---------|
| `--interval` | ตรวจทุกกี่วินาที | 30s |
| `--timeout` | timeout ของการตรวจ | 30s |
| `--retries` | ล้มเหลวกี่ครั้งถึงจะ unhealthy | 3 |
| `--start-period` | รอกี่วินาทีก่อนเริ่มตรวจ | 0s |

### 3. Healthcheck ใน docker-compose.yml

```yaml
services:
  api:
    build: .
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s

  db:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 3s
      retries: 5
```

### 4. depends_on กับ Healthcheck

`depends_on` ปกติแค่รอให้ container **เริ่ม** ไม่ได้รอให้ **พร้อมใช้งาน**

```yaml
services:
  api:
    build: .
    depends_on:
      db:
        condition: service_healthy  # รอให้ db healthy ก่อน!

  db:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5
```

### 5. ดูสถานะ Healthcheck

```bash
# ดูสถานะทุก containers
docker compose ps

# ดูรายละเอียด healthcheck
docker inspect --format='{{json .State.Health}}' <container_name>
```

### 6. Healthcheck Patterns ที่ใช้บ่อย

```yaml
# Web API
healthcheck:
  test: ["CMD", "wget", "--spider", "http://localhost:3000/health"]

# PostgreSQL
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]

# Redis
healthcheck:
  test: ["CMD", "redis-cli", "ping"]

# MySQL
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
```

## แบบฝึกหัด

### ฝึก 1: เพิ่ม Healthcheck
1. สร้าง Node.js app ที่มี `/health` endpoint
2. เพิ่ม healthcheck ใน Dockerfile
3. รันแล้วดูสถานะด้วย `docker ps`

### ฝึก 2: depends_on + condition
1. สร้าง compose file ที่มี API + PostgreSQL
2. ใช้ `depends_on` กับ `condition: service_healthy`
3. ดู logs ว่า API รอ database พร้อมก่อนถึงจะเริ่ม

### ฝึก 3: จำลอง Unhealthy
1. สร้าง app ที่ `/health` return error หลังจากรัน 1 นาที
2. ดูว่า Docker ตรวจจับ unhealthy ได้

## สรุป

- Healthcheck ช่วยให้ Docker รู้ว่า container ทำงานได้จริง
- ใช้ `depends_on` + `condition: service_healthy` เพื่อรอให้ service พร้อม
- ทุก production service ควรมี healthcheck
- เลือก healthcheck command ให้เหมาะกับ service (HTTP, CLI, etc.)

## ต่อไป

[Lab 11 — Project: Fullstack App →](../lab-11-project-fullstack/)
