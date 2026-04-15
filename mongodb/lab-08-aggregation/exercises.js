// exercises.js -- แบบฝึกหัด Lab 08 Aggregation Pipeline
// ใช้ใน mongosh: load("exercises.js") หรือ copy-paste ทีละคำสั่ง

// use learn_mongo

// ============================================================
// แบบฝึกหัดที่ 1: $match + $count -- กรองและนับ
// ============================================================

// 1.1 นับจำนวนรายการขายในหมวด Electronics
// ลองเขียนเอง...

// เฉลย:
print("=== 1.1: Electronics sales count ===");
db.sales.aggregate([
  { $match: { category: "Electronics" } },
  { $count: "totalSales" },
]);

// 1.2 นับจำนวนรายการขายที่จ่ายด้วย credit_card และ total > 10000
// ลองเขียนเอง...

// เฉลย:
print("=== 1.2: Credit card sales > 10000 ===");
db.sales.aggregate([
  { $match: { paymentMethod: "credit_card", total: { $gt: 10000 } } },
  { $count: "count" },
]);

// ============================================================
// แบบฝึกหัดที่ 2: $group -- จัดกลุ่มและสรุป
// ============================================================

// 2.1 ยอดขายรวมแยกตาม category
// ลองเขียนเอง...

// เฉลย:
print("=== 2.1: Total sales by category ===");
db.sales.aggregate([
  {
    $group: {
      _id: "$category",
      totalRevenue: { $sum: "$total" },
      totalQuantity: { $sum: "$quantity" },
      avgPrice: { $avg: "$price" },
      count: { $sum: 1 },
    },
  },
  { $sort: { totalRevenue: -1 } },
]);

// 2.2 ยอดขายรวมแยกตามสาขา (store)
// ลองเขียนเอง...

// เฉลย:
print("=== 2.2: Total sales by store ===");
db.sales.aggregate([
  {
    $group: {
      _id: "$store",
      totalRevenue: { $sum: "$total" },
      count: { $sum: 1 },
    },
  },
  { $sort: { totalRevenue: -1 } },
]);

// ============================================================
// แบบฝึกหัดที่ 3: $project + $addFields
// ============================================================

// 3.1 แสดง product, total, และเพิ่ม field "vat" (7% ของ total)
// ลองเขียนเอง...

// เฉลย:
print("=== 3.1: Sales with VAT ===");
db.sales.aggregate([
  {
    $addFields: {
      vat: { $multiply: ["$total", 0.07] },
      totalWithVat: { $multiply: ["$total", 1.07] },
    },
  },
  {
    $project: {
      product: 1,
      total: 1,
      vat: { $round: ["$vat", 2] },
      totalWithVat: { $round: ["$totalWithVat", 2] },
    },
  },
  { $limit: 5 },
]);

// ============================================================
// แบบฝึกหัดที่ 4: $sort + $limit + $skip
// ============================================================

// 4.1 Top 5 รายการขายที่มียอดสูงสุด
// ลองเขียนเอง...

// เฉลย:
print("=== 4.1: Top 5 sales ===");
db.sales.aggregate([
  { $sort: { total: -1 } },
  { $limit: 5 },
  { $project: { product: 1, category: 1, total: 1, store: 1 } },
]);

// 4.2 Top 3 สินค้าที่ขายได้มากที่สุด (จำนวนชิ้น)
// ลองเขียนเอง...

// เฉลย:
print("=== 4.2: Top 3 products by quantity ===");
db.sales.aggregate([
  {
    $group: {
      _id: "$product",
      totalQuantity: { $sum: "$quantity" },
      totalRevenue: { $sum: "$total" },
    },
  },
  { $sort: { totalQuantity: -1 } },
  { $limit: 3 },
]);

// ============================================================
// แบบฝึกหัดที่ 5: Monthly Revenue (ยอดขายรายเดือน)
// ============================================================

// 5.1 สรุปยอดขายรายเดือน
// ลองเขียนเอง...

// เฉลย:
print("=== 5.1: Monthly revenue ===");
db.sales.aggregate([
  {
    $group: {
      _id: {
        year: { $year: "$saleDate" },
        month: { $month: "$saleDate" },
      },
      totalRevenue: { $sum: "$total" },
      totalOrders: { $sum: 1 },
      avgOrderValue: { $avg: "$total" },
    },
  },
  { $sort: { "_id.year": 1, "_id.month": 1 } },
  {
    $project: {
      _id: 0,
      month: {
        $concat: [
          { $toString: "$_id.year" },
          "-",
          {
            $cond: {
              if: { $lt: ["$_id.month", 10] },
              then: { $concat: ["0", { $toString: "$_id.month" }] },
              else: { $toString: "$_id.month" },
            },
          },
        ],
      },
      totalRevenue: 1,
      totalOrders: 1,
      avgOrderValue: { $round: ["$avgOrderValue", 0] },
    },
  },
]);

