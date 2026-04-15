# Lab 02 -- ติดตั้ง Redis & CLI

## เป้าหมาย

รัน Redis ผ่าน Docker, ใช้ redis-cli สั่งคำสั่งพื้นฐาน และรู้จัก RedisInsight GUI

## ทำไมต้องรู้?

ก่อนจะใช้ Redis ได้ ต้องรู้วิธีรัน Redis server และเชื่อมต่อด้วยเครื่องมือต่างๆ เราจะรัน Redis ผ่าน Docker (ที่เรียนมาแล้ว) แทนการติดตั้งลงเครื่องจริง

## สิ่งที่ต้องมีก่อน

- [Docker Lab 02](../../docker/lab-02-first-container/) -- รัน container ได้
- [Lab 01](../lab-01-what-is-redis/) -- รู้ว่า Redis คืออะไร

## เนื้อหา

### 1. รัน Redis ด้วย Docker

```bash
docker run -d \
  --name my-redis \
  -p 6379:6379 \
  redis:7-alpine
```

| flag | ความหมาย |
|------|---------|
| `--name my-redis` | ตั้งชื่อ container |
| `-p 6379:6379` | เปิดพอร์ต Redis (default 6379) |
| `redis:7-alpine` | ใช้ Redis 7 ขนาดเล็ก |

### 2. ใช้ Docker Compose (แนะนำ)

ใน lab นี้มีไฟล์ `docker-compose.yml` ให้แล้ว:

```bash
cd lab-02-setup-and-cli
docker compose up -d
```

จะได้:
- **Redis** ที่ port `6379`
- **RedisInsight** (GUI) ที่ port `5540`

### 3. เชื่อมต่อด้วย redis-cli

`redis-cli` คือเครื่องมือ CLI ที่มาพร้อม Redis:

```bash
# เข้าไปใน container แล้วใช้ redis-cli
docker exec -it my-redis redis-cli

# ผลลัพธ์:
# 127.0.0.1:6379>
```

ทดสอบว่า Redis ทำงาน:

```bash
127.0.0.1:6379> PING
PONG
```

ถ้าได้ `PONG` กลับมา แสดงว่า Redis พร้อมใช้งานแล้ว!

### 4. คำสั่ง redis-cli พื้นฐาน

#### SET -- เก็บข้อมูล

```bash
127.0.0.1:6379> SET name "สมชาย"
OK

127.0.0.1:6379> SET age 25
OK
```

#### GET -- อ่านข้อมูล

```bash
127.0.0.1:6379> GET name
"สมชาย"

127.0.0.1:6379> GET age
"25"
```

> หมายเหตุ: Redis เก็บทุกอย่างเป็น string แม้จะ SET เป็นตัวเลข

#### DEL -- ลบข้อมูล

```bash
127.0.0.1:6379> DEL age
(integer) 1

127.0.0.1:6379> GET age
(nil)
```

`(nil)` หมายถึงไม่มี key นี้

#### EXISTS -- ตรวจสอบว่ามี key อยู่ไหม

```bash
127.0.0.1:6379> EXISTS name
(integer) 1        # มี

127.0.0.1:6379> EXISTS age
(integer) 0        # ไม่มี (ลบไปแล้ว)
```

#### KEYS -- ค้นหา keys

```bash
# ดู keys ทั้งหมด
127.0.0.1:6379> KEYS *
1) "name"

# ค้นหา keys ที่ขึ้นต้นด้วย "user:"
127.0.0.1:6379> SET user:1 "Alice"
OK
127.0.0.1:6379> SET user:2 "Bob"
OK

127.0.0.1:6379> KEYS user:*
1) "user:1"
2) "user:2"
```

> คำเตือน: `KEYS *` ใช้ได้ตอนเรียนรู้ แต่ **ห้ามใช้ใน production** เพราะจะ scan keys ทั้งหมด ทำให้ Redis ช้า

#### TYPE -- ดูประเภทข้อมูล

```bash
127.0.0.1:6379> TYPE name
string

127.0.0.1:6379> TYPE user:1
string
```

