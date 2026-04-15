# Lab 04 -- Expiration & TTL

## เป้าหมาย

เข้าใจระบบหมดอายุ (expiration) ของ Redis -- ตั้งเวลาให้ key ลบตัวเองอัตโนมัติ

## ทำไมต้องรู้?

ข้อมูลหลายอย่างไม่ควรอยู่ตลอดไป:
- **Session** -- หมดอายุหลัง 30 นาที
- **Cache** -- ข้อมูลเก่าต้องถูกลบเพื่อ refresh
- **OTP code** -- ใช้ได้แค่ 5 นาที
- **Rate limit counter** -- reset ทุก 1 นาที

Redis จัดการเรื่องนี้ให้อัตโนมัติด้วยระบบ TTL (Time To Live)

## สิ่งที่ต้องมีก่อน

- [Lab 03](../lab-03-strings/) -- ใช้ SET/GET ได้

## เนื้อหา

### 1. EXPIRE -- ตั้งเวลาหมดอายุ (วินาที)

```bash
# สร้าง key ก่อน
127.0.0.1:6379> SET session:user1 "logged_in"
OK

# ตั้งหมดอายุ 60 วินาที
127.0.0.1:6379> EXPIRE session:user1 60
(integer) 1        # สำเร็จ

# ถ้า key ไม่มี
127.0.0.1:6379> EXPIRE nonexistent 60
(integer) 0        # ไม่สำเร็จ เพราะ key ไม่มี
```

### 2. TTL -- ดูเวลาที่เหลือ (วินาที)

```bash
127.0.0.1:6379> SET session:user1 "logged_in"
OK
127.0.0.1:6379> EXPIRE session:user1 60
(integer) 1

# ดูเวลาที่เหลือ
127.0.0.1:6379> TTL session:user1
(integer) 57       # เหลือ 57 วินาที

# รอสักครู่แล้วดูอีก
127.0.0.1:6379> TTL session:user1
(integer) 45       # เหลือ 45 วินาที
```

ค่าพิเศษของ TTL:

```bash
# key ไม่มีเวลาหมดอายุ
127.0.0.1:6379> SET permanent "forever"
OK
127.0.0.1:6379> TTL permanent
(integer) -1       # ไม่มี expiration

# key ไม่มีอยู่
127.0.0.1:6379> TTL nonexistent
(integer) -2       # key ไม่มี
```

| ค่า TTL | ความหมาย |
|---------|---------|
| จำนวนบวก | เหลือกี่วินาที |
| `-1` | ไม่มี expiration (อยู่ตลอดไป) |
| `-2` | key ไม่มีอยู่ |

### 3. PTTL & PEXPIRE -- ระดับ millisecond

```bash
# ตั้งหมดอายุเป็น millisecond
127.0.0.1:6379> SET otp:user1 "123456"
OK
127.0.0.1:6379> PEXPIRE otp:user1 5000
(integer) 1        # หมดอายุใน 5000 ms (5 วินาที)

# ดูเวลาที่เหลือเป็น millisecond
127.0.0.1:6379> PTTL otp:user1
(integer) 4235     # เหลือ 4235 ms
```

### 4. SETEX -- SET + EXPIRE ในคำสั่งเดียว

```bash
# SETEX key seconds value
127.0.0.1:6379> SETEX session:user2 1800 "session_data_here"
OK
# = SET session:user2 "session_data_here" แล้ว EXPIRE 1800 วินาที (30 นาที)

127.0.0.1:6379> TTL session:user2
(integer) 1797
```

**ทำไมใช้ SETEX แทน SET + EXPIRE?**
- `SETEX` เป็น **atomic** -- ทำทั้งสองอย่างพร้อมกัน
- ถ้าใช้ `SET` แล้ว `EXPIRE` แยกกัน -- ถ้า EXPIRE fail จะเกิด key ที่ไม่มีวันหมดอายุ

### 5. PSETEX -- SET + EXPIRE (millisecond)

```bash
# PSETEX key milliseconds value
127.0.0.1:6379> PSETEX flash:msg 3000 "This message will self-destruct"
OK
# หมดอายุใน 3000 ms (3 วินาที)

127.0.0.1:6379> PTTL flash:msg
(integer) 2150
```

### 6. SET กับ options EX/PX/NX/XX

Redis 2.6+ สามารถรวมทุกอย่างในคำสั่ง SET เดียว:

```bash
# SET key value EX seconds
127.0.0.1:6379> SET cache:data "value" EX 300
OK
# = SETEX cache:data 300 "value"

# SET key value PX milliseconds
127.0.0.1:6379> SET cache:data "value" PX 5000
OK
# = PSETEX cache:data 5000 "value"

# SET key value EX seconds NX (SET ถ้ายังไม่มี + หมดอายุ)
127.0.0.1:6379> SET lock:job1 "worker1" EX 30 NX
OK
# ใช้ทำ distributed lock ที่มี timeout

# SET key value XX (SET เฉพาะเมื่อ key มีอยู่แล้ว)
127.0.0.1:6379> SET cache:data "updated" XX
OK
```

