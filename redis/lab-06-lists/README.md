# Lab 06 -- Lists

## เป้าหมาย

เข้าใจและใช้งาน List ใน Redis -- โครงสร้างข้อมูลแบบ linked list ที่ใช้ทำ queue, stack และ recent items

## ทำไมต้องรู้?

List เป็น data type ที่ใช้บ่อยมากใน Redis:
- **Queue** (คิว) -- จัดการงานตามลำดับ (email queue, task queue)
- **Stack** -- ข้อมูลแบบเข้าหลังออกก่อน
- **Recent items** -- 10 กิจกรรมล่าสุด, 5 สินค้าที่ดูล่าสุด
- **Activity feed** -- timeline ข้อความล่าสุด

## สิ่งที่ต้องมีก่อน

- [Lab 03](../lab-03-strings/) -- ใช้ SET/GET ได้
- [Lab 04](../lab-04-expiration/) -- เข้าใจ TTL

## เนื้อหา

### 1. LPUSH & RPUSH -- เพิ่มข้อมูล

```bash
# LPUSH -- เพิ่มที่หัว (ซ้าย)
127.0.0.1:6379> LPUSH fruits "apple"
(integer) 1

127.0.0.1:6379> LPUSH fruits "banana"
(integer) 2

127.0.0.1:6379> LPUSH fruits "cherry"
(integer) 3

# ผลลัพธ์: [cherry, banana, apple]
#           ↑ หัว                ↑ ท้าย

# RPUSH -- เพิ่มที่ท้าย (ขวา)
127.0.0.1:6379> RPUSH fruits "date"
(integer) 4

127.0.0.1:6379> RPUSH fruits "elderberry"
(integer) 5

# ผลลัพธ์: [cherry, banana, apple, date, elderberry]
```

```
LPUSH (เพิ่มทางซ้าย)         RPUSH (เพิ่มทางขวา)
        ↓                                    ↓
  [cherry, banana, apple, date, elderberry]
   หัว(0)                        ท้าย(4)
```

เพิ่มหลายค่าพร้อมกัน:

```bash
127.0.0.1:6379> RPUSH colors "red" "green" "blue"
(integer) 3
```

### 2. LRANGE -- ดูข้อมูลใน list

```bash
# LRANGE key start stop
# index เริ่มจาก 0, ใช้ -1 หมายถึงตัวสุดท้าย

# ดูทั้งหมด
127.0.0.1:6379> LRANGE fruits 0 -1
1) "cherry"
2) "banana"
3) "apple"
4) "date"
5) "elderberry"

# ดู 3 ตัวแรก
127.0.0.1:6379> LRANGE fruits 0 2
1) "cherry"
2) "banana"
3) "apple"

# ดู 2 ตัวสุดท้าย
127.0.0.1:6379> LRANGE fruits -2 -1
1) "date"
2) "elderberry"
```

### 3. LPOP & RPOP -- ดึงข้อมูลออก

```bash
# LPOP -- ดึงจากหัว (ซ้าย)
127.0.0.1:6379> LPOP fruits
"cherry"

# RPOP -- ดึงจากท้าย (ขวา)
127.0.0.1:6379> RPOP fruits
"elderberry"

127.0.0.1:6379> LRANGE fruits 0 -1
1) "banana"
2) "apple"
3) "date"
```

ดึงหลายตัวพร้อมกัน (Redis 6.2+):

```bash
127.0.0.1:6379> RPUSH nums "1" "2" "3" "4" "5"
(integer) 5

127.0.0.1:6379> LPOP nums 2
1) "1"
2) "2"

127.0.0.1:6379> RPOP nums 2
1) "5"
2) "4"
```

### 4. LLEN -- นับจำนวน

```bash
127.0.0.1:6379> RPUSH tasks "task1" "task2" "task3"
(integer) 3

127.0.0.1:6379> LLEN tasks
(integer) 3
```

### 5. LINDEX -- ดูค่าที่ตำแหน่ง

```bash
127.0.0.1:6379> RPUSH letters "a" "b" "c" "d" "e"
(integer) 5

# ตำแหน่ง 0 (ตัวแรก)
127.0.0.1:6379> LINDEX letters 0
"a"

# ตำแหน่ง 2
127.0.0.1:6379> LINDEX letters 2
"c"

# ตำแหน่ง -1 (ตัวสุดท้าย)
127.0.0.1:6379> LINDEX letters -1
"e"
```

### 6. LREM -- ลบข้อมูลตามค่า

```bash
127.0.0.1:6379> RPUSH items "a" "b" "c" "b" "d" "b"
(integer) 6

# ลบ "b" จำนวน 2 ตัวจากหัว
127.0.0.1:6379> LREM items 2 "b"
(integer) 2

127.0.0.1:6379> LRANGE items 0 -1
1) "a"
2) "c"
3) "d"
4) "b"
```

| LREM count | ความหมาย |
|-----------|---------|
| `LREM key 2 val` | ลบ val 2 ตัว จากหัวไปท้าย |
| `LREM key -2 val` | ลบ val 2 ตัว จากท้ายไปหัว |
| `LREM key 0 val` | ลบ val ทุกตัว |

### 7. LTRIM -- ตัดให้เหลือเฉพาะบางส่วน

```bash
127.0.0.1:6379> RPUSH logs "log1" "log2" "log3" "log4" "log5" "log6" "log7" "log8" "log9" "log10"
(integer) 10

# เก็บแค่ 5 ตัวล่าสุด (index 0-4)
127.0.0.1:6379> LTRIM logs 0 4
OK

127.0.0.1:6379> LRANGE logs 0 -1
1) "log1"
2) "log2"
3) "log3"
4) "log4"
5) "log5"
```

