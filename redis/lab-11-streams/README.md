# Lab 11 — Streams

## เป้าหมาย

เข้าใจและใช้งาน Redis Streams สำหรับ message queue, event sourcing, และ activity logging ที่มี persistence และ consumer groups

## ทำไมต้องรู้?

- **Event Sourcing** — บันทึกทุก event ที่เกิดขึ้นตามลำดับเวลา
- **Message Queue** — ส่งงานให้ workers หลายตัวประมวลผล โดยแต่ละ message ถูกประมวลผลแค่ครั้งเดียว
- **Activity Log** — เก็บ log กิจกรรมของ users แบบ append-only
- **Reliable Messaging** — ต่างจาก Pub/Sub ตรงที่ข้อความถูกเก็บไว้ ไม่หายหาก subscriber offline
- เป็น data structure ที่ทรงพลังที่สุดของ Redis

## สิ่งที่ต้องมีก่อน

- [Lab 10](../lab-10-pubsub/) — เข้าใจ Pub/Sub และข้อจำกัด
- Docker & Docker Compose

## เนื้อหา

### 1. Stream คืออะไร?

```
Stream เหมือน append-only log ที่มี ID อัตโนมัติตามเวลา

Stream "orders"
┌──────────────────┬──────────────────┬──────────────────┐
│ 1705312800000-0  │ 1705312801000-0  │ 1705312802000-0  │
│ item: "iPhone"   │ item: "iPad"     │ item: "MacBook"  │
│ price: 35900     │ price: 24900     │ price: 59900     │
│ user: "alice"    │ user: "bob"      │ user: "alice"    │
└──────────────────┴──────────────────┴──────────────────┘
      Entry 1             Entry 2           Entry 3

- แต่ละ entry มี unique ID (timestamp-sequence)
- แต่ละ entry มี field-value pairs (คล้าย Hash)
- ข้อมูลถูกเก็บถาวร (persistent)
- รองรับ Consumer Groups
```

### 2. XADD — เพิ่ม entry ลง stream

```bash
docker exec -it redis redis-cli

# XADD — เพิ่ม entry ลง stream
# * = ให้ Redis สร้าง ID อัตโนมัติ (timestamp-based)
XADD orders * item "iPhone 16" price 35900 user "alice"
# "1705312800000-0"

XADD orders * item "iPad Air" price 24900 user "bob"
# "1705312801000-0"

XADD orders * item "MacBook Pro" price 59900 user "alice"
# "1705312802000-0"

# ระบุ ID เอง (ไม่แนะนำ ยกเว้นมีเหตุผลเฉพาะ)
XADD orders 1705400000000-0 item "AirPods" price 8990 user "charlie"
```

### 3. XLEN — นับจำนวน entries

```bash
XLEN orders
# (integer) 4
```

### 4. XRANGE / XREVRANGE — อ่าน entries ตามช่วง

```bash
# XRANGE — อ่านจากเก่าไปใหม่
# - = เริ่มต้น, + = ล่าสุด
XRANGE orders - +
# 1) 1) "1705312800000-0"
#    2) 1) "item" 2) "iPhone 16" 3) "price" 4) "35900" ...
# 2) ...

# อ่านแค่ 2 entries แรก
XRANGE orders - + COUNT 2

# อ่านตั้งแต่ ID ที่ระบุ
XRANGE orders 1705312801000-0 +

# XREVRANGE — อ่านจากใหม่ไปเก่า
XREVRANGE orders + -

# 3 entries ล่าสุด
XREVRANGE orders + - COUNT 3
```

### 5. XREAD — อ่าน entries ใหม่ (polling)

```bash
# XREAD — อ่าน entries ใหม่กว่า ID ที่ระบุ
# 0 = อ่านตั้งแต่แรก
XREAD COUNT 2 STREAMS orders 0
# อ่าน 2 entries แรกของ stream "orders"

# XREAD BLOCK — รอ (blocking) จนกว่าจะมี entry ใหม่
# $ = อ่านเฉพาะ entries ที่มาหลังจากคำสั่งนี้
# BLOCK 5000 = รอ 5 วินาที (0 = รอไม่มีกำหนด)
XREAD BLOCK 5000 COUNT 1 STREAMS orders $
# รอ... จนกว่าจะมี entry ใหม่ หรือ timeout
```

### 6. XINFO — ดูข้อมูล stream

```bash
# ดูข้อมูลทั่วไปของ stream
XINFO STREAM orders

# ดูรายละเอียด groups
XINFO GROUPS orders

# ดู consumers ใน group
XINFO CONSUMERS orders order-processors
```

### 7. Consumer Groups — ประมวลผลแบบกระจาย

