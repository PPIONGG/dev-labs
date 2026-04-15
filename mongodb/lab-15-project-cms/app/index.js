const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/?replicaSet=rs0';
const DB_NAME = process.env.DB_NAME || 'cms';

let db;
let client;

// ===== Helper: สร้าง slug จาก title =====
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0E00-\u0E7F]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now().toString(36);
}

// ===== Connect to MongoDB =====
async function connectDB() {
  client = new MongoClient(MONGO_URL);
  await client.connect();
  db = client.db(DB_NAME);
  console.log(`Connected to MongoDB: ${DB_NAME}`);

  // เริ่ม Change Stream
  startChangeStream();
}

// ===== Change Stream — Real-time Logging =====
function startChangeStream() {
  try {
    const pipeline = [
      { $match: { operationType: { $in: ['insert', 'update', 'delete'] } } }
    ];

    const changeStream = db.collection('articles').watch(pipeline, {
      fullDocument: 'updateLookup'
    });

    changeStream.on('change', (change) => {
      const time = new Date().toISOString();
      switch (change.operationType) {
        case 'insert':
          console.log(`[${time}] ARTICLE CREATED: "${change.fullDocument.title}"`);
          break;
        case 'update':
          if (change.fullDocument) {
            console.log(`[${time}] ARTICLE UPDATED: "${change.fullDocument.title}" (v${change.fullDocument.version})`);
          }
          break;
        case 'delete':
          console.log(`[${time}] ARTICLE DELETED: ${change.documentKey._id}`);
          break;
      }
    });

    changeStream.on('error', (err) => {
      console.error('Change stream error:', err.message);
    });

    console.log('Change stream started for articles collection');
  } catch (err) {
    console.error('Failed to start change stream:', err.message);
  }
}

// ============================================================
// ARTICLES ENDPOINTS
// ============================================================

