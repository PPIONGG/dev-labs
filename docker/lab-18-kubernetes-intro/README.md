# Lab 18 — Kubernetes เบื้องต้น

## เป้าหมาย

เข้าใจว่า Kubernetes (K8s) คืออะไร ทำไมต้องใช้ และเรียนรู้ concepts พื้นฐาน

## ทำไมต้องรู้?

Docker Compose เหมาะสำหรับ:
- Development environment
- Small-scale deployment (1-2 servers)

แต่เมื่อ app ต้องรองรับผู้ใช้จำนวนมาก ต้องการ:
- **Auto-scaling** — เพิ่ม/ลด containers อัตโนมัติตาม load
- **Self-healing** — container ตายก็สร้างใหม่อัตโนมัติ
- **Rolling updates** — อัปเดตโดยไม่ downtime
- **Load balancing** — กระจาย traffic

Kubernetes ทำสิ่งเหล่านี้ได้ทั้งหมด

## สิ่งที่ต้องมีก่อน

- [Lab 17](../lab-17-monitoring/) — Monitoring & Logging
- Docker Desktop (มี Kubernetes built-in)

## เนื้อหา

### 1. Kubernetes คืออะไร?

Kubernetes (K8s) คือ **container orchestration platform** — จัดการ containers จำนวนมากบนหลาย servers

```
Docker Compose:              Kubernetes:
1 เครื่อง, หลาย containers    หลายเครื่อง, หลายร้อย containers
สั่งเอง                       จัดการอัตโนมัติ
```

### 2. Concepts หลัก

```
+--- Cluster (กลุ่มเครื่อง) ------+
|                                  |
|  +--- Node (เครื่อง server) --+  |
|  |                            |  |
|  |  +--- Pod (หน่วยเล็กสุด) -+|  |
|  |  | Container(s)           ||  |
|  |  +------------------------+|  |
|  |                            |  |
|  |  +--- Pod ----------------+|  |
|  |  | Container(s)           ||  |
|  |  +------------------------+|  |
|  +----------------------------+  |
|                                  |
|  +--- Node -------------------+  |
|  |  +--- Pod ----+            |  |
|  |  | Container  |            |  |
|  |  +------------+            |  |
|  +----------------------------+  |
+----------------------------------+
```

| Concept | คืออะไร | เปรียบเทียบ |
|---------|---------|------------|
| **Cluster** | กลุ่ม servers ที่ทำงานร่วมกัน | - |
| **Node** | เครื่อง server 1 เครื่อง | เครื่องคอมพิวเตอร์ |
| **Pod** | หน่วยเล็กสุดที่ K8s จัดการ (มี 1+ containers) | เหมือน docker run |
| **Deployment** | กำหนดว่าจะรัน Pod กี่ตัว | เหมือน docker compose service |
| **Service** | เปิดทาง network ให้เข้าถึง Pods | เหมือน port mapping |
| **Namespace** | แยกกลุ่ม resources | เหมือน project/folder |

### 3. ติดตั้ง Kubernetes (Local)

#### Docker Desktop
1. เปิด Docker Desktop → Settings → Kubernetes
2. เลือก "Enable Kubernetes"
3. รอสักครู่ให้ติดตั้ง

#### ทดสอบ
```bash
# ดูเวอร์ชัน
kubectl version

# ดู nodes
kubectl get nodes

# ดูว่า cluster ทำงานได้
kubectl cluster-info
```

### 4. kubectl — เครื่องมือสั่ง K8s

```bash
# ดู resources
kubectl get pods              # ดู pods
kubectl get deployments       # ดู deployments
kubectl get services          # ดู services
kubectl get all               # ดูทุกอย่าง

# ดูรายละเอียด
kubectl describe pod <name>

# ดู logs
kubectl logs <pod-name>
kubectl logs -f <pod-name>    # follow

# เข้าไปใน pod
kubectl exec -it <pod-name> -- sh
```

### 5. สร้าง Deployment แรก

สร้างไฟล์ `deployment.yml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3                  # รัน 3 pods
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app
          image: nginx:alpine
          ports:
            - containerPort: 80
```

```bash
# สร้าง deployment
kubectl apply -f deployment.yml

# ดู pods ที่ถูกสร้าง
kubectl get pods

# ดู deployment
kubectl get deployment my-app
```

### 6. สร้าง Service

สร้างไฟล์ `service.yml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  type: LoadBalancer
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 80
```

```bash
# สร้าง service
kubectl apply -f service.yml

# ดู service
kubectl get services

# เปิดเบราว์เซอร์ http://localhost:80
```

### 7. Scaling

```bash
# เพิ่ม pods เป็น 5
kubectl scale deployment my-app --replicas=5

# ดู pods เพิ่มขึ้น
kubectl get pods

# ลดลงเหลือ 2
kubectl scale deployment my-app --replicas=2
```

### 8. Self-healing

```bash
# ลบ pod — K8s จะสร้างใหม่อัตโนมัติ!
kubectl delete pod <pod-name>

# ดูว่า pod ใหม่ถูกสร้างขึ้นแทน
kubectl get pods
```

### 9. Docker Compose vs Kubernetes

| Feature | Docker Compose | Kubernetes |
|---------|---------------|------------|
| Scale | manual | auto-scaling |
| Self-heal | ไม่มี | pod ตาย → สร้างใหม่ |
| Update | downtime | rolling update |
| Load balance | ทำเอง | built-in |
| Multi-server | ไม่ได้ | ได้ |
| Complexity | ง่าย | ซับซ้อน |
| เหมาะกับ | dev, small apps | production, scale |

## แบบฝึกหัด

### ฝึก 1: เริ่มต้น kubectl
1. เปิด Kubernetes ใน Docker Desktop
2. รัน `kubectl get nodes` ยืนยันว่าทำงานได้
3. สร้าง pod ด้วย `kubectl run nginx --image=nginx:alpine`
4. ดู logs และ describe pod

### ฝึก 2: Deployment + Service
1. สร้าง deployment.yml สำหรับ nginx (3 replicas)
2. สร้าง service.yml (LoadBalancer)
3. เปิดเบราว์เซอร์ทดสอบ
4. Scale เป็น 5 replicas

### ฝึก 3: Self-healing
1. ดู pods ที่รันอยู่
2. ลบ pod 1 ตัว
3. สังเกตว่า K8s สร้าง pod ใหม่อัตโนมัติ

### ฝึก 4: Deploy App ของเรา
1. Push image ของ app ไป Docker Hub (จาก Lab 14)
2. สร้าง deployment.yml ที่ใช้ image ของเรา
3. สร้าง service และทดสอบ

## สรุป

- Kubernetes จัดการ containers จำนวนมากบนหลาย servers
- Pod = หน่วยเล็กสุด, Deployment = กำหนดจำนวน, Service = เปิดทาง network
- `kubectl` คือเครื่องมือหลักสำหรับสั่ง K8s
- K8s มี auto-scaling, self-healing, rolling updates
- เริ่มต้นด้วย Docker Desktop Kubernetes ง่ายที่สุด

## ต่อไป

[Lab 19 — Project: Deploy to Cloud with K8s →](../lab-19-project-deploy-k8s/)
