// init.js — CMS Database Initialization
// สร้าง collections พร้อม schema validation + ข้อมูลเริ่มต้น

db = db.getSiblingDB("cms");

// ===== 1. Users Collection =====
db.createCollection("users", {
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
          enum: ["admin", "editor", "author", "viewer"]
        },
        displayName: { bsonType: "string" },
        avatar: { bsonType: "string" },
        createdAt: { bsonType: "date" }
      }
    }
  }
});

// ===== 2. Articles Collection (with validation) =====
db.createCollection("articles", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "content", "author", "status", "createdAt"],
      properties: {
        title: {
          bsonType: "string",
          minLength: 1,
          maxLength: 300
        },
        slug: {
          bsonType: "string"
        },
        content: {
          bsonType: "string",
          minLength: 1
        },
        author: {
          bsonType: "object",
          required: ["userId", "name"],
          properties: {
            userId: { bsonType: "objectId" },
            name: { bsonType: "string" },
            avatar: { bsonType: "string" }
          }
        },
        category: {
          bsonType: "string"
        },
        tags: {
          bsonType: "array",
          items: { bsonType: "string" },
          maxItems: 15
        },
        status: {
          bsonType: "string",
          enum: ["draft", "published", "archived"]
        },
        metadata: {
          bsonType: "object",
          properties: {
            readTime: { bsonType: "int" },
            wordCount: { bsonType: "int" },
            featuredImage: { bsonType: "string" },
            seoTitle: { bsonType: "string" },
            seoDescription: { bsonType: "string" }
          }
        },
        comments: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["userId", "name", "text", "createdAt"],
            properties: {
              userId: { bsonType: "objectId" },
              name: { bsonType: "string" },
              text: { bsonType: "string" },
              createdAt: { bsonType: "date" }
            }
          }
        },
        version: {
          bsonType: "int",
          minimum: 1
        },
        publishedAt: { bsonType: "date" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

// ===== 3. Categories Collection =====
db.createCollection("categories");

// ===== 4. Notifications Collection =====
db.createCollection("notifications");

// ===== 5. Article Versions Collection =====
db.createCollection("article_versions");

// ===== สร้าง Indexes =====

// Users
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });

// Articles
db.articles.createIndex({ slug: 1 }, { unique: true });
db.articles.createIndex({ status: 1, createdAt: -1 });
db.articles.createIndex({ category: 1 });
db.articles.createIndex({ tags: 1 });
db.articles.createIndex({ "author.userId": 1 });
db.articles.createIndex(
  { title: "text", content: "text", tags: "text" },
  { weights: { title: 10, tags: 5, content: 1 }, name: "articles_text_search" }
);

// Categories
db.categories.createIndex({ slug: 1 }, { unique: true });

// Notifications
db.notifications.createIndex({ userId: 1, read: 1 });
db.notifications.createIndex({ createdAt: -1 });

// Article Versions
db.article_versions.createIndex({ articleId: 1, version: 1 });

// ===== ใส่ข้อมูลเริ่มต้น =====

const users = db.users.insertMany([
  {
    username: "admin",
    email: "admin@cms.com",
    role: "admin",
    displayName: "Admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    createdAt: new Date()
  },
  {
    username: "somchai",
    email: "somchai@cms.com",
    role: "editor",
    displayName: "สมชาย นักเขียน",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=somchai",
    createdAt: new Date()
  },
  {
    username: "somsri",
    email: "somsri@cms.com",
    role: "author",
    displayName: "สมศรี บทความดี",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=somsri",
    createdAt: new Date()
  }
]);

const userIds = Object.values(users.insertedIds);

// Categories
db.categories.insertMany([
  { name: "Technology", slug: "technology", description: "บทความเทคโนโลยี", parent: null, articleCount: 0 },
  { name: "Programming", slug: "programming", description: "บทความเขียนโปรแกรม", parent: "technology", articleCount: 0 },
  { name: "Database", slug: "database", description: "บทความฐานข้อมูล", parent: "technology", articleCount: 0 },
  { name: "DevOps", slug: "devops", description: "บทความ DevOps", parent: "technology", articleCount: 0 },
  { name: "Lifestyle", slug: "lifestyle", description: "บทความไลฟ์สไตล์", parent: null, articleCount: 0 }
]);

