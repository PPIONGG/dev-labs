# Lab 08 — Hashes

## เป้าหมาย

เข้าใจและใช้งาน Redis Hashes สำหรับจัดเก็บข้อมูลแบบ key-value ซ้อนใน (field-value pairs ภายใน key เดียว)

## ทำไมต้องรู้?

ในงานจริง เราต้องจัดเก็บข้อมูลที่มีหลาย field เช่น:
- **User Profile** — name, email, age อยู่ใน key เดียว
- **Object Storage** — เก็บ object ทั้งตัวโดยไม่ต้อง serialize/deserialize
- **Session Data** — เก็บข้อมูล session ของ user (token, login time, etc.)
- **Shopping Cart** — เก็บ product_id → quantity

Hash ช่วยลดจำนวน key และจัดกลุ่มข้อมูลที่เกี่ยวข้องไว้ด้วยกัน ประหยัด memory มากกว่าใช้ String หลาย key

## สิ่งที่ต้องมีก่อน

- Docker & Docker Compose
- ใช้ `redis-cli` เบื้องต้นได้
- เข้าใจ Redis Strings, Sets, Sorted Sets

## เนื้อหา

### 1. HSET / HGET — ตั้งค่าและอ่านค่า field

```bash
# เข้า redis-cli
docker exec -it redis redis-cli

# HSET — ตั้งค่า field ใน hash
HSET user:1001 name "สมชาย"
HSET user:1001 email "somchai@example.com"
HSET user:1001 age 28

# HSET หลาย field พร้อมกัน (Redis 4.0+)
HSET user:1002 name "สมหญิง" email "somying@example.com" age 25

# HGET — อ่านค่า field เดียว
HGET user:1001 name
# "สมชาย"

HGET user:1001 email
# "somchai@example.com"
```

### 2. HMSET / HMGET — ตั้งค่าและอ่านหลาย field

```bash
# HMSET — ตั้งค่าหลาย field (เหมือน HSET หลาย field)
HMSET product:101 name "iPhone 16" price 35900 stock 50 category "phone"

# HMGET — อ่านหลาย field พร้อมกัน
HMGET product:101 name price stock
# 1) "iPhone 16"
# 2) "35900"
# 3) "50"

# ถ้า field ไม่มีจะได้ nil
HMGET product:101 name color
# 1) "iPhone 16"
# 2) (nil)
```

### 3. HGETALL — อ่านทุก field

```bash
# HGETALL — ได้ทุก field-value คู่กัน
HGETALL user:1001
# 1) "name"
# 2) "สมชาย"
# 3) "email"
# 4) "somchai@example.com"
# 5) "age"
# 6) "28"

HGETALL product:101
# 1) "name"
# 2) "iPhone 16"
# 3) "price"
# 4) "35900"
# 5) "stock"
# 6) "50"
# 7) "category"
# 8) "phone"
```

### 4. HDEL — ลบ field

```bash
# HDEL — ลบ field ออกจาก hash
HDEL user:1001 age
# (integer) 1

HGETALL user:1001
# 1) "name"
# 2) "สมชาย"
# 3) "email"
# 4) "somchai@example.com"

# ลบหลาย field
HDEL product:101 stock category
# (integer) 2
```

### 5. HEXISTS — ตรวจสอบว่า field มีอยู่ไหม

```bash
HEXISTS user:1001 name
# (integer) 1  ← มี

HEXISTS user:1001 age
# (integer) 0  ← ไม่มี (ลบไปแล้ว)

HEXISTS user:9999 name
# (integer) 0  ← key ไม่มีเลย
```

### 6. HKEYS / HVALS — ดูเฉพาะ keys หรือ values

```bash
# สร้างข้อมูลใหม่
HSET session:abc123 user_id 1001 login_time "2025-01-15T10:30:00" ip "192.168.1.1" role "admin"

# HKEYS — ดูเฉพาะชื่อ field
HKEYS session:abc123
# 1) "user_id"
# 2) "login_time"
# 3) "ip"
# 4) "role"

# HVALS — ดูเฉพาะค่า
HVALS session:abc123
# 1) "1001"
# 2) "2025-01-15T10:30:00"
# 3) "192.168.1.1"
# 4) "admin"
```

### 7. HINCRBY / HINCRBYFLOAT — เพิ่มค่าตัวเลข

```bash
# HINCRBY — เพิ่มค่า integer
HSET product:101 stock 50 price 35900

HINCRBY product:101 stock 10
# (integer) 60  ← 50 + 10

HINCRBY product:101 stock -5
# (integer) 55  ← 60 - 5

# HINCRBYFLOAT — เพิ่มค่า float
HSET product:101 rating 4.5

HINCRBYFLOAT product:101 rating 0.1
# "4.6"

HINCRBYFLOAT product:101 rating -0.3
# "4.3"
```

