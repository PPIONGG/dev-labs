# Lab 19 — Project: Deploy to Cloud with Kubernetes

## เป้าหมาย

Deploy แอปพลิเคชันขึ้น Kubernetes cluster จริง ตั้งแต่เตรียม manifests จนใช้งานได้

## ทำไมต้องทำ?

นี่คือ lab สุดท้าย — รวมทุกอย่างที่เรียนมาตั้งแต่ Lab 01 สร้าง app ที่พร้อมรันบน Kubernetes จริง

## สิ่งที่ต้องมีก่อน

- [Lab 18](../lab-18-kubernetes-intro/) — เข้าใจ K8s เบื้องต้น
- Docker Hub account (มี image push ไว้แล้ว)

## สิ่งที่จะใช้ในโปรเจคนี้

- ทุกอย่างจาก Lab 01-18!
- Kubernetes Deployments, Services, ConfigMaps, Secrets
- Ingress (reverse proxy)
- Persistent Volumes

## โจทย์

Deploy **Fullstack App** (จาก Lab 11) ขึ้น Kubernetes:

| Component | K8s Resource |
|-----------|-------------|
| API | Deployment + Service |
| PostgreSQL | StatefulSet + PersistentVolume |
| Redis | Deployment + Service |
| Config | ConfigMap |
| Secrets | Secret |
| Ingress | Ingress (reverse proxy) |

## โครงสร้างโปรเจค

```
lab-19-project-deploy-k8s/
├── README.md
├── k8s/
│   ├── namespace.yml
│   ├── configmap.yml
│   ├── secret.yml
│   ├── api-deployment.yml
│   ├── api-service.yml
│   ├── db-statefulset.yml
│   ├── db-service.yml
│   ├── redis-deployment.yml
│   ├── redis-service.yml
│   └── ingress.yml
└── app/
    ├── Dockerfile
    └── ...
```

## ขั้นตอน

### Step 1: สร้าง Namespace

```yaml
# k8s/namespace.yml
apiVersion: v1
kind: Namespace
metadata:
  name: todo-app
```

```bash
kubectl apply -f k8s/namespace.yml
```

### Step 2: ConfigMap & Secret

```yaml
# k8s/configmap.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
  namespace: todo-app
data:
  NODE_ENV: "production"
  DB_HOST: "db-service"
  DB_PORT: "5432"
  DB_NAME: "todos"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
```

```yaml
# k8s/secret.yml
apiVersion: v1
kind: Secret
metadata:
  name: api-secrets
  namespace: todo-app
type: Opaque
stringData:
  DB_USER: "postgres"
  DB_PASSWORD: "your-secure-password"
```

### Step 3: Database (StatefulSet)

```yaml
# k8s/db-statefulset.yml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: db
  namespace: todo-app
spec:
  serviceName: db-service
  replicas: 1
  selector:
    matchLabels:
      app: db
  template:
    metadata:
      labels:
        app: db
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_DB
              valueFrom:
                configMapKeyRef:
                  name: api-config
                  key: DB_NAME
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: api-secrets
                  key: DB_USER
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: api-secrets
                  key: DB_PASSWORD
          volumeMounts:
            - name: db-storage
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: db-storage
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 1Gi
```

### Step 4: API Deployment

```yaml
# k8s/api-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: todo-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: youruser/todo-api:latest
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: api-config
            - secretRef:
                name: api-secrets
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 20
          resources:
            limits:
              memory: "256Mi"
              cpu: "500m"
            requests:
              memory: "128Mi"
              cpu: "250m"
```

### Step 5: Services

```yaml
# k8s/api-service.yml
apiVersion: v1
kind: Service
metadata:
  name: api-service
  namespace: todo-app
spec:
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

### Step 6: Deploy ทุกอย่าง

```bash
# Deploy ทั้งหมด
kubectl apply -f k8s/

# ดูสถานะ
kubectl get all -n todo-app

# ดู logs
kubectl logs -f deployment/api -n todo-app

# Port forward เพื่อทดสอบ
kubectl port-forward service/api-service 3000:80 -n todo-app

# เปิด http://localhost:3000
```

### Step 7: Scaling & Updates

```bash
# Scale API
kubectl scale deployment api --replicas=5 -n todo-app

# Rolling update (เปลี่ยน image version)
kubectl set image deployment/api api=youruser/todo-api:2.0.0 -n todo-app

# ดู rollout status
kubectl rollout status deployment/api -n todo-app

# Rollback ถ้ามีปัญหา
kubectl rollout undo deployment/api -n todo-app
```

## Checklist

- [ ] ทุก resources สร้างสำเร็จ (namespace, configmap, secret, deployments, services)
- [ ] API pods running และ healthy
- [ ] Database มี persistent storage
- [ ] API เชื่อมต่อ database และ Redis ได้
- [ ] Port forward แล้วเข้าถึง API ได้
- [ ] Scale API ได้ (เพิ่ม/ลด replicas)
- [ ] Rolling update ทำงานได้
- [ ] Rollback ทำงานได้

## สิ่งที่ได้เรียนรู้ตลอดหลักสูตร

```
Lab 01-03: Docker คืออะไร, Images, Layers
Lab 04-06: Dockerfile, Volumes, Networking
Lab 07:    Project — Containerize app
Lab 08-10: Compose, Env vars, Healthchecks
Lab 11:    Project — Fullstack app
Lab 12-14: Multi-stage, Security, Registry
Lab 15:    Project — Production-ready
Lab 16-17: CI/CD, Monitoring
Lab 18-19: Kubernetes — Orchestration & Deploy
```

คุณเรียนรู้ Docker ตั้งแต่ **ไม่รู้อะไรเลย** จนถึง **deploy ขึ้น Kubernetes ได้**!

## แหล่งเรียนรู้เพิ่มเติม

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Hub](https://hub.docker.com/)
- [Play with Docker](https://labs.play-with-docker.com/) — ลอง Docker ในเบราว์เซอร์
- [Play with Kubernetes](https://labs.play-with-k8s.com/) — ลอง K8s ในเบราว์เซอร์
