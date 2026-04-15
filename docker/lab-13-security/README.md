# Lab 13 — Security Best Practices

## เป้าหมาย

เรียนรู้แนวทางรักษาความปลอดภัยของ Docker containers สำหรับ production

## ทำไมต้องรู้?

Container ที่ไม่ปลอดภัยอาจทำให้:
- ผู้โจมตีเข้าถึงเครื่อง host ได้
- ข้อมูลลับรั่วไหล
- ถูกใช้เป็นฐานโจมตีระบบอื่น

การตั้งค่าความปลอดภัยที่ดีลดความเสี่ยงเหล่านี้ได้มาก

## สิ่งที่ต้องมีก่อน

- [Lab 12](../lab-12-multistage-builds/) — Multi-stage builds

## เนื้อหา

### 1. อย่ารันด้วย root

ปัญหา: ปกติ container รันด้วย root — ถ้า container ถูก hack ผู้โจมตีจะได้สิทธิ์ root

```dockerfile
# ไม่ดี — รันด้วย root
FROM node:20-alpine
WORKDIR /app
COPY . .
CMD ["node", "app.js"]

# ดี — สร้าง user สำหรับรัน app
FROM node:20-alpine
WORKDIR /app
COPY . .

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

CMD ["node", "app.js"]
```

### 2. ใช้ Specific Image Tags

```dockerfile
# ไม่ดี — ไม่รู้ว่าจะได้เวอร์ชันไหน
FROM node:latest
FROM node

# ดี — ระบุเวอร์ชันชัดเจน
FROM node:20.11-alpine

# ดียิ่งขึ้น — ใช้ digest (hash ของ image)
FROM node:20.11-alpine@sha256:abc123...
```

### 3. Scan Images สำหรับ Vulnerabilities

```bash
# ใช้ Docker Scout (มาพร้อม Docker Desktop)
docker scout cves my-app:latest

# หรือใช้ Trivy (open source)
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image my-app:latest
```

### 4. ลดจำนวน Packages

```dockerfile
# ไม่ดี — ใช้ full image มี packages มากมาย
FROM node:20

# ดี — Alpine มี packages น้อย โจมตียากกว่า
FROM node:20-alpine

# อย่าติดตั้งสิ่งที่ไม่จำเป็น
RUN apk add --no-cache curl  # ติดตั้งเฉพาะที่ต้องใช้
```

### 5. ใช้ Read-only Filesystem

```yaml
# docker-compose.yml
services:
  api:
    image: my-app
    read_only: true
    tmpfs:
      - /tmp
      - /app/temp
```

### 6. จำกัด Resources

```yaml
services:
  api:
    image: my-app
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          memory: 128M
```

### 7. อย่าเก็บ Secrets ใน Image

```dockerfile
# ห้ามเด็ดขาด!
ENV API_KEY=sk-12345
COPY .env .

# ส่งผ่าน environment variables แทน
# docker run -e API_KEY=sk-12345 my-app
```

### 8. .dockerignore ที่ครบถ้วน

```
.git
.env
.env.*
node_modules
*.md
tests/
coverage/
.github/
docker-compose*.yml
```

### 9. Security Checklist

```dockerfile
# Dockerfile ที่ปลอดภัย
FROM node:20.11-alpine

# ไม่รันด้วย root
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Install dependencies ก่อน (cache layer)
COPY package*.json .
RUN npm ci --omit=dev && npm cache clean --force

# Copy source
COPY --chown=app:app . .

# ใช้ user ที่สร้าง
USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --spider http://localhost:3000/health || exit 1

CMD ["node", "index.js"]
```

## แบบฝึกหัด

### ฝึก 1: Non-root User
1. สร้าง Dockerfile ที่รันด้วย non-root user
2. ยืนยันด้วย `docker exec <container> whoami`

### ฝึก 2: Scan Vulnerabilities
1. Build image ด้วย `FROM node:20` (full image)
2. Scan ด้วย `docker scout cves`
3. เปลี่ยนเป็น `node:20-alpine` แล้ว scan ใหม่
4. เปรียบเทียบจำนวน vulnerabilities

### ฝึก 3: Read-only Container
1. รัน container ด้วย `--read-only`
2. ลองเขียนไฟล์ — ดูว่าเกิดอะไร
3. เพิ่ม tmpfs สำหรับ directory ที่ต้องเขียนได้

## สรุป

- **อย่ารันด้วย root** — สร้าง user ด้วย `adduser` + `USER`
- **ระบุ image tag** — ไม่ใช้ `latest` หรือไม่ระบุ
- **Scan vulnerabilities** — ใช้ Docker Scout หรือ Trivy
- **ลด attack surface** — ใช้ Alpine, ติดตั้งเฉพาะที่จำเป็น
- **ไม่เก็บ secrets ใน image** — ส่งผ่าน env vars หรือ Docker Secrets

## ต่อไป

[Lab 14 — Docker Registry →](../lab-14-registry/)
