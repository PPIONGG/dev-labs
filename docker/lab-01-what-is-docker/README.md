# Lab 01 — Docker คืออะไร? ทำไมต้องใช้?

## เป้าหมาย

เข้าใจว่า Docker คืออะไร แก้ปัญหาอะไร และแตกต่างจากวิธีเดิมอย่างไร

## ทำไมต้องรู้?

ลองนึกภาพว่าคุณเขียนเว็บเสร็จแล้ว รันบนเครื่องตัวเองได้สบาย แต่พอส่งให้เพื่อนร่วมทีม กลับรันไม่ได้ เพราะ:
- เวอร์ชัน Node.js ไม่ตรงกัน
- ลืมติดตั้ง database
- OS ต่างกัน (Mac vs Linux vs Windows)

นี่คือปัญหา **"It works on my machine"** ที่ Docker เข้ามาแก้

## เนื้อหา

### Container คืออะไร?

Container คือ "กล่อง" ที่บรรจุแอปพลิเคชันพร้อมทุกอย่างที่ต้องใช้ (code, runtime, libraries, config) ไว้ด้วยกัน ทำให้รันได้เหมือนกันทุกเครื่อง

```
+---------------------------+
|       Container           |
|  +-----+  +----------+   |
|  | App |  | Node.js   |   |
|  +-----+  +----------+   |
|  +----------+  +------+  |
|  | Libraries|  |Config |  |
|  +----------+  +------+  |
+---------------------------+
```

### Container vs Virtual Machine (VM)

| | Container | VM |
|---|-----------|-----|
| ขนาด | เล็ก (MB) | ใหญ่ (GB) |
| เริ่มต้น | วินาที | นาที |
| OS | ใช้ร่วมกับ host | มี OS เต็มของตัวเอง |
| ทรัพยากร | น้อย | มาก |
| Isolation | ระดับ process | ระดับ hardware |

```
Container:                    VM:
+-------+ +-------+          +-------+ +-------+
| App A | | App B |          | App A | | App B |
+-------+ +-------+          +-------+ +-------+
| Docker Engine   |          | OS    | | OS    |
+-----------------+          +-------+ +-------+
| Host OS         |          | Hypervisor      |
+-----------------+          +-----------------+
| Hardware        |          | Hardware        |
+-----------------+          +-----------------+
```

### Docker คืออะไร?

Docker คือเครื่องมือที่ช่วยสร้าง แจกจ่าย และรัน containers ประกอบด้วย:

- **Docker Engine** — โปรแกรมที่รัน containers
- **Docker Image** — "พิมพ์เขียว" สำหรับสร้าง container (เหมือน class)
- **Docker Container** — instance ที่รันจริง (เหมือน object)
- **Docker Hub** — ที่เก็บ images สำเร็จรูป (เหมือน npm registry)
- **Dockerfile** — ไฟล์คำสั่งสำหรับสร้าง image

### ทำไมคนถึงใช้ Docker?

1. **Consistency** — รันได้เหมือนกันทุกเครื่อง ทุก environment
2. **Isolation** — แต่ละแอปแยกกัน ไม่กระทบกัน
3. **Portability** — ย้ายไปรันที่ไหนก็ได้
4. **Scalability** — เพิ่ม/ลด containers ได้ง่าย
5. **DevOps** — ทำ CI/CD, deploy อัตโนมัติได้สะดวก

### Docker ใช้ทำอะไรได้บ้าง?

- **Development** — สร้าง dev environment ที่เหมือนกันทั้งทีม
- **Testing** — รัน test ใน environment ที่ควบคุมได้
- **Deployment** — deploy แอปขึ้น server
- **Microservices** — แยกแต่ละ service เป็น container
- **CI/CD** — build และ test อัตโนมัติใน pipeline

## สรุป

- Docker แก้ปัญหา "It works on my machine"
- Container เบากว่า VM มาก — เริ่มเร็ว ใช้ทรัพยากรน้อย
- Docker Image = พิมพ์เขียว, Container = สิ่งที่รันจริง
- Docker ช่วยให้ทำงานได้ consistent ตั้งแต่ dev จนถึง production

## ต่อไป

[Lab 02 — ติดตั้ง Docker & รัน container แรก →](../lab-02-first-container/)
