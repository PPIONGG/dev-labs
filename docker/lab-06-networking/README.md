# Lab 06 — Networking: เชื่อมต่อ Containers

## เป้าหมาย

เข้าใจ Docker networking และวิธีให้ containers คุยกันได้

## ทำไมต้องรู้?

ในงานจริง แอปไม่ได้รันตัวเดียว — ต้องคุยกับ database, cache, หรือ service อื่น การเข้าใจ networking ทำให้เชื่อมต่อ containers เข้าด้วยกันได้

## สิ่งที่ต้องมีก่อน

- [Lab 05](../lab-05-volumes/) — เข้าใจ volumes

## เนื้อหา

### 1. Docker Network คืออะไร?

Docker สร้าง virtual network ให้ containers สื่อสารกันได้ เหมือนเครือข่ายจำลอง

```
+------ Docker Network ------+
|                             |
|  +-------+    +-------+    |
|  | App   | ←→ | DB    |    |
|  | :3000 |    | :5432 |    |
|  +-------+    +-------+    |
|                             |
+-----------------------------+
```

### 2. ประเภท Network

| ประเภท | คำอธิบาย | ใช้เมื่อ |
|--------|----------|---------|
| `bridge` | default — containers ใน network เดียวกันคุยกันได้ | ใช้งานทั่วไป |
| `host` | container ใช้ network ของเครื่อง host โดยตรง | ต้องการ performance สูง |
| `none` | ไม่มี network เลย | ต้องการ isolation สูง |

### 3. คำสั่งจัดการ Network

```bash
# ดู networks ทั้งหมด
docker network ls

# สร้าง network
docker network create my-network

# ดูรายละเอียด
docker network inspect my-network

# ลบ network
docker network rm my-network
```

### 4. เชื่อมต่อ Containers

```bash
# สร้าง network
docker network create app-network

# รัน database container
docker run -d \
  --name my-db \
  --network app-network \
  -e POSTGRES_PASSWORD=secret \
  postgres:16-alpine

# รัน app container ใน network เดียวกัน
docker run -it \
  --name my-app \
  --network app-network \
  node:20-alpine sh

# ใน my-app container สามารถเข้าถึง database ได้โดยใช้ชื่อ container
# ping my-db   ← ใช้ชื่อ container แทน IP ได้เลย!
```

### 5. DNS อัตโนมัติ

ใน custom network (ที่เราสร้างเอง) Docker จะทำ DNS ให้อัตโนมัติ:
- ใช้ **ชื่อ container** เป็น hostname ได้เลย
- ไม่ต้องจำ IP address

```bash
# ใน my-app container
ping my-db          # ใช้ชื่อ container
# แทนที่จะต้องรู้ว่า IP คือ 172.18.0.2
```

### 6. Port Mapping

```bash
# เปิดพอร์ตให้เข้าถึงจากนอก Docker
docker run -d -p 8080:80 nginx
#              ↑     ↑
#           เครื่อง  container

# host:container
# เข้าถึงได้ที่ localhost:8080
```

```
เครื่องเรา                Docker
+-----------+          +----------+
| :8080     | ------→  | :80      |
| (เบราว์เซอร์) |       | (nginx)  |
+-----------+          +----------+
```

## แบบฝึกหัด

### ฝึก 1: สร้าง Custom Network
1. สร้าง network ชื่อ `lab-network`
2. รัน 2 containers ใน network เดียวกัน
3. ทดสอบว่า containers ping กันได้โดยใช้ชื่อ

### ฝึก 2: App + Database
1. สร้าง network
2. รัน PostgreSQL container
3. รัน Node.js container ใน network เดียวกัน
4. ทดสอบเชื่อมต่อ database จาก Node.js container

### ฝึก 3: Port Mapping
1. รัน nginx ด้วย port mapping ต่างๆ (`-p 8080:80`, `-p 9090:80`)
2. เปิดเบราว์เซอร์ทดสอบแต่ละ port

## สรุป

- Docker สร้าง virtual network ให้ containers สื่อสารกัน
- ใช้ `docker network create` สร้าง custom network
- Containers ใน network เดียวกันใช้ **ชื่อ container** เป็น hostname ได้เลย
- `-p host:container` เปิดพอร์ตให้เข้าถึงจากนอก Docker
- ควรสร้าง custom network เสมอ (ไม่ควรใช้ default bridge)

## ต่อไป

[Lab 07 — Project: Containerize Node.js App →](../lab-07-project-node-app/)
