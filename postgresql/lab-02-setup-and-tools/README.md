# Lab 02 — ติดตั้ง PostgreSQL & เครื่องมือ

## เป้าหมาย

รัน PostgreSQL ผ่าน Docker และเชื่อมต่อด้วยเครื่องมือต่างๆ

## ทำไมต้องรู้?

ก่อนจะเขียน SQL ได้ ต้องมี database ให้ทำงานด้วยก่อน เราจะรัน PostgreSQL ผ่าน Docker (ที่เรียนมาแล้ว) แทนการติดตั้งลงเครื่องจริง

## สิ่งที่ต้องมีก่อน

- [Docker Lab 02](../../docker/lab-02-first-container/) — รัน container ได้
- [Lab 01](../lab-01-what-is-database/) — รู้ว่า database คืออะไร

## เนื้อหา

### 1. รัน PostgreSQL ด้วย Docker

```bash
docker run -d \
  --name my-postgres \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=learn_sql \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

| flag | ความหมาย |
|------|---------|
| `--name my-postgres` | ตั้งชื่อ container |
| `-e POSTGRES_USER` | สร้าง user |
| `-e POSTGRES_PASSWORD` | ตั้ง password |
| `-e POSTGRES_DB` | สร้าง database เริ่มต้น |
| `-p 5432:5432` | เปิดพอร์ต PostgreSQL |
| `-v pgdata:/var/lib/postgresql/data` | เก็บข้อมูลถาวร |

### 2. ใช้ Docker Compose (แนะนำ)

ใน lab นี้มีไฟล์ `docker-compose.yml` ให้แล้ว:

```bash
cd lab-02-setup-and-tools
docker compose up -d
```

### 3. เชื่อมต่อด้วย psql (Command Line)

`psql` คือเครื่องมือ CLI ที่มาพร้อม PostgreSQL

```bash
# เข้าไปใน container แล้วใช้ psql
docker exec -it my-postgres psql -U admin -d learn_sql

# หรือใช้ psql จากเครื่อง (ถ้าติดตั้งแล้ว)
psql -h localhost -U admin -d learn_sql
```

### 4. คำสั่ง psql ที่ใช้บ่อย

```sql
-- ดู databases ทั้งหมด
\l

-- เชื่อมต่อ database อื่น
\c database_name

-- ดู tables ทั้งหมด
\dt

-- ดูโครงสร้าง table
\d table_name

-- ดู users
\du

-- ออกจาก psql
\q

-- รัน SQL จากไฟล์
\i filename.sql

-- เปิด/ปิด expanded display (อ่านง่ายขึ้น)
\x
```

### 5. เครื่องมือ GUI

ถ้าไม่ถนัด command line สามารถใช้เครื่องมือ GUI ได้:

| เครื่องมือ | ราคา | แนะนำสำหรับ |
|-----------|------|------------|
| **pgAdmin** | ฟรี | มาพร้อม PostgreSQL |
| **DBeaver** | ฟรี | รองรับหลาย databases |
| **TablePlus** | ฟรี (จำกัด) | Mac, สวย ใช้ง่าย |
| **DataGrip** | เสียเงิน | JetBrains IDE |

ใน lab นี้มี pgAdmin ให้ใน docker-compose.yml:
- เปิด `http://localhost:5050`
- Email: `admin@admin.com`
- Password: `admin`
- เพิ่ม server: Host=`db`, Port=`5432`, User=`admin`, Password=`secret`

### 6. ทดสอบการเชื่อมต่อ

```sql
-- ใน psql ลองรันคำสั่งแรก:
SELECT version();

-- ผลลัพธ์:
-- PostgreSQL 16.x on x86_64-pc-linux-musl...

-- ลองสร้าง table ทดสอบ
CREATE TABLE test (id SERIAL, message TEXT);
INSERT INTO test (message) VALUES ('Hello PostgreSQL!');
SELECT * FROM test;

-- ลบ table ทดสอบ
DROP TABLE test;
```

## แบบฝึกหัด

1. รัน PostgreSQL ด้วย `docker compose up -d`
2. เชื่อมต่อด้วย `psql` แล้วรัน `SELECT version()`
3. ลองใช้คำสั่ง `\l`, `\dt`, `\du`
4. เปิด pgAdmin ที่ `localhost:5050` แล้วเชื่อมต่อ database
5. สร้าง table ทดสอบ แล้วลบทิ้ง

## สรุป

- ใช้ Docker Compose รัน PostgreSQL ง่ายที่สุด
- `psql` คือ CLI สำหรับ PostgreSQL — จำคำสั่ง `\l`, `\dt`, `\d`, `\q`
- pgAdmin คือ GUI ที่มาพร้อม PostgreSQL
- ทุก lab หลังจากนี้จะมี `docker-compose.yml` พร้อมใช้

## ต่อไป

[Lab 03 — CREATE TABLE & Data Types →](../lab-03-create-table/)
