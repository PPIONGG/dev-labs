-- ==============================================
-- Lab 05: แบบฝึกหัด WHERE, ORDER BY, LIMIT
-- ==============================================

-- ฝึก 1: หาสินค้าที่ราคามากกว่า 20,000 บาท



-- ฝึก 2: หาสินค้าหมวด 'phone' ทั้งหมด



-- ฝึก 3: หาสินค้าที่ชื่อมีคำว่า 'Air' (ไม่สน ตัวพิมพ์เล็ก/ใหญ่)



-- ฝึก 4: หาสินค้าที่ราคา 5,000 - 15,000 บาท เรียงจากถูกไปแพง



-- ฝึก 5: หาสินค้าที่ stock หมด (= 0) หรือ ไม่ available



-- ฝึก 6: หาสินค้าหมวด 'accessory' ที่ราคาต่ำกว่า 1,000 บาท



-- ฝึก 7: แสดงสินค้าทั้งหมด เรียงตามราคาจากแพงไปถูก แสดงหน้าที่ 2 (หน้าละ 5)



-- ฝึก 8: หาสินค้าที่ไม่ใช่หมวด 'accessory' และยัง available อยู่
--         เรียงตาม stock มากไปน้อย แสดง 5 อันดับแรก



-- ==============================================
-- เฉลย
-- ==============================================

/*
-- ฝึก 1:
SELECT * FROM products WHERE price > 20000;

-- ฝึก 2:
SELECT * FROM products WHERE category = 'phone';

-- ฝึก 3:
SELECT * FROM products WHERE name ILIKE '%air%';

-- ฝึก 4:
SELECT * FROM products WHERE price BETWEEN 5000 AND 15000 ORDER BY price ASC;

-- ฝึก 5:
SELECT * FROM products WHERE stock = 0 OR is_available = false;

-- ฝึก 6:
SELECT * FROM products WHERE category = 'accessory' AND price < 1000;

-- ฝึก 7:
SELECT * FROM products ORDER BY price DESC LIMIT 5 OFFSET 5;

-- ฝึก 8:
SELECT * FROM products
WHERE category != 'accessory' AND is_available = true
ORDER BY stock DESC
LIMIT 5;
*/
