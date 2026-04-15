# Lab 03 -- Strings

## เป้าหมาย

เข้าใจและใช้งาน String ซึ่งเป็น data type พื้นฐานที่สุดของ Redis

## ทำไมต้องรู้?

String เป็น data type ที่ใช้บ่อยที่สุดใน Redis -- ใช้เก็บ cache, counter, session token, JSON data และอื่นๆ อีกมาก ทุก value ใน Redis เริ่มต้นจาก String

## สิ่งที่ต้องมีก่อน

- [Lab 02](../lab-02-setup-and-cli/) -- ใช้ redis-cli ได้

## เนื้อหา

### 1. SET & GET -- พื้นฐานที่สุด

```bash
# เก็บค่า
127.0.0.1:6379> SET greeting "Hello Redis"
OK

# อ่านค่า
127.0.0.1:6379> GET greeting
"Hello Redis"

# เขียนทับ
127.0.0.1:6379> SET greeting "สวัสดี Redis"
OK

127.0.0.1:6379> GET greeting
"สวัสดี Redis"
```

SET จะ **เขียนทับ** ค่าเดิมเสมอ ถ้า key มีอยู่แล้ว

### 2. SETNX -- SET ถ้ายังไม่มี

```bash
# SET เฉพาะเมื่อ key ยังไม่มี (NX = Not eXists)
127.0.0.1:6379> SETNX greeting "ค่าใหม่"
(integer) 0        # ไม่ set เพราะ key มีอยู่แล้ว

127.0.0.1:6379> GET greeting
"สวัสดี Redis"     # ค่าเดิมยังอยู่

127.0.0.1:6379> SETNX new_key "ค่าใหม่"
(integer) 1        # set สำเร็จ เพราะ key ยังไม่มี
```

**Use case:** ใช้ทำ distributed lock -- ใครเรียก SETNX ก่อนจะได้ lock

### 3. MSET & MGET -- SET/GET หลาย keys พร้อมกัน

```bash
# SET หลาย keys ในคำสั่งเดียว
127.0.0.1:6379> MSET user:1:name "Alice" user:1:email "alice@mail.com" user:1:age "30"
OK

# GET หลาย keys ในคำสั่งเดียว
127.0.0.1:6379> MGET user:1:name user:1:email user:1:age
1) "Alice"
2) "alice@mail.com"
3) "30"
```

**ข้อดี:** ลด round-trip ระหว่าง client กับ Redis -- เร็วกว่า SET/GET ทีละตัว

### 4. INCR, DECR, INCRBY -- Counter (ตัวนับ)

```bash
# ตั้งค่าเริ่มต้น
127.0.0.1:6379> SET page:views 0
OK

# เพิ่มทีละ 1
127.0.0.1:6379> INCR page:views
(integer) 1

127.0.0.1:6379> INCR page:views
(integer) 2

127.0.0.1:6379> INCR page:views
(integer) 3

# ลดทีละ 1
127.0.0.1:6379> DECR page:views
(integer) 2

# เพิ่มทีละหลายๆ
127.0.0.1:6379> INCRBY page:views 10
(integer) 12

# ลดทีละหลายๆ
127.0.0.1:6379> DECRBY page:views 5
(integer) 7
```

**สำคัญ:** INCR/DECR เป็น **atomic operation** -- ปลอดภัยแม้มีหลาย clients เรียกพร้อมกัน

```bash
# ถ้า key ยังไม่มี INCR จะสร้างให้อัตโนมัติ (เริ่มจาก 0)
127.0.0.1:6379> INCR new_counter
(integer) 1
```

### 5. INCRBYFLOAT -- เพิ่มทศนิยม

```bash
127.0.0.1:6379> SET price 19.99
OK

127.0.0.1:6379> INCRBYFLOAT price 0.01
"20"

127.0.0.1:6379> INCRBYFLOAT price -5.50
"14.5"
```

### 6. APPEND & STRLEN -- จัดการ String

```bash
# ต่อ string
127.0.0.1:6379> SET msg "Hello"
OK

127.0.0.1:6379> APPEND msg " World"
(integer) 11       # ความยาวหลัง append

127.0.0.1:6379> GET msg
"Hello World"

# นับความยาว
127.0.0.1:6379> STRLEN msg
(integer) 11
```

