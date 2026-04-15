# PostgreSQL Learning Path

เรียนรู้ PostgreSQL ตั้งแต่เริ่มต้นจนถึงระดับ Advanced

> ทุก lab รัน PostgreSQL ผ่าน Docker — ไม่ต้องติดตั้งลงเครื่องจริง

## เส้นทางการเรียน

### Level 1: SQL Fundamentals (พื้นฐาน SQL)

| Lab | หัวข้อ | ประเภท |
|-----|--------|--------|
| [01](./lab-01-what-is-database/) | Database คืออะไร? SQL vs NoSQL | concept |
| [02](./lab-02-setup-and-tools/) | ติดตั้ง PostgreSQL & เครื่องมือ | hands-on |
| [03](./lab-03-create-table/) | CREATE TABLE & Data Types | hands-on |
| [04](./lab-04-crud/) | CRUD — INSERT, SELECT, UPDATE, DELETE | hands-on |
| [05](./lab-05-filtering-and-sorting/) | WHERE, ORDER BY, LIMIT, OFFSET | hands-on |
| [06](./lab-06-project-todo-db/) | **Project: Todo App Database** | project |

### Level 2: Intermediate SQL (SQL ขั้นกลาง)

| Lab | หัวข้อ | ประเภท |
|-----|--------|--------|
| [07](./lab-07-joins/) | JOIN — INNER, LEFT, RIGHT, FULL | hands-on |
| [08](./lab-08-aggregation/) | Aggregate — COUNT, SUM, AVG, GROUP BY | hands-on |
| [09](./lab-09-subqueries-and-cte/) | Subqueries & CTE | hands-on |
| [10](./lab-10-project-ecommerce/) | **Project: E-commerce Database** | project |

### Level 3: Advanced PostgreSQL (ขั้นสูง)

| Lab | หัวข้อ | ประเภท |
|-----|--------|--------|
| [11](./lab-11-indexing/) | Indexing — ทำให้ query เร็วขึ้น | hands-on |
| [12](./lab-12-transactions/) | Transactions & ACID | hands-on |
| [13](./lab-13-views-functions-triggers/) | Views, Functions, Triggers | hands-on |
| [14](./lab-14-json/) | JSON/JSONB — SQL + NoSQL ในตัวเดียว | hands-on |
| [15](./lab-15-performance/) | Performance Tuning — EXPLAIN ANALYZE | hands-on |
| [16](./lab-16-backup-and-migrations/) | Backup, Restore & Migrations | hands-on |
| [17](./lab-17-project-blog-platform/) | **Project: Blog Platform + Full-text Search** | project |

## สิ่งที่ต้องมีก่อน

- [Docker Learning Path](../docker/) — ต้องใช้ Docker รัน PostgreSQL
- ความรู้ JavaScript/Node.js พื้นฐาน

## วิธีใช้งาน

1. เรียนตาม lab เรียงลำดับจาก 01 ถึง 17
2. แต่ละ lab มี `docker-compose.yml` พร้อมใช้ — สั่ง `docker compose up -d` แล้วเริ่มเรียนได้เลย
3. ไฟล์ `.sql` ใน lab คือแบบฝึกหัดและตัวอย่าง — รันผ่าน `psql` หรือเครื่องมือ GUI
4. Lab ที่เป็น **Project** จะมี Node.js code ที่เชื่อมต่อ database จริง
