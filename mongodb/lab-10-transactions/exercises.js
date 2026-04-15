// exercises.js — Transactions Lab
// วิธีรัน: docker compose exec mongo mongosh --file /scripts/exercises.js

// ========================================
// ตัวอย่างที่ 1: Transaction พื้นฐาน — โอนเงิน
// ========================================

print("\n===== ตัวอย่างที่ 1: โอนเงินระหว่าง Wallets =====\n");

db = db.getSiblingDB("transaction_lab");

// ลบข้อมูลเก่า
db.wallets.drop();
db.transactions.drop();

// สร้างข้อมูล wallets
db.wallets.insertMany([
  { userId: "alice", name: "Alice", balance: 5000 },
  { userId: "bob", name: "Bob", balance: 3000 },
  { userId: "charlie", name: "Charlie", balance: 1000 }
]);

print("ก่อนโอนเงิน:");
db.wallets.find({}, { _id: 0 }).forEach(w => {
  print(`  ${w.name}: ${w.balance} บาท`);
});

// โอนเงินด้วย Transaction
const session1 = db.getMongo().startSession();
const walletsWithSession = session1.getDatabase("transaction_lab").wallets;
const txnLogWithSession = session1.getDatabase("transaction_lab").transactions;

session1.startTransaction();

try {
  const fromUser = "alice";
  const toUser = "bob";
  const amount = 1500;

  // ตรวจสอบยอดเงิน
  const sender = walletsWithSession.findOne({ userId: fromUser });
  if (sender.balance < amount) {
    throw new Error("ยอดเงินไม่พอ!");
  }

  // หักเงินผู้โอน
  walletsWithSession.updateOne(
    { userId: fromUser },
    { $inc: { balance: -amount } }
  );

  // เพิ่มเงินผู้รับ
  walletsWithSession.updateOne(
    { userId: toUser },
    { $inc: { balance: amount } }
  );

  // บันทึก transaction log
  txnLogWithSession.insertOne({
    from: fromUser,
    to: toUser,
    amount: amount,
    status: "completed",
    createdAt: new Date()
  });

  // Commit!
  session1.commitTransaction();
  print("\nโอนเงินสำเร็จ! (committed)");

} catch (error) {
  session1.abortTransaction();
  print("\nโอนเงินล้มเหลว! (aborted): " + error.message);

} finally {
  session1.endSession();
}

print("\nหลังโอนเงิน:");
db.wallets.find({}, { _id: 0 }).forEach(w => {
  print(`  ${w.name}: ${w.balance} บาท`);
});

print("\nTransaction logs:");
db.transactions.find({}, { _id: 0 }).forEach(t => {
  print(`  ${t.from} → ${t.to}: ${t.amount} บาท (${t.status})`);
});

// ========================================
// ตัวอย่างที่ 2: Transaction ที่ Abort (ยอดเงินไม่พอ)
// ========================================

print("\n===== ตัวอย่างที่ 2: โอนเงินที่ล้มเหลว (ยอดไม่พอ) =====\n");

print("ก่อนลองโอน:");
db.wallets.find({}, { _id: 0 }).forEach(w => {
  print(`  ${w.name}: ${w.balance} บาท`);
});

const session2 = db.getMongo().startSession();
const wallets2 = session2.getDatabase("transaction_lab").wallets;

session2.startTransaction();

try {
  const fromUser = "charlie";
  const toUser = "alice";
  const amount = 5000; // Charlie มีแค่ 1000!

  const sender = wallets2.findOne({ userId: fromUser });
  print(`\n${fromUser} มี ${sender.balance} บาท, ต้องการโอน ${amount} บาท`);

  if (sender.balance < amount) {
    throw new Error(`ยอดเงินไม่พอ! (มี ${sender.balance}, ต้องการ ${amount})`);
  }

  wallets2.updateOne(
    { userId: fromUser },
    { $inc: { balance: -amount } }
  );

  wallets2.updateOne(
    { userId: toUser },
    { $inc: { balance: amount } }
  );

  session2.commitTransaction();
  print("โอนเงินสำเร็จ!");

} catch (error) {
  session2.abortTransaction();
  print("Transaction ABORTED: " + error.message);

} finally {
  session2.endSession();
}

