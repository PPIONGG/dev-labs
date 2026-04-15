-- ==============================================
-- Lab 12: แบบฝึกหัด Transactions & ACID
-- ==============================================

-- ฝึก 1: โอนเงิน 3,000 บาท จากสมชาย (id=1) ไปสมหญิง (id=2)
--         ใช้ transaction (BEGIN...COMMIT)
--         อย่าลืมบันทึกใน transfer_log ด้วย



-- ฝึก 2: ลองโอนเงิน 999,999 บาท จากมานี (id=5, มี 5,000)
--         ควรจะ fail เพราะเงินไม่พอ (CHECK constraint)
--         ใช้ ROLLBACK



-- ฝึก 3: ใช้ SAVEPOINT — โอนเงิน 2 ครั้งใน transaction เดียว
--         ครั้งที่ 1: สมใจ → สมชาย 5,000 (สำเร็จ)
--         ครั้งที่ 2: สมใจ → มานี 999,999 (fail → rollback to savepoint)
--         commit เฉพาะครั้งที่ 1



-- ฝึก 4: ตรวจสอบยอดรวมทุกบัญชี (ควรเท่าเดิมเสมอถ้า transaction ถูกต้อง)



-- ฝึก 5: เขียน transaction ที่โอนเงินจากสมศักดิ์ (id=3) ให้ทุกคน คนละ 1,000 บาท
--         (ถ้าเงินไม่พอให้ยกเลิกทั้งหมด)



-- ==============================================
-- เฉลย
-- ==============================================

/*
-- ฝึก 1: โอนเงิน สมชาย → สมหญิง 3,000
BEGIN;
  UPDATE accounts SET balance = balance - 3000 WHERE id = 1;
  UPDATE accounts SET balance = balance + 3000 WHERE id = 2;
  INSERT INTO transfer_log (from_account_id, to_account_id, amount)
    VALUES (1, 2, 3000);
COMMIT;

-- ตรวจสอบ
SELECT * FROM accounts WHERE id IN (1, 2);

-- ฝึก 2: โอนเงินเกินจำนวน (fail)
BEGIN;
  UPDATE accounts SET balance = balance - 999999 WHERE id = 5;
  -- ERROR: new row for relation "accounts" violates check constraint "positive_balance"
ROLLBACK;

-- ตรวจสอบว่าเงินมานียังเท่าเดิม
SELECT * FROM accounts WHERE id = 5;

-- ฝึก 3: SAVEPOINT
BEGIN;
  -- ครั้งที่ 1: สมใจ → สมชาย 5,000
  UPDATE accounts SET balance = balance - 5000 WHERE id = 4;
  UPDATE accounts SET balance = balance + 5000 WHERE id = 1;
  INSERT INTO transfer_log (from_account_id, to_account_id, amount)
    VALUES (4, 1, 5000);

  SAVEPOINT before_second_transfer;

  -- ครั้งที่ 2: สมใจ → มานี 999,999 (จะ fail)
  UPDATE accounts SET balance = balance - 999999 WHERE id = 4;
  -- ERROR → rollback to savepoint
  ROLLBACK TO SAVEPOINT before_second_transfer;

COMMIT;
-- ผลลัพธ์: เฉพาะการโอนครั้งที่ 1 สำเร็จ

-- ฝึก 4: ตรวจสอบยอดรวม
SELECT SUM(balance) AS total_balance FROM accounts;
-- ยอดรวมควรเท่าเดิมเสมอ (175,000)

-- ฝึก 5: โอนให้ทุกคน คนละ 1,000
BEGIN;
  -- สมศักดิ์ (id=3) มี 10,000 โอนให้ 4 คน = 4,000
  UPDATE accounts SET balance = balance - 4000 WHERE id = 3;
  UPDATE accounts SET balance = balance + 1000 WHERE id = 1;
  UPDATE accounts SET balance = balance + 1000 WHERE id = 2;
  UPDATE accounts SET balance = balance + 1000 WHERE id = 4;
  UPDATE accounts SET balance = balance + 1000 WHERE id = 5;

  INSERT INTO transfer_log (from_account_id, to_account_id, amount) VALUES
    (3, 1, 1000), (3, 2, 1000), (3, 4, 1000), (3, 5, 1000);
COMMIT;
*/
