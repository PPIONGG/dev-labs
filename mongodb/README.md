# MongoDB Learning Path

เรียนรู้ MongoDB ตั้งแต่เริ่มต้นจนถึงระดับ Advanced

> ทุก lab รัน MongoDB ผ่าน Docker -- ไม่ต้องติดตั้งลงเครื่องจริง

## เส้นทางการเรียน

### Level 1: NoSQL Fundamentals (พื้นฐาน NoSQL)

| Lab | หัวข้อ | ประเภท |
|-----|--------|--------|
| [01](./lab-01-what-is-nosql/) | NoSQL & Document Database คืออะไร? | concept |
| [02](./lab-02-setup-and-shell/) | ติดตั้ง MongoDB & Shell | hands-on |
| [03](./lab-03-crud/) | CRUD Operations | hands-on |
| [04](./lab-04-query-operators/) | Query Operators | hands-on |
| [05](./lab-05-project-bookstore/) | **Project: Bookstore Database** | project |

### Level 2: Intermediate MongoDB (ขั้นกลาง)

| Lab | หัวข้อ | ประเภท |
|-----|--------|--------|
| [06](./lab-06-schema-design/) | Schema Design Patterns | hands-on |
| [07](./lab-07-indexing/) | Indexing & Performance | hands-on |
| [08](./lab-08-aggregation/) | Aggregation Pipeline | hands-on |
| [09](./lab-09-project-social-media/) | **Project: Social Media API** | project |

### Level 3: Advanced MongoDB (ขั้นสูง)

| Lab | หัวข้อ | ประเภท |
|-----|--------|--------|
| [10](./lab-10-transactions/) | Multi-Document Transactions | hands-on |
| [11](./lab-11-change-streams/) | Change Streams & Real-time | hands-on |
| [12](./lab-12-schema-validation/) | Schema Validation | hands-on |
| [13](./lab-13-performance/) | Performance Tuning | hands-on |
| [14](./lab-14-backup-and-replication/) | Backup & Replication | hands-on |
| [15](./lab-15-project-cms/) | **Project: Content Management System API** | project |

## สิ่งที่ต้องมีก่อน

- [Docker Learning Path](../docker/) — ต้องใช้ Docker รัน MongoDB
- ความรู้ JavaScript/Node.js พื้นฐาน

## วิธีใช้งาน

1. เรียนตาม lab เรียงลำดับจาก 01 ถึง 15
2. แต่ละ lab มี `docker-compose.yml` พร้อมใช้ — สั่ง `docker compose up -d` แล้วเริ่มเรียนได้เลย
3. ไฟล์ `.js` ใน lab คือแบบฝึกหัดและตัวอย่าง — รันผ่าน `mongosh` หรือ Mongo Express GUI
4. Lab ที่เป็น **Project** จะมี Node.js code ที่เชื่อมต่อ database จริง

## MongoDB vs SQL สรุปเร็ว

| MongoDB | SQL |
|---------|-----|
| Database | Database |
| Collection | Table |
| Document | Row |
| Field | Column |
| `$lookup` | `JOIN` |
| `$match` | `WHERE` |
| `$group` | `GROUP BY` |
| Index | Index |

## Stack ที่ใช้

- **MongoDB 7** — ผ่าน Docker
- **mongosh** — MongoDB Shell
- **Mongo Express** — GUI (ใน lab 02 เป็นต้นไป)
- **Node.js + mongoose / mongodb driver** — สำหรับ project labs

## ระดับความยาก

```
Level 1 ████░░░░░░ พื้นฐาน
Level 2 ███████░░░ ขั้นกลาง
Level 3 ██████████ ขั้นสูง
```

---

*ส่วนหนึ่งของ [dev-labs](../README.md) — Database Section*
