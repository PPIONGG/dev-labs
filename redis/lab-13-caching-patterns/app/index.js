const express = require('express');
const Redis = require('ioredis');

const app = express();
app.use(express.json());

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

// ============================================
// Fake "Slow Database" (จำลอง database ที่ช้า)
// ============================================
const fakeDatabase = {
  products: {
    101: { id: 101, name: 'iPhone 16', price: 35900, category: 'phone', stock: 50 },
    102: { id: 102, name: 'iPad Air', price: 24900, category: 'tablet', stock: 30 },
    103: { id: 103, name: 'MacBook Pro', price: 59900, category: 'laptop', stock: 20 },
    104: { id: 104, name: 'AirPods Pro', price: 8990, category: 'audio', stock: 100 },
    105: { id: 105, name: 'Apple Watch', price: 15900, category: 'wearable', stock: 40 },
  },

  // จำลอง query ช้า (2 วินาที)
  async getProduct(id) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return this.products[id] || null;
  },

  async getAllProducts() {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return Object.values(this.products);
  },

  async updateProduct(id, updates) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (this.products[id]) {
      this.products[id] = { ...this.products[id], ...updates };
      return this.products[id];
    }
    return null;
  },
};

// ============================================
// Cache Stats
// ============================================
const stats = { hits: 0, misses: 0 };

// ============================================
// Cache-aside Pattern (Lazy Loading)
// ============================================

const CACHE_TTL = 300; // 5 minutes

// GET /products/:id — ดึงข้อมูลสินค้า (cache-aside)
app.get('/products/:id', async (req, res) => {
  const start = Date.now();
  const { id } = req.params;
  const cacheKey = `product:${id}`;

  try {
    // 1. ถาม Cache ก่อน
    const cached = await redis.get(cacheKey);

    if (cached) {
      // Cache HIT
      stats.hits++;
      const elapsed = Date.now() - start;
      return res.json({
        source: 'cache',
        data: JSON.parse(cached),
        responseTime: `${elapsed}ms`,
      });
    }

    // 2. Cache MISS → ถาม "Database"
    stats.misses++;
    const product = await fakeDatabase.getProduct(parseInt(id));

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // 3. เก็บใน Cache พร้อม TTL
    await redis.set(cacheKey, JSON.stringify(product), 'EX', CACHE_TTL);

    const elapsed = Date.now() - start;
    res.json({
      source: 'database',
      data: product,
      responseTime: `${elapsed}ms`,
      cacheTTL: `${CACHE_TTL}s`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /products/:id — อัพเดทสินค้า + invalidate cache
app.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const cacheKey = `product:${id}`;

  try {
    // 1. อัพเดท "Database"
    const updated = await fakeDatabase.updateProduct(parseInt(id), updates);

    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // 2. Invalidate cache (ลบ cache เก่า)
    await redis.del(cacheKey);

    res.json({
      message: 'Product updated and cache invalidated',
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// Cache-aside with Mutex Lock (Stampede Prevention)
// ============================================

// GET /products/:id/safe — cache-aside + mutex lock
app.get('/products/:id/safe', async (req, res) => {
  const start = Date.now();
  const { id } = req.params;
  const cacheKey = `product:${id}`;
  const lockKey = `lock:product:${id}`;

  try {
    // 1. ถาม Cache
    const cached = await redis.get(cacheKey);

    if (cached) {
      stats.hits++;
      const elapsed = Date.now() - start;
      return res.json({
        source: 'cache',
        data: JSON.parse(cached),
        responseTime: `${elapsed}ms`,
      });
    }

    // 2. Cache miss → ลอง acquire lock
    stats.misses++;
    const lockAcquired = await redis.set(lockKey, '1', 'NX', 'EX', 10);

    if (lockAcquired) {
      // ได้ lock → ไปถาม DB
      try {
        const product = await fakeDatabase.getProduct(parseInt(id));

        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }

        await redis.set(cacheKey, JSON.stringify(product), 'EX', CACHE_TTL);

        const elapsed = Date.now() - start;
        return res.json({
          source: 'database (lock acquired)',
          data: product,
          responseTime: `${elapsed}ms`,
        });
      } finally {
        // ปล่อย lock
        await redis.del(lockKey);
      }
    } else {
      // ไม่ได้ lock → รอแล้วอ่าน cache
      await new Promise((resolve) => setTimeout(resolve, 200));

      const retryCache = await redis.get(cacheKey);
      if (retryCache) {
        const elapsed = Date.now() - start;
        return res.json({
          source: 'cache (after wait)',
          data: JSON.parse(retryCache),
          responseTime: `${elapsed}ms`,
        });
      }

      // ยังไม่มี → ไปถาม DB ตรง (fallback)
      const product = await fakeDatabase.getProduct(parseInt(id));
      const elapsed = Date.now() - start;
      return res.json({
        source: 'database (fallback)',
        data: product,
        responseTime: `${elapsed}ms`,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// Cache Management
// ============================================

// GET /cache/stats — ดูสถิติ cache
app.get('/cache/stats', async (req, res) => {
  const total = stats.hits + stats.misses;
  const hitRate = total > 0 ? ((stats.hits / total) * 100).toFixed(1) : 0;

  // นับจำนวน keys ใน Redis
  const dbSize = await redis.dbsize();

  res.json({
    hits: stats.hits,
    misses: stats.misses,
    total,
    hitRate: `${hitRate}%`,
    redisKeys: dbSize,
  });
});

// DELETE /cache/flush — ล้าง cache ทั้งหมด
app.delete('/cache/flush', async (req, res) => {
  await redis.flushdb();
  stats.hits = 0;
  stats.misses = 0;

  res.json({ message: 'Cache flushed and stats reset' });
});

// ============================================
// Health check
// ============================================
app.get('/health', async (req, res) => {
  try {
    await redis.ping();
    res.json({ status: 'ok', redis: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', redis: 'disconnected' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Caching Patterns API running on port ${PORT}`);
  console.log(`Cache TTL: ${CACHE_TTL} seconds`);
});
