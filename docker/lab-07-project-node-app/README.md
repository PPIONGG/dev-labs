# Lab 07 — Project: Containerize Node.js App

## เป้าหมาย

รวม concept ทั้งหมดจาก Level 1 มาสร้าง Node.js application ที่รันบน Docker ตั้งแต่ต้นจนจบ

## ทำไมต้องทำ?

ถึงเวลาเอาทุกอย่างที่เรียนมารวมกัน! Lab นี้จะจำลองสถานการณ์จริง — สร้างแอป เขียน Dockerfile ใช้ volumes สำหรับ development และ network สำหรับเชื่อมต่อ

## สิ่งที่ต้องมีก่อน

- [Lab 01](../lab-01-what-is-docker/) ถึง [Lab 06](../lab-06-networking/) — ทุก concept ใน Level 1

## สิ่งที่จะใช้ในโปรเจคนี้

- Dockerfile (Lab 04)
- Volumes / Bind Mounts (Lab 05)
- Networking / Port Mapping (Lab 06)
- .dockerignore (Lab 04)

## โจทย์

สร้าง **REST API** ง่ายๆ ด้วย Express.js ที่:
1. มี endpoint `GET /` — แสดง welcome message
2. มี endpoint `GET /health` — แสดงสถานะ
3. มี endpoint `GET /info` — แสดงข้อมูล container (hostname, uptime)
4. รันบน Docker ได้

## โครงสร้างโปรเจค

```
lab-07-project-node-app/
├── README.md
├── app/
│   ├── package.json
│   ├── index.js
│   ├── Dockerfile
│   └── .dockerignore
```

## ขั้นตอน

### Step 1: สร้าง Express App

สร้างไฟล์ `app/package.json`:
```json
{
  "name": "docker-node-app",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}
```

สร้างไฟล์ `app/index.js`:
```javascript
const express = require('express');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Docker!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/info', (req, res) => {
  res.json({
    hostname: os.hostname(),
    platform: os.platform(),
    uptime: process.uptime(),
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 2: เขียน Dockerfile

สร้างไฟล์ `app/Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json .
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Step 3: สร้าง .dockerignore

สร้างไฟล์ `app/.dockerignore`:
```
node_modules
.git
*.md
```

### Step 4: Build & Run

```bash
cd app

# Build image
docker build -t my-node-app .

# รัน container
docker run -d -p 3000:3000 --name my-app my-node-app

# ทดสอบ
curl http://localhost:3000/
curl http://localhost:3000/health
curl http://localhost:3000/info
```

### Step 5: Development Mode (Bind Mount)

```bash
# รันแบบ development — แก้โค้ดแล้วเห็นผลทันที
docker run -d \
  -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  --name my-app-dev \
  my-node-app \
  npm run dev
```

## Checklist

- [ ] สร้าง Express app ได้
- [ ] เขียน Dockerfile ได้
- [ ] Build image สำเร็จ
- [ ] รัน container และเข้าถึง API ได้
- [ ] ใช้ bind mount สำหรับ development ได้
- [ ] เข้าใจทุก flag ที่ใช้ (`-d`, `-p`, `-v`, `--name`)

## สรุป

คุณเพิ่ง containerize แอปเป็นครั้งแรก! สิ่งที่ทำ:
- สร้าง Dockerfile ที่ใช้ cache layers อย่างมีประสิทธิภาพ
- ใช้ .dockerignore ลดขนาด build context
- ใช้ bind mount สำหรับ development workflow
- เข้าใจ port mapping สำหรับเข้าถึง container

## ต่อไป

[Lab 08 — Docker Compose พื้นฐาน →](../lab-08-compose-basics/)