### 5. คำสั่ง redis-cli ที่ใช้บ่อย (สรุป)

| คำสั่ง | ความหมาย | ตัวอย่าง |
|--------|---------|---------|
| `PING` | ทดสอบการเชื่อมต่อ | `PING` → `PONG` |
| `SET` | เก็บข้อมูล | `SET key value` |
| `GET` | อ่านข้อมูล | `GET key` |
| `DEL` | ลบ key | `DEL key` |
| `EXISTS` | ตรวจสอบว่ามี key | `EXISTS key` → 1/0 |
| `KEYS` | ค้นหา keys ตาม pattern | `KEYS user:*` |
| `TYPE` | ดูประเภทข้อมูล | `TYPE key` |
| `FLUSHDB` | ลบ keys ทั้งหมดใน database | `FLUSHDB` |
| `DBSIZE` | นับจำนวน keys ทั้งหมด | `DBSIZE` |
| `INFO` | ดูข้อมูล server | `INFO` |
| `CLEAR` | เคลียร์หน้าจอ | `CLEAR` |
| `QUIT` | ออกจาก redis-cli | `QUIT` |

### 6. RedisInsight (GUI)

RedisInsight เป็นเครื่องมือ GUI อย่างเป็นทางการจาก Redis สำหรับดูและจัดการข้อมูล

1. เปิด browser ไปที่ `http://localhost:5540`
2. คลิก **Add Redis Database**
3. ใส่ข้อมูล:
   - Host: `redis` (ชื่อ service ใน docker-compose)
   - Port: `6379`
   - Name: `My Redis` (ตั้งชื่ออะไรก็ได้)
4. คลิก **Add Redis Database**

ใน RedisInsight คุณจะเห็น:
- **Browser** -- ดู keys ทั้งหมด กรองตาม pattern
- **Workbench** -- พิมพ์คำสั่ง Redis ได้เหมือน redis-cli
- **Analysis Tools** -- วิเคราะห์ memory usage

### 7. Key Naming Convention

Redis ไม่บังคับรูปแบบชื่อ key แต่มี convention ที่นิยม:

```bash
# ใช้ : (colon) คั่นระดับ
"user:1:name"        → "สมชาย"
"user:1:email"       → "somchai@mail.com"
"user:2:name"        → "สมหญิง"

# ใช้ : แยกประเภท:id:field
"product:100:name"   → "iPhone"
"product:100:price"  → "35000"

"session:abc123"     → "{userId: 1}"
"cache:homepage"     → "<html>..."
```

ข้อแนะนำ:
- ใช้ `:` คั่นระดับ (ไม่ใช่ `.` หรือ `/`)
- ใช้ lowercase
- ตั้งชื่อให้อ่านเข้าใจ

## แบบฝึกหัด

1. รัน Redis ด้วย `docker compose up -d`
2. เชื่อมต่อด้วย `docker exec -it my-redis redis-cli`
3. ลองรัน `PING` ดูว่าได้ `PONG` หรือไม่
4. SET keys 5 ตัว แล้วใช้ `KEYS *` ดู
5. ใช้ `GET`, `DEL`, `EXISTS` กับ keys ที่สร้าง
6. ใช้ `TYPE` ดูประเภทของ key
7. ใช้ `DBSIZE` นับจำนวน keys
8. เปิด RedisInsight ที่ `localhost:5540` แล้วเชื่อมต่อ Redis

## สรุป

- ใช้ Docker Compose รัน Redis ง่ายที่สุด
- `redis-cli` คือ CLI สำหรับ Redis -- จำคำสั่ง `SET`, `GET`, `DEL`, `KEYS`, `EXISTS`
- RedisInsight คือ GUI อย่างเป็นทางการ ใช้ดูข้อมูลแบบ visual
- ตั้งชื่อ key ใช้ `:` คั่นระดับ เช่น `user:1:name`

## ต่อไป

[Lab 03 -- Strings -->](../lab-03-strings/)
