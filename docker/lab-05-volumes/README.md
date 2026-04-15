# Lab 05 — Volumes: เก็บข้อมูลถาวร

## เป้าหมาย

เข้าใจว่า container เก็บข้อมูลอย่างไร และวิธีใช้ Volumes เพื่อไม่ให้ข้อมูลหายเมื่อ container ถูกลบ

## ทำไมต้องรู้?

ปกติเมื่อลบ container ข้อมูลทั้งหมดข้างในจะ **หายไปด้วย** ลองนึกภาพ:
- Database ที่เก็บข้อมูลผู้ใช้ → ลบ container = ข้อมูลหาย!
- Log files → ลบ container = log หาย!

Volumes ช่วยให้ข้อมูลอยู่รอดแม้ container ถูกลบ

## สิ่งที่ต้องมีก่อน

- [Lab 04](../lab-04-dockerfile/) — เขียน Dockerfile เป็น

## เนื้อหา

### 1. ปัญหา — ข้อมูลหายเมื่อลบ Container

```bash
# สร้าง container และเขียนไฟล์
docker run -it --name test ubuntu bash
echo "important data" > /data.txt
exit

# ลบ container
docker rm test

# สร้างใหม่ — data.txt หายไปแล้ว!
docker run -it --name test ubuntu bash
cat /data.txt  # ไม่มีไฟล์!
```

### 2. Volume คืออะไร?

Volume คือพื้นที่เก็บข้อมูลที่ Docker จัดการ อยู่ **นอก container** ทำให้:
- ข้อมูลไม่หายเมื่อลบ container
- หลาย containers ใช้ volume เดียวกันได้
- ง่ายต่อการ backup

### 3. ประเภทของ Storage

#### Named Volume (แนะนำ)
Docker จัดการ path ให้เอง

```bash
# สร้าง volume
docker volume create my-data

# ใช้ volume กับ container
docker run -v my-data:/app/data ubuntu bash

# ข้อมูลใน /app/data จะอยู่ถาวร
```

#### Bind Mount
ผูกโฟลเดอร์จากเครื่องเราเข้าไปใน container โดยตรง

```bash
# ผูกโฟลเดอร์ปัจจุบันเข้าไปใน container
docker run -v $(pwd):/app node:20-alpine ls /app

# เหมาะสำหรับ development — แก้โค้ดแล้วเห็นผลทันที
```

#### tmpfs Mount
เก็บใน memory เท่านั้น (เร็ว แต่หายเมื่อ container หยุด)

```bash
docker run --tmpfs /app/temp ubuntu bash
```

### 4. การใช้งาน Named Volume

```bash
# สร้าง volume
docker volume create app-data

# ดู volumes ทั้งหมด
docker volume ls

# ดูรายละเอียด
docker volume inspect app-data

# ใช้กับ container
docker run -d -v app-data:/data --name c1 ubuntu bash -c "echo hello > /data/test.txt && sleep 3600"

# อ่านจาก container อื่น (share volume)
docker run --rm -v app-data:/data ubuntu cat /data/test.txt
# Output: hello

# ลบ volume
docker volume rm app-data

# ลบ volumes ที่ไม่มี container ใช้
docker volume prune
```

### 5. Bind Mount สำหรับ Development

```bash
# สร้างไฟล์ index.js ในเครื่อง
echo 'console.log("hello")' > index.js

# รันโดยผูกโฟลเดอร์เข้าไป
docker run --rm -v $(pwd):/app -w /app node:20-alpine node index.js

# แก้ไฟล์ในเครื่อง → container เห็นการเปลี่ยนแปลงทันที
```

### 6. Volume ใน Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .

# ประกาศว่า container นี้ใช้ volume ที่ /app/data
VOLUME ["/app/data"]

CMD ["node", "app.js"]
```

## แบบฝึกหัด

### ฝึก 1: พิสูจน์ว่าข้อมูลหาย
1. รัน container เขียนไฟล์เข้าไป
2. ลบ container แล้วสร้างใหม่
3. ยืนยันว่าไฟล์หายไป

### ฝึก 2: ใช้ Named Volume
1. สร้าง volume ชื่อ `my-data`
2. รัน container ที่ mount volume แล้วเขียนข้อมูล
3. ลบ container สร้างใหม่ mount volume เดิม
4. ยืนยันว่าข้อมูลยังอยู่

### ฝึก 3: Bind Mount สำหรับ Dev
1. สร้าง Node.js app เล็กๆ
2. รัน container โดย bind mount โค้ด
3. แก้โค้ดในเครื่อง แล้วดูว่า container เห็นการเปลี่ยนแปลง

## สรุป

- ข้อมูลใน container จะหายเมื่อลบ container
- **Named Volume** — Docker จัดการให้ เหมาะกับ database, persistent data
- **Bind Mount** — ผูกโฟลเดอร์จากเครื่อง เหมาะกับ development
- `-v volume_name:/path` สำหรับ named volume
- `-v $(pwd):/path` สำหรับ bind mount

## ต่อไป

[Lab 06 — Networking →](../lab-06-networking/)