**Use case สำคัญ:** เก็บแค่ N รายการล่าสุด

```bash
# เพิ่ม log ใหม่ แล้ว trim ให้เหลือ 100 รายการ
LPUSH activity:user1 "viewed product"
LTRIM activity:user1 0 99
```

### 8. LSET -- แก้ไขค่าที่ตำแหน่ง

```bash
127.0.0.1:6379> RPUSH colors "red" "green" "blue"
(integer) 3

127.0.0.1:6379> LSET colors 1 "yellow"
OK

127.0.0.1:6379> LRANGE colors 0 -1
1) "red"
2) "yellow"
3) "blue"
```

### 9. LINSERT -- แทรกก่อน/หลัง

```bash
127.0.0.1:6379> RPUSH colors "red" "blue" "green"
(integer) 3

# แทรก "yellow" ก่อน "blue"
127.0.0.1:6379> LINSERT colors BEFORE "blue" "yellow"
(integer) 4

# แทรก "purple" หลัง "blue"
127.0.0.1:6379> LINSERT colors AFTER "blue" "purple"
(integer) 5

127.0.0.1:6379> LRANGE colors 0 -1
1) "red"
2) "yellow"
3) "blue"
4) "purple"
5) "green"
```

### 10. Use Cases จริง

#### 10.1 Queue (FIFO -- First In, First Out)

```bash
# Producer: เพิ่มงานที่ท้าย
RPUSH email:queue '{"to":"a@mail.com","subject":"Welcome"}'
RPUSH email:queue '{"to":"b@mail.com","subject":"Order"}'
RPUSH email:queue '{"to":"c@mail.com","subject":"Reset"}'

# Consumer: หยิบงานจากหัว
LPOP email:queue
# '{"to":"a@mail.com","subject":"Welcome"}'  (เข้าก่อน ออกก่อน)

LPOP email:queue
# '{"to":"b@mail.com","subject":"Order"}'

# ดูงานที่เหลือ
LLEN email:queue
# (integer) 1
```

```
Queue (FIFO):
RPUSH →  [job1, job2, job3]  → LPOP
          เข้าทางขวา           ออกทางซ้าย
```

#### 10.2 Stack (LIFO -- Last In, First Out)

```bash
# Push: เพิ่มที่หัว
LPUSH undo:stack "action1"
LPUSH undo:stack "action2"
LPUSH undo:stack "action3"

# Pop: ดึงจากหัว (ตัวล่าสุดออกก่อน)
LPOP undo:stack
# "action3"  (เข้าหลัง ออกก่อน)
```

```
Stack (LIFO):
LPUSH →  [action3, action2, action1]  → LPOP
          เข้าทางซ้าย                    ออกทางซ้าย
```

#### 10.3 Recent Items (N ล่าสุด)

```bash
# เพิ่มสินค้าที่เพิ่งดู
LPUSH recent:user:1 "product:500"
LPUSH recent:user:1 "product:200"
LPUSH recent:user:1 "product:350"
LPUSH recent:user:1 "product:100"

# เก็บแค่ 3 ล่าสุด
LTRIM recent:user:1 0 2

# ดูสินค้าที่ดูล่าสุด
LRANGE recent:user:1 0 -1
# 1) "product:100"
# 2) "product:350"
# 3) "product:200"
```

#### 10.4 Activity Feed

```bash
# เพิ่ม activity
LPUSH feed:user:1 '{"action":"liked","target":"post:42","time":"10:00"}'
LPUSH feed:user:1 '{"action":"commented","target":"post:38","time":"10:05"}'
LPUSH feed:user:1 '{"action":"shared","target":"post:42","time":"10:10"}'

# ดู 10 activities ล่าสุด
LRANGE feed:user:1 0 9

# เก็บแค่ 100 activities
LTRIM feed:user:1 0 99
```

### 11. คำสั่ง List ทั้งหมด (สรุป)

| คำสั่ง | ความหมาย | ตัวอย่าง |
|--------|---------|---------|
| `LPUSH` | เพิ่มที่หัว (ซ้าย) | `LPUSH key val` |
| `RPUSH` | เพิ่มที่ท้าย (ขวา) | `RPUSH key val` |
| `LPOP` | ดึงจากหัว | `LPOP key` |
| `RPOP` | ดึงจากท้าย | `RPOP key` |
| `LRANGE` | ดูช่วง | `LRANGE key 0 -1` |
| `LLEN` | นับจำนวน | `LLEN key` |
| `LINDEX` | ดูค่าที่ตำแหน่ง | `LINDEX key 0` |
| `LREM` | ลบตามค่า | `LREM key 2 val` |
| `LTRIM` | ตัดให้เหลือช่วง | `LTRIM key 0 99` |
| `LSET` | แก้ค่าที่ตำแหน่ง | `LSET key 1 val` |
| `LINSERT` | แทรกก่อน/หลัง | `LINSERT key BEFORE pivot val` |

## แบบฝึกหัด

ดูไฟล์ [exercises.txt](./exercises.txt) -- มีแบบฝึกหัดพร้อมเฉลย

## สรุป

- List คือ linked list ที่เพิ่ม/ลบจากหัวและท้ายได้อย่างรวดเร็ว (O(1))
- **Queue** = RPUSH + LPOP (FIFO)
- **Stack** = LPUSH + LPOP (LIFO)
- `LTRIM` ใช้จำกัดจำนวน -- เก็บแค่ N รายการล่าสุด
- Use case หลัก: queue, stack, recent items, activity feed

## ต่อไป

[Lab 07 -- Sets & Sorted Sets -->](../lab-07-sets/)
