# Lab 15 — Project: Production-ready API

## เป้าหมาย

สร้าง API ที่พร้อมขึ้น production จริง โดยใช้ best practices ทั้งหมดจาก Level 3

## ทำไมต้องทำ?

Lab นี้จำลองการเตรียม app สำหรับ production — ซึ่งต่างจาก development ตรงที่ต้องคำนึงถึง:
- ขนาด image (เล็กที่สุดเท่าที่ทำได้)
- ความปลอดภัย (non-root, scan vulnerabilities)
- Configuration (env vars, secrets)
- Versioning (tag images ถูกต้อง)

## สิ่งที่ต้องมีก่อน

- [Lab 12-14](../lab-14-registry/) — ทุก concept ใน Level 3

## สิ่งที่จะใช้ในโปรเจคนี้

- Multi-stage builds (Lab 12)
- Security best practices (Lab 13)
- Docker Registry (Lab 14)
- Docker Compose (Lab 08)
- Healthchecks (Lab 10)

## โจทย์

สร้าง **Production-ready REST API** ที่มีคุณสมบัติ:

| คุณสมบัติ | รายละเอียด |
|-----------|-----------|
| Multi-stage build | image เล็ก < 200 MB |
| Non-root user | ไม่รันด้วย root |
| Healthcheck | ตรวจสอบสถานะอัตโนมัติ |
| Environment config | แยก dev / production |
| Logging | structured JSON logs |
| Graceful shutdown | ปิดอย่างถูกต้อง |
| Push to registry | อยู่บน Docker Hub |

## โครงสร้างโปรเจค

```
lab-15-project-production-api/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── api/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── src/
│       └── index.js
└── README.md
```

## ขั้นตอน

### Step 1: เขียน Production Dockerfile

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json .
RUN npm ci --omit=dev

# Stage 2: Production
FROM node:20-alpine

# Security: non-root user
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Copy production dependencies
COPY --from=deps --chown=app:app /app/node_modules ./node_modules
COPY --chown=app:app . .

USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --spider http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
```

### Step 2: Graceful Shutdown

```javascript
// src/index.js
const server = app.listen(PORT, () => {
  console.log(JSON.stringify({ level: 'info', message: `Server started on port ${PORT}` }));
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(JSON.stringify({ level: 'info', message: `${signal} received, shutting down...` }));
  server.close(() => {
    console.log(JSON.stringify({ level: 'info', message: 'Server closed' }));
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

### Step 3: แยก Compose สำหรับ Dev และ Prod

`docker-compose.yml` (development):
```yaml
services:
  api:
    build: ./api
    ports:
      - "3000:3000"
    volumes:
      - ./api:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev
```

`docker-compose.prod.yml` (production):
```yaml
services:
  api:
    build: ./api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    deploy:
      resources:
        limits:
          memory: 256M
    read_only: true
    tmpfs:
      - /tmp
```

### Step 4: Build, Tag, Push

```bash
# Build
docker build -t myuser/prod-api:1.0.0 ./api

# Test
docker compose -f docker-compose.prod.yml up

# Push
docker push myuser/prod-api:1.0.0
```

## Checklist

- [ ] Multi-stage Dockerfile — image < 200 MB
- [ ] Non-root user
- [ ] Healthcheck ทำงาน
- [ ] Graceful shutdown (SIGTERM)
- [ ] Structured logging (JSON)
- [ ] แยก dev / production compose files
- [ ] Resource limits ใน production
- [ ] Read-only filesystem ใน production
- [ ] Image pushed ไป Docker Hub
- [ ] Vulnerability scan ผ่าน

## สรุป

คุณเพิ่งเตรียม app สำหรับ production! สิ่งที่ต่างจาก development:
- Image เล็กลงจาก multi-stage builds
- ปลอดภัยขึ้นจาก non-root user และ read-only filesystem
- มี healthcheck สำหรับ monitoring
- Graceful shutdown ป้องกันข้อมูลเสียหาย
- Push ไป registry พร้อม deploy

## ต่อไป

[Lab 16 — CI/CD with GitHub Actions →](../lab-16-ci-cd/)
