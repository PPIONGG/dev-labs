// examples.js -- ตัวอย่าง Schema Design Patterns
// ใช้ใน mongosh: load("examples.js") หรือ copy-paste ทีละส่วน

db = db.getSiblingDB("learn_mongo");

// ============================================================
// ตัวอย่างที่ 1: Embedding (1:1) -- User กับ Profile
// ============================================================

db.users_embedded.drop();

// ดี: Profile ถูกเข้าถึงพร้อม User เสมอ
db.users_embedded.insertOne({
  name: "สมชาย",
  email: "somchai@mail.com",
  // embed profile เข้าไปใน user document
  profile: {
    bio: "Full-stack developer ที่กรุงเทพ",
    avatar: "https://example.com/avatar.jpg",
    website: "https://somchai.dev",
    social: {
      github: "somchai",
      twitter: "somchai_dev",
    },
  },
});

print("--- Example 1: Embedded 1:1 (User + Profile) ---");
db.users_embedded.findOne();

// ============================================================
// ตัวอย่างที่ 2: Embedding (1:N) -- Blog Post กับ Comments
// ============================================================

db.posts_embedded.drop();

// ดี: ถ้า comments มีไม่มาก (< 100) และแสดงพร้อม post เสมอ
db.posts_embedded.insertOne({
  title: "MongoDB Schema Design 101",
  content: "เรียนรู้การออกแบบ schema ใน MongoDB...",
  author: "สมชาย",
  tags: ["mongodb", "database", "nosql"],
  // embed comments เข้าไปใน post
  comments: [
    {
      user: "สมหญิง",
      text: "บทความดีมากค่ะ",
      createdAt: new Date("2024-01-15"),
    },
    {
      user: "มานะ",
      text: "ขอบคุณครับ เข้าใจง่าย",
      createdAt: new Date("2024-01-16"),
    },
  ],
  createdAt: new Date("2024-01-14"),
});

print("--- Example 2: Embedded 1:N (Post + Comments) ---");
db.posts_embedded.findOne();

// ============================================================
// ตัวอย่างที่ 3: Referencing (1:N) -- Author กับ Books
// ============================================================

db.authors.drop();
db.books_ref.drop();

// แยก collection เมื่อ: books มีจำนวนมาก, ต้องการ query books แยกจาก author
const authorResult = db.authors.insertOne({
  name: "Robert C. Martin",
  nationality: "American",
  booksCount: 3,
});

const authorId = authorResult.insertedId;

db.books_ref.insertMany([
  {
    title: "Clean Code",
    authorId: authorId, // reference ไปที่ authors collection
    price: 890,
    publishedYear: 2008,
  },
  {
    title: "Clean Architecture",
    authorId: authorId,
    price: 950,
    publishedYear: 2017,
  },
  {
    title: "The Clean Coder",
    authorId: authorId,
    price: 780,
    publishedYear: 2011,
  },
]);

print("--- Example 3: Referencing 1:N (Author -> Books) ---");
print("Author:");
db.authors.findOne();
print("Books:");
db.books_ref.find().forEach(printjson);

// Query: หาหนังสือพร้อมข้อมูล author (ต้องใช้ $lookup)
print("Joined with $lookup:");
db.books_ref
  .aggregate([
    {
      $lookup: {
        from: "authors",
        localField: "authorId",
        foreignField: "_id",
        as: "author",
      },
    },
    { $unwind: "$author" },
    { $project: { title: 1, price: 1, "author.name": 1 } },
  ])
  .forEach(printjson);

// ============================================================
// ตัวอย่างที่ 4: Referencing (N:N) -- Students กับ Courses
// ============================================================

db.students.drop();
db.courses.drop();

db.students.insertMany([
  {
    name: "สมชาย",
    courseIds: [], // จะเพิ่มทีหลัง
  },
  {
    name: "สมหญิง",
    courseIds: [],
  },
]);

const courseResults = db.courses.insertMany([
  { name: "MongoDB 101", instructor: "อาจารย์ A", studentCount: 0 },
  { name: "Node.js 101", instructor: "อาจารย์ B", studentCount: 0 },
  { name: "React 101", instructor: "อาจารย์ C", studentCount: 0 },
]);

const courseIds = Object.values(courseResults.insertedIds);

