# Lab 10 — Transactions: ความปลอดภัยของข้อมูลด้วย Multi-Document Transactions

## เป้าหมาย

เข้าใจ Transactions ใน MongoDB ทำไมต้องใช้ replica set ใช้ `startTransaction()`, `commitTransaction()`, `abortTransaction()` ได้

## ทำไมต้องรู้?

ในระบบจริง บางครั้งเราต้อง **แก้ไขหลาย document พร้อมกัน** และต้องการให้ **สำเร็จทั้งหมดหรือไม่สำเร็จเลย**:

- **โอนเงิน:** หักจากบัญชี A + เพิ่มในบัญชี B → ต้องสำเร็จทั้งคู่
- **สั่งซื้อสินค้า:** สร้าง order + ลด stock → ถ้าลด stock ไม่ได้ ต้อง rollback order
- **สมัครสมาชิก:** สร้าง user + สร้าง profile + ส่ง notification → ทั้งหมดหรือไม่มีเลย

ถ้าไม่มี transaction → **ข้อมูลอาจไม่สอดคล้องกัน** (inconsistent)

## สิ่งที่ต้องมีก่อน

- [Lab 09](../lab-09-project-social-media/) — ใช้ MongoDB กับ Node.js ได้
- เข้าใจ CRUD operations

## เนื้อหา

### 1. ทำไม MongoDB ต้องใช้ Replica Set สำหรับ Transactions?

MongoDB ออกแบบ transactions ให้ทำงานบน **replica set** เท่านั้น:

```
Replica Set:
┌─────────────┐
│   Primary   │  ← รับ write ทั้งหมด
└──────┬──────┘
       │ replicate
  ┌────┴────┐
  ▼         ▼
┌─────┐  ┌─────┐
│ Sec │  │ Sec │  ← สำเนาข้อมูล
└─────┘  └─────┘
```

**เหตุผล:**
- Transaction ต้องการ **oplog** (operation log) เพื่อ track การเปลี่ยนแปลง
- Oplog มีเฉพาะใน replica set
- แม้จะใช้ node เดียว ก็ต้อง config เป็น replica set

**ใน lab นี้** เราใช้ single-node replica set (1 node แต่ config เป็น replica set):

```yaml
services:
  mongo:
    image: mongo:7
    command: mongod --replSet rs0
```

### 2. Transaction พื้นฐาน

```
Without Transaction (อันตราย!):
┌──────────────────────────────────┐
│ 1. หักเงิน A -1000   ✓ สำเร็จ   │
│ 2. เพิ่มเงิน B +1000  ✗ ERROR!  │  ← เงินหายไป 1000!
└──────────────────────────────────┘

With Transaction (ปลอดภัย):
┌──────────────────────────────────┐
│ START TRANSACTION                │
│ 1. หักเงิน A -1000              │
│ 2. เพิ่มเงิน B +1000  ✗ ERROR!  │
│ ABORT → Rollback ทุกอย่าง        │  ← เงิน A กลับมาเหมือนเดิม
└──────────────────────────────────┘
```

### 3. โครงสร้างโค้ด Transaction

```javascript
const session = client.startSession();

try {
  session.startTransaction();

  // ทำหลาย operations
  await db.collection('wallets').updateOne(
    { userId: fromUser },
    { $inc: { balance: -amount } },
    { session }  // ← ต้องส่ง session ทุกครั้ง
  );

  await db.collection('wallets').updateOne(
    { userId: toUser },
    { $inc: { balance: amount } },
    { session }  // ← ต้องส่ง session ทุกครั้ง
  );

  // สำเร็จทั้งหมด → commit
  await session.commitTransaction();
  console.log("Transaction committed!");

} catch (error) {
  // มี error → abort (rollback)
  await session.abortTransaction();
  console.log("Transaction aborted:", error.message);

} finally {
  // ปิด session เสมอ
  session.endSession();
}
```

**สิ่งสำคัญ:** ทุก operation ใน transaction ต้องส่ง `{ session }` เป็น option

### 4. เริ่มต้นใช้งาน

```bash
docker compose up -d

# รอ replica set พร้อม (ประมาณ 10 วินาที)
docker compose logs -f mongo
# รอจนเห็น "replica set initialized"

# รัน exercises
docker compose exec mongo mongosh --file /scripts/exercises.js
```

### 5. ตัวอย่าง: โอนเงินระหว่าง Wallets

