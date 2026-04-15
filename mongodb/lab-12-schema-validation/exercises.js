// exercises.js — ทดสอบ Schema Validation
// วิธีรัน: docker compose exec mongo mongosh --file /scripts/exercises.js

db = db.getSiblingDB("validation_lab");

print("===== ทดสอบ Schema Validation =====\n");

// ========================================
// ทดสอบที่ 1: Users — valid document
// ========================================
print("--- ทดสอบที่ 1: Insert user ที่ถูกต้อง ---");
try {
  db.users.insertOne({
    username: "newuser",
    email: "newuser@example.com",
    role: "viewer",
    age: NumberInt(28),
    createdAt: new Date()
  });
  print("  ผ่าน: Insert สำเร็จ\n");
} catch (e) {
  print("  ไม่ผ่าน: " + e.message + "\n");
}

// ========================================
// ทดสอบที่ 2: Users — missing required field
// ========================================
print("--- ทดสอบที่ 2: Insert user ที่ขาด required field (role) ---");
try {
  db.users.insertOne({
    username: "baduser",
    email: "bad@example.com",
    // ไม่มี role!
    createdAt: new Date()
  });
  print("  ผ่าน: Insert สำเร็จ (ไม่ควรเกิด!)\n");
} catch (e) {
  print("  ไม่ผ่าน (ถูกต้อง!): Document ถูก reject เพราะขาด role\n");
}

// ========================================
// ทดสอบที่ 3: Users — invalid enum value
// ========================================
print("--- ทดสอบที่ 3: Insert user ที่มี role ไม่ถูกต้อง ---");
try {
  db.users.insertOne({
    username: "hacker",
    email: "hacker@example.com",
    role: "superadmin",  // ไม่อยู่ใน enum!
    createdAt: new Date()
  });
  print("  ผ่าน: Insert สำเร็จ (ไม่ควรเกิด!)\n");
} catch (e) {
  print("  ไม่ผ่าน (ถูกต้อง!): 'superadmin' ไม่อยู่ใน enum [admin, editor, viewer]\n");
}

// ========================================
// ทดสอบที่ 4: Users — username too short
// ========================================
print("--- ทดสอบที่ 4: Insert user ที่ username สั้นเกินไป ---");
try {
  db.users.insertOne({
    username: "ab",  // minLength = 3
    email: "ab@example.com",
    role: "viewer",
    createdAt: new Date()
  });
  print("  ผ่าน: Insert สำเร็จ (ไม่ควรเกิด!)\n");
} catch (e) {
  print("  ไม่ผ่าน (ถูกต้อง!): username 'ab' สั้นกว่า minLength 3\n");
}

// ========================================
// ทดสอบที่ 5: Users — invalid email format
// ========================================
print("--- ทดสอบที่ 5: Insert user ที่ email format ไม่ถูกต้อง ---");
try {
  db.users.insertOne({
    username: "bademail",
    email: "not-an-email",
    role: "viewer",
    createdAt: new Date()
  });
  print("  ผ่าน: Insert สำเร็จ (ไม่ควรเกิด!)\n");
} catch (e) {
  print("  ไม่ผ่าน (ถูกต้อง!): 'not-an-email' ไม่ตรง email pattern\n");
}

// ========================================
// ทดสอบที่ 6: Users — wrong type
// ========================================
print("--- ทดสอบที่ 6: Insert user ที่ age เป็น string แทน int ---");
try {
  db.users.insertOne({
    username: "wrongtype",
    email: "wrongtype@example.com",
    role: "viewer",
    age: "twenty-five",  // ต้องเป็น int!
    createdAt: new Date()
  });
  print("  ผ่าน: Insert สำเร็จ (ไม่ควรเกิด!)\n");
} catch (e) {
  print("  ไม่ผ่าน (ถูกต้อง!): age ต้องเป็น int ไม่ใช่ string\n");
}

// ========================================
// ทดสอบที่ 7: Products — valid with attributes
// ========================================
print("--- ทดสอบที่ 7: Insert product ที่ถูกต้อง (Attribute Pattern) ---");
try {
  db.products.insertOne({
    name: "Keyboard Mechanical",
    price: 2990.0,
    category: "electronics",
    status: "active",
    attributes: [
      { key: "switch", value: "Cherry MX Blue" },
      { key: "layout", value: "TKL" }
    ],
    tags: ["keyboard", "mechanical", "gaming"],
    stock: NumberInt(100)
  });
  print("  ผ่าน: Insert สำเร็จ\n");
} catch (e) {
  print("  ไม่ผ่าน: " + e.message + "\n");
}

// ========================================
// ทดสอบที่ 8: Products — negative price
// ========================================
print("--- ทดสอบที่ 8: Insert product ที่ราคาติดลบ ---");
try {
  db.products.insertOne({
    name: "Free Item",
    price: -100.0,  // minimum: 0
    category: "other",
    status: "active"
  });
  print("  ผ่าน: Insert สำเร็จ (ไม่ควรเกิด!)\n");
} catch (e) {
  print("  ไม่ผ่าน (ถูกต้อง!): price ต้องมากกว่าหรือเท่ากับ 0\n");
}

