// exercises.js -- แบบฝึกหัด Lab 04 Query Operators
// ใช้ใน mongosh: load("exercises.js") หรือ copy-paste ทีละคำสั่ง

// use learn_mongo

// ============================================================
// แบบฝึกหัดที่ 1: Comparison Operators
// ============================================================

// 1.1 หาสินค้าราคา 12900 บาทพอดี
// ลองเขียนเอง...

// เฉลย:
db.products.find({ price: { $eq: 12900 } });

// 1.2 หาสินค้าราคามากกว่า 40000
// ลองเขียนเอง...

// เฉลย:
db.products.find({ price: { $gt: 40000 } });

// 1.3 หาสินค้าราคาระหว่าง 10000-30000
// ลองเขียนเอง...

// เฉลย:
db.products.find({ price: { $gte: 10000, $lte: 30000 } });

// 1.4 หาสินค้าแบรนด์ Apple หรือ Samsung
// ลองเขียนเอง...

// เฉลย:
db.products.find({ brand: { $in: ["Apple", "Samsung"] } });

// 1.5 หาสินค้าที่ไม่ใช่ category smartphone
// ลองเขียนเอง...

// เฉลย:
db.products.find({ category: { $ne: "smartphone" } });

// ============================================================
// แบบฝึกหัดที่ 2: Logical Operators
// ============================================================

// 2.1 หาสินค้า Apple ที่ราคาน้อยกว่า 30000
// ลองเขียนเอง...

// เฉลย:
db.products.find({
  $and: [{ brand: "Apple" }, { price: { $lt: 30000 } }],
});

// 2.2 หาสินค้า laptop หรือ tablet
// ลองเขียนเอง...

// เฉลย:
db.products.find({
  $or: [{ category: "laptop" }, { category: "tablet" }],
});

// 2.3 หาสินค้าที่ไม่ใช่ Apple และราคามากกว่า 20000
// ลองเขียนเอง...

// เฉลย:
db.products.find({
  brand: { $not: { $eq: "Apple" } },
  price: { $gt: 20000 },
});

// 2.4 หาสินค้าที่ไม่ใช่ smartphone และไม่ใช่ laptop
// ลองเขียนเอง...

// เฉลย:
db.products.find({
  $nor: [{ category: "smartphone" }, { category: "laptop" }],
});

// ============================================================
// แบบฝึกหัดที่ 3: Element Operators
// ============================================================

// 3.1 หาสินค้าที่มี field "specs.ram"
// ลองเขียนเอง...

// เฉลย:
db.products.find({ "specs.ram": { $exists: true } });

// 3.2 หาสินค้าที่ rating เป็นตัวเลข (type double)
// ลองเขียนเอง...

// เฉลย:
db.products.find({ rating: { $type: "double" } });

// ============================================================
// แบบฝึกหัดที่ 4: Array Operators
// ============================================================

// 4.1 หาสินค้าที่มี tag "premium"
// ลองเขียนเอง...

// เฉลย:
db.products.find({ tags: "premium" });

// 4.2 หาสินค้าที่มี tag ทั้ง "5g" และ "camera"
// ลองเขียนเอง...

// เฉลย:
db.products.find({ tags: { $all: ["5g", "camera"] } });

// 4.3 หาสินค้าที่มีสีพอดี 1 สี
// ลองเขียนเอง...

// เฉลย:
db.products.find({ colors: { $size: 1 } });

// 4.4 หา orders ที่มี item ราคามากกว่า 40000
// ลองเขียนเอง...

// เฉลย:
db.orders.find({
  items: { $elemMatch: { price: { $gt: 40000 } } },
});

// ============================================================
// แบบฝึกหัดที่ 5: Projection, Sort, Limit, Skip
// ============================================================

// 5.1 แสดงเฉพาะ name และ price ของสินค้าทั้งหมด
// ลองเขียนเอง...

// เฉลย:
db.products.find({}, { name: 1, price: 1, _id: 0 });

// 5.2 เรียงสินค้าตามราคาจากน้อยไปมาก
// ลองเขียนเอง...

// เฉลย:
db.products.find().sort({ price: 1 });

// 5.3 เรียงตามราคาจากมากไปน้อย แสดงแค่ 3 รายการแรก
// ลองเขียนเอง...

// เฉลย:
db.products.find().sort({ price: -1 }).limit(3);

// 5.4 Pagination: หน้าที่ 2 (แสดงหน้าละ 3 รายการ)
// ลองเขียนเอง...

// เฉลย:
db.products.find().sort({ price: -1 }).skip(3).limit(3);

// 5.5 หาสินค้า Apple เรียงตาม rating จากมากไปน้อย แสดง name, price, rating
// ลองเขียนเอง...

// เฉลย:
db.products
  .find({ brand: "Apple" }, { name: 1, price: 1, rating: 1, _id: 0 })
  .sort({ rating: -1 });

print("--- Exercises completed! ---");
