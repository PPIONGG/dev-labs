-- ==============================================
-- Lab 03: แบบฝึกหัด CREATE TABLE
-- ==============================================
-- วิธีใช้: docker exec -it lab-03-create-table-db-1 psql -U admin -d learn_sql -f /exercises.sql
-- หรือ copy-paste ทีละคำสั่งใน psql

-- ฝึก 1: สร้างตาราง students
-- columns: id (auto), name (ห้ามว่าง), email (ไม่ซ้ำ, ห้ามว่าง),
--          age (ตัวเลข), grade (ตัวอักษร 1 ตัว), enrolled_at (วันเวลา, default ปัจจุบัน)
-- เขียนคำสั่งด้านล่าง:



-- ฝึก 2: สร้างตาราง courses
-- columns: id (auto), title (ห้ามว่าง), description (ข้อความยาว),
--          credits (ตัวเลข, ต้อง >= 1 และ <= 4)
-- เขียนคำสั่งด้านล่าง:



-- ฝึก 3: เพิ่ม column phone ให้ตาราง students



-- ฝึก 4: ดูโครงสร้างตาราง
-- \d students
-- \d courses

-- ฝึก 5: ลบตารางทั้งหมด


-- ==============================================
-- เฉลย (อย่าดูก่อนทำ!)
-- ==============================================

/*
-- ฝึก 1:
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  age INTEGER,
  grade CHAR(1),
  enrolled_at TIMESTAMPTZ DEFAULT NOW()
);

-- ฝึก 2:
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  credits INTEGER CHECK (credits >= 1 AND credits <= 4)
);

-- ฝึก 3:
ALTER TABLE students ADD COLUMN phone VARCHAR(20);

-- ฝึก 5:
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS courses;
*/
