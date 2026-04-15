# Dev Labs — คู่มือสำหรับ Claude

## กฎการ Commit (Conventional Commits)

ใช้ [Conventional Commits](https://www.conventionalcommits.org/) ทุกครั้ง รูปแบบ:

```
<type>(<scope>): <subject>

[body — ภาษาไทย ถ้ามีรายละเอียดเพิ่มเติม]
```

### Type ที่ใช้

| Type | ใช้เมื่อ |
|------|---------|
| `feat` | เพิ่มเนื้อหา/lab ใหม่ |
| `fix` | แก้ไขข้อผิดพลาดใน lab หรือ code |
| `docs` | แก้ไข README หรือเอกสาร |
| `refactor` | ปรับโครงสร้างไฟล์ โดยไม่เปลี่ยนเนื้อหา |
| `chore` | งานทั่วไป เช่น อัปเดต .gitignore, config |
| `style` | แก้ formatting, ตัวสะกด ไม่เปลี่ยน logic |

### Scope ที่ใช้

`docker`, `postgresql`, `redis`, `mongodb`, `root`

### ตัวอย่าง Commit Message ที่ถูกต้อง

```
feat(mongodb): เพิ่ม lab-08 Aggregation Pipeline

- เพิ่ม README อธิบาย $match, $group, $project, $lookup, $facet
- เพิ่ม init.js สร้างข้อมูลตัวอย่าง 500 รายการขาย
- เพิ่ม exercises.js พร้อมเฉลย 10 โจทย์
```

```
fix(postgresql): แก้ init.sql lab-05 ข้อมูลสินค้าซ้ำ
```

```
docs(root): อัปเดต README เพิ่ม MongoDB ใน สารบัญ
```

```
chore(root): เพิ่ม CLAUDE.md กำหนด commit rules
```

### กฎเพิ่มเติม

- **subject** — ภาษาไทยหรืออังกฤษก็ได้ กระชับ ไม่เกิน 72 ตัวอักษร ไม่ต้องมี `.` ท้าย
- **body** — ใช้ภาษาไทย อธิบายว่าทำอะไร/ทำไม ถ้ามีหลายจุดใช้ bullet `-`
- **ไม่ใส่** `Co-Authored-By` ทุกกรณี
- Commit ทีละ scope ถ้าแก้หลาย section พร้อมกัน ให้แยก commit

## โครงสร้าง Monorepo

```
dev-labs/
├── docker/          # 19 labs — Docker & DevOps
├── postgresql/      # 17 labs — SQL & PostgreSQL
├── redis/           # 14 labs — Redis & Caching
└── mongodb/         # 15 labs — MongoDB & NoSQL
```

## ภาษา

- README ทุกไฟล์ — **ภาษาไทย**
- Code (JS, SQL) — comment ภาษาไทย, ชื่อตัวแปร/function ภาษาอังกฤษ
- Commit message body — **ภาษาไทย**
