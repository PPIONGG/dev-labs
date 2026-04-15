// watcher.js — Change Stream Watcher
// วิธีรัน: docker compose exec mongo mongosh --file /scripts/watcher.js
// หมายเหตุ: รัน script นี้ก่อน แล้วค่อยรัน writer.js ใน terminal อื่น

db = db.getSiblingDB("changestream_lab");

print("===== Change Stream Watcher =====");
print("กำลังเฝ้าดู collection 'messages'...");
print("เปิด terminal อื่นแล้วรัน: docker compose exec mongo mongosh --file /scripts/writer.js");
print("กด Ctrl+C เพื่อหยุด\n");

// ===== ตัวอย่างที่ 1: Watch ทุก event =====
let eventCount = 0;
let lastResumeToken = null;

const changeStream = db.messages.watch(
  [],  // pipeline ว่าง = ดูทุก event
  { fullDocument: "updateLookup" }  // ให้ส่ง fullDocument มาด้วยตอน update
);

// วนรับ change events
while (changeStream.hasNext()) {
  const change = changeStream.next();
  eventCount++;
  lastResumeToken = change._id;

  print(`\n--- Event #${eventCount} ---`);
  print(`  Type: ${change.operationType}`);
  print(`  Time: ${new Date().toLocaleTimeString()}`);

  switch (change.operationType) {
    case "insert":
      print(`  New Document:`);
      printjson(change.fullDocument);
      break;

    case "update":
      print(`  Document ID: ${change.documentKey._id}`);
      print(`  Updated Fields:`);
      printjson(change.updateDescription.updatedFields);
      if (change.fullDocument) {
        print(`  Full Document After Update:`);
        printjson(change.fullDocument);
      }
      break;

    case "replace":
      print(`  Document ID: ${change.documentKey._id}`);
      print(`  New Document:`);
      printjson(change.fullDocument);
      break;

    case "delete":
      print(`  Deleted Document ID: ${change.documentKey._id}`);
      break;

    default:
      print(`  Event Data:`);
      printjson(change);
  }

  // หยุดหลัง 20 events เพื่อไม่ให้รันไปเรื่อยๆ
  if (eventCount >= 20) {
    print("\n\nรับ 20 events แล้ว หยุดอัตโนมัติ");
    print("Resume Token สุดท้าย:");
    printjson(lastResumeToken);
    break;
  }
}

changeStream.close();
print("\n===== Watcher หยุดทำงาน =====");
