# Lab 17 — Monitoring & Logging

## เป้าหมาย

ตั้งค่า monitoring และ centralized logging สำหรับ Docker containers

## ทำไมต้องรู้?

เมื่อ app ขึ้น production แล้ว ต้องรู้ว่า:
- App ทำงานปกติไหม? (monitoring)
- เกิด error อะไรบ้าง? (logging)
- ใช้ resources เท่าไหร่? (metrics)

ถ้าไม่มี monitoring เหมือนขับรถโดยไม่มีหน้าปัด — ไม่รู้ว่าน้ำมันจะหมดเมื่อไหร่

## สิ่งที่ต้องมีก่อน

- [Lab 16](../lab-16-ci-cd/) — CI/CD pipeline

## เนื้อหา

### 1. Docker Logging พื้นฐาน

```bash
# ดู logs ของ container
docker logs <container_id>

# ดู logs แบบ follow (เหมือน tail -f)
docker logs -f <container_id>

# ดู logs ย้อนหลัง 100 บรรทัด
docker logs --tail 100 <container_id>

# ดู logs ตั้งแต่เวลาที่กำหนด
docker logs --since 2024-01-01T00:00:00 <container_id>
```

### 2. Docker Stats (Metrics พื้นฐาน)

```bash
# ดู resource usage แบบ real-time
docker stats

# ดูเฉพาะ container ที่ต้องการ
docker stats my-app
```

แสดง: CPU%, Memory, Network I/O, Disk I/O

### 3. Logging Stack: Loki + Grafana (ตัวอย่างเพื่อการเรียนรู้)

> หมายเหตุ: ตัวอย่างนี้แสดงให้เห็น concept ของ centralized logging
> ไฟล์ `docker-compose.monitoring.yml` ที่ให้มาจริงใช้ Prometheus + Grafana (Section 4) เพราะเหมาะกับการเริ่มต้นมากกว่า

```yaml
services:
  # App ของเรา
  api:
    build: ./api
    ports:
      - "3000:3000"
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Loki — เก็บ logs
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"

  # Promtail — ส่ง logs ไป Loki
  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
      - ./promtail-config.yml:/etc/promtail/config.yml
    depends_on:
      - loki

  # Grafana — dashboard แสดงผล
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  grafana-data:
```

### 4. Monitoring Stack: Prometheus + Grafana

```yaml
services:
  api:
    build: ./api
    ports:
      - "3000:3000"

  # Prometheus — เก็บ metrics
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  # Node Exporter — metrics ของ host machine
  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"

  # cAdvisor — metrics ของ containers
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    ports:
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro

  # Grafana — dashboard
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

volumes:
  grafana-data:
```

### 5. Structured Logging ใน App

```javascript
// แทนที่จะ console.log ธรรมดา
console.log('User logged in');

// ใช้ structured logging (JSON)
console.log(JSON.stringify({
  level: 'info',
  message: 'User logged in',
  userId: user.id,
  timestamp: new Date().toISOString(),
}));
```

### 6. Log Levels

| Level | ใช้เมื่อ | ตัวอย่าง |
|-------|---------|---------|
| `error` | เกิด error ที่ต้องแก้ | database connection failed |
| `warn` | เหตุการณ์ผิดปกติ | request ช้ากว่าปกติ |
| `info` | เหตุการณ์ปกติที่สำคัญ | user login, server started |
| `debug` | ข้อมูลสำหรับ debug | query parameters, response body |

### 7. Docker Logging Drivers

```yaml
services:
  api:
    image: my-app
    logging:
      driver: "json-file"        # default — เก็บเป็น JSON file
      options:
        max-size: "10m"          # ขนาดสูงสุดต่อไฟล์
        max-file: "3"            # จำนวนไฟล์สูงสุด
```

Drivers ที่ใช้บ่อย:
- `json-file` — default, เก็บเป็นไฟล์
- `syslog` — ส่งไป syslog
- `fluentd` — ส่งไป Fluentd
- `none` — ไม่เก็บ log

## แบบฝึกหัด

### ฝึก 1: Docker Logs & Stats
1. รัน app ด้วย Docker Compose
2. ใช้ `docker logs -f` ดู logs
3. ใช้ `docker stats` ดู resource usage
4. จำกัดขนาด log file ด้วย logging options

### ฝึก 2: Structured Logging
1. แก้ app ให้ log เป็น JSON format
2. เพิ่ม log levels (info, error, warn)
3. รันแล้วดู logs — อ่านง่ายกว่าเดิมไหม?

### ฝึก 3: Grafana Dashboard
1. เพิ่ม Prometheus + Grafana ใน compose
2. เปิด Grafana ที่ `localhost:3001`
3. เพิ่ม Prometheus เป็น data source
4. สร้าง dashboard แสดง container metrics

## สรุป

- `docker logs` และ `docker stats` เป็นเครื่องมือพื้นฐาน
- ใช้ structured logging (JSON) เพื่อให้ค้นหาและวิเคราะห์ง่าย
- Prometheus + Grafana สำหรับ metrics monitoring
- Loki + Grafana สำหรับ centralized logging
- กำหนด log rotation (`max-size`, `max-file`) เสมอ

## ต่อไป

[Lab 18 — Kubernetes เบื้องต้น →](../lab-18-kubernetes-intro/)
