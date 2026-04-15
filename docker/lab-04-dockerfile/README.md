# Lab 04 — เขียน Dockerfile

## เป้าหมาย

เขียน Dockerfile เป็น เพื่อสร้าง custom Docker image ของตัวเอง

## ทำไมต้องรู้?

จนถึงตอนนี้เราใช้แต่ images สำเร็จรูป แต่ในงานจริงเราต้อง **สร้าง image ของแอปเราเอง** Dockerfile คือไฟล์ที่บอก Docker ว่าจะสร้าง image ยังไง

## สิ่งที่ต้องมีก่อน

- [Lab 03](../lab-03-images-and-layers/) — เข้าใจ images และ layers

## เนื้อหา

### 1. Dockerfile คืออะไร?

Dockerfile คือไฟล์ text ที่มีคำสั่งบอก Docker ทีละขั้นว่าจะสร้าง image อย่างไร

```dockerfile
# เลือก base image
FROM node:20-alpine

# ตั้ง working directory ใน container
WORKDIR /app

# คัดลอกไฟล์จากเครื่องเราไปใน container
COPY package.json .

# รันคำสั่ง (ตอนสร้าง image)
RUN npm install

# คัดลอก source code
COPY . .

# เปิดพอร์ต (เป็นแค่ documentation)
EXPOSE 3000

# คำสั่งที่รันเมื่อ container เริ่มทำงาน
CMD ["node", "app.js"]
```

### 2. คำสั่งหลักใน Dockerfile

| คำสั่ง | หน้าที่ | ตัวอย่าง |
|--------|---------|---------|
| `FROM` | เลือก base image | `FROM node:20-alpine` |
| `WORKDIR` | ตั้ง directory ทำงาน | `WORKDIR /app` |
| `COPY` | คัดลอกไฟล์เข้า image | `COPY . .` |
| `ADD` | เหมือน COPY แต่แตก tar ได้ | `ADD app.tar.gz /app` |
| `RUN` | รันคำสั่งตอน build | `RUN npm install` |
| `CMD` | คำสั่งตอนรัน container | `CMD ["node", "app.js"]` |
| `ENTRYPOINT` | คำสั่งหลักของ container | `ENTRYPOINT ["node"]` |
| `ENV` | ตั้ง environment variable | `ENV NODE_ENV=production` |
| `EXPOSE` | ประกาศพอร์ต (documentation) | `EXPOSE 3000` |
| `ARG` | ตัวแปรตอน build | `ARG VERSION=1.0` |

### 3. CMD vs ENTRYPOINT

```dockerfile
# CMD — ถูกแทนที่ได้ตอน docker run
CMD ["node", "app.js"]
# docker run myapp             → รัน node app.js
# docker run myapp bash        → รัน bash แทน

# ENTRYPOINT — ไม่ถูกแทนที่
ENTRYPOINT ["node"]
CMD ["app.js"]
# docker run myapp             → รัน node app.js
# docker run myapp server.js   → รัน node server.js
```

### 4. ลองสร้าง Image

สร้างไฟล์ `app.js`:
```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from Docker!\n');
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

สร้างไฟล์ `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY app.js .
EXPOSE 3000
CMD ["node", "app.js"]
```

Build และรัน:
```bash
# สร้าง image (อย่าลืม . ตอนท้าย = build context)
docker build -t my-app .

# รัน container
docker run -d -p 3000:3000 my-app

# เปิด http://localhost:3000
```

### 5. .dockerignore

เหมือน `.gitignore` — บอก Docker ว่าไม่ต้อง copy ไฟล์อะไรบ้าง

```
node_modules
.git
.env
*.md
```

### 6. Best Practices เบื้องต้น

```dockerfile
# ดี — COPY package.json ก่อน แล้วค่อย npm install
# ทำให้ Docker cache layer ของ npm install ไว้
COPY package.json .
RUN npm install
COPY . .

# ไม่ดี — ถ้า source code เปลี่ยน ต้อง npm install ใหม่ทุกครั้ง
COPY . .
RUN npm install
```

## แบบฝึกหัด

### ฝึก 1: สร้าง Hello World Image
1. สร้างไฟล์ `app.js` ตามตัวอย่างด้านบน
2. สร้าง `Dockerfile`
3. Build image ด้วย `docker build -t my-app .`
4. รันและเปิดดูในเบราว์เซอร์

### ฝึก 2: ใช้ Environment Variable
1. แก้ `app.js` ให้อ่านพอร์ตจาก `process.env.PORT`
2. เพิ่ม `ENV PORT=3000` ใน Dockerfile
3. Build ใหม่และทดสอบ

### ฝึก 3: สร้าง .dockerignore
1. สร้าง `.dockerignore` ที่มี `node_modules` และ `.git`
2. Build image แล้วเทียบขนาดกับตอนไม่มี `.dockerignore`

## สรุป

- Dockerfile = สูตรสำหรับสร้าง image
- `FROM` → `WORKDIR` → `COPY` → `RUN` → `CMD` คือ flow พื้นฐาน
- ใช้ `.dockerignore` เพื่อไม่ให้ copy ไฟล์ไม่จำเป็น
- เรียงลำดับ COPY อย่างชาญฉลาดเพื่อใช้ประโยชน์จาก cache

## ต่อไป

[Lab 05 — Volumes →](../lab-05-volumes/)
