// exercises.js -- แบบฝึกหัด Lab 03 CRUD Operations
// ใช้ใน mongosh: load("exercises.js") หรือ copy-paste ทีละคำสั่ง

// เชื่อมต่อ database
// use learn_mongo

// ============================================================
// แบบฝึกหัดที่ 1: INSERT -- เพิ่มข้อมูล
// ============================================================

// 1.1 เพิ่มพนักงานใหม่ 1 คน ชื่อ "ทดสอบ เพิ่มใหม่" แผนก IT Support
// ลองเขียนเอง...

// เฉลย:
db.employees.insertOne({
  name: "ทดสอบ เพิ่มใหม่",
  email: "test@company.com",
  department: "IT Support",
  position: "IT Support Specialist",
  salary: 32000,
  skills: ["Networking", "Windows Server"],
  isActive: true,
  joinDate: new Date(),
});

// 1.2 เพิ่มพนักงานใหม่ 3 คน พร้อมกัน
// ลองเขียนเอง...

// เฉลย:
db.employees.insertMany([
  {
    name: "อรุณ แสงเดือน",
    email: "arun@company.com",
    department: "Engineering",
    position: "Frontend Developer",
    salary: 45000,
    skills: ["React", "TypeScript", "CSS"],
    isActive: true,
    joinDate: new Date("2024-01-15"),
  },
  {
    name: "ณัฐ ชาญชัย",
    email: "nat@company.com",
    department: "Sales",
    position: "Sales Manager",
    salary: 52000,
    skills: ["Leadership", "Negotiation", "CRM"],
    isActive: true,
    joinDate: new Date("2020-06-01"),
  },
  {
    name: "พรทิพย์ ดีมาก",
    email: "porntip@company.com",
    department: "HR",
    position: "HR Specialist",
    salary: 35000,
    skills: ["Recruitment", "Payroll"],
    isActive: true,
    joinDate: new Date("2023-03-01"),
  },
]);

// ============================================================
// แบบฝึกหัดที่ 2: READ -- ค้นหาข้อมูล
// ============================================================

// 2.1 ดูพนักงานทั้งหมด
db.employees.find();

// 2.2 ดูเฉพาะพนักงานแผนก Engineering
// ลองเขียนเอง...

// เฉลย:
db.employees.find({ department: "Engineering" });

// 2.3 ดูพนักงานที่เงินเดือนมากกว่า 50000
// ลองเขียนเอง...

// เฉลย:
db.employees.find({ salary: { $gt: 50000 } });

// 2.4 ดูพนักงาน 1 คนที่ชื่อ "สมชาย ใจดี"
// ลองเขียนเอง...

// เฉลย:
db.employees.findOne({ name: "สมชาย ใจดี" });

// 2.5 นับจำนวนพนักงานที่ active
// ลองเขียนเอง...

// เฉลย:
db.employees.countDocuments({ isActive: true });

// ============================================================
// แบบฝึกหัดที่ 3: UPDATE -- แก้ไขข้อมูล
// ============================================================

// 3.1 เปลี่ยนเงินเดือนของ "สมหญิง รักเรียน" เป็น 40000
// ลองเขียนเอง...

// เฉลย:
db.employees.updateOne(
  { name: "สมหญิง รักเรียน" },
  { $set: { salary: 40000 } }
);

// 3.2 เพิ่ม skill "TypeScript" ให้ "สมชาย ใจดี"
// ลองเขียนเอง...

// เฉลย:
db.employees.updateOne(
  { name: "สมชาย ใจดี" },
  { $push: { skills: "TypeScript" } }
);

// 3.3 เพิ่มเงินเดือนพนักงาน Engineering ทุกคน 5000 บาท
// ลองเขียนเอง...

// เฉลย:
db.employees.updateMany(
  { department: "Engineering" },
  { $inc: { salary: 5000 } }
);

// 3.4 ใช้ replaceOne แทนที่ข้อมูลทั้ง document (ระวัง! ข้อมูลเก่าหายหมด)
// ลองเขียนเอง...

// เฉลย:
db.employees.replaceOne(
  { email: "test@company.com" },
  {
    name: "ทดสอบ ถูกแทนที่",
    email: "test@company.com",
    department: "IT Support",
    position: "System Admin",
    salary: 40000,
    skills: ["Linux", "Docker", "Networking"],
    isActive: true,
    joinDate: new Date(),
  }
);

// ============================================================
// แบบฝึกหัดที่ 4: DELETE -- ลบข้อมูล
// ============================================================

// 4.1 ลบพนักงานที่ email เป็น "test@company.com"
// ลองเขียนเอง...

// เฉลย:
db.employees.deleteOne({ email: "test@company.com" });

// 4.2 ลบพนักงานที่ไม่ active ทั้งหมด
// ลองเขียนเอง...

// เฉลย:
db.employees.deleteMany({ isActive: false });

// ============================================================
// แบบฝึกหัดที่ 5: ตรวจสอบผลลัพธ์
// ============================================================

// 5.1 นับจำนวนพนักงานทั้งหมดที่เหลือ
db.employees.countDocuments();

// 5.2 ดูพนักงานแผนก Engineering ทั้งหมด (ตรวจว่าเงินเดือนเพิ่มขึ้น 5000)
db.employees.find({ department: "Engineering" });

// 5.3 ดูว่า "สมชาย ใจดี" มี skill "TypeScript" แล้ว
db.employees.findOne({ name: "สมชาย ใจดี" });

print("--- Exercises completed! ---");
