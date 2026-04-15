-- ==============================================
-- Lab 04: แบบฝึกหัด CRUD
-- ==============================================

-- ฝึก 1: เพิ่มผู้ใช้ใหม่ 3 คน (ชื่อ, email, อายุ ตามใจ)



-- ฝึก 2: ดูผู้ใช้ทั้งหมด



-- ฝึก 3: ดูเฉพาะชื่อและ email



-- ฝึก 4: นับจำนวนผู้ใช้ทั้งหมด



-- ฝึก 5: แก้ไขอายุของผู้ใช้ id = 1 เป็น 26 แล้วดูผลลัพธ์ (ใช้ RETURNING)



-- ฝึก 6: ปิดการใช้งาน (is_active = false) สำหรับผู้ใช้ id = 3



-- ฝึก 7: ลบผู้ใช้ id = 5 แล้วดูข้อมูลที่ลบ



-- ฝึก 8: UPSERT — เพิ่มผู้ใช้ด้วย email 'somchai@mail.com'
--         ถ้ามีอยู่แล้วให้แก้ชื่อเป็น 'สมชาย อัปเดต'



-- ==============================================
-- เฉลย
-- ==============================================

/*
-- ฝึก 1:
INSERT INTO users (name, email, age) VALUES
  ('ปิยะ', 'piya@mail.com', 29),
  ('จันทร์', 'jan@mail.com', 24),
  ('ดาว', 'dao@mail.com', 31);

-- ฝึก 2:
SELECT * FROM users;

-- ฝึก 3:
SELECT name, email FROM users;

-- ฝึก 4:
SELECT COUNT(*) FROM users;

-- ฝึก 5:
UPDATE users SET age = 26 WHERE id = 1 RETURNING *;

-- ฝึก 6:
UPDATE users SET is_active = false WHERE id = 3;

-- ฝึก 7:
DELETE FROM users WHERE id = 5 RETURNING *;

-- ฝึก 8:
INSERT INTO users (name, email, age)
VALUES ('สมชาย อัปเดต', 'somchai@mail.com', 25)
ON CONFLICT (email)
DO UPDATE SET name = EXCLUDED.name;
*/
