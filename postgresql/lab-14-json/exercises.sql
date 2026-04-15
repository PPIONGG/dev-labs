-- ==============================================
-- Lab 14: แบบฝึกหัด JSON/JSONB
-- ==============================================

-- ฝึก 1: ดึงชื่อสินค้าและ brand (ใช้ ->>)


-- ฝึก 2: หาสินค้า Samsung ทั้งหมด (ใช้ @>)


-- ฝึก 3: หาสินค้าที่มี key "ram" ใน specs (ใช้ ?)


-- ฝึก 4: ดึง display size ของทุกสินค้าที่มี display (ใช้ #>>)


-- ฝึก 5: หาสินค้าที่หน้าจอ refresh rate 120Hz (ใช้ #>>)


-- ฝึก 6: อัปเดต theme ของ "สมหญิง" เป็น "dark" (ใช้ jsonb_set)


-- ฝึก 7: เพิ่ม key "warranty_years": 2 ให้สินค้า iPhone 15 (ใช้ ||)


-- ฝึก 8: หาผู้ใช้ที่เปิด push notification (ใช้ #>>)


-- ฝึก 9: หาสินค้าที่มีสีดำ (colors array มี "black")


-- ฝึก 10: สร้าง GIN index บน specs แล้วเปรียบเทียบ query plan


-- ==============================================
-- เฉลย
-- ==============================================

/*
-- ฝึก 1:
SELECT name, specs->>'brand' AS brand FROM products;

-- ฝึก 2:
SELECT name, price FROM products
WHERE specs @> '{"brand": "Samsung"}';

-- ฝึก 3:
SELECT name, specs->>'ram' AS ram FROM products
WHERE specs ? 'ram';

-- ฝึก 4:
SELECT name, specs#>>'{display,size}' AS display_size FROM products
WHERE specs ? 'display';

-- ฝึก 5:
SELECT name, specs#>>'{display,refresh_rate}' AS refresh_rate FROM products
WHERE specs#>>'{display,refresh_rate}' = '120';

-- ฝึก 6:
UPDATE user_settings
SET settings = jsonb_set(settings, '{theme}', '"dark"')
WHERE user_name = 'สมหญิง';
-- ตรวจสอบ:
SELECT user_name, settings->>'theme' AS theme FROM user_settings WHERE user_name = 'สมหญิง';

-- ฝึก 7:
UPDATE products
SET specs = specs || '{"warranty_years": 2}'
WHERE name = 'iPhone 15';
-- ตรวจสอบ:
SELECT name, specs->>'warranty_years' AS warranty FROM products WHERE name = 'iPhone 15';

-- ฝึก 8:
SELECT user_name FROM user_settings
WHERE settings#>>'{notifications,push}' = 'true';

-- ฝึก 9:
SELECT name FROM products
WHERE specs->'colors' @> '"black"';

-- ฝึก 10:
-- ก่อนสร้าง index
EXPLAIN ANALYZE SELECT * FROM products WHERE specs @> '{"brand": "Apple"}';

-- สร้าง GIN index
CREATE INDEX idx_products_specs ON products USING GIN (specs);

-- หลังสร้าง index
EXPLAIN ANALYZE SELECT * FROM products WHERE specs @> '{"brand": "Apple"}';
-- สังเกต: เปลี่ยนจาก Seq Scan เป็น Bitmap Index Scan (ถ้าข้อมูลมีมากพอ)
*/