```
Consumer Group:
- หลาย consumers แบ่งงานกัน
- แต่ละ message ถูกส่งให้ consumer เดียว (ไม่ซ้ำ)
- มี acknowledgment (XACK) ยืนยันว่าประมวลผลเสร็จ
- ถ้า consumer ตาย message จะถูกส่งให้ consumer อื่น

                    ┌─────────────┐
                    │   Stream    │
                    │  "orders"   │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │   Group:    │
                    │ "processors"│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Worker 1 │ │ Worker 2 │ │ Worker 3 │
        │ msg 1,4  │ │ msg 2,5  │ │ msg 3,6  │
        └──────────┘ └──────────┘ └──────────┘
```

```bash
# สร้าง Consumer Group
# $ = เริ่มอ่านจาก entries ใหม่
# 0 = เริ่มอ่านจาก entry แรก
XGROUP CREATE orders order-processors 0 MKSTREAM

# อ่าน message ในฐานะ consumer (worker-1)
# > = อ่าน message ที่ยังไม่ถูก deliver ให้ consumer ไหน
XREADGROUP GROUP order-processors worker-1 COUNT 1 STREAMS orders >

# อ่าน message ในฐานะ consumer อื่น (worker-2)
XREADGROUP GROUP order-processors worker-2 COUNT 1 STREAMS orders >
```

### 8. XACK — ยืนยันว่าประมวลผลเสร็จ

```bash
# หลังจาก consumer ประมวลผล message เสร็จ ต้อง ACK
XACK orders order-processors 1705312800000-0
# (integer) 1

# ดู pending messages (ยังไม่ ACK)
XPENDING orders order-processors
# 1) (integer) 1       ← จำนวน pending
# 2) "1705312801000-0"  ← min ID
# 3) "1705312801000-0"  ← max ID
# 4) 1) 1) "worker-2"  ← consumer ที่ถือ message
#       2) "1"

# ดูรายละเอียด pending messages
XPENDING orders order-processors - + 10
```

### 9. XCLAIM — โอน message ให้ consumer อื่น

```bash
# ถ้า worker-2 ตาย สามารถโอน message ที่ค้างให้ worker-1
# min-idle-time = 60000 ms (1 นาที) — โอนเฉพาะที่ค้างนานกว่า 1 นาที
XCLAIM orders order-processors worker-1 60000 1705312801000-0
```

### 10. XTRIM — จำกัดขนาด stream

```bash
# เก็บแค่ 1000 entries ล่าสุด
XTRIM orders MAXLEN 1000

# เก็บแบบประมาณ (เร็วกว่า)
XTRIM orders MAXLEN ~ 1000

# หรือตั้ง MAXLEN ตอน XADD
XADD orders MAXLEN ~ 1000 * item "New Item" price 100
```

### 11. XDEL — ลบ entry

```bash
# ลบ entry เฉพาะ (ไม่ค่อยใช้ เพราะ stream เป็น append-only)
XDEL orders 1705400000000-0
# (integer) 1
```

## แบบฝึกหัด

ดู `exercises.txt` สำหรับแบบฝึกหัดเพิ่มเติม

1. สร้าง stream `events` แล้วเพิ่ม 5 entries (type: login, logout, purchase, view, click)
2. อ่านทุก entries ด้วย XRANGE
3. อ่านเฉพาะ 3 entries ล่าสุดด้วย XREVRANGE
4. สร้าง Consumer Group `event-processors` แล้วให้ 2 workers อ่าน message
5. ACK message ที่ประมวลผลเสร็จ
6. ตรวจสอบ pending messages ด้วย XPENDING
7. จำกัดขนาด stream ให้เก็บแค่ 100 entries

## Checklist

- [ ] ใช้ XADD เพิ่ม entries ลง stream ได้
- [ ] ใช้ XRANGE / XREVRANGE อ่าน entries ได้
- [ ] ใช้ XREAD อ่าน entries ใหม่ได้ (รวม BLOCK mode)
- [ ] สร้าง Consumer Group ได้
- [ ] ใช้ XREADGROUP อ่าน message ในฐานะ consumer ได้
- [ ] ใช้ XACK ยืนยันการประมวลผลได้
- [ ] เข้าใจ XPENDING และ XCLAIM สำหรับ error handling
- [ ] ใช้ XTRIM จำกัดขนาด stream ได้

## สรุป

- **Streams** เป็น append-only log ที่มี persistence — ต่างจาก Pub/Sub ที่เป็น fire-and-forget
- `XADD` — เพิ่ม entry, `XRANGE` / `XREVRANGE` — อ่านตามช่วง
- `XREAD BLOCK` — blocking read สำหรับ real-time
- **Consumer Groups** — กระจายงานให้หลาย workers โดยไม่ซ้ำ
- `XACK` — ยืนยันว่าประมวลผลเสร็จ
- `XPENDING` / `XCLAIM` — จัดการ message ที่ค้าง
- `XTRIM` — จำกัดขนาด stream

## ต่อไป

[Lab 12 — Persistence →](../lab-12-persistence/)
