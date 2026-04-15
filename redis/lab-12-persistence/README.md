# Lab 12 — Persistence

## เป้าหมาย

เข้าใจกลไกการเก็บข้อมูลถาวรของ Redis — RDB Snapshots และ AOF (Append Only File) รวมถึงวิธีตั้งค่าและ backup strategy

## ทำไมต้องรู้?

- Redis เก็บข้อมูลใน memory — ถ้า server restart ข้อมูลจะหาย (ถ้าไม่ตั้ง persistence)
- **RDB** เหมาะกับ backup เป็นระยะ — ไฟล์เล็ก, restore เร็ว
- **AOF** เหมาะกับ durability สูง — บันทึกทุก write operation
- ใช้ทั้งสอง (**RDB + AOF**) ร่วมกันเพื่อความปลอดภัยสูงสุด
- ต้องเข้าใจ trade-off ระหว่าง performance กับ durability

## สิ่งที่ต้องมีก่อน

- [Lab 11](../lab-11-streams/) — ใช้ Redis data structures ได้
- Docker & Docker Compose

## เนื้อหา

### 1. Persistence 2 แบบ

```
┌─────────────────────────────────────────────────────┐
│                    Redis Server                      │
│                  (data ใน memory)                     │
└────────┬──────────────────────────────┬──────────────┘
         │                              │
    ┌────▼────┐                   ┌─────▼─────┐
    │   RDB   │                   │    AOF     │
    │ snapshot│                   │  log file  │
    │ .rdb    │                   │  .aof      │
    └─────────┘                   └───────────┘

RDB = ถ่ายรูป (snapshot) ทุก N วินาที
AOF = จดบันทึกทุกคำสั่ง (append-only log)
```

### 2. RDB Snapshots

```bash
docker exec -it redis redis-cli

# ดู config RDB ปัจจุบัน
CONFIG GET save
# 1) "save"
# 2) "3600 1 300 100 60 10000"
# หมายถึง:
#   - save ทุก 3600 วินาที (1 ชม.) ถ้ามีการเปลี่ยนแปลง >= 1 key
#   - save ทุก 300 วินาที (5 นาที) ถ้ามีการเปลี่ยนแปลง >= 100 keys
#   - save ทุก 60 วินาที ถ้ามีการเปลี่ยนแปลง >= 10000 keys

# SAVE — บันทึก RDB แบบ synchronous (blocking! ห้ามใช้ใน production)
SAVE

# BGSAVE — บันทึก RDB แบบ background (แนะนำ)
BGSAVE
# Background saving started

# ตรวจสอบเวลา save ล่าสุด
LASTSAVE
# (integer) 1705312800  ← Unix timestamp

# ดูตำแหน่งไฟล์ RDB
CONFIG GET dir
CONFIG GET dbfilename
```

#### RDB Config ใน redis.conf

```conf
# บันทึก snapshot ทุก 60 วินาที ถ้ามีการเปลี่ยนแปลง >= 1000 keys
save 60 1000

# ชื่อไฟล์ RDB
dbfilename dump.rdb

# ตำแหน่งเก็บไฟล์
dir /data

# บีบอัดไฟล์ RDB (แนะนำ เปิด)
rdbcompression yes

# ตรวจสอบความถูกต้องของไฟล์
rdbchecksum yes
```

### 3. AOF (Append Only File)

```bash
# เปิดใช้ AOF
CONFIG SET appendonly yes

# ดู config AOF
CONFIG GET appendonly
CONFIG GET appendfsync

# ไฟล์ AOF จะถูกสร้างที่ /data/appendonlydir/
```

#### AOF fsync policies

```conf
# appendfsync มี 3 ตัวเลือก:

# 1. always — fsync ทุก write (ช้าสุด, ปลอดภัยสุด)
appendfsync always
# ✅ ไม่มีโอกาสเสียข้อมูล
# ❌ ช้ามาก (ทุก command ต้องรอเขียน disk)

# 2. everysec — fsync ทุก 1 วินาที (แนะนำ, default)
appendfsync everysec
# ✅ balance ระหว่าง performance กับ safety
# ❌ อาจเสียข้อมูลไม่เกิน 1 วินาที

# 3. no — ให้ OS จัดการเอง (เร็วสุด, เสี่ยงสุด)
appendfsync no
# ✅ เร็วที่สุด
# ❌ อาจเสียข้อมูลหลายวินาที
```

### 4. AOF Rewrite

```bash
# AOF file จะโตขึ้นเรื่อยๆ ต้อง rewrite เพื่อลดขนาด
# Rewrite = สร้างไฟล์ใหม่ที่มีแค่คำสั่งที่จำเป็น

# สั่ง rewrite แบบ manual
BGREWRITEAOF

# ดูสถานะ
INFO persistence
```

#### AOF Rewrite Config