// ===== GET /articles — List articles =====
app.get('/articles', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || 'published';

    const filter = status === 'all' ? {} : { status };

    const articles = await db.collection('articles')
      .find(filter)
      .project({ content: 0, comments: 0 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('articles').countDocuments(filter);

    res.json({
      articles,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== GET /articles/search?q=... — Text Search =====
app.get('/articles/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const articles = await db.collection('articles')
      .find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .project({ content: 0 })
      .toArray();

    res.json({ query, count: articles.length, articles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== GET /articles/:id — Single article =====
app.get('/articles/:id', async (req, res) => {
  try {
    const article = await db.collection('articles').findOne(
      { _id: new ObjectId(req.params.id) }
    );

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== POST /articles — Create article =====
app.post('/articles', async (req, res) => {
  try {
    const { title, content, authorId, category, tags } = req.body;

    if (!title || !content || !authorId) {
      return res.status(400).json({ error: 'title, content, and authorId are required' });
    }

    const author = await db.collection('users').findOne(
      { _id: new ObjectId(authorId) }
    );

    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    const wordCount = content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);

    const newArticle = {
      title,
      slug: slugify(title),
      content,
      author: {
        userId: author._id,
        name: author.displayName,
        avatar: author.avatar || null
      },
      category: category || 'uncategorized',
      tags: tags || [],
      status: 'draft',
      metadata: {
        readTime: readTime,
        wordCount: wordCount,
        featuredImage: null,
        seoTitle: title,
        seoDescription: content.substring(0, 160)
      },
      comments: [],
      version: 1,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('articles').insertOne(newArticle);
    newArticle._id = result.insertedId;

    res.status(201).json(newArticle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== PUT /articles/:id — Update article (with versioning) =====
app.put('/articles/:id', async (req, res) => {
  try {
    const articleId = new ObjectId(req.params.id);
    const { title, content, category, tags, metadata } = req.body;

    const currentArticle = await db.collection('articles').findOne({ _id: articleId });
    if (!currentArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // เก็บ version เดิมใน article_versions
    await db.collection('article_versions').insertOne({
      articleId: currentArticle._id,
      version: currentArticle.version,
      title: currentArticle.title,
      content: currentArticle.content,
      category: currentArticle.category,
      tags: currentArticle.tags,
      metadata: currentArticle.metadata,
      savedAt: new Date()
    });

    // สร้าง update object
    const updateFields = { updatedAt: new Date() };
    updateFields.version = currentArticle.version + 1;

    if (title) {
      updateFields.title = title;
      updateFields.slug = slugify(title);
    }
    if (content) {
      updateFields.content = content;
      const wordCount = content.split(/\s+/).length;
      updateFields['metadata.wordCount'] = wordCount;
      updateFields['metadata.readTime'] = Math.ceil(wordCount / 200);
    }
    if (category) updateFields.category = category;
    if (tags) updateFields.tags = tags;
    if (metadata) {
      for (const [key, value] of Object.entries(metadata)) {
        updateFields[`metadata.${key}`] = value;
      }
    }

    const result = await db.collection('articles').findOneAndUpdate(
      { _id: articleId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    res.json({ message: 'Article updated', article: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== DELETE /articles/:id — Delete article =====
app.delete('/articles/:id', async (req, res) => {
  try {
    const articleId = new ObjectId(req.params.id);

    const article = await db.collection('articles').findOne({ _id: articleId });
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // ลด articleCount ถ้าเป็น published
    if (article.status === 'published' && article.category) {
      await db.collection('categories').updateOne(
        { slug: article.category },
        { $inc: { articleCount: -1 } }
      );
    }

    await db.collection('articles').deleteOne({ _id: articleId });

    // ลบ versions ด้วย
    await db.collection('article_versions').deleteMany({ articleId });

    res.json({ message: 'Article deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== POST /articles/:id/publish — Publish (Transaction) =====
app.post('/articles/:id/publish', async (req, res) => {
  const session = client.startSession();

  try {
    const articleId = new ObjectId(req.params.id);

    session.startTransaction();

    // 1. อัปเดต article status
    const article = await db.collection('articles').findOneAndUpdate(
      { _id: articleId, status: { $ne: 'published' } },
      {
        $set: {
          status: 'published',
          publishedAt: new Date(),
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after', session }
    );

    if (!article) {
      throw new Error('Article not found or already published');
    }

    // 2. สร้าง notification
    await db.collection('notifications').insertOne({
      type: 'article_published',
      message: `บทความ "${article.title}" ถูกเผยแพร่แล้ว`,
      articleId: article._id,
      userId: article.author.userId,
      read: false,
      createdAt: new Date()
    }, { session });

    // 3. อัปเดต category articleCount
    if (article.category) {
      await db.collection('categories').updateOne(
        { slug: article.category },
        { $inc: { articleCount: 1 } },
        { session }
      );
    }

    await session.commitTransaction();
    res.json({ message: 'Article published', article });

  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ error: err.message });

  } finally {
    session.endSession();
  }
});

// ===== POST /articles/:id/unpublish — Unpublish (Transaction) =====
app.post('/articles/:id/unpublish', async (req, res) => {
  const session = client.startSession();

  try {
    const articleId = new ObjectId(req.params.id);

    session.startTransaction();

    // 1. อัปเดต article status กลับเป็น draft
    const article = await db.collection('articles').findOneAndUpdate(
      { _id: articleId, status: 'published' },
      {
        $set: {
          status: 'draft',
          publishedAt: null,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after', session }
    );

    if (!article) {
      throw new Error('Article not found or not published');
    }

    // 2. สร้าง notification
    await db.collection('notifications').insertOne({
      type: 'article_unpublished',
      message: `บทความ "${article.title}" ถูกยกเลิกการเผยแพร่`,
      articleId: article._id,
      userId: article.author.userId,
      read: false,
      createdAt: new Date()
    }, { session });

    // 3. ลด category articleCount
    if (article.category) {
      await db.collection('categories').updateOne(
        { slug: article.category },
        { $inc: { articleCount: -1 } },
        { session }
      );
    }

    await session.commitTransaction();
    res.json({ message: 'Article unpublished', article });

  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ error: err.message });

  } finally {
    session.endSession();
  }
});

// ===== POST /articles/:id/comments — Add comment =====
app.post('/articles/:id/comments', async (req, res) => {
  try {
    const { userId, name, text } = req.body;

    if (!userId || !name || !text) {
      return res.status(400).json({ error: 'userId, name, and text are required' });
    }

    const comment = {
      userId: new ObjectId(userId),
      name,
      text,
      createdAt: new Date()
    };

    const result = await db.collection('articles').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $push: { comments: comment } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.status(201).json({ message: 'Comment added', comment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// STATS ENDPOINT (Aggregation Pipeline)
// ============================================================

app.get('/stats', async (req, res) => {
  try {
    // จำนวนบทความตาม status
    const byStatus = await db.collection('articles').aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    // จำนวนบทความตาม category
    const byCategory = await db.collection('articles').aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    // Popular tags
    const popularTags = await db.collection('articles').aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    // บทความล่าสุด
    const latestArticles = await db.collection('articles').aggregate([
      { $match: { status: 'published' } },
      { $sort: { publishedAt: -1 } },
      { $limit: 5 },
      {
        $project: {
          title: 1,
          'author.name': 1,
          category: 1,
          publishedAt: 1,
          commentCount: { $size: '$comments' }
        }
      }
    ]).toArray();

    // บทความที่มี comment มากที่สุด
    const mostCommented = await db.collection('articles').aggregate([
      { $match: { status: 'published' } },
      {
        $project: {
          title: 1,
          'author.name': 1,
          commentCount: { $size: '$comments' }
        }
      },
      { $sort: { commentCount: -1 } },
      { $limit: 5 }
    ]).toArray();

    // รวม stats
    const totalArticles = await db.collection('articles').countDocuments();
    const totalUsers = await db.collection('users').countDocuments();
    const totalCategories = await db.collection('categories').countDocuments();

    res.json({
      overview: {
        totalArticles,
        totalUsers,
        totalCategories
      },
      byStatus,
      byCategory,
      popularTags,
      latestArticles,
      mostCommented
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// CATEGORIES ENDPOINTS
// ============================================================

app.get('/categories', async (req, res) => {
  try {
    const categories = await db.collection('categories')
      .find()
      .sort({ name: 1 })
      .toArray();

    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/categories', async (req, res) => {
  try {
    const { name, slug, description, parent } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'name and slug are required' });
    }

    const newCategory = {
      name,
      slug,
      description: description || '',
      parent: parent || null,
      articleCount: 0
    };

    const result = await db.collection('categories').insertOne(newCategory);
    newCategory._id = result.insertedId;

    res.status(201).json(newCategory);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Category slug already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// USERS ENDPOINTS (read-only for this lab)
// ============================================================

app.get('/users', async (req, res) => {
  try {
    const users = await db.collection('users').find().toArray();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// START SERVER
// ============================================================

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`CMS API running on port ${PORT}`);
    console.log(`Endpoints:`);
    console.log(`  GET    /articles`);
    console.log(`  GET    /articles/:id`);
    console.log(`  POST   /articles`);
    console.log(`  PUT    /articles/:id`);
    console.log(`  DELETE /articles/:id`);
    console.log(`  GET    /articles/search?q=...`);
    console.log(`  POST   /articles/:id/publish`);
    console.log(`  POST   /articles/:id/unpublish`);
    console.log(`  POST   /articles/:id/comments`);
    console.log(`  GET    /stats`);
    console.log(`  GET    /categories`);
    console.log(`  POST   /categories`);
    console.log(`  GET    /users`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});
