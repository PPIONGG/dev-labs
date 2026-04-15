// init.js -- สร้างข้อมูลตัวอย่างสำหรับ Lab 08 Aggregation Pipeline

db = db.getSiblingDB("learn_mongo");

db.sales.drop();
db.customers_agg.drop();
db.products_agg.drop();

// ============================================================
// Collection: sales (รายการขาย)
// ============================================================

const categories = ["Electronics", "Clothing", "Food", "Books", "Sports"];
const paymentMethods = ["credit_card", "cash", "promptpay", "bank_transfer"];
const stores = ["สาขา กรุงเทพ", "สาขา เชียงใหม่", "สาขา ภูเก็ต", "สาขา ขอนแก่น", "สาขา ชลบุรี"];

const productsByCategory = {
  Electronics: [
    { name: "iPhone 15", price: 42900 },
    { name: "Samsung Galaxy S24", price: 32900 },
    { name: "MacBook Air", price: 44900 },
    { name: "AirPods Pro", price: 8990 },
    { name: "iPad Air", price: 24900 },
  ],
  Clothing: [
    { name: "เสื้อยืด", price: 390 },
    { name: "กางเกงยีนส์", price: 1290 },
    { name: "รองเท้าผ้าใบ", price: 2490 },
    { name: "เสื้อแจ็คเก็ต", price: 1890 },
    { name: "หมวกแก๊ป", price: 490 },
  ],
  Food: [
    { name: "กาแฟ", price: 120 },
    { name: "ชาเขียว", price: 89 },
    { name: "ขนมปัง", price: 65 },
    { name: "คุกกี้", price: 150 },
    { name: "น้ำผลไม้", price: 95 },
  ],
  Books: [
    { name: "Clean Code", price: 890 },
    { name: "Atomic Habits", price: 550 },
    { name: "Sapiens", price: 650 },
    { name: "Dune", price: 420 },
    { name: "The Alchemist", price: 350 },
  ],
  Sports: [
    { name: "ลูกฟุตบอล", price: 990 },
    { name: "ไม้แบดมินตัน", price: 1590 },
    { name: "ที่ออกกำลังกาย", price: 2990 },
    { name: "รองเท้าวิ่ง", price: 3490 },
    { name: "ลูกบาสเกตบอล", price: 1290 },
  ],
};

const sales = [];

for (let i = 0; i < 500; i++) {
  const category = categories[Math.floor(Math.random() * categories.length)];
  const products = productsByCategory[category];
  const product = products[Math.floor(Math.random() * products.length)];
  const quantity = Math.floor(Math.random() * 5) + 1;
  const store = stores[Math.floor(Math.random() * stores.length)];
  const payment = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

  // Random date in 2024
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  const saleDate = new Date(2024, month, day);

  sales.push({
    product: product.name,
    category: category,
    price: product.price,
    quantity: quantity,
    total: product.price * quantity,
    store: store,
    paymentMethod: payment,
    customerId: `C${String(Math.floor(Math.random() * 50) + 1).padStart(3, "0")}`,
    saleDate: saleDate,
  });
}

db.sales.insertMany(sales);

// ============================================================
// Collection: customers_agg (ลูกค้า -- สำหรับ $lookup)
// ============================================================

const customerNames = [
  "สมชาย ใจดี", "สมหญิง รักเรียน", "สมศักดิ์ มั่นคง", "สมใจ สุขสันต์",
  "มานี มีสุข", "มานะ ขยัน", "ปิติ สุขใจ", "วิภา สวยงาม",
  "ชาลี อดทน", "ดวงใจ ร่าเริง", "ประเสริฐ ยิ่งใหญ่", "กมล สงบ",
  "อรุณ แสงเดือน", "ณัฐ ชาญชัย", "พรทิพย์ ดีมาก", "วิชัย พากเพียร",
  "สุดา สำเร็จ", "ธนา เจริญ", "รัตนา มงคล", "เอกชัย ศรีสุข",
  "ภัทรา แสงทอง", "สิทธิ์ บุญเลิศ", "พิมพ์ วรรณดี", "ไพรัช สมบูรณ์",
  "จันทร์ ผ่องใส", "บุญมี ศรีทอง", "ศิริ วัฒนา", "นภา สกุลดี",
  "ปราโมทย์ ชัยชนะ", "วาสนา โชคดี", "สุรชัย แก้วมณี", "ดาว สว่าง",
  "ภูมิ ใจเย็น", "กิตติ รุ่งเรือง", "ปิยะ สันติ", "อมร ทองคำ",
  "จิรา เจริญสุข", "ธาริน ภูผา", "เมธี คมคาย", "ศรัณย์ สิริมา",
  "พัชรี ดาวเรือง", "นิธิ บุญส่ง", "กนก แสงจันทร์", "รวิน เกียรติ",
  "ประภัสสร ผิวผ่อง", "สถิต มั่นใจ", "ลลิตา ศรีสว่าง", "อนันต์ กล้าหาญ",
  "จุฑา เพ็ญศรี", "วิรัช สายใจ",
];

const customers = [];
for (let i = 0; i < 50; i++) {
  customers.push({
    customerId: `C${String(i + 1).padStart(3, "0")}`,
    name: customerNames[i],
    email: `customer${i + 1}@example.com`,
    memberTier: ["bronze", "silver", "gold", "platinum"][Math.floor(Math.random() * 4)],
    joinDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1),
  });
}

db.customers_agg.insertMany(customers);

// ============================================================
// Collection: products_agg (สินค้า -- สำหรับ $lookup)
// ============================================================

const allProducts = [];
for (const [cat, prods] of Object.entries(productsByCategory)) {
  for (const p of prods) {
    allProducts.push({
      name: p.name,
      category: cat,
      price: p.price,
      supplier: ["SupplierA", "SupplierB", "SupplierC"][Math.floor(Math.random() * 3)],
    });
  }
}

db.products_agg.insertMany(allProducts);

print(`--- Initialized: ${db.sales.countDocuments()} sales, ${db.customers_agg.countDocuments()} customers, ${db.products_agg.countDocuments()} products ---`);