```javascript
// สร้างข้อมูล wallets
db.wallets.insertMany([
  { userId: "alice", balance: 5000 },
  { userId: "bob", balance: 3000 }
]);

// ฟังก์ชันโอนเงิน (ต้องใช้ใน mongosh หรือ Node.js driver)
async function transferMoney(client, from, to, amount) {
  const session = client.startSession();

  try {
    session.startTransaction();
    const db = client.db("transaction_lab");

    // ตรวจสอบยอดเงินก่อน
    const sender = await db.collection("wallets").findOne(
      { userId: from },
      { session }
    );

    if (!sender || sender.balance < amount) {
      throw new Error("Insufficient balance");
    }

    // หักเงินจากผู้โอน
    await db.collection("wallets").updateOne(
      { userId: from },
      { $inc: { balance: -amount } },
      { session }
    );

    // เพิ่มเงินให้ผู้รับ
    await db.collection("wallets").updateOne(
      { userId: to },
      { $inc: { balance: amount } },
      { session }
    );

    // บันทึก transaction log
    await db.collection("transactions").insertOne({
      from,
      to,
      amount,
      status: "completed",
      createdAt: new Date()
    }, { session });

    await session.commitTransaction();
    console.log(`Transferred ${amount} from ${from} to ${to}`);

  } catch (error) {
    await session.abortTransaction();
    console.error("Transfer failed:", error.message);

  } finally {
    session.endSession();
  }
}
```

### 6. Error Handling กับ Transactions

```javascript
// Pattern: Retry Transaction
async function runTransactionWithRetry(session, txnFunc) {
  while (true) {
    try {
      await txnFunc(session);
      break;  // สำเร็จ → ออกจาก loop

    } catch (error) {
      // ถ้าเป็น transient error → ลองใหม่
      if (error.hasErrorLabel &&
          error.hasErrorLabel("TransientTransactionError")) {
        console.log("Transient error, retrying...");
        continue;
      }
      // error อื่น → throw ออกไป
      throw error;
    }
  }
}

// Pattern: Retry Commit
async function commitWithRetry(session) {
  while (true) {
    try {
      await session.commitTransaction();
      console.log("Transaction committed.");
      break;

    } catch (error) {
      if (error.hasErrorLabel &&
          error.hasErrorLabel("UnknownTransactionCommitResult")) {
        console.log("Retrying commit...");
        continue;
      }
      throw error;
    }
  }
}
```

### 7. Transaction Options

```javascript
session.startTransaction({
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" },
  readPreference: "primary"
});
```

| Option | ค่า | คำอธิบาย |
|--------|-----|----------|
| `readConcern` | `"snapshot"` | อ่านข้อมูล ณ จุดเริ่มต้น transaction |
| `writeConcern` | `"majority"` | ยืนยัน write กับ majority ของ replica set |
| `readPreference` | `"primary"` | อ่านจาก primary เท่านั้น |

### 8. สิ่งที่ควรรู้เกี่ยวกับ Transactions

```
ข้อจำกัดของ Transactions:
┌──────────────────────────────────────────┐
│ 1. ต้องใช้ replica set                     │
│ 2. Transaction มี time limit (60 วินาที)   │
│ 3. Transaction lock documents             │
│ 4. อย่าใช้ transaction ถ้าไม่จำเป็น        │
│ 5. ออกแบบ schema ให้ดี ลดความจำเป็น        │
│    ในการใช้ transaction                    │
└──────────────────────────────────────────┘
```

**Best Practices:**
- ใช้ transaction เมื่อจำเป็นจริงๆ เท่านั้น
- ทำให้ transaction สั้นที่สุด
- ถ้าข้อมูลอยู่ใน document เดียว ใช้ atomic update (`$inc`, `$push`) แทน
- ออกแบบ schema ที่ดี ลดความจำเป็นในการ update หลาย documents

## แบบฝึกหัด

- [ ] รัน `docker compose up -d` และรอให้ replica set พร้อม
- [ ] รัน exercises.js แล้วสังเกตผลลัพธ์
- [ ] ลองแก้ exercises.js ให้โอนเงินมากกว่ายอดในบัญชี (ต้อง abort)
- [ ] ลองเพิ่ม transaction log ที่บันทึกทุกการโอนเงิน
- [ ] ลองสร้าง transaction สำหรับ "สั่งซื้อสินค้า" (สร้าง order + ลด stock)
- [ ] ลองทดสอบว่าถ้า abort แล้ว ข้อมูลจะกลับเป็นเหมือนเดิมจริงไหม

## สรุป

- **Transaction** ทำให้หลาย operations เป็น atomic (สำเร็จทั้งหมดหรือไม่มีเลย)
- MongoDB ต้องใช้ **replica set** สำหรับ transactions
- ใช้ `session.startTransaction()` → ทำ operations → `commitTransaction()` หรือ `abortTransaction()`
- ทุก operation ใน transaction ต้องส่ง `{ session }`
- ออกแบบ schema ให้ดีเพื่อลดความจำเป็นในการใช้ transaction

## ต่อไป

- [Lab 11 — Change Streams](../lab-11-change-streams/)
