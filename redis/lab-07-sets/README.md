# Lab 07 -- Sets & Sorted Sets

## เป้าหมาย

เข้าใจและใช้งาน Set (กลุ่มข้อมูลไม่ซ้ำ) และ Sorted Set (กลุ่มข้อมูลไม่ซ้ำ + คะแนน) ใน Redis

## ทำไมต้องรู้?

Set และ Sorted Set แก้ปัญหาที่พบบ่อย:
- **Set** -- เก็บข้อมูลที่ไม่ซ้ำกัน เช่น tags, unique visitors, followers
- **Sorted Set** -- จัดอันดับข้อมูล เช่น leaderboard, ranking, priority queue

ทั้งสองมีประสิทธิภาพสูงมากใน Redis

## สิ่งที่ต้องมีก่อน

- [Lab 03](../lab-03-strings/) -- ใช้ SET/GET ได้
- [Lab 06](../lab-06-lists/) -- เข้าใจ data structures ใน Redis

## เนื้อหา

---

# Part 1: Sets

Set คือกลุ่มข้อมูลที่ **ไม่มีลำดับ** และ **ไม่ซ้ำกัน**

```
Set "fruits" = {"apple", "banana", "cherry"}
                ↑ ไม่มีลำดับ, ไม่ซ้ำ
```

### 1. SADD -- เพิ่มสมาชิก

```bash
127.0.0.1:6379> SADD fruits "apple"
(integer) 1

127.0.0.1:6379> SADD fruits "banana"
(integer) 1

127.0.0.1:6379> SADD fruits "cherry"
(integer) 1

# เพิ่มค่าซ้ำ -- ไม่มีผล
127.0.0.1:6379> SADD fruits "apple"
(integer) 0        # ไม่ได้เพิ่ม เพราะมีอยู่แล้ว

# เพิ่มหลายค่าพร้อมกัน
127.0.0.1:6379> SADD fruits "date" "elderberry"
(integer) 2
```

### 2. SMEMBERS -- ดูสมาชิกทั้งหมด

```bash
127.0.0.1:6379> SMEMBERS fruits
1) "banana"
2) "cherry"
3) "date"
4) "elderberry"
5) "apple"
# ลำดับอาจต่างจากที่เพิ่ม -- Set ไม่มีลำดับ
```

### 3. SISMEMBER -- ตรวจสอบว่าเป็นสมาชิกหรือไม่

```bash
127.0.0.1:6379> SISMEMBER fruits "apple"
(integer) 1        # ใช่ เป็นสมาชิก

127.0.0.1:6379> SISMEMBER fruits "grape"
(integer) 0        # ไม่ใช่
```

### 4. SCARD -- นับจำนวนสมาชิก

```bash
127.0.0.1:6379> SCARD fruits
(integer) 5
```

### 5. SREM -- ลบสมาชิก

```bash
127.0.0.1:6379> SREM fruits "date"
(integer) 1

127.0.0.1:6379> SREM fruits "nonexistent"
(integer) 0        # ไม่มีอะไรถูกลบ
```

### 6. SRANDMEMBER -- สุ่มสมาชิก

```bash
# สุ่ม 1 ตัว (ไม่ลบออก)
127.0.0.1:6379> SRANDMEMBER fruits
"cherry"

# สุ่ม 2 ตัว
127.0.0.1:6379> SRANDMEMBER fruits 2
1) "apple"
2) "banana"
```

### 7. SPOP -- สุ่มแล้วลบ

```bash
# สุ่มแล้วลบออกจาก set
127.0.0.1:6379> SPOP fruits
"elderberry"

127.0.0.1:6379> SMEMBERS fruits
1) "banana"
2) "cherry"
3) "apple"
```

### 8. Set Operations -- SINTER, SUNION, SDIFF

นี่คือจุดแข็งที่สุดของ Set!

```bash
# สร้าง 2 sets
127.0.0.1:6379> SADD user:1:skills "python" "javascript" "redis" "docker"
(integer) 4

127.0.0.1:6379> SADD user:2:skills "javascript" "react" "redis" "mongodb"
(integer) 4
```

#### SINTER -- หา intersection (สมาชิกที่มีทั้งสอง set)

```bash
127.0.0.1:6379> SINTER user:1:skills user:2:skills
1) "javascript"
2) "redis"
# ทั้ง user:1 และ user:2 มี javascript และ redis
```

#### SUNION -- หา union (สมาชิกทั้งหมดรวมกัน)

