-- Lab 17: Blog Platform Schema + Sample Data

-- ===========================
-- Tables
-- ===========================

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300) NOT NULL UNIQUE,
  body TEXT NOT NULL,
  excerpt TEXT,
  author_id INTEGER REFERENCES users(id),
  category_id INTEGER REFERENCES categories(id),
  tags JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  view_count INTEGER DEFAULT 0,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- Indexes
-- ===========================

-- GIN index สำหรับ full-text search
CREATE INDEX idx_posts_search ON posts USING GIN (search_vector);

-- GIN index สำหรับ JSONB tags
CREATE INDEX idx_posts_tags ON posts USING GIN (tags);

-- B-tree indexes
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_user ON comments(user_id);

-- ===========================
-- Triggers
-- ===========================

-- Trigger: อัปเดต updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger: อัปเดต search_vector อัตโนมัติ
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector =
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.body, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_posts_search_vector
  BEFORE INSERT OR UPDATE OF title, excerpt, body ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_search_vector();

-- ===========================
-- Views
-- ===========================

-- View: สถิติบทความ
CREATE OR REPLACE VIEW post_stats AS
SELECT
  p.id,
  p.title,
  u.name AS author,
  c.name AS category,
  p.tags,
  p.status,
  p.view_count,
  COUNT(cm.id) AS comment_count,
  p.created_at,
  p.updated_at
FROM posts p
LEFT JOIN users u ON p.author_id = u.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN comments cm ON p.id = cm.post_id
GROUP BY p.id, u.name, c.name;

-- View: สรุป dashboard
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM posts WHERE status = 'published') AS total_published,
  (SELECT COUNT(*) FROM posts WHERE status = 'draft') AS total_drafts,
  (SELECT COUNT(*) FROM comments) AS total_comments,
  (SELECT COUNT(*) FROM users) AS total_users,
  (SELECT COALESCE(SUM(view_count), 0) FROM posts) AS total_views;

-- ===========================
-- Functions
-- ===========================