// Sample Articles
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, "-").replace(/^-|-$/g, "");
}

const articles = [
  {
    title: "เริ่มต้นเรียน MongoDB ฉบับมือใหม่",
    content: "MongoDB เป็น NoSQL database ที่ได้รับความนิยมมากที่สุด ในบทความนี้เราจะมาเรียนรู้พื้นฐานของ MongoDB กัน ตั้งแต่การติดตั้ง การสร้าง database การ CRUD ข้อมูล ไปจนถึงการใช้ aggregation pipeline MongoDB เก็บข้อมูลในรูปแบบ document ซึ่งคล้ายกับ JSON ทำให้เหมาะกับ application สมัยใหม่ที่ต้องการความยืดหยุ่นในการเก็บข้อมูล",
    authorIdx: 1,
    category: "database",
    tags: ["mongodb", "nosql", "tutorial", "beginner"],
    status: "published"
  },
  {
    title: "Docker Compose สำหรับ Development",
    content: "Docker Compose เป็นเครื่องมือที่ช่วยให้เราจัดการ multi-container applications ได้ง่าย ในบทความนี้จะสอนวิธีเขียน docker-compose.yml สำหรับ development environment ที่มีทั้ง web server database และ cache เราจะใช้ volumes สำหรับ hot reload และ networks สำหรับการสื่อสารระหว่าง containers",
    authorIdx: 2,
    category: "devops",
    tags: ["docker", "compose", "development"],
    status: "published"
  },
  {
    title: "Node.js Performance Tips",
    content: "การปรับปรุง performance ของ Node.js application มีหลายวิธี ตั้งแต่การใช้ caching การ optimize database queries การใช้ clustering สำหรับ multi-core และการ profiling เพื่อหา bottleneck ในบทความนี้เราจะมาดูเทคนิคต่างๆ ที่ช่วยให้ application ของเราเร็วขึ้น",
    authorIdx: 1,
    category: "programming",
    tags: ["nodejs", "performance", "optimization"],
    status: "draft"
  },
  {
    title: "Aggregation Pipeline ใน MongoDB",
    content: "Aggregation Pipeline เป็น feature ที่ทรงพลังมากใน MongoDB ช่วยให้เราประมวลผลข้อมูลได้ซับซ้อน ตั้งแต่ group, sort, lookup ไปจนถึง graph lookup ในบทความนี้เราจะมาดูตัวอย่างการใช้งาน aggregation pipeline ในสถานการณ์จริง เช่น รายงานยอดขาย สถิติผู้ใช้ และ analytics dashboard",
    authorIdx: 2,
    category: "database",
    tags: ["mongodb", "aggregation", "data-processing"],
    status: "published"
  }
];

articles.forEach(a => {
  const author = db.users.findOne({ _id: userIds[a.authorIdx] });
  const wordCount = a.content.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);

  db.articles.insertOne({
    title: a.title,
    slug: slugify(a.title),
    content: a.content,
    author: {
      userId: author._id,
      name: author.displayName,
      avatar: author.avatar
    },
    category: a.category,
    tags: a.tags,
    status: a.status,
    metadata: {
      readTime: NumberInt(readTime),
      wordCount: NumberInt(wordCount),
      featuredImage: null,
      seoTitle: a.title,
      seoDescription: a.content.substring(0, 160)
    },
    comments: [],
    version: NumberInt(1),
    publishedAt: a.status === "published" ? new Date() : null,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // อัปเดต articleCount ใน categories
  if (a.status === "published") {
    db.categories.updateOne({ slug: a.category }, { $inc: { articleCount: 1 } });
  }
});

print("=== CMS Database Initialized ===");
print("Users: " + db.users.countDocuments());
print("Articles: " + db.articles.countDocuments());
print("Categories: " + db.categories.countDocuments());
print("Indexes created successfully");
