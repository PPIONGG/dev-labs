# Lab 12 — Multi-stage Builds

## เป้าหมาย

เรียนรู้ multi-stage builds เพื่อสร้าง Docker image ที่เล็กและปลอดภัยสำหรับ production

## ทำไมต้องรู้?

Image ที่เราสร้างจนถึงตอนนี้มีปัญหา:
- มี dev dependencies รวมอยู่ (เช่น nodemon, test tools)
- มี source files ที่ไม่จำเป็น
- ขนาดใหญ่เกินไป

Multi-stage builds ช่วยให้ **แยก build กับ run** — image สุดท้ายมีแค่สิ่งที่ต้องใช้จริง

## สิ่งที่ต้องมีก่อน

- [Lab 11](../lab-11-project-fullstack/) — สร้าง fullstack app ได้

## เนื้อหา

### 1. ปัญหาของ Single-stage Build

```dockerfile
# Single-stage — image ใหญ่!
FROM node:20
WORKDIR /app
COPY package*.json .
RUN npm install          # รวม devDependencies ด้วย!
COPY . .
RUN npm run build        # build tools อยู่ใน image สุดท้าย
CMD ["node", "dist/app.js"]

# ผลลัพธ์: ~1 GB image
```

### 2. Multi-stage Build คืออะไร?

ใช้หลาย `FROM` ใน Dockerfile เดียว — แต่ละ FROM คือ "stage" หนึ่ง โดย image สุดท้ายจะเอาแค่สิ่งที่ COPY มาจาก stage ก่อนหน้า

```dockerfile
# Stage 1: Build
FROM node:20 AS builder
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production (image สุดท้าย)
FROM node:20-alpine
WORKDIR /app
COPY package*.json .
RUN npm install --omit=dev   # เฉพาะ production deps
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/app.js"]

# ผลลัพธ์: ~150 MB image
```

```
Stage 1 (builder):        Stage 2 (production):
+------------------+      +------------------+
| node:20 (full)   |      | node:20-alpine   |
| source code      |      | prod deps only   |
| all dependencies |  →   | dist/ (built)    |
| build tools      |      |                  |
| dist/ (output)   |      | ~150 MB          |
| ~1 GB            |      +------------------+
+------------------+           ↑
        |                      |
        +--- COPY --from=builder /app/dist ---+
```

### 3. ตัวอย่าง: Node.js TypeScript App

```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json .
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app
COPY package*.json .
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### 4. ตัวอย่าง: React App (Static Files)

```dockerfile
# Stage 1: Build React app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve ด้วย nginx
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ผลลัพธ์: ~25 MB image (แทนที่จะเป็น ~1 GB)
```

### 5. เทคนิคเพิ่มเติม

#### Build เฉพาะ stage ที่ต้องการ
```bash
# Build เฉพาะ stage "builder"
docker build --target builder -t my-app:builder .
```

#### ใช้ ARG ข้าม stages
```dockerfile
ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-alpine AS builder
# ...

FROM node:${NODE_VERSION}-alpine
# ...
```

### 6. เปรียบเทียบขนาด

| วิธี | ขนาดประมาณ |
|------|-----------|
| Single-stage (node:20) | ~1 GB |
| Single-stage (node:20-alpine) | ~300 MB |
| Multi-stage (alpine + prod only) | ~150 MB |
| Multi-stage (React → nginx) | ~25 MB |

## แบบฝึกหัด

### ฝึก 1: แปลง Single → Multi-stage
1. เขียน single-stage Dockerfile สำหรับ Node.js app
2. แปลงเป็น multi-stage build
3. เปรียบเทียบขนาด image ทั้งสอง

### ฝึก 2: React App
1. สร้าง React app ด้วย `npx create-react-app`
2. เขียน multi-stage Dockerfile (build → nginx)
3. Build และรัน — เปิดดูในเบราว์เซอร์

### ฝึก 3: 3-stage Build
1. สร้าง TypeScript Express app
2. เขียน Dockerfile 3 stages: deps → build → production
3. ยืนยันว่า image สุดท้ายไม่มี TypeScript compiler

## สรุป

- Multi-stage builds แยก build environment กับ runtime environment
- Image สุดท้ายมีแค่สิ่งที่จำเป็น — เล็กลงและปลอดภัยขึ้น
- `COPY --from=<stage>` คัดลอกไฟล์จาก stage อื่น
- React/frontend apps: build → nginx = image เล็กมาก (~25 MB)

## ต่อไป

[Lab 13 — Security Best Practices →](../lab-13-security/)
