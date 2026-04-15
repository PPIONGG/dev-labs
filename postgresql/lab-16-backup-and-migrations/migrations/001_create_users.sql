-- Migration 001: Create users table
-- วันที่: 2024-01-01
-- คำอธิบาย: สร้างตาราง users สำหรับเก็บข้อมูลผู้ใช้

-- ============ UP ============

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ DOWN ============
-- DROP TABLE IF EXISTS users;
