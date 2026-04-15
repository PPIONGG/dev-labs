// writer.js — ทำการเปลี่ยนแปลงข้อมูลเพื่อให้ watcher เห็น
// วิธีรัน: docker compose exec mongo mongosh --file /scripts/writer.js
// หมายเหตุ: ต้องรัน watcher.js ก่อนใน terminal อื่น

db = db.getSiblingDB("changestream_lab");

print("===== Change Stream Writer =====");
print("กำลังสร้างการเปลี่ยนแปลงข้อมูล...\n");

// ลบข้อมูลเก่า (watcher จะไม่เห็นเพราะยังไม่มี data)
db.messages.drop();

// เว้นช่วงเล็กน้อยเพื่อให้ watcher พร้อม
sleep(1000);

// ===== 1. INSERT — เพิ่ม documents =====
print("1. INSERT: เพิ่มข้อความ 3 รายการ...");

db.messages.insertOne({
  user: "somchai",
  text: "สวัสดีครับ!",
  priority: "normal",
  createdAt: new Date()
});
sleep(1000);

db.messages.insertOne({
  user: "somsri",
  text: "มีใครออนไลน์ไหม?",
  priority: "normal",
  createdAt: new Date()
});
sleep(1000);

const urgentMsg = db.messages.insertOne({
  user: "admin",
  text: "ระบบจะปิดปรับปรุงคืนนี้",
  priority: "high",
  createdAt: new Date()
});
sleep(1000);

// ===== 2. UPDATE — แก้ไข documents =====
print("2. UPDATE: แก้ไขข้อความ...");

db.messages.updateOne(
  { user: "somchai" },
  { $set: { text: "สวัสดีครับ! (แก้ไขแล้ว)", editedAt: new Date() } }
);
sleep(1000);

// Update ด้วย $inc
db.messages.updateOne(
  { user: "somsri" },
  {
    $set: { status: "read" },
    $inc: { viewCount: 1 }
  }
);
sleep(1000);

// ===== 3. REPLACE — replace ทั้ง document =====
print("3. REPLACE: เปลี่ยน document ทั้งหมด...");

db.messages.replaceOne(
  { user: "admin" },
  {
    user: "admin",
    text: "ระบบจะปิดปรับปรุง 22:00 - 02:00",
    priority: "urgent",
    category: "announcement",
    createdAt: new Date(),
    updatedAt: new Date()
  }
);
sleep(1000);

// ===== 4. MORE INSERTS =====
print("4. INSERT: เพิ่มข้อความอีก...");

db.messages.insertMany([
  {
    user: "prasit",
    text: "รับทราบครับ",
    priority: "normal",
    createdAt: new Date()
  },
  {
    user: "somying",
    text: "ขอบคุณที่แจ้งค่ะ",
    priority: "normal",
    createdAt: new Date()
  }
]);
sleep(1000);

// ===== 5. DELETE — ลบ documents =====
print("5. DELETE: ลบข้อความ...");

db.messages.deleteOne({ user: "prasit" });
sleep(1000);

// ===== 6. BULK UPDATE =====
print("6. UPDATE: อัปเดตหลาย documents...");

db.messages.updateMany(
  { priority: "normal" },
  { $set: { archived: true, archivedAt: new Date() } }
);
sleep(1000);

// ===== สรุป =====
print("\n===== Writer เสร็จสิ้น =====");
print("สร้าง events ทั้งหมด:");
print("  - INSERT x 5 (3 + insertMany 2)");
print("  - UPDATE x 3 (2 single + 1 multi)");
print("  - REPLACE x 1");
print("  - DELETE x 1");
print("\nดู watcher terminal เพื่อดู events ที่ได้รับ");
