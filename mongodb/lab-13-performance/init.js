// init.js — สร้าง Dataset ใหญ่สำหรับทดสอบ Performance
// วิธีรัน: docker compose exec mongo mongosh --file /scripts/init.js
// หมายเหตุ: ใช้เวลาประมาณ 30 วินาที - 1 นาที

db = db.getSiblingDB("performance_lab");

// ลบข้อมูลเก่า
db.orders.drop();
db.customers.drop();

print("===== สร้าง Dataset ขนาดใหญ่ =====\n");

// ===== Helper functions =====
const statuses = ["pending", "processing", "completed", "cancelled", "refunded"];
const categories = ["electronics", "clothing", "food", "books", "sports", "home", "beauty", "toys"];
const cities = ["Bangkok", "Chiang Mai", "Phuket", "Pattaya", "Khon Kaen", "Hat Yai", "Nakhon Ratchasima", "Udon Thani"];
const paymentMethods = ["credit_card", "bank_transfer", "cash_on_delivery", "e_wallet"];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// ===== สร้าง Customers (10,000 คน) =====
print("กำลังสร้าง customers 10,000 คน...");

const customerBatch = [];
for (let i = 0; i < 10000; i++) {
  customerBatch.push({
    name: `Customer_${i.toString().padStart(5, "0")}`,
    email: `customer${i}@example.com`,
    city: randomItem(cities),
    memberLevel: randomItem(["bronze", "silver", "gold", "platinum"]),
    totalOrders: 0,
    totalSpent: 0,
    createdAt: randomDate(new Date("2022-01-01"), new Date("2024-01-01"))
  });

  if (customerBatch.length === 1000) {
    db.customers.insertMany(customerBatch);
    customerBatch.length = 0;
    print(`  ... ${i + 1} customers`);
  }
}
if (customerBatch.length > 0) {
  db.customers.insertMany(customerBatch);
}
print(`  customers: ${db.customers.countDocuments()} docs`);

// ===== สร้าง Orders (100,000 รายการ) =====
print("\nกำลังสร้าง orders 100,000 รายการ (ใช้เวลาสักครู่)...");

const customerIds = db.customers.find({}, { _id: 1 }).map(c => c._id);

let orderBatch = [];
for (let i = 0; i < 100000; i++) {
  const itemCount = randomInt(1, 5);
  const items = [];
  let total = 0;

  for (let j = 0; j < itemCount; j++) {
    const price = randomInt(50, 50000);
    const qty = randomInt(1, 3);
    items.push({
      name: `Product_${randomInt(1, 500)}`,
      category: randomItem(categories),
      price: price,
      quantity: qty
    });
    total += price * qty;
  }

  const status = randomItem(statuses);
  const createdAt = randomDate(new Date("2023-01-01"), new Date("2024-12-31"));

  orderBatch.push({
    customerId: randomItem(customerIds),
    status: status,
    items: items,
    total: total,
    discount: randomInt(0, 20),
    paymentMethod: randomItem(paymentMethods),
    shippingCity: randomItem(cities),
    notes: i % 10 === 0 ? `Order note for order ${i}` : null,
    createdAt: createdAt,
    updatedAt: status !== "pending" ? new Date(createdAt.getTime() + randomInt(1, 72) * 3600000) : null
  });

  if (orderBatch.length === 5000) {
    db.orders.insertMany(orderBatch);
    orderBatch = [];
    print(`  ... ${i + 1} orders`);
  }
}
if (orderBatch.length > 0) {
  db.orders.insertMany(orderBatch);
}

print(`  orders: ${db.orders.countDocuments()} docs`);

// ===== สรุป =====
print("\n===== Dataset สร้างเสร็จ =====");
print(`Customers: ${db.customers.countDocuments().toLocaleString()} documents`);
print(`Orders: ${db.orders.countDocuments().toLocaleString()} documents`);
print("\nยังไม่มี index (จะสร้างใน exercises)");
print("รัน exercises ด้วย: docker compose exec mongo mongosh --file /scripts/exercises.js");