// ============================================================
// แบบฝึกหัดที่ 6: $unwind
// ============================================================

// 6.1 สร้าง collection ตัวอย่างที่มี array แล้วใช้ $unwind
print("=== 6.1: $unwind example ===");

db.orders_agg.drop();
db.orders_agg.insertMany([
  {
    orderNo: "ORD-001",
    customer: "สมชาย",
    items: [
      { product: "iPhone 15", price: 42900 },
      { product: "AirPods", price: 8990 },
    ],
  },
  {
    orderNo: "ORD-002",
    customer: "สมหญิง",
    items: [
      { product: "MacBook Air", price: 44900 },
      { product: "iPad Air", price: 24900 },
      { product: "AirPods", price: 8990 },
    ],
  },
]);

// $unwind แตก array ออกเป็น document แยก
db.orders_agg.aggregate([
  { $unwind: "$items" },
  {
    $project: {
      orderNo: 1,
      customer: 1,
      product: "$items.product",
      price: "$items.price",
    },
  },
]);

// ============================================================
// แบบฝึกหัดที่ 7: $lookup (JOIN)
// ============================================================

// 7.1 JOIN sales กับ customers_agg เพื่อดูชื่อลูกค้า
// ลองเขียนเอง...

// เฉลย:
print("=== 7.1: Sales with customer info ($lookup) ===");
db.sales.aggregate([
  { $limit: 5 },
  {
    $lookup: {
      from: "customers_agg",
      localField: "customerId",
      foreignField: "customerId",
      as: "customerInfo",
    },
  },
  { $unwind: "$customerInfo" },
  {
    $project: {
      product: 1,
      total: 1,
      customerName: "$customerInfo.name",
      memberTier: "$customerInfo.memberTier",
    },
  },
]);

// 7.2 Top 5 ลูกค้าที่ซื้อเยอะที่สุด พร้อมชื่อ
// ลองเขียนเอง...

// เฉลย:
print("=== 7.2: Top 5 customers by spending ===");
db.sales.aggregate([
  {
    $group: {
      _id: "$customerId",
      totalSpent: { $sum: "$total" },
      orderCount: { $sum: 1 },
    },
  },
  { $sort: { totalSpent: -1 } },
  { $limit: 5 },
  {
    $lookup: {
      from: "customers_agg",
      localField: "_id",
      foreignField: "customerId",
      as: "customer",
    },
  },
  { $unwind: "$customer" },
  {
    $project: {
      _id: 0,
      customerId: "$_id",
      name: "$customer.name",
      memberTier: "$customer.memberTier",
      totalSpent: 1,
      orderCount: 1,
    },
  },
]);

// ============================================================
// แบบฝึกหัดที่ 8: Pipeline แบบซับซ้อน
// ============================================================

// 8.1 ยอดขายแยกตาม category และสาขา (cross-tab)
// ลองเขียนเอง...

// เฉลย:
print("=== 8.1: Sales by category and store ===");
db.sales.aggregate([
  {
    $group: {
      _id: { category: "$category", store: "$store" },
      totalRevenue: { $sum: "$total" },
      count: { $sum: 1 },
    },
  },
  { $sort: { "_id.category": 1, totalRevenue: -1 } },
  {
    $project: {
      _id: 0,
      category: "$_id.category",
      store: "$_id.store",
      totalRevenue: 1,
      count: 1,
    },
  },
]);

// 8.2 สินค้ายอดนิยมในแต่ละ category (Top 1 per category)
// ลองเขียนเอง...

// เฉลย:
print("=== 8.2: Top product per category ===");
db.sales.aggregate([
  {
    $group: {
      _id: { category: "$category", product: "$product" },
      totalQuantity: { $sum: "$quantity" },
      totalRevenue: { $sum: "$total" },
    },
  },
  { $sort: { "_id.category": 1, totalQuantity: -1 } },
  {
    $group: {
      _id: "$_id.category",
      topProduct: { $first: "$_id.product" },
      topQuantity: { $first: "$totalQuantity" },
      topRevenue: { $first: "$totalRevenue" },
    },
  },
  { $sort: { topRevenue: -1 } },
]);

print("\n--- Exercises completed! ---");
