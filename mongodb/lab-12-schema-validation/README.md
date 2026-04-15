# Lab 12 — Schema Validation & Data Modeling: ควบคุมโครงสร้างข้อมูลและรูปแบบการออกแบบ

## เป้าหมาย

เข้าใจ JSON Schema Validation ใน MongoDB ตั้งค่า `$jsonSchema` สำหรับ validation กำหนด required fields, bsonType, enum ได้ และเข้าใจ advanced data modeling patterns

## ทำไมต้องรู้?

MongoDB เป็น schema-less แต่ **ไม่ได้หมายความว่าไม่ต้องมี schema**:

- **ไม่มี validation** → ใครก็ใส่อะไรก็ได้ → ข้อมูลเละ → app พัง
- **มี validation** → ข้อมูลถูกต้องตามที่กำหนด → app ทำงานได้ถูกต้อง

```
ไม่มี Schema Validation:
┌────────────────────────────────────┐
│ { name: "สมชาย", age: 25 }        │  ← OK
│ { name: 123, age: "ยี่สิบห้า" }    │  ← ก็ได้?!
│ { foo: "bar" }                     │  ← ก็ได้?!
│ { }                                │  ← ก็ได้?!
└────────────────────────────────────┘

มี Schema Validation:
┌────────────────────────────────────┐
│ { name: "สมชาย", age: 25 }        │  ← OK ✓
│ { name: 123, age: "ยี่สิบห้า" }    │  ← ERROR ✗
│ { foo: "bar" }                     │  ← ERROR ✗
│ { }                                │  ← ERROR ✗
└────────────────────────────────────┘
```

## สิ่งที่ต้องมีก่อน

- [Lab 11](../lab-11-change-streams/) — Change Streams
- เข้าใจ MongoDB CRUD

## เนื้อหา

### 1. สร้าง Collection พร้อม Validation

```javascript
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "email", "role"],
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
        }
      }
    }
  }
});
```

### 2. bsonType ที่ใช้บ่อย

| bsonType | ตรงกับ | ตัวอย่าง |
|----------|--------|----------|
| `"string"` | String | `"hello"` |
| `"int"` | 32-bit integer | `NumberInt(42)` |
| `"long"` | 64-bit integer | `NumberLong(42)` |
| `"double"` | Float | `3.14` |
| `"bool"` | Boolean | `true` |
| `"date"` | Date | `new Date()` |
| `"objectId"` | ObjectId | `ObjectId()` |
| `"array"` | Array | `[1, 2, 3]` |
| `"object"` | Object | `{ a: 1 }` |

### 3. validationLevel & validationAction

```javascript
// validationLevel
// "strict" (default) — validate ทุก insert และ update
// "moderate" — validate เฉพาะ document ที่ตรง schema อยู่แล้ว

// validationAction
// "error" (default) — reject document ที่ไม่ผ่าน
// "warn" — ยอมรับแต่ log warning

db.createCollection("logs", {
  validator: { $jsonSchema: { ... } },
  validationLevel: "moderate",
  validationAction: "warn"
});
```

### 4. Nested Object Validation

```javascript
db.createCollection("products", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "price", "dimensions"],
      properties: {
        name: { bsonType: "string" },
        price: { bsonType: "double", minimum: 0 },
        dimensions: {
          bsonType: "object",
          required: ["width", "height"],
          properties: {
            width: { bsonType: "double", minimum: 0 },
            height: { bsonType: "double", minimum: 0 },
            unit: {
              bsonType: "string",
              enum: ["cm", "inch", "mm"]
            }
          }
        }
      }
    }
  }
});
```

### 5. Array Validation

```javascript
db.createCollection("articles", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "tags"],
      properties: {
        title: { bsonType: "string" },
        tags: {
          bsonType: "array",
          minItems: 1,
          maxItems: 10,
          items: {
            bsonType: "string"
          },
          description: "ต้องมี tag อย่างน้อย 1 อันและไม่เกิน 10 อัน"
        }
      }
    }
  }
});
```

### 6. แก้ไข Validation ของ Collection ที่มีอยู่

```javascript
db.runCommand({
  collMod: "users",
  validator: {
    $jsonSchema: {
      // schema ใหม่
    }
  },
  validationLevel: "moderate"
});
```

### 7. Data Modeling Patterns

**Polymorphic Pattern** (document ที่มีโครงสร้างต่างกันใน collection เดียว):

```javascript
// collection: notifications
{ type: "email", to: "user@example.com", subject: "Hello" }
{ type: "sms", phone: "+66891234567", message: "Hi" }
{ type: "push", deviceToken: "abc123", title: "Update" }
```

**Attribute Pattern** (attribute ที่หลากหลาย):

```javascript
// แทนที่จะมี field เยอะมาก
{ color: "red", size: "L", material: "cotton", ... }

// ใช้ array of key-value pairs
{
  name: "T-Shirt",
  attributes: [
    { key: "color", value: "red" },
    { key: "size", value: "L" },
    { key: "material", value: "cotton" }
  ]
}
// ข้อดี: index ได้ด้วย { "attributes.key": 1, "attributes.value": 1 }
```

**Tree Structures:**

```javascript
// Parent Reference (เก็บ parent)
{ _id: "MongoDB", parent: "Databases" }
{ _id: "PostgreSQL", parent: "Databases" }
{ _id: "Databases", parent: "Programming" }

// Child Reference (เก็บ children)
{ _id: "Databases", children: ["MongoDB", "PostgreSQL"] }

// Materialized Path (เก็บ path เต็ม)
{ _id: "MongoDB", path: "/Programming/Databases/MongoDB" }

// Nested Sets (เก็บ left/right สำหรับ tree traversal)
{ _id: "Databases", left: 2, right: 7 }
```

### 8. เริ่มลองทำ

```bash
docker compose up -d

# รัน init.js (สร้าง collections พร้อม validation)
docker compose exec mongo mongosh --file /scripts/init.js

# รัน exercises.js (ทดสอบ validation)
docker compose exec mongo mongosh --file /scripts/exercises.js
```

## แบบฝึกหัด

- [ ] รัน `docker compose up -d` แล้วรัน init.js
- [ ] รัน exercises.js แล้วสังเกตว่า document ไหนผ่าน ไหนไม่ผ่าน
- [ ] ลองเพิ่ม validation rule: email ต้องเป็น pattern ที่ถูกต้อง
- [ ] ลองสร้าง collection ใหม่พร้อม nested validation
- [ ] ลองใช้ `validationAction: "warn"` แล้วดูว่าต่างจาก `"error"` อย่างไร
- [ ] ลองออกแบบ schema สำหรับ e-commerce products ที่ใช้ Attribute Pattern
- [ ] ลองสร้าง tree structure สำหรับ categories

## สรุป

- **$jsonSchema** ช่วยกำหนดโครงสร้างข้อมูลที่ยอมรับ
- กำหนด **required fields**, **bsonType**, **enum**, **min/max**, **pattern** ได้
- **validationLevel**: `strict` (ทุก doc) vs `moderate` (เฉพาะ doc ที่ตรง schema)
- **validationAction**: `error` (reject) vs `warn` (log warning)
- รองรับ **nested objects** และ **arrays** validation
- **Data Modeling Patterns**: Polymorphic, Attribute, Tree Structures ช่วยออกแบบ schema ที่ดี

## ต่อไป

- [Lab 13 — Performance](../lab-13-performance/)
