// exercises.js — Performance Analysis & Optimization
// วิธีรัน: docker compose exec mongo mongosh --file /scripts/exercises.js

db = db.getSiblingDB("performance_lab");

const totalOrders = db.orders.countDocuments();
print(`\n===== Performance Lab (${totalOrders.toLocaleString()} orders) =====\n`);

// ========================================
// 1. explain() — ก่อนมี Index (COLLSCAN)
// ========================================
print("===== 1. Query ก่อนสร้าง Index =====\n");

print("--- Query: หา orders ที่ status = 'completed' ---");
let explain = db.orders.find({ status: "completed" }).explain("executionStats");
let stats = explain.executionStats;

print(`  Stage: ${explain.queryPlanner.winningPlan.stage}`);
print(`  nReturned: ${stats.nReturned}`);
print(`  totalDocsExamined: ${stats.totalDocsExamined}`);
print(`  executionTimeMillis: ${stats.executionTimeMillis}ms`);
print(`  ผลวิเคราะห์: ${stats.totalDocsExamined > stats.nReturned * 2 ? "ไม่ดี! scan มากกว่า return เยอะ" : "OK"}`);

print("\n--- Query: หา orders เรียงตาม createdAt ---");
explain = db.orders.find({ status: "completed" }).sort({ createdAt: -1 }).limit(10).explain("executionStats");
stats = explain.executionStats;

print(`  Stage: ${JSON.stringify(explain.queryPlanner.winningPlan.stage)}`);
print(`  nReturned: ${stats.nReturned}`);
print(`  totalDocsExamined: ${stats.totalDocsExamined}`);
print(`  executionTimeMillis: ${stats.executionTimeMillis}ms`);

print("\n--- Query: หา orders ตาม total range ---");
explain = db.orders.find({ total: { $gte: 10000, $lte: 20000 } }).explain("executionStats");
stats = explain.executionStats;

print(`  Stage: ${JSON.stringify(explain.queryPlanner.winningPlan.stage)}`);
print(`  nReturned: ${stats.nReturned}`);
print(`  totalDocsExamined: ${stats.totalDocsExamined}`);
print(`  executionTimeMillis: ${stats.executionTimeMillis}ms`);

// ========================================
// 2. สร้าง Indexes
// ========================================
print("\n===== 2. สร้าง Indexes =====\n");

print("สร้าง index: { status: 1 }");
db.orders.createIndex({ status: 1 });

print("สร้าง index: { createdAt: -1 }");
db.orders.createIndex({ createdAt: -1 });

print("สร้าง index: { total: 1 }");
db.orders.createIndex({ total: 1 });

print("สร้าง compound index: { status: 1, createdAt: -1 }");
db.orders.createIndex({ status: 1, createdAt: -1 });

print("สร้าง compound index: { status: 1, total: 1 }");
db.orders.createIndex({ status: 1, total: 1 });

print("สร้าง index: { shippingCity: 1 }");
db.orders.createIndex({ shippingCity: 1 });

print("\nIndexes ทั้งหมด:");
db.orders.getIndexes().forEach(idx => {
  print(`  ${idx.name}: ${JSON.stringify(idx.key)}`);
});

// ========================================
// 3. explain() — หลังมี Index (IXSCAN)
// ========================================
print("\n===== 3. Query หลังสร้าง Index =====\n");

print("--- Query: หา orders ที่ status = 'completed' ---");
explain = db.orders.find({ status: "completed" }).explain("executionStats");
stats = explain.executionStats;
const stage3 = explain.queryPlanner.winningPlan.inputStage ? explain.queryPlanner.winningPlan.inputStage.stage : explain.queryPlanner.winningPlan.stage;

print(`  Stage: ${stage3}`);
print(`  nReturned: ${stats.nReturned}`);
print(`  totalKeysExamined: ${stats.totalKeysExamined}`);
print(`  totalDocsExamined: ${stats.totalDocsExamined}`);
print(`  executionTimeMillis: ${stats.executionTimeMillis}ms`);
print(`  ผลวิเคราะห์: ใช้ index แล้ว! เร็วขึ้นมาก`);

print("\n--- Query: หา orders เรียงตาม createdAt (ใช้ compound index) ---");
explain = db.orders.find({ status: "completed" }).sort({ createdAt: -1 }).limit(10).explain("executionStats");
stats = explain.executionStats;

