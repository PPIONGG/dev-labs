-- ==============================================
-- Lab 09: แบบฝึกหัด Subqueries & CTE
-- ==============================================

-- ฝึก 1: หาสินค้าที่ราคาสูงกว่าค่าเฉลี่ย (subquery ใน WHERE)



-- ฝึก 2: หาลูกค้าที่เคยซื้อสินค้าในหมวด 'phone' (subquery + IN)



-- ฝึก 3: หาลูกค้าที่ไม่เคยสั่งซื้อ (NOT EXISTS)



-- ฝึก 4: ใช้ CTE หาลูกค้าที่ซื้อมากที่สุด 3 อันดับ



-- ฝึก 5: ใช้ CTE หลายตัว — หายอดขายแต่ละหมวดเทียบกับค่าเฉลี่ย
--         แสดง: category, total_sales, avg_all_categories, diff



-- ==============================================
-- เฉลย
-- ==============================================

/*
-- ฝึก 1:
SELECT name, price
FROM products
WHERE price > (SELECT AVG(price) FROM products)
ORDER BY price DESC;

-- ฝึก 2:
SELECT DISTINCT u.name
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.id IN (
  SELECT oi.order_id FROM order_items oi
  WHERE oi.product_id IN (
    SELECT id FROM products WHERE category = 'phone'
  )
);

-- ฝึก 3:
SELECT name, email FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
);

-- ฝึก 4:
WITH customer_spending AS (
  SELECT u.name, SUM(o.total) AS total_spent
  FROM users u
  INNER JOIN orders o ON u.id = o.user_id
  WHERE o.status = 'completed'
  GROUP BY u.id, u.name
)
SELECT name, total_spent
FROM customer_spending
ORDER BY total_spent DESC
LIMIT 3;

-- ฝึก 5:
WITH
  category_sales AS (
    SELECT p.category, SUM(oi.price * oi.quantity) AS total_sales
    FROM products p
    INNER JOIN order_items oi ON p.id = oi.product_id
    GROUP BY p.category
  ),
  overall_avg AS (
    SELECT AVG(total_sales) AS avg_sales FROM category_sales
  )
SELECT
  cs.category,
  cs.total_sales,
  ROUND(oa.avg_sales, 2) AS avg_all_categories,
  ROUND(cs.total_sales - oa.avg_sales, 2) AS diff
FROM category_sales cs, overall_avg oa
ORDER BY cs.total_sales DESC;
*/
