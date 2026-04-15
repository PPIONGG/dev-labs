# Lab 08 — Docker Compose พื้นฐาน

## เป้าหมาย

เรียนรู้ Docker Compose สำหรับจัดการหลาย containers พร้อมกัน

## ทำไมต้องรู้?

จาก Lab 06 เราต้องพิมพ์คำสั่ง `docker run` ยาวๆ หลายบรรทัดสำหรับแต่ละ container แถมต้องสร้าง network เอง ลองนึกภาพว่ามี 5-10 containers — จะพิมพ์คำสั่งไม่ไหว!

Docker Compose ช่วยให้เขียนทุกอย่างลงในไฟล์เดียว แล้วสั่ง `docker compose up` จบ

## สิ่งที่ต้องมีก่อน

- [Lab 07](../lab-07-project-node-app/) — Containerize app ได้

## เนื้อหา

### 1. Docker Compose คืออะไร?

Docker Compose คือเครื่องมือสำหรับ **กำหนดและรันหลาย containers** ด้วยไฟล์ YAML ไฟล์เดียว

```
ก่อน Compose:                     หลัง Compose:
docker network create ...         docker compose up
docker run --name db ...          (จบ!)
docker run --name cache ...
docker run --name app ...
```

### 2. ไฟล์ docker-compose.yml

```yaml
services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"

  api:
    build: ./api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_PASSWORD=secret
    volumes:
      - db-data:/var/lib/postgresql/data

volumes:
  db-data:
```

### 3. โครงสร้างไฟล์

| key | หน้าที่ | ตัวอย่าง |
|-----|---------|---------|
| `services` | กำหนด containers | `web`, `api`, `db` |
| `image` | ใช้ image สำเร็จรูป | `nginx:alpine` |
| `build` | build จาก Dockerfile | `./api` |
| `ports` | port mapping | `"8080:80"` |
| `environment` | ตั้ง env vars | `NODE_ENV=dev` |
| `volumes` | mount volumes | `db-data:/data` |
| `depends_on` | ลำดับการเริ่มต้น | `depends_on: [db]` |
| `networks` | กำหนด network | (สร้างอัตโนมัติ) |

### 4. คำสั่งหลัก

```bash
# เริ่มต้นทุก services (สร้าง + รัน)
docker compose up

# รันใน background
docker compose up -d

# ดูสถานะ
docker compose ps

# ดู logs
docker compose logs
docker compose logs api    # เฉพาะ service

# หยุดทุก services
docker compose stop

# หยุดและลบทุกอย่าง (containers, networks)
docker compose down

# หยุด ลบ รวมถึง volumes
docker compose down -v

# Build images ใหม่
docker compose build

# Build ใหม่แล้วรัน
docker compose up --build
```

### 5. ตัวอย่าง: Web + API

สร้างโครงสร้าง:
```
lab-08-compose-basics/
├── docker-compose.yml
├── api/
│   ├── Dockerfile
│   ├── package.json
│   └── index.js
└── web/
    └── index.html
```

`docker-compose.yml`:
```yaml
services:
  api:
    build: ./api
    ports:
      - "3000:3000"

  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./web:/usr/share/nginx/html:ro
    depends_on:
      - api
```

### 6. Compose สร้าง Network อัตโนมัติ

Compose จะสร้าง network ให้โดยอัตโนมัติ ทุก services ใน compose file เดียวกันจะคุยกันได้โดยใช้ **ชื่อ service** เป็น hostname

```javascript
// ใน api container สามารถเข้าถึง db ได้ด้วย:
const dbHost = 'db';  // ใช้ชื่อ service ใน compose
```

## แบบฝึกหัด

### ฝึก 1: สร้าง Compose File แรก
1. สร้าง `docker-compose.yml` ที่มี nginx service
2. `docker compose up -d` แล้วเปิดเบราว์เซอร์
3. `docker compose down` เพื่อหยุด

### ฝึก 2: หลาย Services
1. สร้าง compose file ที่มี api (Node.js) + web (nginx)
2. ให้ web service depends_on api
3. ทดสอบว่าทั้งสองเข้าถึงได้

### ฝึก 3: ใช้ Volumes กับ Compose
1. เพิ่ม PostgreSQL service พร้อม named volume
2. เขียนข้อมูลลง database
3. `docker compose down` แล้ว `up` ใหม่
4. ยืนยันว่าข้อมูลยังอยู่

## สรุป

- Docker Compose จัดการหลาย containers ด้วยไฟล์ YAML ไฟล์เดียว
- `docker compose up` เริ่มทุกอย่าง, `docker compose down` หยุดทุกอย่าง
- Compose สร้าง network อัตโนมัติ — ใช้ชื่อ service เป็น hostname ได้เลย
- `depends_on` กำหนดลำดับการเริ่มต้น

## ต่อไป

[Lab 09 — Environment Variables & Secrets →](../lab-09-env-and-secrets/)
