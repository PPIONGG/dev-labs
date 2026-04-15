// init.js -- สร้างข้อมูล 10,000+ documents สำหรับ Lab 07 Indexing

db = db.getSiblingDB("learn_mongo");

db.customers.drop();

print("--- Generating 10,000 customers... ---");

const firstNames = [
  "สมชาย", "สมหญิง", "สมศักดิ์", "สมใจ", "มานี", "มานะ", "ปิติ", "วิภา",
  "ชาลี", "ดวงใจ", "ประเสริฐ", "กมล", "อรุณ", "ณัฐ", "พรทิพย์",
  "วิชัย", "สุดา", "ประยุทธ์", "กานดา", "ธนา", "รัตนา", "เอกชัย",
  "ภัทรา", "สิทธิ์", "พิมพ์", "ไพรัช", "จันทร์", "บุญมี", "ศิริ", "นภา",
];

const lastNames = [
  "ใจดี", "รักเรียน", "มั่นคง", "สุขสันต์", "มีสุข", "ขยัน", "สุขใจ",
  "สวยงาม", "อดทน", "ร่าเริง", "ยิ่งใหญ่", "สงบ", "แสงเดือน", "ชาญชัย",
  "ดีมาก", "พากเพียร", "สำเร็จ", "เจริญ", "มงคล", "ศรีสุข",
];

const cities = [
  "กรุงเทพ", "เชียงใหม่", "ภูเก็ต", "ขอนแก่น", "นครราชสีมา",
  "สงขลา", "ชลบุรี", "นนทบุรี", "ปทุมธานี", "สมุทรปราการ",
  "เชียงราย", "อุดรธานี", "นครสวรรค์", "สุราษฎร์ธานี", "ระยอง",
];

const plans = ["free", "basic", "premium", "enterprise"];

const tags = [
  "active", "inactive", "vip", "new", "returning",
  "mobile-user", "desktop-user", "newsletter", "referral",
];

const customers = [];

for (let i = 0; i < 10000; i++) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const plan = plans[Math.floor(Math.random() * plans.length)];
  const age = Math.floor(Math.random() * 50) + 18;
  const score = Math.floor(Math.random() * 100);
  const totalSpent = Math.floor(Math.random() * 100000);

  // random subset of tags
  const numTags = Math.floor(Math.random() * 4) + 1;
  const customerTags = [];
  for (let t = 0; t < numTags; t++) {
    const tag = tags[Math.floor(Math.random() * tags.length)];
    if (!customerTags.includes(tag)) customerTags.push(tag);
  }

  const joinYear = 2018 + Math.floor(Math.random() * 7);
  const joinMonth = Math.floor(Math.random() * 12);
  const joinDay = Math.floor(Math.random() * 28) + 1;

  customers.push({
    name: `${firstName} ${lastName}`,
    email: `user${i}@example.com`,
    age: age,
    city: city,
    plan: plan,
    score: score,
    totalSpent: totalSpent,
    tags: customerTags,
    isActive: Math.random() > 0.2,
    joinDate: new Date(joinYear, joinMonth, joinDay),
    lastLogin: new Date(2024, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
  });
}

// Insert in batches
const batchSize = 2000;
for (let i = 0; i < customers.length; i += batchSize) {
  db.customers.insertMany(customers.slice(i, i + batchSize));
}

print(`--- Initialized: ${db.customers.countDocuments()} customers inserted ---`);
