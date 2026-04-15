-- Migration 002: Add phone column to users
-- วันที่: 2024-01-15
-- คำอธิบาย: เพิ่ม column phone ในตาราง users สำหรับเก็บเบอร์โทรศัพท์

-- ============ UP ============

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- ============ DOWN ============
-- DROP INDEX IF EXISTS idx_users_phone;
-- ALTER TABLE users DROP COLUMN IF EXISTS phone;