-- Function: ค้นหาบทความด้วย full-text search
CREATE OR REPLACE FUNCTION search_posts(search_query TEXT)
RETURNS TABLE (
  id INTEGER,
  title VARCHAR,
  excerpt TEXT,
  author VARCHAR,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.excerpt,
    u.name AS author,
    ts_rank(p.search_vector, plainto_tsquery('english', search_query)) AS rank
  FROM posts p
  LEFT JOIN users u ON p.author_id = u.id
  WHERE p.search_vector @@ plainto_tsquery('english', search_query)
    AND p.status = 'published'
  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- Sample Data
-- ===========================

-- Users
INSERT INTO users (name, email, bio) VALUES
  ('สมชาย ใจดี', 'somchai@mail.com', 'Full-stack developer ชอบเขียน blog เกี่ยวกับ database'),
  ('สมหญิง รักเรียน', 'somying@mail.com', 'Backend developer สาย PostgreSQL'),
  ('มานะ ตั้งใจ', 'mana@mail.com', 'DevOps engineer ชอบ Linux'),
  ('มานี มีสุข', 'manee@mail.com', 'Frontend developer ชอบ React'),
  ('วิชัย เก่งมาก', 'wichai@mail.com', 'Tech lead ชอบ system design');

-- Categories
INSERT INTO categories (name, slug, description) VALUES
  ('Database', 'database', 'บทความเกี่ยวกับ database ทุกชนิด'),
  ('Backend', 'backend', 'บทความเกี่ยวกับ backend development'),
  ('DevOps', 'devops', 'บทความเกี่ยวกับ DevOps และ infrastructure'),
  ('Frontend', 'frontend', 'บทความเกี่ยวกับ frontend development'),
  ('Career', 'career', 'บทความเกี่ยวกับสายอาชีพ IT');

-- Posts
INSERT INTO posts (title, slug, body, excerpt, author_id, category_id, tags, status, view_count, created_at) VALUES
  (
    'Getting Started with PostgreSQL',
    'getting-started-with-postgresql',
    'PostgreSQL is one of the most powerful open-source relational database systems. It has more than 35 years of active development. In this article we will cover the basics of PostgreSQL including installation, creating databases, tables, and running queries. PostgreSQL supports advanced features like JSON, full-text search, and custom functions that make it suitable for modern applications.',
    'เริ่มต้นใช้งาน PostgreSQL สำหรับมือใหม่',
    1, 1,
    '["postgresql", "database", "beginner", "tutorial"]',
    'published', 1520,
    '2024-01-10'
  ),
  (
    'Understanding JSONB in PostgreSQL',
    'understanding-jsonb-in-postgresql',
    'JSONB is a powerful data type in PostgreSQL that allows you to store JSON data in a binary format. Unlike the JSON type, JSONB is decomposed into a binary format which makes it faster to process. You can create GIN indexes on JSONB columns for efficient querying. JSONB supports operators like @>, ?, and || for containment checks, key existence, and concatenation.',
    'เข้าใจ JSONB ใน PostgreSQL — SQL + NoSQL ในตัวเดียว',
    1, 1,
    '["postgresql", "jsonb", "nosql", "database"]',
    'published', 980,
    '2024-02-05'
  ),
  (
    'Full-text Search with PostgreSQL',
    'full-text-search-with-postgresql',
    'PostgreSQL provides built-in full-text search capabilities using tsvector and tsquery. You can create tsvector columns and GIN indexes for fast searching. The ts_rank function helps you order results by relevance. With proper configuration you can build powerful search features without external tools like Elasticsearch. Weight categories A B C D help prioritize matches in title versus body content.',
    'สร้างระบบค้นหาด้วย Full-text Search ใน PostgreSQL',
    2, 1,
    '["postgresql", "full-text-search", "search", "database"]',
    'published', 750,
    '2024-02-20'
  ),
  (
    'Building REST APIs with Node.js and Express',
    'building-rest-apis-with-nodejs-and-express',
    'Express is a minimal and flexible Node.js web application framework. It provides a robust set of features for building web and mobile applications. In this guide we will create a REST API with CRUD operations, middleware, error handling, and database integration using PostgreSQL. We will also cover best practices for API design including proper status codes and response formats.',
    'สร้าง REST API ด้วย Node.js Express',
    4, 2,
    '["nodejs", "express", "api", "backend"]',
    'published', 2100,
    '2024-03-01'
  ),
  (
    'Docker for Developers',
    'docker-for-developers',
    'Docker is a platform for developing, shipping, and running applications in containers. Containers are lightweight, standalone, and executable packages that include everything needed to run an application. In this article we cover Docker basics, Dockerfile creation, docker-compose for multi-container applications, volumes for data persistence, and networking between containers.',
    'Docker สำหรับ developer — container เบื้องต้น',
    3, 3,
    '["docker", "devops", "container", "tutorial"]',
    'published', 1800,
    '2024-03-15'
  ),
  (
    'PostgreSQL Performance Tuning Guide',
    'postgresql-performance-tuning-guide',
    'Performance tuning is essential for maintaining fast database queries. This guide covers EXPLAIN ANALYZE for understanding query plans, index strategies including B-tree and GIN indexes, VACUUM and ANALYZE for maintaining database health, connection pooling with PgBouncer, and common performance anti-patterns like N+1 queries and missing indexes.',
    'คู่มือปรับแต่ง performance ของ PostgreSQL',
    2, 1,
    '["postgresql", "performance", "optimization", "database"]',
    'published', 620,
    '2024-04-01'
  ),
  (
    'Introduction to React Hooks',
    'introduction-to-react-hooks',
    'React Hooks let you use state and other React features without writing classes. The most common hooks are useState for managing component state and useEffect for handling side effects. Custom hooks allow you to extract and reuse stateful logic across components. This guide covers all built-in hooks with practical examples.',
    'เริ่มต้นใช้ React Hooks',
    4, 4,
    '["react", "hooks", "frontend", "javascript"]',
    'published', 3200,
    '2024-04-10'
  ),
  (
    'Database Backup Strategies',
    'database-backup-strategies',
    'A solid backup strategy is critical for any production database. This article covers pg_dump and pg_restore for logical backups, WAL archiving for point-in-time recovery, automated backup scripts with cron, backup rotation and retention policies, and testing your restore process regularly.',
    'วางแผน backup database ให้ปลอดภัย',
    3, 1,
    '["postgresql", "backup", "database", "devops"]',
    'published', 430,
    '2024-04-20'
  ),
  (
    'Advanced SQL Techniques',
    'advanced-sql-techniques',
    'Take your SQL skills to the next level with advanced techniques. This article covers window functions for running totals and rankings, Common Table Expressions (CTEs) for readable complex queries, recursive queries for hierarchical data, lateral joins for correlated subqueries, and materialized views for caching expensive computations.',
    'เทคนิค SQL ขั้นสูงที่ developer ควรรู้',
    1, 1,
    '["sql", "database", "advanced", "postgresql"]',
    'draft', 0,
    '2024-05-01'
  ),
  (
    'Career Path for Backend Developers',
    'career-path-for-backend-developers',
    'Becoming a successful backend developer requires mastering several key areas. Start with a programming language like Node.js Python or Go. Learn databases both SQL and NoSQL. Understand APIs REST and GraphQL. Study system design patterns. Practice DevOps skills including Docker and CI/CD. Focus on security best practices and testing strategies.',
    'เส้นทางสายอาชีพ Backend Developer',
    5, 5,
    '["career", "backend", "developer", "guide"]',
    'published', 5400,
    '2024-05-10'
  );

-- Comments
INSERT INTO comments (post_id, user_id, body, created_at) VALUES
  (1, 2, 'บทความดีมากครับ เหมาะสำหรับมือใหม่', '2024-01-12'),
  (1, 3, 'ขอบคุณครับ ช่วยได้มาก', '2024-01-13'),
  (1, 4, 'อยากให้เขียนเรื่อง advanced PostgreSQL ด้วยครับ', '2024-01-15'),
  (2, 3, 'JSONB ทำให้ไม่ต้องใช้ MongoDB เลย', '2024-02-07'),
  (2, 5, 'ใช้ JSONB กับ GIN index เร็วมากครับ', '2024-02-10'),
  (3, 1, 'Full-text search ของ PostgreSQL ดีกว่าที่คิด', '2024-02-22'),
  (3, 4, 'ไม่ต้องพึ่ง Elasticsearch จริง ๆ ด้วย', '2024-02-25'),
  (4, 1, 'Express ยังเป็น framework ที่ดีสำหรับเริ่มต้น', '2024-03-03'),
  (4, 2, 'ลองใช้ Fastify ดูครับ เร็วกว่า', '2024-03-05'),
  (4, 5, 'ชอบส่วน error handling ครับ ละเอียดดี', '2024-03-08'),
  (5, 1, 'Docker ช่วยให้ setup โปรเจกต์ง่ายขึ้นมาก', '2024-03-18'),
  (5, 2, 'ใช้ docker-compose ทุกโปรเจกต์เลยครับ', '2024-03-20'),
  (7, 2, 'React Hooks ทำให้โค้ดสะอาดขึ้นมาก', '2024-04-12'),
  (7, 3, 'useEffect ยังงงอยู่บ้างครับ', '2024-04-15'),
  (10, 1, 'เส้นทางที่ดีครับ ขอบคุณที่แชร์', '2024-05-12'),
  (10, 2, 'อยากให้เพิ่มเรื่อง system design ด้วย', '2024-05-15'),
  (10, 3, 'กำลังเดินตามเส้นทางนี้อยู่ครับ', '2024-05-18');
