# Lab 10 — Project: E-commerce Database

## เป้าหมาย

ออกแบบและสร้าง database สำหรับระบบ E-commerce พร้อม API ที่ใช้ JOIN, Aggregate, Subquery จริง

## ทำไมต้องทำ?

E-commerce เป็นตัวอย่างคลาสสิกของ relational database — มี users, products, orders, order_items ที่เชื่อมกัน Lab นี้รวมทุกอย่างจาก Level 2

## สิ่งที่ต้องมีก่อน

- [Lab 07](../lab-07-joins/) ถึง [Lab 09](../lab-09-subqueries-and-cte/) — ทุก concept ใน Level 2

## Database Schema

```
users ──────┐
             ├──→ orders ──→ order_items ←── products
addresses ──┘                                    ↑
                                            categories
```

| ตาราง | คำอธิบาย | ความสัมพันธ์ |
|-------|---------|-------------|
| `users` | ลูกค้า | 1:N orders |
| `addresses` | ที่อยู่ | N:1 users |
| `categories` | หมวดสินค้า | 1:N products |
| `products` | สินค้า | 1:N order_items |
| `orders` | ออเดอร์ | 1:N order_items |
| `order_items` | รายการสินค้าในออเดอร์ | N:1 orders, N:1 products |

## API Endpoints

| Method | Path | คำอธิบาย | SQL Concepts |
|--------|------|---------|-------------|
| GET | `/products` | ดูสินค้า + ชื่อหมวด | JOIN |
| GET | `/products/:id` | ดูสินค้า 1 ชิ้น | JOIN |
| GET | `/orders` | ดูออเดอร์ + ชื่อลูกค้า | JOIN |
| GET | `/orders/:id` | ดูออเดอร์ + รายการสินค้า | JOIN หลายตาราง |
| POST | `/orders` | สร้างออเดอร์ใหม่ | INSERT + Transaction |
| GET | `/stats/top-products` | สินค้าขายดี | JOIN + GROUP BY |
| GET | `/stats/top-customers` | ลูกค้า VIP | JOIN + GROUP BY + CTE |
| GET | `/stats/monthly-sales` | ยอดขายรายเดือน | GROUP BY + TO_CHAR |

## วิธีรัน

```bash
docker compose up --build

# ทดสอบ
curl http://localhost:3000/products
curl http://localhost:3000/orders/1
curl http://localhost:3000/stats/top-products
curl http://localhost:3000/stats/monthly-sales
```

## Checklist

- [ ] Schema สร้างถูกต้อง มี foreign keys
- [ ] ดูสินค้าพร้อมชื่อหมวด (JOIN)
- [ ] ดูออเดอร์พร้อมรายการสินค้า (JOIN หลายตาราง)
- [ ] สร้างออเดอร์ใหม่ + อัปเดต stock (Transaction)
- [ ] สินค้าขายดี (GROUP BY + SUM)
- [ ] ลูกค้า VIP (CTE + GROUP BY)
- [ ] ยอดขายรายเดือน (GROUP BY + TO_CHAR)

## สรุป

คุณเพิ่งสร้าง E-commerce database! สิ่งที่ได้เรียนรู้:
- ออกแบบ schema หลายตารางที่มีความสัมพันธ์กัน
- ใช้ JOIN เชื่อมหลายตาราง
- ใช้ Aggregate + GROUP BY วิเคราะห์ข้อมูล
- ใช้ CTE ทำ query ซับซ้อนให้อ่านง่าย

## ต่อไป

[Lab 11 — Indexing →](../lab-11-indexing/)