### 7. GETRANGE & SETRANGE -- ตัดและแทนที่

```bash
127.0.0.1:6379> SET msg "Hello World"
OK

# ตัด substring (0-indexed)
127.0.0.1:6379> GETRANGE msg 0 4
"Hello"

127.0.0.1:6379> GETRANGE msg 6 10
"World"

# แทนที่บางส่วน
127.0.0.1:6379> SETRANGE msg 6 "Redis"
(integer) 11

127.0.0.1:6379> GET msg
"Hello Redis"
```

### 8. GETSET & GETDEL -- อ่านแล้วเปลี่ยน/ลบ

```bash
# อ่านค่าเก่า แล้ว SET ค่าใหม่
127.0.0.1:6379> SET counter 100
OK

127.0.0.1:6379> GETSET counter 0
"100"              # คืนค่าเก่า

127.0.0.1:6379> GET counter
"0"                # ค่าใหม่

# อ่านค่าแล้วลบ
127.0.0.1:6379> SET temp_token "abc123"
OK

127.0.0.1:6379> GETDEL temp_token
"abc123"           # คืนค่า แล้วลบ key

127.0.0.1:6379> GET temp_token
(nil)              # key ถูกลบแล้ว
```

### 9. Use Cases จริง

#### 9.1 Cache ผลลัพธ์จาก API

```bash
# เก็บ JSON response ใน Redis
SET cache:user:1 '{"id":1,"name":"Alice","email":"alice@mail.com"}'

# อ่าน cache (เร็วกว่า query database)
GET cache:user:1
```

#### 9.2 Counter (นับจำนวน)

```bash
# นับ page views
INCR page:views:homepage
INCR page:views:about

# นับ API calls
INCR api:calls:2024-01-15

# ดูค่า
GET page:views:homepage
```

#### 9.3 Rate Limiting (จำกัดการเรียก)

```bash
# นับจำนวนครั้งที่ IP นี้เรียก API
INCR rate:192.168.1.1

# ถ้าเกินจำนวน → ปฏิเสธ
GET rate:192.168.1.1
```

### 10. คำสั่ง String ทั้งหมด (สรุป)

| คำสั่ง | ความหมาย | ตัวอย่าง |
|--------|---------|---------|
| `SET` | เก็บค่า | `SET key value` |
| `GET` | อ่านค่า | `GET key` |
| `SETNX` | SET ถ้ายังไม่มี | `SETNX key value` |
| `MSET` | SET หลาย keys | `MSET k1 v1 k2 v2` |
| `MGET` | GET หลาย keys | `MGET k1 k2` |
| `INCR` | เพิ่ม 1 | `INCR counter` |
| `DECR` | ลด 1 | `DECR counter` |
| `INCRBY` | เพิ่ม N | `INCRBY counter 10` |
| `DECRBY` | ลด N | `DECRBY counter 5` |
| `INCRBYFLOAT` | เพิ่มทศนิยม | `INCRBYFLOAT price 0.5` |
| `APPEND` | ต่อ string | `APPEND key " more"` |
| `STRLEN` | ความยาว string | `STRLEN key` |
| `GETRANGE` | ตัด substring | `GETRANGE key 0 4` |
| `SETRANGE` | แทนที่บางส่วน | `SETRANGE key 6 "new"` |
| `GETSET` | GET แล้ว SET ใหม่ | `GETSET key newval` |
| `GETDEL` | GET แล้วลบ | `GETDEL key` |

## แบบฝึกหัด

ดูไฟล์ [exercises.txt](./exercises.txt) -- มีแบบฝึกหัดพร้อมเฉลย

## สรุป

- String เป็น data type พื้นฐานที่สุด เก็บได้ทั้ง text, number, JSON
- `INCR`/`DECR` เป็น atomic -- ปลอดภัยสำหรับ counter ที่มีหลาย clients
- `MSET`/`MGET` ลด round-trip เมื่อต้อง SET/GET หลาย keys
- `SETNX` ใช้ทำ distributed lock ได้
- ใช้บ่อยสำหรับ caching, counters, rate limiting

## ต่อไป

[Lab 04 -- Expiration & TTL -->](../lab-04-expiration/)
