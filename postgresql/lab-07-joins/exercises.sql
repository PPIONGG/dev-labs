-- ==============================================
-- Lab 07: แบบฝึกหัด JOIN
-- ==============================================

-- ฝึก 1: INNER JOIN — แสดงชื่อลูกค้าและยอดออเดอร์



-- ฝึก 2: LEFT JOIN — แสดงลูกค้าทุกคน รวมคนที่ไม่มีออเดอร์



-- ฝึก 3: หาลูกค้าที่ไม่เคยสั่งซื้อเลย (LEFT JOIN + WHERE IS NULL)



-- ฝึก 4: JOIN 3 ตาราง — แสดงชื่อลูกค้า, ชื่อสินค้า, จำนวน, ราคา



-- ฝึก 5: หาสินค้าที่ไม่เคยถูกสั่งซื้อ



-- ฝึก 6: หาสินค้าขายดีที่สุด (จำนวนชิ้นรวม)



-- ==============================================
-- เฉลย
-- ==============================================

/*
-- ฝึก 1:
SELECT u.name, o.total, o.status
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- ฝึก 2:
SELECT u.name, o.total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;

-- ฝึก 3:
SELECT u.name, u.email
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.id IS NULL;

-- ฝึก 4:
SELECT u.name AS customer, p.name AS product, oi.quantity, oi.price
FROM users u
INNER JOIN orders o ON u.id = o.user_id
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id;

-- ฝึก 5:
SELECT p.name
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
WHERE oi.id IS NULL;

-- ฝึก 6:
SELECT p.name, SUM(oi.quantity) AS total_sold
FROM products p
INNER JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.name
ORDER BY total_sold DESC;
*/
