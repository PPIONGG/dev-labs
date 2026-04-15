# Lab 03 — Docker Images & Layers

## เป้าหมาย

เข้าใจว่า Docker Image ทำงานอย่างไร ระบบ layers คืออะไร และวิธีจัดการ images

## ทำไมต้องรู้?

Image คือหัวใจของ Docker ถ้าเข้าใจว่ามันทำงานยังไง จะช่วยให้:
- สร้าง image ได้เล็กและเร็วขึ้น
- debug ปัญหาได้ง่ายขึ้น
- ใช้ cache อย่างมีประสิทธิภาพ

## สิ่งที่ต้องมีก่อน

- [Lab 02](../lab-02-first-container/) — ติดตั้ง Docker แล้ว

## เนื้อหา

### 1. Image คืออะไร?

Image คือ **read-only template** ที่ใช้สร้าง container เปรียบเหมือน:
- Image = แม่พิมพ์ขนม
- Container = ขนมที่พิมพ์ออกมา

Image หนึ่งตัวสามารถสร้าง container ได้หลายตัว

### 2. Layers ระบบชั้น

Image ไม่ได้เป็นก้อนเดียว แต่ประกอบจากหลาย **layers** ซ้อนกัน:

```
+-------------------+
| Layer 4: COPY app | ← เฉพาะของเรา
+-------------------+
| Layer 3: RUN npm  | ← ติดตั้ง packages
+-------------------+
| Layer 2: Node.js  | ← runtime
+-------------------+
| Layer 1: Ubuntu   | ← base OS
+-------------------+
```

- แต่ละ layer เป็น read-only
- layers ที่เหมือนกันจะ **share** กัน (ประหยัดพื้นที่)
- เมื่อรัน container จะเพิ่ม **writable layer** ด้านบน

### 3. Docker Hub — Registry สำเร็จรูป

[Docker Hub](https://hub.docker.com/) เป็นที่เก็บ images สำเร็จรูป เหมือน npm สำหรับ Docker

```bash
# ค้นหา image
docker search node

# ดาวน์โหลด image (ไม่ต้องรัน)
docker pull node:20-alpine

# ดู images ที่มีในเครื่อง
docker images
```

### 4. Image Tags

Tag คือ "เวอร์ชัน" ของ image

```bash
# ดาวน์โหลด node เวอร์ชันต่างๆ
docker pull node:20          # Node 20 บน Debian (ใหญ่)
docker pull node:20-slim     # Node 20 ตัดของไม่จำเป็นออก
docker pull node:20-alpine   # Node 20 บน Alpine Linux (เล็กมาก)
```

| Tag | ขนาดประมาณ | ใช้เมื่อ |
|-----|-----------|---------|
| `node:20` | ~1 GB | ต้องการ libraries ครบ |
| `node:20-slim` | ~200 MB | ใช้งานทั่วไป |
| `node:20-alpine` | ~50 MB | ต้องการ image เล็ก |

### 5. ดูรายละเอียด Image

```bash
# ดูประวัติ layers ของ image
docker history node:20-alpine

# ดูข้อมูลละเอียด
docker inspect node:20-alpine
```

### 6. จัดการ Images

```bash
# ดู images ทั้งหมด
docker images

# ดูขนาดรวม
docker system df

# ลบ image
docker rmi node:20

# ลบ images ที่ไม่ได้ใช้
docker image prune

# ลบทุกอย่างที่ไม่ได้ใช้ (images, containers, networks)
docker system prune
```

## แบบฝึกหัด

1. Pull image `node:20`, `node:20-slim`, และ `node:20-alpine` แล้วเปรียบเทียบขนาด
2. ใช้ `docker history node:20-alpine` ดู layers
3. รัน 2 containers จาก image เดียวกัน แล้วสังเกตว่า layers ถูก share
4. ใช้ `docker system df` ดูว่า Docker ใช้พื้นที่เท่าไหร่
5. ลบ images ที่ไม่ต้องการด้วย `docker rmi`

## สรุป

- Image = read-only template ที่ประกอบจากหลาย layers
- Layers ที่เหมือนกันจะ share กัน ประหยัดพื้นที่
- Docker Hub = ที่เก็บ images สำเร็จรูป
- Tag = เวอร์ชันของ image เลือกให้เหมาะกับงาน
- Alpine images เล็กที่สุด เหมาะกับ production

## ต่อไป

[Lab 04 — เขียน Dockerfile →](../lab-04-dockerfile/)