### 8. HLEN / HSETNX — คำสั่งเสริม

```bash
# HLEN — นับจำนวน field ใน hash
HLEN user:1001
# (integer) 2

HLEN product:101
# (integer) 3

# HSETNX — ตั้งค่าเฉพาะเมื่อ field ยังไม่มี
HSETNX user:1001 name "ชื่อใหม่"
# (integer) 0  ← ไม่ set เพราะ name มีอยู่แล้ว

HSETNX user:1001 phone "081-234-5678"
# (integer) 1  ← set สำเร็จ เพราะ phone ยังไม่มี
```

### 9. Use Case: User Profile

```bash
# สร้าง user profile
HSET user:1001 \
  name "สมชาย แก้วมณี" \
  email "somchai@example.com" \
  phone "081-234-5678" \
  role "member" \
  points 0 \
  created_at "2025-01-15"

# อัพเดทบางส่วน
HSET user:1001 role "premium"
HINCRBY user:1001 points 100

# อ่าน profile
HGETALL user:1001

# เช็คว่ามี email ไหม
HEXISTS user:1001 email
```

### 10. Use Case: Shopping Cart

```bash
# เพิ่มสินค้าลงตะกร้า (field = product_id, value = quantity)
HSET cart:user1001 product:101 2
HSET cart:user1001 product:102 1
HSET cart:user1001 product:103 3

# ดูตะกร้าทั้งหมด
HGETALL cart:user1001

# เพิ่มจำนวนสินค้า
HINCRBY cart:user1001 product:101 1

# ลบสินค้าออก
HDEL cart:user1001 product:103

# นับจำนวนรายการ
HLEN cart:user1001
```

### 11. Hash vs Multiple Strings

```
วิธี 1: ใช้ String หลาย key (ไม่แนะนำ)
SET user:1001:name "สมชาย"
SET user:1001:email "somchai@example.com"
SET user:1001:age 28
→ ใช้ 3 keys, กิน memory มาก

วิธี 2: ใช้ Hash (แนะนำ)
HSET user:1001 name "สมชาย" email "somchai@example.com" age 28
→ ใช้ 1 key, ประหยัด memory

Hash ดีกว่าเมื่อ:
- มี field < 128 (ziplist encoding)
- ข้อมูลเกี่ยวข้องกัน (เป็น object เดียวกัน)
- ต้องอ่าน/เขียนหลาย field พร้อมกัน
```

## แบบฝึกหัด

ดู `exercises.txt` สำหรับแบบฝึกหัดเพิ่มเติม

1. สร้าง hash เก็บข้อมูลหนังสือ (book:1) โดยมี field: title, author, year, price, pages
2. อ่านเฉพาะ title และ author ด้วยคำสั่งเดียว
3. เพิ่ม field `rating` = 4.5 เฉพาะเมื่อยังไม่มี
4. เพิ่ม price ขึ้น 50 บาท
5. ลบ field pages ออก
6. นับจำนวน field ที่เหลือ
7. สร้าง shopping cart สำหรับ user:2001 ใส่สินค้า 3 รายการ แล้วเพิ่มจำนวนรายการแรก +2

## Checklist

- [ ] ใช้ HSET / HGET ตั้งค่าและอ่านค่า field ได้
- [ ] ใช้ HMSET / HMGET จัดการหลาย field พร้อมกันได้
- [ ] ใช้ HGETALL อ่านทุก field ได้
- [ ] ใช้ HDEL ลบ field ได้
- [ ] ใช้ HEXISTS ตรวจสอบ field ได้
- [ ] ใช้ HKEYS / HVALS ดูเฉพาะ keys หรือ values ได้
- [ ] ใช้ HINCRBY เพิ่มค่าตัวเลขได้
- [ ] เข้าใจ use case: user profile, shopping cart, session

## สรุป

- **Hash** เก็บ field-value pairs ภายใน key เดียว เหมาะกับข้อมูลแบบ object
- `HSET` / `HGET` — ตั้งค่า / อ่านค่า field
- `HMGET` — อ่านหลาย field, `HGETALL` — อ่านทุก field
- `HDEL` — ลบ field, `HEXISTS` — ตรวจสอบ field
- `HKEYS` / `HVALS` — ดูเฉพาะ keys หรือ values
- `HINCRBY` — เพิ่มค่าตัวเลขแบบ atomic
- Hash ประหยัด memory กว่าใช้ String หลาย key

## ต่อไป

[Lab 09 — Project: Leaderboard & Session Manager →](../lab-09-project-leaderboard/)
