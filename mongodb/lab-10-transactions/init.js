// init.js — สร้างข้อมูลตัวอย่างสำหรับ Lab 10 Transactions
// วิธีรัน: docker compose exec mongo mongosh --file /scripts/init.js

db = db.getSiblingDB("transaction_lab");

// ล้างข้อมูลเก่า
db.wallets.drop();
db.bank_accounts.drop();
db.transactions.drop();
db.inventory.drop();
db.orders_tx.drop();
db.audit_log.drop();

print("=== สร้างข้อมูลตัวอย่าง Lab 10 Transactions ===\n");

// ============================================================
// Collection: wallets — กระเป๋าเงิน
// ============================================================
db.wallets.insertMany([
  { userId: "alice",   name: "Alice",   balance: 10000, currency: "THB", createdAt: new Date() },
  { userId: "bob",     name: "Bob",     balance: 5000,  currency: "THB", createdAt: new Date() },
  { userId: "charlie", name: "Charlie", balance: 8000,  currency: "THB", createdAt: new Date() },
  { userId: "diana",   name: "Diana",   balance: 15000, currency: "THB", createdAt: new Date() },
  { userId: "eve",     name: "Eve",     balance: 2000,  currency: "THB", createdAt: new Date() },
]);
print("✅ wallets: " + db.wallets.countDocuments() + " documents");

// ============================================================
// Collection: bank_accounts — บัญชีธนาคาร
// ============================================================
db.bank_accounts.insertMany([
  { accountNo: "001-111-1111", owner: "Alice",   type: "savings",  balance: 50000, bank: "SCB" },
  { accountNo: "002-222-2222", owner: "Bob",     type: "checking", balance: 30000, bank: "KBank" },
  { accountNo: "003-333-3333", owner: "Charlie", type: "savings",  balance: 75000, bank: "BBL" },
  { accountNo: "004-444-4444", owner: "Diana",   type: "savings",  balance: 120000, bank: "SCB" },
]);
print("✅ bank_accounts: " + db.bank_accounts.countDocuments() + " documents");

// ============================================================
// Collection: inventory — คลังสินค้า
// ============================================================
db.inventory.insertMany([
  { sku: "PHONE-001", name: "iPhone 15",       price: 35900, stock: 50, reserved: 0 },
  { sku: "PHONE-002", name: "Samsung Galaxy",  price: 29900, stock: 30, reserved: 0 },
  { sku: "LAPTOP-001", name: "MacBook Air",    price: 42900, stock: 20, reserved: 0 },
  { sku: "AUDIO-001", name: "AirPods Pro",     price: 8990,  stock: 100, reserved: 0 },
  { sku: "TAB-001",   name: "iPad Air",        price: 22900, stock: 15, reserved: 0 },
  { sku: "ACC-001",   name: "USB-C Cable",     price: 690,   stock: 500, reserved: 0 },
]);
print("✅ inventory: " + db.inventory.countDocuments() + " documents");

// ============================================================
// ประวัติ transactions
// ============================================================
db.transactions.insertMany([
  {
    type: "transfer",
    from: "alice",
    to: "bob",
    amount: 500,
    status: "completed",
    ref: "TXN-001",
    createdAt: new Date(Date.now() - 86400000 * 7)
  },
  {
    type: "transfer",
    from: "charlie",
    to: "alice",
    amount: 1200,
    status: "completed",
    ref: "TXN-002",
    createdAt: new Date(Date.now() - 86400000 * 3)
  },
  {
    type: "topup",
    to: "eve",
    amount: 3000,
    status: "completed",
    ref: "TXN-003",
    createdAt: new Date(Date.now() - 86400000)
  },
]);
print("✅ transactions: " + db.transactions.countDocuments() + " documents");

print("\n=== ข้อมูลเริ่มต้นทั้งหมด ===");
print("\n📊 Wallets:");
db.wallets.find({}, { _id: 0, userId: 1, name: 1, balance: 1 }).forEach(w => {
  print(`  ${w.name} (${w.userId}): ${w.balance.toLocaleString()} บาท`);
});

print("\n🏦 Bank Accounts:");
db.bank_accounts.find({}, { _id: 0, owner: 1, accountNo: 1, balance: 1, bank: 1 }).forEach(a => {
  print(`  ${a.owner} [${a.bank}] ${a.accountNo}: ${a.balance.toLocaleString()} บาท`);
});

print("\n📦 Inventory:");
db.inventory.find({}, { _id: 0, sku: 1, name: 1, price: 1, stock: 1 }).forEach(p => {
  print(`  [${p.sku}] ${p.name}: ${p.price} บาท (stock: ${p.stock})`);
});

print("\n✨ ข้อมูลพร้อมสำหรับ Lab 10 Transactions!");
print("💡 ลองรัน exercises.js ได้เลย: docker compose exec mongo mongosh --file /scripts/exercises.js");
