const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'social_media';

let db;

// ===== Connect to MongoDB =====
async function connectDB() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  db = client.db(DB_NAME);
  console.log(`Connected to MongoDB: ${DB_NAME}`);
}

// ===== GET /users/:id — User Profile =====
app.get('/users/:id', async (req, res) => {
  try {
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.params.id) }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== GET /feed — Posts Feed (with pagination) =====
app.get('/feed', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await db.collection('posts')
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('posts').countDocuments();

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== POST /posts — Create Post =====
app.post('/posts', async (req, res) => {
  try {
    const { authorId, content, tags } = req.body;

    if (!authorId || !content) {
      return res.status(400).json({ error: 'authorId and content are required' });
    }

    // ดึงชื่อ author
    const author = await db.collection('users').findOne(
      { _id: new ObjectId(authorId) }
    );

    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    const newPost = {
      authorId: new ObjectId(authorId),
      authorName: author.username,
      content,
      tags: tags || [],
      likes: 0,
      comments: [],
      createdAt: new Date()
    };

    const result = await db.collection('posts').insertOne(newPost);
    newPost._id = result.insertedId;

    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== POST /posts/:id/comments — Add Comment =====
app.post('/posts/:id/comments', async (req, res) => {
  try {
    const { userId, username, text } = req.body;

    if (!userId || !username || !text) {
      return res.status(400).json({
        error: 'userId, username, and text are required'
      });
    }

    const comment = {
      userId: new ObjectId(userId),
      username,
      text,
      createdAt: new Date()
    };

    const result = await db.collection('posts').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $push: { comments: comment } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.status(201).json({ message: 'Comment added', comment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== POST /posts/:id/like — Increment Likes =====
app.post('/posts/:id/like', async (req, res) => {
  try {
    const result = await db.collection('posts').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $inc: { likes: 1 } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ message: 'Liked!', likes: result.likes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== GET /posts/search?q=... — Text Search =====
app.get('/posts/search', async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const posts = await db.collection('posts')
      .find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .toArray();

    res.json({ query, count: posts.length, posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== GET /stats/popular — Most Liked Posts =====
app.get('/stats/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const popular = await db.collection('posts').aggregate([
      { $sort: { likes: -1 } },
      { $limit: limit },
      {
        $project: {
          content: 1,
          authorName: 1,
          likes: 1,
          commentCount: { $size: '$comments' },
          tags: 1,
          createdAt: 1
        }
      }
    ]).toArray();

    res.json(popular);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Start Server =====
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Social Media API running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});