```bash
127.0.0.1:6379> SUNION user:1:skills user:2:skills
1) "python"
2) "javascript"
3) "redis"
4) "docker"
5) "react"
6) "mongodb"
```

#### SDIFF -- หา difference (สมาชิกที่มีใน set แรกแต่ไม่มีใน set ที่สอง)

```bash
# skills ที่ user:1 มีแต่ user:2 ไม่มี
127.0.0.1:6379> SDIFF user:1:skills user:2:skills
1) "python"
2) "docker"

# skills ที่ user:2 มีแต่ user:1 ไม่มี
127.0.0.1:6379> SDIFF user:2:skills user:1:skills
1) "react"
2) "mongodb"
```

```
user:1:skills          user:2:skills
+------------------+   +------------------+
| python           |   |                  |
| docker           |   |                  |
|      +-----------+---+-----------+      |
|      | javascript|   |           |      |
|      | redis     |   |           |      |
|      +-----------+---+-----------+      |
|                  |   | react             |
|                  |   | mongodb           |
+------------------+   +------------------+

SINTER = javascript, redis       (ตรงกลาง)
SDIFF  = python, docker          (ซ้ายอย่างเดียว)
SUNION = ทั้งหมดรวมกัน
```

### 9. Set Use Cases

#### 9.1 Tags (แท็ก)

```bash
# เพิ่ม tags ให้บทความ
SADD post:1:tags "redis" "database" "tutorial"
SADD post:2:tags "redis" "docker" "devops"
SADD post:3:tags "docker" "kubernetes" "devops"

# หาบทความที่มี tag ร่วมกัน
SINTER post:1:tags post:2:tags
# "redis"

# ตรวจสอบว่าบทความมี tag นี้หรือไม่
SISMEMBER post:1:tags "redis"
# (integer) 1
```

#### 9.2 Unique Visitors (ผู้เข้าชมไม่ซ้ำ)

```bash
# เพิ่ม visitor (ถ้าซ้ำจะไม่นับ)
SADD visitors:2024-01-15 "user:1"
SADD visitors:2024-01-15 "user:2"
SADD visitors:2024-01-15 "user:1"    # ซ้ำ ไม่นับ
SADD visitors:2024-01-15 "user:3"

# นับ unique visitors
SCARD visitors:2024-01-15
# (integer) 3
```

#### 9.3 Mutual Friends (เพื่อนร่วม)

```bash
SADD friends:alice "bob" "charlie" "dave"
SADD friends:bob "alice" "charlie" "eve"

# เพื่อนร่วมกัน
SINTER friends:alice friends:bob
# "charlie"
```

---

# Part 2: Sorted Sets

Sorted Set (ZSet) คือ Set ที่แต่ละสมาชิกมี **score** (คะแนน) สำหรับจัดอันดับ

```
Sorted Set "leaderboard":
  Alice   → score: 2500
  Bob     → score: 2100
  Charlie → score: 1800
```

### 10. ZADD -- เพิ่มสมาชิกพร้อมคะแนน

```bash
# ZADD key score member
127.0.0.1:6379> ZADD leaderboard 2500 "Alice"
(integer) 1

127.0.0.1:6379> ZADD leaderboard 2100 "Bob"
(integer) 1

127.0.0.1:6379> ZADD leaderboard 1800 "Charlie"
(integer) 1

127.0.0.1:6379> ZADD leaderboard 3000 "Dave"
(integer) 1

# เพิ่มหลายคนพร้อมกัน
127.0.0.1:6379> ZADD leaderboard 1500 "Eve" 2800 "Frank"
(integer) 2
```

### 11. ZRANGE -- ดูตามลำดับคะแนน (น้อยไปมาก)

```bash
# ดูทั้งหมด (คะแนนน้อยไปมาก)
127.0.0.1:6379> ZRANGE leaderboard 0 -1
1) "Eve"
2) "Charlie"
3) "Bob"
4) "Alice"
5) "Frank"
6) "Dave"

# ดูพร้อมคะแนน
127.0.0.1:6379> ZRANGE leaderboard 0 -1 WITHSCORES
 1) "Eve"
 2) "1500"
 3) "Charlie"
 4) "1800"
 5) "Bob"
 6) "2100"
 7) "Alice"
 8) "2500"
 9) "Frank"
10) "2800"
11) "Dave"
12) "3000"
```

### 12. ZREVRANGE -- ดูตามลำดับคะแนน (มากไปน้อย)

