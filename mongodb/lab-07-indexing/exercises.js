// exercises.js -- แบบฝึกหัด Lab 07 Indexing
// ใช้ใน mongosh: load("exercises.js") หรือ copy-paste ทีละคำสั่ง

// use learn_mongo

// ============================================================
// แบบฝึกหัดที่ 1: ดู query plan ก่อนสร้าง index
// ============================================================

// 1.1 ดู explain ของ query ที่ค้นหาตาม city
// สังเกต: queryPlanner.winningPlan.stage = "COLLSCAN" (scan ทุก document)
print("=== 1.1: Query by city WITHOUT index ===");
db.customers.find({ city: "กรุงเทพ" }).explain("executionStats");

// เฉลย: ดู executionStats
const stats1 = db.customers
  .find({ city: "กรุงเทพ" })
  .explain("executionStats");
print("totalDocsExamined:", stats1.executionStats.totalDocsExamined);
print("executionTimeMillis:", stats1.executionStats.executionTimeMillis);
print("stage:", stats1.queryPlanner.winningPlan.stage);

// ============================================================
// แบบฝึกหัดที่ 2: สร้าง Single Field Index
// ============================================================

// 2.1 สร้าง index บน field city
// ลองเขียนเอง...

// เฉลย:
db.customers.createIndex({ city: 1 });
print("\n=== 2.1: Created index on city ===");

// 2.2 ดู explain อีกครั้ง -- สังเกตว่า stage เปลี่ยนเป็น IXSCAN
const stats2 = db.customers
  .find({ city: "กรุงเทพ" })
  .explain("executionStats");
print("totalDocsExamined:", stats2.executionStats.totalDocsExamined);
print("executionTimeMillis:", stats2.executionStats.executionTimeMillis);
print(
  "stage:",
  stats2.queryPlanner.winningPlan.inputStage
    ? stats2.queryPlanner.winningPlan.inputStage.stage
    : stats2.queryPlanner.winningPlan.stage
);

// 2.3 สร้าง index บน field email (unique)
// ลองเขียนเอง...

// เฉลย:
db.customers.createIndex({ email: 1 }, { unique: true });
print("\n=== 2.3: Created unique index on email ===");

// ============================================================
// แบบฝึกหัดที่ 3: Compound Index
// ============================================================

// 3.1 สร้าง compound index: city + plan
// ลองเขียนเอง...

// เฉลย:
db.customers.createIndex({ city: 1, plan: 1 });
print("\n=== 3.1: Created compound index on city + plan ===");

// 3.2 ทดสอบ query ที่ใช้ compound index
const stats3 = db.customers
  .find({ city: "เชียงใหม่", plan: "premium" })
  .explain("executionStats");
print("totalDocsExamined:", stats3.executionStats.totalDocsExamined);

// 3.3 สร้าง compound index สำหรับ sort: city ASC + totalSpent DESC
// ลองเขียนเอง...

// เฉลย:
db.customers.createIndex({ city: 1, totalSpent: -1 });
print("\n=== 3.3: Created compound index on city + totalSpent ===");

// ============================================================
// แบบฝึกหัดที่ 4: Multikey Index (Array)
// ============================================================

// 4.1 สร้าง index บน field tags (array)
// ลองเขียนเอง...

// เฉลย:
db.customers.createIndex({ tags: 1 });
print("\n=== 4.1: Created multikey index on tags ===");

// 4.2 ค้นหาลูกค้าที่มี tag "vip" -- ตรวจว่าใช้ index
const stats4 = db.customers
  .find({ tags: "vip" })
  .explain("executionStats");
print("totalDocsExamined:", stats4.executionStats.totalDocsExamined);

// ============================================================
// แบบฝึกหัดที่ 5: Text Index
// ============================================================

// 5.1 สร้าง text index บน field name
// ลองเขียนเอง...

// เฉลย:
db.customers.createIndex({ name: "text" });
print("\n=== 5.1: Created text index on name ===");

// 5.2 ค้นหาลูกค้าชื่อ "สมชาย"
db.customers.find({ $text: { $search: "สมชาย" } }).limit(5);

// ============================================================
// แบบฝึกหัดที่ 6: ดู indexes ทั้งหมดและลบ index
// ============================================================

// 6.1 ดู indexes ทั้งหมดของ collection
print("\n=== 6.1: All indexes ===");
db.customers.getIndexes().forEach(printjson);

// 6.2 ลบ index บน tags
// ลองเขียนเอง...

// เฉลย:
db.customers.dropIndex({ tags: 1 });
print("\n=== 6.2: Dropped index on tags ===");

// 6.3 ดู indexes อีกครั้ง -- ตรวจว่า tags index หายไป
print("Remaining indexes:");
db.customers.getIndexes().forEach((idx) => print(" -", idx.name));

// ============================================================
// แบบฝึกหัดที่ 7: เปรียบเทียบ performance
// ============================================================

// 7.1 Query ที่ใช้ index (city)
print("\n=== 7.1: With index (city) ===");
const withIdx = db.customers
  .find({ city: "กรุงเทพ" })
  .explain("executionStats");
print(
  "  docsExamined:",
  withIdx.executionStats.totalDocsExamined,
  "| time:",
  withIdx.executionStats.executionTimeMillis,
  "ms"
);

// 7.2 Query ที่ไม่มี index (age)
print("=== 7.2: Without index (age) ===");
const noIdx = db.customers
  .find({ age: 25 })
  .explain("executionStats");
print(
  "  docsExamined:",
  noIdx.executionStats.totalDocsExamined,
  "| time:",
  noIdx.executionStats.executionTimeMillis,
  "ms"
);

print("\n--- Exercises completed! ---");