// ========================================
// ทดสอบที่ 9: Products — invalid category
// ========================================
print("--- ทดสอบที่ 9: Insert product ที่ category ไม่ถูกต้อง ---");
try {
  db.products.insertOne({
    name: "Mystery Item",
    price: 100.0,
    category: "toys",  // ไม่อยู่ใน enum!
    status: "active"
  });
  print("  ผ่าน: Insert สำเร็จ (ไม่ควรเกิด!)\n");
} catch (e) {
  print("  ไม่ผ่าน (ถูกต้อง!): 'toys' ไม่อยู่ใน category enum\n");
}

// ========================================
// ทดสอบที่ 10: Notifications — Polymorphic Pattern
// ========================================
print("--- ทดสอบที่ 10: Insert notifications หลายประเภท ---");
try {
  db.notifications.insertMany([
    {
      type: "email",
      to: "user@example.com",
      subject: "Welcome!",
      body: "ยินดีต้อนรับ",
      createdAt: new Date()
    },
    {
      type: "sms",
      phone: "+66891234567",
      message: "รหัส OTP: 123456",
      createdAt: new Date()
    },
    {
      type: "push",
      deviceToken: "abc123def456",
      title: "มีข้อความใหม่",
      badge: 5,
      createdAt: new Date()
    }
  ]);
  print("  ผ่าน: Insert 3 notifications สำเร็จ (polymorphic pattern)\n");
} catch (e) {
  print("  ไม่ผ่าน: " + e.message + "\n");
}

// ========================================
// ทดสอบที่ 11: Notifications — invalid type
// ========================================
print("--- ทดสอบที่ 11: Insert notification ที่ type ไม่ถูกต้อง ---");
try {
  db.notifications.insertOne({
    type: "telegram",  // ไม่อยู่ใน enum!
    chatId: "12345",
    createdAt: new Date()
  });
  print("  ผ่าน: Insert สำเร็จ (ไม่ควรเกิด!)\n");
} catch (e) {
  print("  ไม่ผ่าน (ถูกต้อง!): 'telegram' ไม่อยู่ใน type enum\n");
}

// ========================================
// ทดสอบที่ 12: Tree Structure — Query
// ========================================
print("--- ทดสอบที่ 12: Query Tree Structure ---");

print("\n  หา children ของ 'electronics':");
db.categories.find({ parent: "electronics" }, { _id: 1, name: 1 }).forEach(c => {
  print(`    - ${c.name} (${c._id})`);
});

print("\n  หา descendants ของ 'electronics' (ด้วย path):");
db.categories.find(
  { path: { $regex: "^/electronics" } },
  { _id: 1, name: 1, path: 1 }
).forEach(c => {
  print(`    - ${c.name}: ${c.path}`);
});

print("\n  หา ancestors ของ 'laptops' (ด้วย path):");
const laptop = db.categories.findOne({ _id: "laptops" });
const pathParts = laptop.path.split("/").filter(p => p);
print(`    Path: ${laptop.path}`);
print(`    Ancestors: ${pathParts.join(" > ")}`);

// ========================================
// ทดสอบที่ 13: แก้ไข Validation
// ========================================
print("\n--- ทดสอบที่ 13: แก้ไข Validation ของ Collection ---");

// เพิ่ม field ใหม่เข้า users validation
db.runCommand({
  collMod: "users",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "email", "role", "createdAt"],
      properties: {
        username: {
          bsonType: "string",
          minLength: 3,
          maxLength: 30
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        },
        role: {
          bsonType: "string",
          enum: ["admin", "editor", "viewer", "moderator"]  // เพิ่ม moderator!
        },
        age: { bsonType: "int", minimum: 0, maximum: 150 },
        createdAt: { bsonType: "date" }
      }
    }
  }
});
print("  แก้ไข validation สำเร็จ: เพิ่ม role 'moderator'");

// ตอนนี้ moderator ใช้ได้แล้ว
try {
  db.users.insertOne({
    username: "newmod",
    email: "mod@example.com",
    role: "moderator",
    createdAt: new Date()
  });
  print("  Insert moderator สำเร็จ!\n");
} catch (e) {
  print("  Insert moderator ล้มเหลว: " + e.message + "\n");
}

// ========================================
// ดู validation rules ของ collection
// ========================================
print("--- ดู Validation Rules ---");
const info = db.getCollectionInfos({ name: "users" })[0];
print("\nUsers collection validation:");
printjson(info.options.validator);

print("\n===== จบ Exercises =====");
print("ลองแก้ไข exercises.js แล้วรันใหม่ด้วย:");
print("docker compose exec mongo mongosh --file /scripts/exercises.js");