```bash
# Top 3 คะแนนสูงสุด
127.0.0.1:6379> ZREVRANGE leaderboard 0 2 WITHSCORES
1) "Dave"
2) "3000"
3) "Frank"
4) "2800"
5) "Alice"
6) "2500"
```

### 13. ZSCORE -- ดูคะแนนของสมาชิก

```bash
127.0.0.1:6379> ZSCORE leaderboard "Alice"
"2500"

127.0.0.1:6379> ZSCORE leaderboard "nonexistent"
(nil)
```

### 14. ZRANK & ZREVRANK -- ดูอันดับ

```bash
# อันดับจากน้อยไปมาก (0 = ต่ำสุด)
127.0.0.1:6379> ZRANK leaderboard "Dave"
(integer) 5        # อันดับ 5 (จากน้อยไปมาก = คะแนนสูงสุด)

# อันดับจากมากไปน้อย (0 = สูงสุด)
127.0.0.1:6379> ZREVRANK leaderboard "Dave"
(integer) 0        # อันดับ 0 = อันดับ 1

127.0.0.1:6379> ZREVRANK leaderboard "Alice"
(integer) 2        # อันดับ 2 = อันดับ 3
```

### 15. ZINCRBY -- เพิ่ม/ลดคะแนน

```bash
# Alice ได้คะแนนเพิ่ม 500
127.0.0.1:6379> ZINCRBY leaderboard 500 "Alice"
"3000"

# Bob เสียคะแนน 100
127.0.0.1:6379> ZINCRBY leaderboard -100 "Bob"
"2000"

# ดู top 3 ใหม่
127.0.0.1:6379> ZREVRANGE leaderboard 0 2 WITHSCORES
1) "Alice"
2) "3000"
3) "Dave"
4) "3000"
5) "Frank"
6) "2800"
```

### 16. ZRANGEBYSCORE -- กรองตามช่วงคะแนน

```bash
# คนที่มีคะแนน 2000-3000
127.0.0.1:6379> ZRANGEBYSCORE leaderboard 2000 3000 WITHSCORES
1) "Bob"
2) "2000"
3) "Alice"
4) "3000"
5) "Dave"
6) "3000"

# คนที่มีคะแนนมากกว่า 2500
127.0.0.1:6379> ZRANGEBYSCORE leaderboard 2500 +inf WITHSCORES
1) "Alice"
2) "3000"
3) "Frank"
4) "2800"
5) "Dave"
6) "3000"

# คนที่มีคะแนนน้อยกว่า 2000
127.0.0.1:6379> ZRANGEBYSCORE leaderboard -inf 2000 WITHSCORES
1) "Eve"
2) "1500"
3) "Charlie"
4) "1800"
5) "Bob"
6) "2000"
```

| Symbol | ความหมาย |
|--------|---------|
| `+inf` | ไม่จำกัดค่าสูงสุด |
| `-inf` | ไม่จำกัดค่าต่ำสุด |
| `(2000` | มากกว่า 2000 (ไม่รวม 2000) |

### 17. ZCARD & ZCOUNT -- นับจำนวน

```bash
# นับสมาชิกทั้งหมด
127.0.0.1:6379> ZCARD leaderboard
(integer) 6

# นับสมาชิกในช่วงคะแนน 2000-3000
127.0.0.1:6379> ZCOUNT leaderboard 2000 3000
(integer) 4
```

### 18. ZREM -- ลบสมาชิก

```bash
127.0.0.1:6379> ZREM leaderboard "Eve"
(integer) 1

127.0.0.1:6379> ZCARD leaderboard
(integer) 5
```

### 19. Sorted Set Use Cases

#### 19.1 Leaderboard (กระดานคะแนน)

```bash
# เพิ่มคะแนนผู้เล่น
ZADD game:leaderboard 0 "player:1"
ZINCRBY game:leaderboard 100 "player:1"    # ได้ 100 คะแนน
ZINCRBY game:leaderboard 50 "player:1"     # ได้อีก 50

ZADD game:leaderboard 0 "player:2"
ZINCRBY game:leaderboard 200 "player:2"

ZADD game:leaderboard 0 "player:3"
ZINCRBY game:leaderboard 120 "player:3"

# ดู Top 3
ZREVRANGE game:leaderboard 0 2 WITHSCORES
# 1) "player:2" → 200
# 2) "player:1" → 150
# 3) "player:3" → 120

# ดูอันดับของตัวเอง
ZREVRANK game:leaderboard "player:1"
# (integer) 1  (อันดับ 2)

ZSCORE game:leaderboard "player:1"
# "150"
```

