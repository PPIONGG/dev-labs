// init.js — สร้าง Collections พร้อม Schema Validation
// วิธีรัน: docker compose exec mongo mongosh --file /scripts/init.js

db = db.getSiblingDB("validation_lab");

// ลบ collections เก่า
db.users.drop();
db.products.drop();
db.articles.drop();
db.notifications.drop();
db.categories.drop();

print("===== สร้าง Collections พร้อม Schema Validation =====\n");

// ===== 1. Users Collection (Strict Validation) =====
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "email", "role", "createdAt"],
      properties: {
        username: {
          bsonType: "string",
          minLength: 3,
          maxLength: 30,
          description: "ต้องเป็น string ความยาว 3-30 ตัวอักษร"
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "ต้องเป็น email ที่ถูกต้อง"
        },
        role: {
          bsonType: "string",
          enum: ["admin", "editor", "viewer"],
          description: "ต้องเป็น admin, editor, หรือ viewer"
        },
        age: {
          bsonType: "int",
          minimum: 0,
          maximum: 150,
          description: "อายุต้องเป็นจำนวนเต็ม 0-150"
        },
        profile: {
          bsonType: "object",
          properties: {
            displayName: { bsonType: "string" },
            bio: { bsonType: "string", maxLength: 500 },
            avatar: { bsonType: "string" }
          }
        },
        settings: {
          bsonType: "object",
          properties: {
            theme: {
              bsonType: "string",
              enum: ["light", "dark", "auto"]
            },
            notifications: { bsonType: "bool" },
            language: {
              bsonType: "string",
              enum: ["th", "en", "ja"]
            }
          }
        },
        createdAt: {
          bsonType: "date",
          description: "วันที่สร้าง"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});
print("1. Created 'users' collection (strict, error)");

// ===== 2. Products Collection (with nested validation) =====
db.createCollection("products", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "price", "category", "status"],
      properties: {
        name: {
          bsonType: "string",
          minLength: 1,
          maxLength: 200
        },
        description: {
          bsonType: "string",
          maxLength: 2000
        },
        price: {
          bsonType: "double",
          minimum: 0,
          description: "ราคาต้องมากกว่าหรือเท่ากับ 0"
        },
        category: {
          bsonType: "string",
          enum: ["electronics", "clothing", "food", "books", "other"]
        },
        status: {
          bsonType: "string",
          enum: ["active", "inactive", "discontinued"]
        },
        dimensions: {
          bsonType: "object",
          properties: {
            width: { bsonType: "double", minimum: 0 },
            height: { bsonType: "double", minimum: 0 },
            depth: { bsonType: "double", minimum: 0 },
            unit: {
              bsonType: "string",
              enum: ["cm", "inch", "mm"]
            }
          }
        },
        attributes: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["key", "value"],
            properties: {
              key: { bsonType: "string" },
              value: { bsonType: "string" }
            }
          }
        },
        tags: {
          bsonType: "array",
          maxItems: 20,
          items: { bsonType: "string" }
        },
        stock: {
          bsonType: "int",
          minimum: 0
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});
print("2. Created 'products' collection (strict, error)");

// ===== 3. Articles Collection (moderate validation) =====
db.createCollection("articles", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "content", "author", "status"],
      properties: {
        title: {
          bsonType: "string",
          minLength: 1,
          maxLength: 200
        },
        content: {
          bsonType: "string",
          minLength: 1
        },
        author: {
          bsonType: "object",
          required: ["name"],
          properties: {
            name: { bsonType: "string" },
            email: { bsonType: "string" }
          }
        },
        status: {
          bsonType: "string",
          enum: ["draft", "published", "archived"]
        },
        tags: {
          bsonType: "array",
          minItems: 1,
          maxItems: 10,
          items: { bsonType: "string" }
        },
        publishedAt: { bsonType: "date" },
        createdAt: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});
print("3. Created 'articles' collection (moderate, warn)");

// ===== 4. Notifications Collection (Polymorphic Pattern) =====
db.createCollection("notifications", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["type", "createdAt"],
      properties: {
        type: {
          bsonType: "string",
          enum: ["email", "sms", "push"],
          description: "ประเภทการแจ้งเตือน"
        },
        createdAt: { bsonType: "date" }
      }
    }
  }
});
print("4. Created 'notifications' collection (polymorphic pattern)");

// ===== 5. Categories Collection (Tree Structure) =====
db.createCollection("categories");
db.categories.createIndex({ path: 1 });
db.categories.createIndex({ parent: 1 });
print("5. Created 'categories' collection (tree structure)");

// ===== ใส่ข้อมูลตัวอย่าง =====
print("\n===== ใส่ข้อมูลตัวอย่าง =====\n");

// Users
db.users.insertMany([
  {
    username: "somchai",
    email: "somchai@example.com",
    role: "admin",
    age: NumberInt(30),
    profile: {
      displayName: "สมชาย ใจดี",
      bio: "MongoDB enthusiast",
      avatar: "https://example.com/avatar1.jpg"
    },
    settings: {
      theme: "dark",
      notifications: true,
      language: "th"
    },
    createdAt: new Date()
  },
  {
    username: "somsri",
    email: "somsri@example.com",
    role: "editor",
    age: NumberInt(25),
    profile: {
      displayName: "สมศรี รักเรียน"
    },
    settings: {
      theme: "light",
      notifications: true,
      language: "th"
    },
    createdAt: new Date()
  }
]);
print("Inserted 2 users");

// Products (Attribute Pattern)
db.products.insertMany([
  {
    name: "MacBook Pro 16",
    description: "Laptop สำหรับ developer",
    price: 89900.0,
    category: "electronics",
    status: "active",
    dimensions: {
      width: 35.57,
      height: 1.68,
      depth: 24.81,
      unit: "cm"
    },
    attributes: [
      { key: "brand", value: "Apple" },
      { key: "cpu", value: "M3 Pro" },
      { key: "ram", value: "18GB" },
      { key: "storage", value: "512GB SSD" }
    ],
    tags: ["laptop", "apple", "developer"],
    stock: NumberInt(50)
  },
  {
    name: "เสื้อยืด Cotton 100%",
    price: 350.0,
    category: "clothing",
    status: "active",
    attributes: [
      { key: "color", value: "black" },
      { key: "size", value: "L" },
      { key: "material", value: "cotton" }
    ],
    tags: ["clothing", "tshirt"],
    stock: NumberInt(200)
  }
]);
print("Inserted 2 products");

// Categories (Materialized Path Pattern)
db.categories.insertMany([
  { _id: "root", name: "All", path: "/", parent: null },
  { _id: "electronics", name: "Electronics", path: "/electronics", parent: "root" },
  { _id: "computers", name: "Computers", path: "/electronics/computers", parent: "electronics" },
  { _id: "laptops", name: "Laptops", path: "/electronics/computers/laptops", parent: "computers" },
  { _id: "desktops", name: "Desktops", path: "/electronics/computers/desktops", parent: "computers" },
  { _id: "phones", name: "Phones", path: "/electronics/phones", parent: "electronics" },
  { _id: "clothing", name: "Clothing", path: "/clothing", parent: "root" },
  { _id: "mens", name: "Men's", path: "/clothing/mens", parent: "clothing" },
  { _id: "womens", name: "Women's", path: "/clothing/womens", parent: "clothing" }
]);
print("Inserted 9 categories (tree structure)");

print("\n===== Initialization Complete =====");