print("\nหลังลองโอน (ข้อมูลไม่เปลี่ยน เพราะ abort):");
db.wallets.find({}, { _id: 0 }).forEach(w => {
  print(`  ${w.name}: ${w.balance} บาท`);
});

// ========================================
// ตัวอย่างที่ 3: Multi-Collection Transaction
// ========================================

print("\n===== ตัวอย่างที่ 3: สั่งซื้อสินค้า (Multi-Collection) =====\n");

// สร้างข้อมูลสินค้า
db.products.drop();
db.orders.drop();

db.products.insertMany([
  { name: "MacBook Pro", price: 59900, stock: 5 },
  { name: "iPhone 15", price: 34900, stock: 10 },
  { name: "AirPods Pro", price: 8990, stock: 0 }  // หมด!
]);

print("สินค้าก่อนสั่งซื้อ:");
db.products.find({}, { _id: 0 }).forEach(p => {
  print(`  ${p.name}: ${p.stock} ชิ้น (${p.price} บาท)`);
});

// ฟังก์ชันสั่งซื้อ
function placeOrder(productName, quantity, customerName) {
  const session = db.getMongo().startSession();
  const products = session.getDatabase("transaction_lab").products;
  const orders = session.getDatabase("transaction_lab").orders;

  session.startTransaction();

  try {
    // ตรวจสอบ stock
    const product = products.findOne({ name: productName });

    if (!product) {
      throw new Error(`ไม่พบสินค้า: ${productName}`);
    }

    if (product.stock < quantity) {
      throw new Error(`สินค้า ${productName} เหลือ ${product.stock} ชิ้น (ต้องการ ${quantity})`);
    }

    // ลด stock
    products.updateOne(
      { name: productName },
      { $inc: { stock: -quantity } }
    );

    // สร้าง order
    orders.insertOne({
      customer: customerName,
      product: productName,
      quantity: quantity,
      totalPrice: product.price * quantity,
      status: "confirmed",
      createdAt: new Date()
    });

    session.commitTransaction();
    print(`  สั่งซื้อ ${productName} x${quantity} สำเร็จ!`);

  } catch (error) {
    session.abortTransaction();
    print(`  สั่งซื้อล้มเหลว: ${error.message}`);

  } finally {
    session.endSession();
  }
}

print("\nลองสั่งซื้อ:");
placeOrder("MacBook Pro", 2, "สมชาย");    // สำเร็จ
placeOrder("AirPods Pro", 1, "สมศรี");     // ล้มเหลว (หมด stock)
placeOrder("iPhone 15", 20, "สมหญิง");    // ล้มเหลว (stock ไม่พอ)

print("\nสินค้าหลังสั่งซื้อ:");
db.products.find({}, { _id: 0 }).forEach(p => {
  print(`  ${p.name}: ${p.stock} ชิ้น`);
});

print("\nOrders:");
db.orders.find({}, { _id: 0 }).forEach(o => {
  print(`  ${o.customer}: ${o.product} x${o.quantity} = ${o.totalPrice} บาท (${o.status})`);
});

// ========================================
// ตัวอย่างที่ 4: ดูว่า Abort rollback จริง
// ========================================

print("\n===== ตัวอย่างที่ 4: พิสูจน์ว่า Abort = Rollback =====\n");

db.test_rollback.drop();
db.test_rollback.insertOne({ name: "original", value: 100 });

print("ก่อน transaction:");
printjson(db.test_rollback.findOne({}, { _id: 0 }));

const session4 = db.getMongo().startSession();
const testColl = session4.getDatabase("transaction_lab").test_rollback;

session4.startTransaction();

// แก้ไขข้อมูล
testColl.updateOne({ name: "original" }, { $set: { value: 999 } });
testColl.insertOne({ name: "new_doc", value: 500 });

// ดูข้อมูลใน session (จะเห็นการเปลี่ยนแปลง)
print("\nระหว่าง transaction (ใน session):");
testColl.find({}, { _id: 0 }).forEach(doc => printjson(doc));

// Abort!
session4.abortTransaction();
session4.endSession();

print("\nหลัง ABORT (ข้อมูลกลับเป็นเดิม):");
db.test_rollback.find({}, { _id: 0 }).forEach(doc => printjson(doc));

print("\n===== จบ Exercises =====");
print("ลองแก้ไข exercises.js แล้วรันใหม่ด้วย:");
print("docker compose exec mongo mongosh --file /scripts/exercises.js");