#### 19.2 Ranking (จัดอันดับสินค้าขายดี)

```bash
# นับยอดขายด้วย ZINCRBY
ZINCRBY products:sales 1 "iPhone"
ZINCRBY products:sales 1 "iPhone"
ZINCRBY products:sales 1 "MacBook"
ZINCRBY products:sales 1 "iPhone"
ZINCRBY products:sales 1 "AirPods"
ZINCRBY products:sales 1 "AirPods"

# Top 3 สินค้าขายดี
ZREVRANGE products:sales 0 2 WITHSCORES
# 1) "iPhone"  → 3
# 2) "AirPods" → 2
# 3) "MacBook" → 1
```

#### 19.3 Priority Queue (คิวตามลำดับความสำคัญ)

```bash
# เพิ่มงาน: score = priority (ยิ่งน้อย ยิ่งสำคัญ)
ZADD task:queue 1 "fix-security-bug"
ZADD task:queue 3 "add-feature"
ZADD task:queue 2 "fix-ui-bug"
ZADD task:queue 1 "database-migration"

# หยิบงานที่สำคัญที่สุด (score ต่ำสุด)
ZRANGE task:queue 0 0
# "database-migration" หรือ "fix-security-bug" (priority 1)
```

### 20. คำสั่ง Set & Sorted Set ทั้งหมด (สรุป)

#### Set Commands

| คำสั่ง | ความหมาย | ตัวอย่าง |
|--------|---------|---------|
| `SADD` | เพิ่มสมาชิก | `SADD key val` |
| `SMEMBERS` | ดูทั้งหมด | `SMEMBERS key` |
| `SISMEMBER` | ตรวจสอบสมาชิก | `SISMEMBER key val` |
| `SCARD` | นับจำนวน | `SCARD key` |
| `SREM` | ลบสมาชิก | `SREM key val` |
| `SRANDMEMBER` | สุ่ม (ไม่ลบ) | `SRANDMEMBER key 2` |
| `SPOP` | สุ่มแล้วลบ | `SPOP key` |
| `SINTER` | intersection | `SINTER key1 key2` |
| `SUNION` | union | `SUNION key1 key2` |
| `SDIFF` | difference | `SDIFF key1 key2` |

#### Sorted Set Commands

| คำสั่ง | ความหมาย | ตัวอย่าง |
|--------|---------|---------|
| `ZADD` | เพิ่มสมาชิก+คะแนน | `ZADD key 100 val` |
| `ZRANGE` | ดูตามคะแนน (น้อย→มาก) | `ZRANGE key 0 -1` |
| `ZREVRANGE` | ดูตามคะแนน (มาก→น้อย) | `ZREVRANGE key 0 2` |
| `ZSCORE` | ดูคะแนน | `ZSCORE key val` |
| `ZRANK` | อันดับ (น้อย→มาก) | `ZRANK key val` |
| `ZREVRANK` | อันดับ (มาก→น้อย) | `ZREVRANK key val` |
| `ZINCRBY` | เพิ่มคะแนน | `ZINCRBY key 10 val` |
| `ZRANGEBYSCORE` | กรองตามช่วงคะแนน | `ZRANGEBYSCORE key 0 100` |
| `ZCARD` | นับจำนวน | `ZCARD key` |
| `ZCOUNT` | นับในช่วงคะแนน | `ZCOUNT key 0 100` |
| `ZREM` | ลบสมาชิก | `ZREM key val` |

## แบบฝึกหัด

ดูไฟล์ [exercises.txt](./exercises.txt) -- มีแบบฝึกหัดพร้อมเฉลย

## สรุป

- **Set** เก็บข้อมูลไม่ซ้ำ ไม่มีลำดับ -- เหมาะกับ tags, unique visitors, followers
- **Set Operations** (SINTER, SUNION, SDIFF) ทรงพลังมาก -- หาข้อมูลร่วม/ต่างกัน
- **Sorted Set** เก็บข้อมูลไม่ซ้ำ + คะแนน -- เหมาะกับ leaderboard, ranking
- `ZINCRBY` ใช้เพิ่มคะแนนแบบ atomic
- `ZREVRANGE` ดู top N ตาม ranking

## ต่อไป

[Lab 08 -- Hashes -->](../lab-08-hashes/)
