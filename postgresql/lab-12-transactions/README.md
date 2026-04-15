# Lab 12 — Transactions & ACID: ความปลอดภัยของข้อมูล

## เป้าหมาย

เข้าใจ Transaction และหลัก ACID เพื่อให้ข้อมูลถูกต้องและปลอดภัย

## ทำไมต้องรู้?

ลองนึกภาพ **โอนเงิน** จากบัญชี A ไปบัญชี B:

1. หักเงินจากบัญชี A (-5,000)
2. เพิ่มเงินในบัญชี B (+5,000)

ถ้าขั้นตอนที่ 1 สำเร็จ แต่ขั้นตอนที่ 2 **ล้มเหลว** (เช่น ระบบล่ม) → เงิน 5,000 บาท **หายไป!**

Transaction แก้ปัญหานี้ — **ทำทั้งหมดหรือไม่ทำเลย**

## สิ่งที่ต้องมีก่อน

- [Lab 11](../lab-11-indexing/) — เข้าใจ Index เบื้องต้น

## เนื้อหา

### 1. Transaction คืออะไร?

Transaction คือ **กลุ่มคำสั่ง SQL ที่ทำงานเป็นชุดเดียว** — สำเร็จทั้งหมด หรือยกเลิกทั้งหมด

```
โอนเงิน 5,000 บาท (A → B):

ไม่มี Transaction:                    มี Transaction:
┌──────────────────┐                ┌──────────────────┐
│ 1. หัก A -5,000  │ ✅              │ BEGIN             │
│ 2. ระบบล่ม! 💥   │                │ 1. หัก A -5,000  │
│ 3. เพิ่ม B ??? ❌ │                │ 2. ระบบล่ม!      │
│                  │                │ → ROLLBACK ทั้งหมด │
│ เงินหาย 5,000!  │                │ A กลับมา 5,000   │ ✅
└──────────────────┘                └──────────────────┘
```

### 2. ACID — หลัก 4 ข้อของ Transaction

| หลัก | ชื่อเต็ม | ความหมาย | ตัวอย่าง |
|------|----------|----------|----------|
| **A** | Atomicity | ทำทั้งหมดหรือไม่ทำเลย | โอนเงินต้องหักและเพิ่มทั้งคู่ |
| **C** | Consistency | ข้อมูลถูกต้องเสมอ | ยอดรวมทุกบัญชีเท่าเดิม |
| **I** | Isolation | Transaction ไม่รบกวนกัน | 2 คนโอนพร้อมกัน ไม่เกิดปัญหา |
| **D** | Durability | เมื่อ commit แล้วอยู่ถาวร | ระบบล่มหลัง commit → ข้อมูลยังอยู่ |

### 3. BEGIN, COMMIT, ROLLBACK

```sql
-- BEGIN — เริ่ม transaction
-- COMMIT — ยืนยัน (บันทึกทั้งหมด)
-- ROLLBACK — ยกเลิก (คืนค่าทั้งหมด)

-- ตัวอย่าง: โอนเงิน 5,000 จากสมชาย(1) ไปสมหญิง(2)
BEGIN;
  UPDATE accounts SET balance = balance - 5000 WHERE id = 1;
  UPDATE accounts SET balance = balance + 5000 WHERE id = 2;
  INSERT INTO transfer_log (from_account_id, to_account_id, amount)
    VALUES (1, 2, 5000);
COMMIT;
```

```sql
-- ตัวอย่าง ROLLBACK: ถ้ามีปัญหาให้ยกเลิก
BEGIN;
  UPDATE accounts SET balance = balance - 999999 WHERE id = 5;
  -- ERROR: violates check constraint "positive_balance"
  -- เงินไม่พอ! ยกเลิกทั้งหมด
ROLLBACK;
-- ข้อมูลกลับมาเหมือนเดิม
```

### 4. SAVEPOINT

SAVEPOINT สร้าง **จุดบันทึก** ภายใน transaction — rollback ได้บางส่วน:

```sql
BEGIN;
  -- ขั้นตอนที่ 1
  UPDATE accounts SET balance = balance - 3000 WHERE id = 1;
  UPDATE accounts SET balance = balance + 3000 WHERE id = 2;

  SAVEPOINT after_first_transfer;

  -- ขั้นตอนที่ 2 (อาจ fail)
  UPDATE accounts SET balance = balance - 999999 WHERE id = 1;
  -- ERROR! เงินไม่พอ

  -- rollback เฉพาะขั้นตอนที่ 2
  ROLLBACK TO SAVEPOINT after_first_transfer;

  -- ขั้นตอนที่ 1 ยังอยู่!
COMMIT;
```

```
Timeline ของ SAVEPOINT:
BEGIN ──→ ขั้นตอน 1 ──→ SAVEPOINT ──→ ขั้นตอน 2 (fail!)
                          ↑
                          └── ROLLBACK TO กลับมาตรงนี้
                               ↓
                             COMMIT (เก็บเฉพาะขั้นตอน 1)
```

### 5. Isolation Levels

เมื่อหลาย transactions ทำงาน **พร้อมกัน** อาจเกิดปัญหา:

| ปัญหา | อธิบาย |
|--------|--------|
| Dirty Read | อ่านข้อมูลที่ยังไม่ commit |
| Non-repeatable Read | อ่านซ้ำได้ค่าต่างกัน |
| Phantom Read | query ซ้ำได้จำนวนแถวต่างกัน |

PostgreSQL มี 3 isolation levels:

```sql
-- READ COMMITTED (default) — อ่านได้เฉพาะที่ commit แล้ว
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
  SELECT balance FROM accounts WHERE id = 1;
COMMIT;

-- REPEATABLE READ — อ่านซ้ำได้ค่าเดิมตลอด transaction
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
  SELECT balance FROM accounts WHERE id = 1;  -- ได้ 50,000
  -- แม้คนอื่น UPDATE balance ระหว่างนี้
  SELECT balance FROM accounts WHERE id = 1;  -- ยังได้ 50,000
COMMIT;

-- SERIALIZABLE — เข้มงวดที่สุด เหมือนทำทีละ transaction
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  -- ...
COMMIT;
```

| Level | Dirty Read | Non-repeatable Read | Phantom Read |
|-------|-----------|-------------------|-------------|
| READ COMMITTED | ป้องกัน | เกิดได้ | เกิดได้ |
| REPEATABLE READ | ป้องกัน | ป้องกัน | ป้องกัน* |
| SERIALIZABLE | ป้องกัน | ป้องกัน | ป้องกัน |

> *PostgreSQL's REPEATABLE READ ป้องกัน phantom read ได้ด้วย (ต่างจากมาตรฐาน SQL)

### 6. ตัวอย่าง: ระบบโอนเงินที่ปลอดภัย

```sql
-- โอนเงินที่ปลอดภัย พร้อมตรวจสอบ
BEGIN;
  -- ตรวจสอบยอดเงินก่อน
  DO $$
  DECLARE
    sender_balance NUMERIC;
  BEGIN
    SELECT balance INTO sender_balance
    FROM accounts WHERE id = 1 FOR UPDATE;  -- lock แถวนี้

    IF sender_balance < 5000 THEN
      RAISE EXCEPTION 'ยอดเงินไม่เพียงพอ (มี % ต้องการ %)', sender_balance, 5000;
    END IF;

    UPDATE accounts SET balance = balance - 5000 WHERE id = 1;
    UPDATE accounts SET balance = balance + 5000 WHERE id = 2;

    INSERT INTO transfer_log (from_account_id, to_account_id, amount)
      VALUES (1, 2, 5000);
  END $$;
COMMIT;
```

> **`FOR UPDATE`** ล็อกแถวไม่ให้ transaction อื่นแก้ไขพร้อมกัน

### 7. Deadlocks

Deadlock เกิดเมื่อ 2 transactions **รอกันเอง** — ไม่มีใครทำต่อได้:

```
Transaction A:                Transaction B:
1. LOCK แถว id=1              1. LOCK แถว id=2
2. ต้องการ LOCK แถว id=2       2. ต้องการ LOCK แถว id=1
   → รอ B ปล่อย...               → รอ A ปล่อย...
   → รอไปเรื่อยๆ ❌               → รอไปเรื่อยๆ ❌
```

PostgreSQL ตรวจจับ deadlock อัตโนมัติ — จะยกเลิก transaction หนึ่ง:

```sql
-- ป้องกัน deadlock: ล็อกแถวในลำดับเดียวกันเสมอ (เช่น id น้อยก่อน)
BEGIN;
  UPDATE accounts SET balance = balance - 1000 WHERE id = 1;  -- id น้อยก่อน
  UPDATE accounts SET balance = balance + 1000 WHERE id = 2;  -- id มากทีหลัง
COMMIT;
```

## แบบฝึกหัด

ใช้ข้อมูลจาก init.sql (accounts 5 คน, transfer_log):

1. โอนเงิน 3,000 บาท จากสมชาย (id=1) ไปสมหญิง (id=2) ใช้ transaction พร้อมบันทึก transfer_log
2. ลองโอนเงิน 999,999 บาท จากมานี (id=5) — ควร fail → ใช้ ROLLBACK
3. ใช้ SAVEPOINT — โอนเงิน 2 ครั้ง ครั้งแรกสำเร็จ ครั้งที่ 2 fail → rollback เฉพาะครั้งที่ 2
4. ตรวจสอบยอดรวมทุกบัญชี (ควรเท่าเดิมเสมอ ถ้า transaction ถูกต้อง)
5. เขียน transaction ที่โอนเงินจากสมศักดิ์ (id=3) ให้ทุกคน คนละ 1,000 บาท

## สรุป

- **Transaction** = กลุ่มคำสั่ง SQL ที่ทำงานเป็นชุดเดียว
- **ACID** รับประกันความถูกต้อง: Atomicity, Consistency, Isolation, Durability
- **BEGIN / COMMIT / ROLLBACK** ควบคุม transaction
- **SAVEPOINT** สร้างจุดบันทึกภายใน transaction เพื่อ rollback บางส่วน
- **Isolation Levels** กำหนดว่า transactions เห็นข้อมูลของกันอย่างไร
- **Deadlock** เกิดเมื่อ 2 transactions รอกันเอง — ป้องกันด้วยการล็อกลำดับเดียวกัน

## ต่อไป

[Lab 13 — Views, Functions & Triggers →](../lab-13-views-functions-triggers/)