print(`  nReturned: ${stats.nReturned}`);
print(`  totalKeysExamined: ${stats.totalKeysExamined}`);
print(`  totalDocsExamined: ${stats.totalDocsExamined}`);
print(`  executionTimeMillis: ${stats.executionTimeMillis}ms`);

print("\n--- Query: หา orders ตาม total range (ใช้ index) ---");
explain = db.orders.find({ total: { $gte: 10000, $lte: 20000 } }).explain("executionStats");
stats = explain.executionStats;

print(`  nReturned: ${stats.nReturned}`);
print(`  totalKeysExamined: ${stats.totalKeysExamined}`);
print(`  totalDocsExamined: ${stats.totalDocsExamined}`);
print(`  executionTimeMillis: ${stats.executionTimeMillis}ms`);

// ========================================
// 4. Covered Query
// ========================================
print("\n===== 4. Covered Query =====\n");

print("--- Covered Query: ดึงเฉพาะ status + total (อยู่ใน index) ---");
explain = db.orders.find(
  { status: "completed" },
  { _id: 0, status: 1, total: 1 }
).explain("executionStats");
stats = explain.executionStats;

print(`  nReturned: ${stats.nReturned}`);
print(`  totalKeysExamined: ${stats.totalKeysExamined}`);
print(`  totalDocsExamined: ${stats.totalDocsExamined}`);
print(`  executionTimeMillis: ${stats.executionTimeMillis}ms`);

if (stats.totalDocsExamined === 0) {
  print(`  Covered Query! ไม่ต้องอ่าน document เลย`);
} else {
  print(`  ไม่ใช่ Covered Query (docs examined > 0)`);
}

// ========================================
// 5. Profiler
// ========================================
print("\n===== 5. Database Profiler =====\n");

// เปิด profiler level 2 (log ทุก operation)
db.setProfilingLevel(2);
print("เปิด Profiler Level 2 (log ทุก operation)");

// รัน queries ให้ profiler บันทึก
db.orders.find({ status: "pending" }).limit(5).toArray();
db.orders.find({ shippingCity: "Bangkok", status: "completed" }).toArray();
db.orders.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
]).toArray();

// อ่าน profiler data
print("\nProfiled operations (ล่าสุด 5 รายการ):");
db.system.profile.find(
  { op: { $in: ["query", "command"] } },
  { op: 1, ns: 1, millis: 1, planSummary: 1 }
).sort({ ts: -1 }).limit(5).forEach(p => {
  print(`  [${p.millis}ms] ${p.op} on ${p.ns} — ${p.planSummary || "N/A"}`);
});

// ปิด profiler
db.setProfilingLevel(0);
print("\nปิด Profiler");

// ========================================
// 6. Collection Stats
// ========================================
print("\n===== 6. Collection Stats =====\n");

const collStats = db.orders.stats();
print(`Collection: orders`);
print(`  Documents: ${collStats.count.toLocaleString()}`);
print(`  Data Size: ${(collStats.size / 1024 / 1024).toFixed(2)} MB`);
print(`  Avg Doc Size: ${collStats.avgObjSize} bytes`);
print(`  Total Index Size: ${(collStats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
print(`  Number of Indexes: ${collStats.nindexes}`);

print("\n  Index Sizes:");
for (const [name, size] of Object.entries(collStats.indexSizes)) {
  print(`    ${name}: ${(size / 1024).toFixed(1)} KB`);
}

// ========================================
// 7. Index Usage Stats
// ========================================
print("\n===== 7. Index Usage Stats =====\n");

db.orders.aggregate([{ $indexStats: {} }]).forEach(idx => {
  print(`  ${idx.name}: ${idx.accesses.ops} accesses`);
});

// ========================================
// 8. สรุป
// ========================================
print("\n===== สรุป Performance Tips =====");
print("1. ใช้ explain('executionStats') วิเคราะห์ทุก query สำคัญ");
print("2. COLLSCAN = ไม่ดี → สร้าง index");
print("3. totalDocsExamined ควร ≈ nReturned");
print("4. Covered Query (totalDocsExamined = 0) = เร็วที่สุด");
print("5. Compound index: ใช้ ESR rule (Equality, Sort, Range)");
print("6. Profiler ช่วยหา slow queries ในระบบจริง");
print("7. อย่าสร้าง index มากเกินไป (เพิ่ม write cost)");

print("\n===== จบ Exercises =====");
