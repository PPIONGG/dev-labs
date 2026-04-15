-- ==============================================
-- Lab 08: แบบฝึกหัด Aggregate Functions
-- ==============================================

-- ฝึก 1: นับจำนวนสินค้าทั้งหมด และจำนวนหมวดหมู่ที่ไม่ซ้ำ



-- ฝึก 2: หาราคาเฉลี่ย ต่ำสุด สูงสุด ของสินค้าทั้งหมด



-- ฝึก 3: นับจำนวนสินค้าแต่ละหมวด เรียงจากมากไปน้อย



-- ฝึก 4: หาหมวดที่ราคาเฉลี่ยสูงกว่า 20,000



-- ฝึก 5: หาลูกค้าที่สั่งซื้อมากกว่า 1 ออเดอร์ พร้อมยอดรวม



-- ฝึก 6: หายอดขายรวมแต่ละเดือน



-- ==============================================
-- เฉลย
-- ==============================================

/*
-- ฝึก 1:
SELECT COUNT(*) AS total_products, COUNT(DISTINCT category) AS total_categories
FROM products;

-- ฝึก 2:
SELECT
  ROUND(AVG(price), 2) AS avg_price,
  MIN(price) AS min_price,
  MAX(price) AS max_price
FROM products;

-- ฝึก 3:
SELECT category, COUNT(*) AS count
FROM products
GROUP BY category
ORDER BY count DESC;

-- ฝึก 4:
SELECT category, ROUND(AVG(price), 2) AS avg_price
FROM products
GROUP BY category
HAVING AVG(price) > 20000
ORDER BY avg_price DESC;

-- ฝึก 5:
SELECT u.name, COUNT(o.id) AS order_count, SUM(o.total) AS total_spent
FROM users u
INNER JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 1
ORDER BY total_spent DESC;

-- ฝึก 6:
SELECT
  TO_CHAR(created_at, 'YYYY-MM') AS month,
  COUNT(*) AS order_count,
  SUM(total) AS total_sales
FROM orders
WHERE status = 'completed'
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month;
*/