| Option | ความหมาย |
|--------|---------|
| `EX seconds` | หมดอายุใน N วินาที |
| `PX milliseconds` | หมดอายุใน N milliseconds |
| `NX` | SET เฉพาะเมื่อ key ยังไม่มี |
| `XX` | SET เฉพาะเมื่อ key มีอยู่แล้ว |
| `KEEPTTL` | SET ค่าใหม่แต่เก็บ TTL เดิมไว้ |

### 7. PERSIST -- ยกเลิก expiration

```bash
127.0.0.1:6379> SET temp "data" EX 60
OK

127.0.0.1:6379> TTL temp
(integer) 58

# ยกเลิก expiration -- ให้ key อยู่ตลอดไป
127.0.0.1:6379> PERSIST temp
(integer) 1

127.0.0.1:6379> TTL temp
(integer) -1       # ไม่มี expiration แล้ว
```

### 8. ข้อควรระวัง -- SET ใหม่จะลบ TTL

```bash
127.0.0.1:6379> SET mykey "value1" EX 60
OK

127.0.0.1:6379> TTL mykey
(integer) 58

# SET ใหม่จะ **ลบ** TTL ออก!
127.0.0.1:6379> SET mykey "value2"
OK

127.0.0.1:6379> TTL mykey
(integer) -1       # TTL หายแล้ว!

# ถ้าต้องการ SET ค่าใหม่แต่เก็บ TTL เดิม ใช้ KEEPTTL
127.0.0.1:6379> SET mykey "value1" EX 60
OK
127.0.0.1:6379> SET mykey "value2" KEEPTTL
OK
127.0.0.1:6379> TTL mykey
(integer) 55       # TTL ยังอยู่!
```

### 9. Use Cases จริง

#### 9.1 Session Timeout

```bash
# Login: สร้าง session หมดอายุ 30 นาที
SET session:abc123 '{"userId":1,"role":"admin"}' EX 1800

# ทุกครั้งที่ user ทำอะไร: ต่ออายุ
EXPIRE session:abc123 1800

# ตรวจสอบ session
GET session:abc123
# ถ้าได้ nil = session หมดอายุ → redirect ไป login
```

#### 9.2 OTP (One-Time Password)

```bash
# ส่ง OTP หมดอายุ 5 นาที
SET otp:user:somchai "482913" EX 300

# ตรวจสอบ OTP
GET otp:user:somchai
# ถ้าได้ nil = OTP หมดอายุ

# ใช้แล้วลบทิ้ง
GETDEL otp:user:somchai
```

#### 9.3 Cache Invalidation

```bash
# Cache ข้อมูลสินค้า หมดอายุ 5 นาที
SET cache:product:100 '{"name":"iPhone","price":35000}' EX 300

# เมื่อข้อมูลเปลี่ยน → ลบ cache
DEL cache:product:100
# ครั้งถัดไปจะ query database ใหม่แล้ว cache ค่าใหม่
```

#### 9.4 Temporary Data

```bash
# เก็บ email verification token หมดอายุ 24 ชั่วโมง
SET verify:email:token123 "user@mail.com" EX 86400

# เก็บ password reset token หมดอายุ 1 ชั่วโมง
SET reset:token:xyz789 "userId:42" EX 3600
```

### 10. คำสั่ง Expiration ทั้งหมด (สรุป)

| คำสั่ง | ความหมาย | ตัวอย่าง |
|--------|---------|---------|
| `EXPIRE` | ตั้ง TTL (วินาที) | `EXPIRE key 60` |
| `PEXPIRE` | ตั้ง TTL (ms) | `PEXPIRE key 5000` |
| `TTL` | ดู TTL ที่เหลือ (วินาที) | `TTL key` |
| `PTTL` | ดู TTL ที่เหลือ (ms) | `PTTL key` |
| `SETEX` | SET + EXPIRE | `SETEX key 60 value` |
| `PSETEX` | SET + PEXPIRE | `PSETEX key 5000 value` |
| `PERSIST` | ยกเลิก TTL | `PERSIST key` |
| `SET ... EX` | SET + expire option | `SET key val EX 60` |
| `SET ... PX` | SET + expire ms | `SET key val PX 5000` |
| `SET ... KEEPTTL` | SET ค่าใหม่ เก็บ TTL เดิม | `SET key val KEEPTTL` |

## แบบฝึกหัด

ดูไฟล์ [exercises.txt](./exercises.txt) -- มีแบบฝึกหัดพร้อมเฉลย

## สรุป

- `EXPIRE`/`TTL` ตั้งและดูเวลาหมดอายุเป็นวินาที
- `PEXPIRE`/`PTTL` ตั้งและดูเวลาหมดอายุเป็น millisecond
- `SETEX` = SET + EXPIRE ในคำสั่งเดียว (atomic)
- `SET key value EX 60 NX` คือสูตร distributed lock
- `PERSIST` ยกเลิก expiration
- SET ใหม่จะลบ TTL -- ใช้ `KEEPTTL` ถ้าต้องการเก็บ TTL เดิม
- Use case หลัก: session timeout, OTP, cache invalidation, temporary tokens

## ต่อไป

[Lab 05 -- Project: Hit Counter & Rate Limiter -->](../lab-05-project-counter/)
