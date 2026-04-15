-- Lab 06: Todo App Schema

CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority INTEGER DEFAULT 0 CHECK (priority BETWEEN 0 AND 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ข้อมูลตัวอย่าง
INSERT INTO todos (title, description, status, priority) VALUES
  ('Learn SQL basics', 'Study SELECT, INSERT, UPDATE, DELETE', 'completed', 1),
  ('Learn WHERE clause', 'Practice filtering data', 'completed', 1),
  ('Learn JOIN', 'Understand INNER, LEFT, RIGHT JOIN', 'pending', 2),
  ('Build Todo API', 'Create REST API with PostgreSQL', 'in_progress', 3),
  ('Learn Docker', 'Containerize applications', 'completed', 2),
  ('Setup CI/CD', 'Configure GitHub Actions', 'pending', 1),
  ('Write documentation', 'Document API endpoints', 'pending', 0),
  ('Learn Redis', 'Study caching with Redis', 'pending', 1);
