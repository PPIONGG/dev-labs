# Lab 02 — ติดตั้ง Docker & รัน Container แรก

## เป้าหมาย

ติดตั้ง Docker บนเครื่อง และรัน container แรกให้สำเร็จ

## ทำไมต้องรู้?

ก่อนจะทำอะไรกับ Docker ได้ ต้องติดตั้งและเข้าใจคำสั่งพื้นฐานก่อน

## สิ่งที่ต้องมีก่อน

- เครื่องคอมพิวเตอร์ (Mac, Windows, หรือ Linux)
- สิทธิ์ Admin สำหรับติดตั้งโปรแกรม

## เนื้อหา

### 1. ติดตั้ง Docker

#### macOS
1. ไปที่ [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
2. ดาวน์โหลดและติดตั้ง
3. เปิด Docker Desktop

#### Windows
1. ไปที่ [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
2. ดาวน์โหลดและติดตั้ง
3. เปิด WSL 2 (ถ้ายังไม่ได้เปิด)
4. เปิด Docker Desktop

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. ตรวจสอบการติดตั้ง

```bash
# เช็คเวอร์ชัน
docker --version

# เช็คว่า Docker ทำงานได้
docker info
```

### 3. รัน Container แรก

```bash
# รัน hello-world image
docker run hello-world
```

เมื่อรันคำสั่งนี้ Docker จะ:
1. หา image `hello-world` ในเครื่อง → ไม่เจอ
2. ดาวน์โหลดจาก Docker Hub
3. สร้าง container จาก image
4. รัน container → แสดงข้อความ
5. container หยุดทำงาน

### 4. คำสั่งพื้นฐาน

```bash
# ดูรายการ containers ที่กำลังรันอยู่
docker ps

# ดูรายการ containers ทั้งหมด (รวมที่หยุดแล้ว)
docker ps -a

# ดูรายการ images ที่มีในเครื่อง
docker images

# ลบ container
docker rm <container_id>

# ลบ image
docker rmi <image_name>
```

### 5. ลองเล่นกับ Container จริง

```bash
# รัน nginx web server
docker run -d -p 8080:80 nginx

# -d = รันใน background (detached mode)
# -p 8080:80 = เชื่อมพอร์ต 8080 ของเครื่องเรากับพอร์ต 80 ของ container
```

เปิดเบราว์เซอร์ไปที่ `http://localhost:8080` จะเห็นหน้า Welcome ของ nginx

```bash
# หยุด container
docker stop <container_id>

# รัน Ubuntu container แบบ interactive
docker run -it ubuntu bash

# -it = interactive + terminal
# จะเข้าไปใน Ubuntu container เลย ลองพิมพ์:
# ls, pwd, cat /etc/os-release
# พิมพ์ exit เพื่อออก
```

## แบบฝึกหัด

1. ติดตั้ง Docker บนเครื่องของคุณ
2. รัน `docker run hello-world` ให้สำเร็จ
3. รัน nginx container และเปิดดูในเบราว์เซอร์
4. ใช้ `docker ps` ดูว่ามี container อะไรรันอยู่บ้าง
5. หยุด nginx container ด้วย `docker stop`
6. ลองเข้าไปใน Ubuntu container ด้วย `docker run -it ubuntu bash`

## สรุป

- `docker run` = สร้างและรัน container จาก image
- `-d` = รันใน background
- `-p` = map port ระหว่างเครื่องเรากับ container
- `-it` = เข้าไปใช้งานใน container แบบ interactive
- `docker ps` = ดู containers ที่กำลังรัน
- `docker images` = ดู images ที่มีในเครื่อง

## ต่อไป

[Lab 03 — Docker Images & Layers →](../lab-03-images-and-layers/)
