-- ==============================================
-- Lab 13: แบบฝึกหัด Views, Functions, Triggers
-- ==============================================

-- === Views ===

-- ฝึก 1: สร้าง VIEW ชื่อ v_order_summary แสดง
--         order id, ชื่อลูกค้า, จำนวนสินค้า, ยอดรวม, status



-- ฝึก 2: สร้าง VIEW ชื่อ v_product_stats แสดง
--         category, จำนวนสินค้า, ราคาเฉลี่ย, ราคาต่ำสุด, ราคาสูงสุด



-- ฝึก 3: สร้าง MATERIALIZED VIEW ชื่อ mv_monthly_sales แสดง
--         เดือน, จำนวน orders, ยอดขายรวม (เฉพาะ completed)



-- === Functions ===

-- ฝึก 4: สร้าง function ชื่อ get_user_total_spent(user_id INTEGER)
--         คืนค่า ยอดซื้อรวมของ user คนนั้น (เฉพาะ completed)



-- ฝึก 5: สร้าง function ชื่อ get_products_by_category(cat VARCHAR)
--         คืนค่า TABLE (id, name, price) ของสินค้าในหมวดนั้น



-- === Triggers ===

-- ฝึก 6: สร้าง trigger ที่อัปเดต updated_at อัตโนมัติ
--         เมื่อมีการ UPDATE ตาราง products



-- ฝึก 7: สร้าง trigger ที่ลด stock อัตโนมัติ
--         เมื่อมีการ INSERT ใน order_items



-- ==============================================
-- เฉลย
-- ==============================================

/*
-- ฝึก 1: v_order_summary
CREATE VIEW v_order_summary AS
SELECT
  o.id AS order_id,
  u.name AS customer_name,
  COUNT(oi.id) AS item_count,
  o.total,
  o.status
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, u.name, o.total, o.status
ORDER BY o.id;

SELECT * FROM v_order_summary;

-- ฝึก 2: v_product_stats
CREATE VIEW v_product_stats AS
SELECT
  category,
  COUNT(*) AS product_count,
  ROUND(AVG(price), 2) AS avg_price,
  MIN(price) AS min_price,
  MAX(price) AS max_price
FROM products
GROUP BY category
ORDER BY category;

SELECT * FROM v_product_stats;

-- ฝึก 3: mv_monthly_sales (Materialized View)
CREATE MATERIALIZED VIEW mv_monthly_sales AS
SELECT
  TO_CHAR(created_at, 'YYYY-MM') AS month,
  COUNT(*) AS order_count,
  SUM(total) AS total_sales
FROM orders
WHERE status = 'completed'
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month;

SELECT * FROM mv_monthly_sales;
-- อัปเดตข้อมูลใน materialized view:
-- REFRESH MATERIALIZED VIEW mv_monthly_sales;

-- ฝึก 4: get_user_total_spent
CREATE OR REPLACE FUNCTION get_user_total_spent(p_user_id INTEGER)
RETURNS NUMERIC AS $$
DECLARE
  total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(o.total), 0) INTO total
  FROM orders o
  WHERE o.user_id = p_user_id
    AND o.status = 'completed';
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- ทดสอบ
SELECT get_user_total_spent(1);  -- ยอดรวมของสมชาย
SELECT u.name, get_user_total_spent(u.id) AS total_spent
FROM users u;

-- ฝึก 5: get_products_by_category
CREATE OR REPLACE FUNCTION get_products_by_category(cat VARCHAR)
RETURNS TABLE (id INTEGER, name VARCHAR, price NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.price
  FROM products p
  WHERE p.category = cat
  ORDER BY p.price;
END;
$$ LANGUAGE plpgsql;

-- ทดสอบ
SELECT * FROM get_products_by_category('phone');
SELECT * FROM get_products_by_category('audio');

-- ฝึก 6: trigger อัปเดต updated_at
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_timestamp();

-- ทดสอบ
SELECT id, name, updated_at FROM products WHERE id = 1;
UPDATE products SET price = 36900 WHERE id = 1;
SELECT id, name, updated_at FROM products WHERE id = 1;  -- updated_at เปลี่ยน!

-- ฝึก 7: trigger ลด stock
CREATE OR REPLACE FUNCTION fn_reduce_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;

  IF (SELECT stock FROM products WHERE id = NEW.product_id) < 0 THEN
    RAISE EXCEPTION 'สินค้า id % มี stock ไม่เพียงพอ', NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reduce_stock
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION fn_reduce_stock();

-- ทดสอบ
SELECT id, name, stock FROM products WHERE id = 1;  -- stock เดิม
INSERT INTO order_items (order_id, product_id, quantity, price)
  VALUES (1, 1, 2, 35900);
SELECT id, name, stock FROM products WHERE id = 1;  -- stock ลดลง 2
*/
