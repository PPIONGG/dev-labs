# Lab 16 — CI/CD with GitHub Actions + Docker

## เป้าหมาย

สร้าง CI/CD pipeline ที่ build, test, และ push Docker image อัตโนมัติทุกครั้งที่ push โค้ด

## ทำไมต้องรู้?

ในทีมจริง ไม่มีใครนั่ง build และ push Docker image ด้วยมือ — ทุกอย่างทำอัตโนมัติผ่าน CI/CD pipeline:

1. Developer push โค้ด → 
2. CI build Docker image → 
3. CI รัน tests → 
4. CI push image ไป registry → 
5. CD deploy ไป server

## สิ่งที่ต้องมีก่อน

- [Lab 15](../lab-15-project-production-api/) — Production-ready API
- บัญชี GitHub
- Docker Hub account

## เนื้อหา

### 1. CI/CD คืออะไร?

| คำ | ย่อมาจาก | หมายถึง |
|----|---------|---------|
| CI | Continuous Integration | build + test อัตโนมัติทุกครั้งที่ push |
| CD | Continuous Delivery | deploy อัตโนมัติหลัง CI ผ่าน |

### 2. GitHub Actions คืออะไร?

GitHub Actions คือ CI/CD ที่อยู่ใน GitHub เลย — ฟรีสำหรับ public repos ตั้งค่าด้วยไฟล์ YAML

### 3. ไฟล์ Workflow พื้นฐาน

สร้างไฟล์ `.github/workflows/docker.yml`:

```yaml
name: Docker CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t my-app:test .

      - name: Run tests
        run: docker run --rm my-app:test npm test

  push:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/my-app:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/my-app:${{ github.sha }}
```

### 4. ตั้งค่า Secrets ใน GitHub

1. ไปที่ GitHub repo → Settings → Secrets → Actions
2. เพิ่ม secrets:
   - `DOCKERHUB_USERNAME` — Docker Hub username
   - `DOCKERHUB_TOKEN` — Docker Hub access token

### 5. Workflow ที่สมบูรณ์

```yaml
name: Docker CI/CD

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build test image
        run: docker build --target builder -t my-app:test .

      - name: Run linter
        run: docker run --rm my-app:test npm run lint

      - name: Run tests
        run: docker run --rm my-app:test npm test

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t my-app:scan .

      - name: Run security scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: my-app:scan
          severity: CRITICAL,HIGH

  push:
    needs: [lint-and-test, security-scan]
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ secrets.DOCKERHUB_USERNAME }}/my-app
          tags: |
            type=sha
            type=semver,pattern={{version}}
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: ${{ steps.meta.outputs.tags }}
```

### 6. Flow ของ Pipeline

```
Push to main
    │
    ├── lint-and-test (parallel)
    │     ├── Build test image
    │     ├── Run linter
    │     └── Run tests
    │
    ├── security-scan (parallel)
    │     ├── Build image
    │     └── Trivy scan
    │
    └── push (หลังทั้งสองผ่าน)
          ├── Login to registry
          ├── Build production image
          └── Push to Docker Hub
```

## แบบฝึกหัด

### ฝึก 1: Workflow แรก
1. สร้าง GitHub repo
2. สร้างไฟล์ workflow พื้นฐาน
3. Push โค้ด แล้วดูว่า workflow รันสำเร็จ

### ฝึก 2: เพิ่ม Tests
1. เพิ่ม tests ใน app
2. เพิ่ม step รัน tests ใน workflow
3. ทำให้ test fail แล้วดูว่า pipeline หยุด

### ฝึก 3: Push ไป Docker Hub
1. สร้าง Docker Hub access token
2. เพิ่ม secrets ใน GitHub repo
3. เพิ่ม push step ใน workflow
4. Push โค้ด แล้วตรวจสอบ image บน Docker Hub

## สรุป

- GitHub Actions ทำ CI/CD ฟรีสำหรับ public repos
- Workflow = ไฟล์ YAML ที่กำหนดว่าจะทำอะไรเมื่อไหร่
- ใช้ GitHub Secrets เก็บข้อมูลลับ (password, token)
- Pipeline ที่ดี: lint → test → scan → build → push
- ใช้ official actions (checkout, login, build-push) สะดวกและปลอดภัย

## ต่อไป

[Lab 17 — Monitoring & Logging →](../lab-17-monitoring/)