// สมชาย ลง MongoDB 101 + Node.js 101
db.students.updateOne(
  { name: "สมชาย" },
  { $set: { courseIds: [courseIds[0], courseIds[1]] } }
);
db.courses.updateOne({ _id: courseIds[0] }, { $inc: { studentCount: 1 } });
db.courses.updateOne({ _id: courseIds[1] }, { $inc: { studentCount: 1 } });

// สมหญิง ลง MongoDB 101 + React 101
db.students.updateOne(
  { name: "สมหญิง" },
  { $set: { courseIds: [courseIds[0], courseIds[2]] } }
);
db.courses.updateOne({ _id: courseIds[0] }, { $inc: { studentCount: 1 } });
db.courses.updateOne({ _id: courseIds[2] }, { $inc: { studentCount: 1 } });

print("--- Example 4: Referencing N:N (Students <-> Courses) ---");
print("Students:");
db.students.find().forEach(printjson);
print("Courses:");
db.courses.find().forEach(printjson);

// ============================================================
// ตัวอย่างที่ 5: Subset Pattern -- Product กับ Reviews
// ============================================================

db.products_subset.drop();
db.reviews_full.drop();

// เก็บ reviews ล่าสุด 3 อันใน product (subset)
// เก็บ reviews ทั้งหมดแยก collection
db.products_subset.insertOne({
  name: "iPhone 15 Pro",
  price: 42900,
  // เก็บเฉพาะ 3 reviews ล่าสุด (subset)
  recentReviews: [
    { user: "คนที่ 10", rating: 5, text: "ดีมาก", createdAt: new Date("2024-03-10") },
    { user: "คนที่ 9", rating: 4, text: "โอเค", createdAt: new Date("2024-03-09") },
    { user: "คนที่ 8", rating: 5, text: "สุดยอด", createdAt: new Date("2024-03-08") },
  ],
  totalReviews: 10,
  averageRating: 4.5,
});

// Reviews ทั้งหมดอยู่แยก collection
db.reviews_full.insertMany([
  { productName: "iPhone 15 Pro", user: "คนที่ 1", rating: 4, createdAt: new Date("2024-01-01") },
  { productName: "iPhone 15 Pro", user: "คนที่ 2", rating: 5, createdAt: new Date("2024-01-15") },
  { productName: "iPhone 15 Pro", user: "คนที่ 10", rating: 5, createdAt: new Date("2024-03-10") },
]);

print("--- Example 5: Subset Pattern (Product + Recent Reviews) ---");
db.products_subset.findOne();

// ============================================================
// ตัวอย่างที่ 6: Computed Pattern -- Order กับ Totals
// ============================================================

db.orders_computed.drop();

// คำนวณ total ไว้ล่วงหน้า ไม่ต้องคำนวณทุกครั้งที่ query
db.orders_computed.insertOne({
  orderNo: "ORD-001",
  customer: "สมชาย",
  items: [
    { product: "iPhone 15 Pro", quantity: 1, price: 42900 },
    { product: "AirPods Pro 2", quantity: 2, price: 8990 },
  ],
  // computed fields -- คำนวณไว้ล่วงหน้า
  itemCount: 2,
  totalQuantity: 3,
  subtotal: 60880,
  discount: 5000,
  total: 55880,
});

print("--- Example 6: Computed Pattern (Pre-calculated Totals) ---");
db.orders_computed.findOne();

// ============================================================
// ตัวอย่างที่ 7: Bucket Pattern -- IoT Sensor Data
// ============================================================

db.sensor_buckets.drop();

// แทนที่จะเก็บ 1 reading = 1 document (ล้านๆ documents)
// เก็บเป็น bucket: 1 ชั่วโมง = 1 document
db.sensor_buckets.insertOne({
  sensorId: "sensor-001",
  date: new Date("2024-03-15"),
  hour: 14,
  // readings ทั้งหมดในชั่วโมงนี้
  readings: [
    { minute: 0, temp: 25.1, humidity: 60 },
    { minute: 5, temp: 25.2, humidity: 61 },
    { minute: 10, temp: 25.0, humidity: 59 },
    { minute: 15, temp: 25.3, humidity: 62 },
    { minute: 20, temp: 25.1, humidity: 60 },
    { minute: 25, temp: 24.9, humidity: 58 },
  ],
  // computed summaries
  count: 6,
  avgTemp: 25.1,
  minTemp: 24.9,
  maxTemp: 25.3,
});

print("--- Example 7: Bucket Pattern (Sensor Data by Hour) ---");
db.sensor_buckets.findOne();

print("\n=== All examples loaded! ===");