```conf
# Rewrite อัตโนมัติเมื่อไฟล์โตขึ้น 100% จากครั้งก่อน
auto-aof-rewrite-percentage 100

# ขนาดขั้นต่ำก่อน rewrite (ป้องกัน rewrite บ่อยเกินตอนไฟล์เล็ก)
auto-aof-rewrite-min-size 64mb
```

### 5. RDB vs AOF เปรียบเทียบ

```
┌──────────────────┬────────────────────┬────────────────────┐
│                  │       RDB          │       AOF          │
├──────────────────┼────────────────────┼────────────────────┤
│ รูปแบบ           │ Binary snapshot    │ Text log (commands)│
│ ขนาดไฟล์         │ เล็ก (compact)     │ ใหญ่กว่า           │
│ Restore speed    │ เร็ว              │ ช้ากว่า            │
│ Data loss risk   │ สูง (ตาม interval)│ ต่ำ (1 วินาที)     │
│ Performance      │ ดี                │ ลดลงเล็กน้อย       │
│ Backup           │ ง่าย (copy file)  │ ซับซ้อนกว่า        │
│ Use case         │ Backup, DR        │ Durability สูง     │
└──────────────────┴────────────────────┴────────────────────┘

แนะนำ: ใช้ทั้ง RDB + AOF ร่วมกัน
- AOF เป็น primary (durability)
- RDB เป็น backup (fast restore, disaster recovery)
```

### 6. ทดสอบ Persistence

```bash
# 1. เขียนข้อมูล
SET test:persist "Hello Redis!"
SET test:counter 42

# 2. บังคับ save
BGSAVE

# 3. ตรวจสอบ
LASTSAVE
INFO persistence

# 4. Restart Redis (ผ่าน docker compose)
# docker compose restart redis

# 5. เข้าไปตรวจสอบ
# docker exec -it redis redis-cli
# GET test:persist
# → "Hello Redis!"  (ข้อมูลยังอยู่!)
```

### 7. Backup Strategy

```
Production Backup Strategy:

1. เปิดทั้ง RDB + AOF
2. RDB snapshot ทุก 1 ชม. (สำหรับ disaster recovery)
3. AOF everysec (สำหรับ durability)
4. Copy RDB file ไป remote storage ทุกวัน
5. ทดสอบ restore จาก backup เป็นระยะ

Backup Script ตัวอย่าง:
$ cp /data/dump.rdb /backup/dump-$(date +%Y%m%d).rdb
```

### 8. INFO Persistence

```bash
# ดูสถานะ persistence ทั้งหมด
INFO persistence

# ค่าสำคัญ:
# rdb_last_save_time — เวลา RDB save ล่าสุด
# rdb_changes_since_last_save — จำนวน changes ตั้งแต่ save ล่าสุด
# aof_enabled — AOF เปิดอยู่ไหม
# aof_rewrite_in_progress — กำลัง rewrite อยู่ไหม
# aof_last_rewrite_time_sec — เวลาที่ใช้ rewrite ครั้งล่าสุด
```

## แบบฝึกหัด

1. เปิด `redis-cli` แล้วใช้ `CONFIG GET save` ดู RDB config ปัจจุบัน
2. เพิ่มข้อมูล 10 keys แล้วสั่ง `BGSAVE`
3. ใช้ `CONFIG SET appendonly yes` เปิด AOF แล้วเพิ่มข้อมูลอีก 5 keys
4. ดู `INFO persistence` แล้วอ่านค่าสำคัญ
5. Restart Redis container แล้วตรวจสอบว่าข้อมูลยังอยู่
6. ลองแก้ `redis.conf` ให้ใช้ทั้ง RDB + AOF

## Checklist

- [ ] เข้าใจความแตกต่างระหว่าง RDB และ AOF
- [ ] ใช้ SAVE / BGSAVE สร้าง RDB snapshot ได้
- [ ] ตั้งค่า AOF ได้ (appendonly, appendfsync)
- [ ] เข้าใจ fsync policies (always, everysec, no)
- [ ] ใช้ BGREWRITEAOF ลดขนาด AOF ได้
- [ ] ตรวจสอบ persistence status ด้วย INFO ได้
- [ ] เข้าใจ backup strategy สำหรับ production

## สรุป

- **RDB** — snapshot เป็นระยะ ไฟล์เล็ก restore เร็ว แต่อาจเสียข้อมูลได้
- **AOF** — บันทึกทุกคำสั่ง เสียข้อมูลน้อยมาก แต่ไฟล์ใหญ่กว่า
- **appendfsync everysec** — balance ที่ดีที่สุดระหว่าง performance กับ safety
- **แนะนำ** ใช้ทั้ง RDB + AOF ร่วมกันใน production
- ทำ backup RDB ไป remote storage เป็นประจำ

## ต่อไป

[Lab 13 — Caching Patterns →](../lab-13-caching-patterns/)
