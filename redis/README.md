# Redis Learning Path

เรียนรู้ Redis ตั้งแต่เริ่มต้นจนถึงระดับ Advanced

> ทุก lab รัน Redis ผ่าน Docker -- ไม่ต้องติดตั้งลงเครื่องจริง

## เส้นทางการเรียน

### Level 1: Fundamentals (พื้นฐาน Redis)

| Lab | หัวข้อ | ประเภท |
|-----|--------|--------|
| [01](./lab-01-what-is-redis/) | Redis คืออะไร? | concept |
| [02](./lab-02-setup-and-cli/) | ติดตั้ง Redis & CLI | hands-on |
| [03](./lab-03-strings/) | Strings — SET, GET, INCR | hands-on |
| [04](./lab-04-expiration/) | Expiration & TTL | hands-on |
| [05](./lab-05-project-counter/) | **Project: Hit Counter & Rate Limiter** | project |

### Level 2: Data Structures (โครงสร้างข้อมูล)

| Lab | หัวข้อ | ประเภท |
|-----|--------|--------|
| [06](./lab-06-lists/) | Lists — Queue & Stack | hands-on |
| [07](./lab-07-sets/) | Sets & Sorted Sets | hands-on |
| [08](./lab-08-hashes/) | Hashes — Object Storage | hands-on |
| [09](./lab-09-project-leaderboard/) | **Project: Leaderboard API** | project |

### Level 3: Advanced (ขั้นสูง)

| Lab | หัวข้อ | ประเภท |
|-----|--------|--------|
| [10](./lab-10-pub-sub/) | Pub/Sub — Real-time Messaging | hands-on |
| [11](./lab-11-transactions/) | Transactions & Lua Scripts | hands-on |
| [12](./lab-12-persistence/) | Persistence — RDB & AOF | hands-on |
| [13](./lab-13-security-and-config/) | Security & Configuration | hands-on |
| [14](./lab-14-project-chat/) | **Project: Real-time Chat App** | project |

## สิ่งที่ต้องมีก่อน

- [Docker Learning Path](../docker/) -- ต้องใช้ Docker รัน Redis
- ความรู้ JavaScript/Node.js พื้นฐาน (สำหรับ lab project)

## วิธีใช้งาน

1. เรียนตาม lab เรียงลำดับจาก 01 ถึง 14
2. แต่ละ lab มี `docker-compose.yml` พร้อมใช้ -- สั่ง `docker compose up -d` แล้วเริ่มเรียนได้เลย
3. ไฟล์ `exercises.txt` ใน lab คือแบบฝึกหัดพร้อมเฉลย -- ลองทำเองก่อนดูเฉลย
4. Lab ที่เป็น **Project** จะมี Node.js code ที่เชื่อมต่อ Redis จริง
