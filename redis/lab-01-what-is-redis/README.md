# Lab 01 -- Redis คืออะไร?

## เป้าหมาย

เข้าใจว่า Redis คืออะไร ทำไมถึงเร็ว ใช้ทำอะไรได้บ้าง และแตกต่างจาก database อื่นอย่างไร

## ทำไมต้องรู้?

แอปสมัยใหม่ต้องการความเร็ว:
- เว็บโหลดช้า 1 วินาที ผู้ใช้หนีไป 7%
- API ที่ตอบช้า ทำให้ประสบการณ์ผู้ใช้แย่ลง
- ข้อมูลบางอย่างต้องเข้าถึงซ้ำๆ บ่อยมาก (เช่น session, cache)

Redis ช่วยแก้ปัญหาเหล่านี้โดยเก็บข้อมูลใน **memory** แทน disk -- เร็วกว่า database ทั่วไป 10-100 เท่า

## เนื้อหา

### 1. Redis คืออะไร?

Redis ย่อมาจาก **RE**mote **DI**ctionary **S**erver

เป็น **in-memory data store** ที่เก็บข้อมูลในรูปแบบ key-value:

```
key             → value
─────────────────────────────
"user:1:name"   → "สมชาย"
"page:views"    → 42
"session:abc"   → "{userId: 1, loggedIn: true}"
```

คุณสมบัติหลัก:
- **In-memory** -- เก็บข้อมูลใน RAM ทำให้เร็วมาก
- **Key-Value** -- เข้าถึงข้อมูลด้วย key ตรงๆ ไม่ต้อง query
- **Data structures** -- รองรับ Strings, Lists, Sets, Hashes, Sorted Sets และอื่นๆ
- **Single-threaded** -- ประมวลผลทีละคำสั่ง ไม่มีปัญหา race condition
- **Persistence** -- สามารถบันทึกข้อมูลลง disk ได้ (ไม่หายเมื่อ restart)

### 2. ทำไม Redis ถึงเร็ว?

```
PostgreSQL (disk-based):
Client → Query → Parse → Plan → Read from Disk → Return
                                 ^^^^^^^^^^^^
                                 ช้าที่สุด (milliseconds)

Redis (in-memory):
Client → Command → Read from RAM → Return
                   ^^^^^^^^^^^^^
                   เร็วมาก (microseconds)
```

| | PostgreSQL | Redis |
|---|-----------|-------|
| เก็บข้อมูลที่ | Disk (SSD/HDD) | RAM (Memory) |
| ความเร็วอ่าน | ~1-10 ms | ~0.1-0.5 ms |
| Query language | SQL (ซับซ้อน) | คำสั่งง่ายๆ |
| เหมาะกับ | ข้อมูลถาวร มีความสัมพันธ์ | ข้อมูลชั่วคราว เข้าถึงบ่อย |

### 3. Redis ใช้ทำอะไรได้บ้าง?

#### 3.1 Caching (แคชข้อมูล)

เก็บผลลัพธ์ที่ query บ่อยๆ ไว้ใน Redis ไม่ต้องไป query database ทุกครั้ง:

```
ไม่มี cache:
User → API → PostgreSQL (ช้า) → Response

มี Redis cache:
User → API → Redis (เร็ว!) → Response
              ↓ (ถ้าไม่มี cache)
           PostgreSQL → Redis → Response
```

#### 3.2 Session Storage (เก็บ session)

เก็บข้อมูล login session ของผู้ใช้:

```
"session:abc123" → {userId: 1, role: "admin", loginAt: "2024-01-01"}
                   ↑ หมดอายุอัตโนมัติใน 30 นาที
```

#### 3.3 Rate Limiting (จำกัดการเรียก API)

ป้องกัน API ถูกเรียกมากเกินไป:

```
"rate:192.168.1.1" → 8    (เรียกไปแล้ว 8 ครั้ง)
                     ↑ หมดอายุทุก 1 นาที, จำกัด 10 ครั้ง/นาที
```

#### 3.4 Leaderboard (กระดานคะแนน)

ใช้ Sorted Set จัดอันดับแบบ real-time:

```
"game:leaderboard" → [
  {player: "Alice", score: 2500},
  {player: "Bob",   score: 2100},
  {player: "Charlie", score: 1800}
]
```

#### 3.5 Pub/Sub (ส่งข้อความแบบ real-time)

ส่งข้อความระหว่าง services แบบ real-time:

```
Publisher → Redis Channel "notifications" → Subscriber 1
                                          → Subscriber 2
                                          → Subscriber 3
```

#### 3.6 Queue (คิวงาน)

จัดการงานที่ต้องทำตามลำดับ:

```
"email:queue" → [email1, email2, email3, ...]
                 ↑ เพิ่มงานใหม่ทางขวา (RPUSH)
↑ หยิบงานไปทำทางซ้าย (LPOP)
```

### 4. Redis vs PostgreSQL

| | PostgreSQL | Redis |
|---|-----------|-------|
| ประเภท | Relational Database | In-memory Data Store |
| เก็บข้อมูล | Disk | Memory (RAM) |
| โครงสร้าง | ตาราง (schema) | Key-Value (ไม่มี schema) |
| ภาษา | SQL | คำสั่ง Redis |
| JOIN | ได้ | ไม่ได้ |
| ข้อมูลถาวร | ใช่ (primary storage) | ได้ (แต่ไม่ใช่จุดแข็ง) |
| ความเร็ว | เร็ว | เร็วมาก |
| ขนาดข้อมูล | ไม่จำกัด (disk) | จำกัดด้วย RAM |
| เหมาะกับ | ข้อมูลหลักของแอป | cache, session, real-time |

**สรุป:** ไม่ได้เลือกอย่างใดอย่างหนึ่ง -- ใช้ **ทั้งคู่** ร่วมกัน!

```
User → API → Redis (cache/session) → เร็ว!
              ↓ (ถ้าไม่มีใน cache)
           PostgreSQL (ข้อมูลหลัก)
```

### 5. Data Types ใน Redis (ภาพรวม)

| Data Type | ลักษณะ | ตัวอย่าง | Use Case |
|-----------|--------|---------|----------|
| **String** | ค่าเดียว (text/number) | `"Hello"`, `42` | cache, counter |
| **List** | ลำดับข้อมูล | `[a, b, c]` | queue, recent items |
| **Set** | กลุ่มไม่ซ้ำ ไม่เรียงลำดับ | `{a, b, c}` | tags, unique visitors |
| **Sorted Set** | กลุ่มไม่ซ้ำ + คะแนน | `{a:10, b:20}` | leaderboard, ranking |
| **Hash** | object/map | `{name:"A", age:25}` | user profile, settings |
| **Stream** | log ข้อมูล | event stream | event sourcing |

เราจะเรียนทีละ data type ใน lab ถัดๆ ไป

### 6. คำศัพท์พื้นฐาน

| คำ | ความหมาย | ตัวอย่าง |
|----|---------|---------|
| Key | ชื่อที่ใช้เข้าถึงข้อมูล | `"user:1:name"` |
| Value | ค่าที่เก็บ | `"สมชาย"` |
| TTL | เวลาหมดอายุ (Time To Live) | 3600 วินาที |
| Expire | การตั้งเวลาให้ key หมดอายุ | `EXPIRE key 60` |
| Database | Redis มี 16 databases (0-15) | default = 0 |
| Command | คำสั่ง Redis | `SET`, `GET`, `DEL` |
| Persistence | การบันทึกข้อมูลลง disk | RDB, AOF |
| Pub/Sub | ระบบส่งข้อความ | publish/subscribe |

## สรุป

- Redis คือ in-memory data store ที่เร็วมาก เพราะเก็บข้อมูลใน RAM
- ใช้รูปแบบ key-value -- เข้าถึงข้อมูลด้วย key ตรงๆ
- Use cases หลัก: caching, session, rate limiting, leaderboard, pub/sub, queue
- ใช้ Redis **ร่วมกับ** database หลัก (เช่น PostgreSQL) ไม่ได้แทนที่
- รองรับ data types หลายแบบ: String, List, Set, Sorted Set, Hash

## ต่อไป

[Lab 02 -- ติดตั้ง Redis & CLI -->](../lab-02-setup-and-cli/)
