# Lab 14 — Docker Registry

## เป้าหมาย

เรียนรู้วิธี push/pull Docker images ไปยัง registry เพื่อแชร์และ deploy

## ทำไมต้องรู้?

จนถึงตอนนี้ images อยู่แค่ในเครื่องเรา แต่ในงานจริงต้อง:
- แชร์ images กับทีม
- Deploy images ไปยัง server
- เก็บ images หลายเวอร์ชัน
- ใช้ images ใน CI/CD pipeline

Registry คือที่เก็บ images ส่วนกลาง

## สิ่งที่ต้องมีก่อน

- [Lab 13](../lab-13-security/) — Security best practices
- บัญชี Docker Hub (สมัครฟรี)

## เนื้อหา

### 1. Docker Registry คืออะไร?

Registry คือ "คลัง" สำหรับเก็บ Docker images

| Registry | คำอธิบาย | ราคา |
|----------|----------|------|
| Docker Hub | Registry หลัก default | ฟรี (1 private repo) |
| GitHub Container Registry (ghcr.io) | ผูกกับ GitHub repo | ฟรี |
| AWS ECR | Amazon's registry | ตาม usage |
| Google Artifact Registry | Google's registry | ตาม usage |
| Self-hosted | Registry ของตัวเอง | ฟรี (จ่ายค่า server) |

### 2. Docker Hub

#### Login
```bash
docker login
# ใส่ username และ password
```

#### ตั้งชื่อ Image ให้ถูกรูปแบบ
```bash
# รูปแบบ: <username>/<image-name>:<tag>
docker tag my-app:latest myusername/my-app:1.0.0
docker tag my-app:latest myusername/my-app:latest
```

#### Push Image
```bash
docker push myusername/my-app:1.0.0
docker push myusername/my-app:latest
```

#### Pull Image
```bash
docker pull myusername/my-app:1.0.0
```

### 3. Tagging Strategy

```bash
# ใช้ semantic versioning
docker tag my-app myuser/my-app:1.0.0
docker tag my-app myuser/my-app:1.0
docker tag my-app myuser/my-app:1
docker tag my-app myuser/my-app:latest

# ใช้ git commit hash
docker tag my-app myuser/my-app:abc1234

# ใช้ environment
docker tag my-app myuser/my-app:staging
docker tag my-app myuser/my-app:production
```

### 4. GitHub Container Registry (GHCR)

```bash
# Login ด้วย GitHub token
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag สำหรับ GHCR
docker tag my-app ghcr.io/username/my-app:1.0.0

# Push
docker push ghcr.io/username/my-app:1.0.0
```

### 5. Self-hosted Registry

```bash
# รัน registry ของตัวเอง (ง่ายมาก!)
docker run -d -p 5000:5000 --name registry registry:2

# Tag สำหรับ local registry
docker tag my-app localhost:5000/my-app:1.0.0

# Push
docker push localhost:5000/my-app:1.0.0

# Pull
docker pull localhost:5000/my-app:1.0.0
```

### 6. ใช้กับ docker-compose.yml

```yaml
services:
  api:
    image: myusername/my-app:1.0.0  # pull จาก registry
    ports:
      - "3000:3000"
```

## แบบฝึกหัด

### ฝึก 1: Push ไป Docker Hub
1. สมัคร Docker Hub (ถ้ายังไม่มี)
2. `docker login`
3. Tag image ด้วย username ของคุณ
4. Push image ไป Docker Hub
5. เปิด Docker Hub ดูว่า image อยู่จริง

### ฝึก 2: Tagging หลายเวอร์ชัน
1. สร้าง image เวอร์ชัน 1.0.0
2. แก้โค้ดเล็กน้อย สร้างเวอร์ชัน 1.1.0
3. Push ทั้ง 2 เวอร์ชัน
4. Pull เวอร์ชัน 1.0.0 กลับมาทดสอบ

### ฝึก 3: Self-hosted Registry
1. รัน local registry
2. Push image ไปยัง local registry
3. ลบ image ออกจากเครื่อง แล้ว pull กลับมา

## สรุป

- Registry คือที่เก็บ images ส่วนกลาง
- Docker Hub เป็น default registry — ใช้ง่ายสุด
- ตั้งชื่อ image: `username/image:tag`
- ใช้ semantic versioning สำหรับ tags
- GitHub Container Registry เหมาะสำหรับ open source projects

## ต่อไป

[Lab 15 — Project: Production-ready API →](../lab-15-project-production-api/)
