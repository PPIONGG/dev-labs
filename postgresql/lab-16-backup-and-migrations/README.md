# Lab 16 — Backup, Restore & Migrations

## เป้าหมาย

Backup/Restore database และจัดการ migrations สำหรับ schema changes

## ทำไมต้องรู้?

- **Server ล่ม → ข้อมูลหาย** ถ้าไม่มี backup
- **Schema เปลี่ยน → ต้อง migrate** ไม่งั้น app พัง
- Production database ต้องมี backup strategy เสมอ
- ทีมหลายคนต้องใช้ migrations ให้ schema ตรงกัน

## สิ่งที่ต้องมีก่อน

- [Lab 15](../lab-15-performance/) — Performance Tuning

## เนื้อหา

### 1. pg_dump -- Export Database

`pg_dump` สร้างไฟล์ที่มีคำสั่ง SQL ทั้งหมดเพื่อสร้าง database ใหม่

```bash
# เข้าไปใน container ก่อน
docker compose exec db bash

# Backup ทั้ง database เป็น SQL file
pg_dump -U admin learn_sql > /tmp/backup.sql

# ดู backup file
cat /tmp/backup.sql
```

**Options ที่ใช้บ่อย:**

```bash
# --schema-only: เฉพาะ schema (ไม่มี data)
pg_dump -U admin --schema-only learn_sql > /tmp/schema.sql

# --data-only: เฉพาะ data (ไม่มี schema)
pg_dump -U admin --data-only learn_sql > /tmp/data.sql

# --clean: เพิ่ม DROP ก่อน CREATE
pg_dump -U admin --clean learn_sql > /tmp/backup_clean.sql

# --if-exists: เพิ่ม IF EXISTS กับ DROP
pg_dump -U admin --clean --if-exists learn_sql > /tmp/backup_safe.sql
```

### 2. pg_restore -- Import Database

```bash
# Restore จาก SQL file (ใช้ psql)
psql -U admin -d learn_sql < /tmp/backup.sql

# สร้าง database ใหม่แล้ว restore
createdb -U admin learn_sql_copy
psql -U admin -d learn_sql_copy < /tmp/backup.sql
```

### 3. pg_dump Formats

| Format | Flag | นามสกุล | คำอธิบาย |
|--------|------|--------|---------|
| Plain SQL | (default) | `.sql` | อ่านได้ แก้ไขได้ |
| Custom | `-Fc` | `.dump` | บีบอัด restore เลือกตารางได้ |
| Directory | `-Fd` | folder | หลายไฟล์ parallel ได้ |
| Tar | `-Ft` | `.tar` | เหมือน custom แต่เป็น tar |

```bash
# Custom format (แนะนำสำหรับ production)
pg_dump -U admin -Fc learn_sql > /tmp/backup.dump

# Restore จาก custom format
pg_restore -U admin -d learn_sql_copy /tmp/backup.dump

# Directory format (parallel backup)
pg_dump -U admin -Fd -j 4 learn_sql -f /tmp/backup_dir

# Restore จาก directory format (parallel restore)
pg_restore -U admin -d learn_sql_copy -j 4 /tmp/backup_dir
```

### 4. Backup Specific Tables

```bash
# Backup เฉพาะตาราง users
pg_dump -U admin -t users learn_sql > /tmp/users.sql

# Backup หลายตาราง
pg_dump -U admin -t users -t orders learn_sql > /tmp/users_orders.sql

# Backup ตารางที่ขึ้นต้นด้วย order
pg_dump -U admin -t 'order*' learn_sql > /tmp/order_tables.sql

# Exclude ตาราง
pg_dump -U admin -T logs learn_sql > /tmp/no_logs.sql
```

### 5. Automated Backup (cron)

สร้าง script สำหรับ backup อัตโนมัติ:

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DB_NAME="learn_sql"
DB_USER="admin"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/${DB_NAME}_${DATE}.dump"

# สร้าง backup
pg_dump -U $DB_USER -Fc $DB_NAME > $FILENAME

# ลบ backup เก่ากว่า 7 วัน
find $BACKUP_DIR -name "*.dump" -mtime +7 -delete

