// init.js — ข้อมูลเริ่มต้นสำหรับ Social Media Database

db = db.getSiblingDB('social_media');

// ===== สร้าง Users =====
const users = db.users.insertMany([
  {
    username: "somchai",
    email: "somchai@example.com",
    displayName: "สมชาย ใจดี",
    bio: "Full-stack developer ที่ชอบเรียนรู้สิ่งใหม่",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=somchai",
    settings: {
      theme: "dark",
      notifications: true,
      language: "th"
    },
    createdAt: new Date("2024-01-15")
  },
  {
    username: "somsri",
    email: "somsri@example.com",
    displayName: "สมศรี รักเรียน",
    bio: "Data Engineer สาย MongoDB",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=somsri",
    settings: {
      theme: "light",
      notifications: true,
      language: "th"
    },
    createdAt: new Date("2024-02-01")
  },
  {
    username: "somying",
    email: "somying@example.com",
    displayName: "สมหญิง เก่งมาก",
    bio: "DevOps Engineer ชอบ Docker",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=somying",
    settings: {
      theme: "dark",
      notifications: false,
      language: "en"
    },
    createdAt: new Date("2024-02-10")
  },
  {
    username: "prasit",
    email: "prasit@example.com",
    displayName: "ประสิทธิ์ โค้ดเก่ง",
    bio: "Backend developer สาย Node.js",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=prasit",
    settings: {
      theme: "light",
      notifications: true,
      language: "th"
    },
    createdAt: new Date("2024-03-01")
  }
]);

const userIds = Object.values(users.insertedIds);

// ===== สร้าง Posts =====
db.posts.insertMany([
  {
    authorId: userIds[0],
    authorName: "somchai",
    content: "วันนี้เริ่มเรียน MongoDB แล้ว สนุกมาก! Document database ใช้ง่ายกว่าที่คิด",
    tags: ["mongodb", "learning", "database"],
    likes: 15,
    comments: [
      {
        userId: userIds[1],
        username: "somsri",
        text: "สู้ๆ นะ! MongoDB สนุกมาก",
        createdAt: new Date("2024-03-01T10:30:00Z")
      },
      {
        userId: userIds[2],
        username: "somying",
        text: "ลองใช้กับ Docker ด้วยนะ",
        createdAt: new Date("2024-03-01T11:00:00Z")
      }
    ],
    createdAt: new Date("2024-03-01T10:00:00Z")
  },
  {
    authorId: userIds[1],
    authorName: "somsri",
    content: "เพิ่งทำ Aggregation Pipeline เสร็จ ใช้ $group กับ $lookup ได้แล้ว!",
    tags: ["mongodb", "aggregation", "dev"],
    likes: 25,
    comments: [
      {
        userId: userIds[0],
        username: "somchai",
        text: "เจ๋งมาก! สอนหน่อยได้ไหม",
        createdAt: new Date("2024-03-05T14:00:00Z")
      }
    ],
    createdAt: new Date("2024-03-05T13:00:00Z")
  },
  {
    authorId: userIds[2],
    authorName: "somying",
    content: "Docker Compose + MongoDB replica set ทำง่ายมาก ใช้แค่ไม่กี่บรรทัด",
    tags: ["docker", "mongodb", "devops"],
    likes: 42,
    comments: [
      {
        userId: userIds[3],
        username: "prasit",
        text: "แชร์ docker-compose.yml ได้ไหม?",
        createdAt: new Date("2024-03-10T09:30:00Z")
      },
      {
        userId: userIds[1],
        username: "somsri",
        text: "ใช้ในโปรเจคจริงแล้ว ดีมาก!",
        createdAt: new Date("2024-03-10T10:00:00Z")
      },
      {
        userId: userIds[0],
        username: "somchai",
        text: "ขอบคุณมาก!",
        createdAt: new Date("2024-03-10T10:30:00Z")
      }
    ],
    createdAt: new Date("2024-03-10T09:00:00Z")
  },
  {
    authorId: userIds[3],
    authorName: "prasit",
    content: "Express.js + MongoDB เป็นคู่ที่ลงตัว ทำ REST API ได้เร็วมาก",
    tags: ["nodejs", "express", "mongodb", "api"],
    likes: 18,
    comments: [],
    createdAt: new Date("2024-03-12T16:00:00Z")
  },
  {
    authorId: userIds[0],
    authorName: "somchai",
    content: "Text Search ใน MongoDB ใช้ง่ายกว่า Elasticsearch สำหรับโปรเจคเล็กๆ",
    tags: ["mongodb", "search", "tips"],
    likes: 30,
    comments: [
      {
        userId: userIds[1],
        username: "somsri",
        text: "เห็นด้วย! แต่ถ้าต้องการ full-text search จริงจัง ยังแนะนำ Elasticsearch",
        createdAt: new Date("2024-03-15T11:00:00Z")
      }
    ],
    createdAt: new Date("2024-03-15T10:00:00Z")
  },
  {
    authorId: userIds[1],
    authorName: "somsri",
    content: "สรุปสิ่งที่เรียนวันนี้: Index ใน MongoDB ช่วยให้ query เร็วขึ้น 100 เท่า!",
    tags: ["mongodb", "performance", "index"],
    likes: 35,
    comments: [
      {
        userId: userIds[2],
        username: "somying",
        text: "อย่าลืม compound index ด้วยนะ",
        createdAt: new Date("2024-03-18T15:00:00Z")
      }
    ],
    createdAt: new Date("2024-03-18T14:00:00Z")
  }
]);

// ===== สร้าง Indexes =====
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.posts.createIndex({ authorId: 1 });
db.posts.createIndex({ createdAt: -1 });
db.posts.createIndex({ tags: 1 });
db.posts.createIndex({ likes: -1 });
db.posts.createIndex(
  { content: "text", tags: "text" },
  { weights: { content: 10, tags: 5 }, name: "posts_text_search" }
);

print("=== Social Media Database initialized ===");
print("Users: " + db.users.countDocuments());
print("Posts: " + db.posts.countDocuments());
print("Indexes created successfully");