echo "Backup completed: $FILENAME"
```

ตั้ง cron ให้รันทุกวัน ตี 2:

```bash
# เปิด crontab
crontab -e

# เพิ่มบรรทัดนี้
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

### 6. Migrations คืออะไร

Migration = versioned schema changes — ติดตามการเปลี่ยน schema เหมือน Git ติดตามโค้ด

```
ปัญหาที่ไม่มี migrations:
  Dev A: ALTER TABLE users ADD COLUMN phone...
  Dev B: ALTER TABLE users ADD COLUMN phone... ← ซ้ำ!
  Production: ใครจำได้ว่าต้องรัน SQL อะไรบ้าง?

แก้ด้วย migrations:
  001_create_users.sql  → ทุกคนรัน
  002_add_phone.sql     → ทุกคนรัน
  003_add_avatar.sql    → ทุกคนรัน
  รันตามลำดับ ไม่ซ้ำ ทุกคนได้ schema เดียวกัน
```

### 7. Migration Files Structure (up/down)

ทุก migration มี 2 ส่วน:
- **UP** — ทำการเปลี่ยนแปลง (เพิ่ม column, สร้างตาราง)
- **DOWN** — ย้อนกลับ (ลบ column, ลบตาราง)

```sql
-- migrations/001_create_users.sql

-- UP
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOWN
-- DROP TABLE users;
```

```sql
-- migrations/002_add_phone.sql

-- UP
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
CREATE INDEX idx_users_phone ON users(phone);

-- DOWN
-- DROP INDEX idx_users_phone;
-- ALTER TABLE users DROP COLUMN phone;
```

### 8. ตัวอย่าง Migration: เพิ่ม column, สร้าง index

```sql
-- migrations/003_add_avatar.sql

-- UP
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;

-- DOWN
-- ALTER TABLE users DROP COLUMN bio;
-- ALTER TABLE users DROP COLUMN avatar_url;
```

```sql
-- migrations/004_create_posts.sql

-- UP
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(300) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);

-- DOWN
-- DROP TABLE posts;
```

**เครื่องมือ Migration ที่นิยม:**
- **Node.js:** node-pg-migrate, Knex.js, Prisma
- **Python:** Alembic, Django migrations
- **Go:** golang-migrate, goose
- **Ruby:** Active Record Migrations

## แบบฝึกหัด

1. Backup database ทั้งหมดเป็น SQL file
2. Backup เฉพาะตาราง users
3. Backup เป็น custom format
4. สร้าง database ใหม่แล้ว restore
5. ฝึกรัน migration files ตามลำดับ (001, 002)
6. เขียน migration สำหรับเพิ่ม column `avatar_url` ในตาราง users

**วิธีฝึก:**

```bash
# เริ่ม container
docker compose up -d

# เข้า container
docker compose exec db bash

# ฝึก backup
pg_dump -U admin learn_sql > /tmp/backup.sql
pg_dump -U admin -Fc learn_sql > /tmp/backup.dump

# สร้าง database ใหม่
createdb -U admin test_restore

# Restore
psql -U admin -d test_restore < /tmp/backup.sql

# ตรวจสอบ
psql -U admin -d test_restore -c "SELECT COUNT(*) FROM users;"

# ฝึก migration
psql -U admin -d learn_sql < /docker-entrypoint-initdb.d/migrations/001_create_users.sql
psql -U admin -d learn_sql < /docker-entrypoint-initdb.d/migrations/002_add_phone.sql
```

## สรุป

- `pg_dump` export database, `psql`/`pg_restore` import กลับ
- ใช้ custom format (`-Fc`) สำหรับ production — บีบอัด + restore เลือกตารางได้
- ตั้ง automated backup ด้วย cron + script
- Migrations = versioned schema changes — ทุกคนได้ schema เดียวกัน
- ทุก migration มี UP (ทำ) และ DOWN (ย้อน)
- ใช้เครื่องมือ migration ของ framework ช่วยจัดการลำดับ

## ต่อไป

[Lab 17 — Project: Blog Platform →](../lab-17-project-blog-platform/)
