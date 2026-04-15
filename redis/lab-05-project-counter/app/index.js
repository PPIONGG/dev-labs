const express = require('express');
const Redis = require('ioredis');

const app = express();
app.use(express.json());

const PORT = 3000;

// เชื่อมต่อ Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});

// GET /health -- ตรวจสอบสถานะ
app.get('/health', async (req, res) => {
  try {
    await redis.ping();
    res.json({ status: 'ok', redis: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', redis: 'disconnected' });
  }
});

// GET /hit -- นับ page view (+1)
app.get('/hit', async (req, res) => {
  try {
    const hits = await redis.incr('page:hits');
    res.json({ hits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats -- ดูจำนวน hits ทั้งหมด
app.get('/stats', async (req, res) => {
  try {
    const hits = await redis.get('page:hits');
    res.json({ total_hits: parseInt(hits) || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/data -- rate limited endpoint (10 requests/minute/IP)
app.post('/api/data', async (req, res) => {
  try {
    const ip = req.ip;
    const key = `rate:${ip}`;
    const limit = 10;    // max 10 requests
    const window = 60;   // per 60 seconds

    // เพิ่ม counter
    const current = await redis.incr(key);

    // ครั้งแรก → ตั้ง expiration
    if (current === 1) {
      await redis.expire(key, window);
    }

    // เกิน limit → ปฏิเสธ
    if (current > limit) {
      const ttl = await redis.ttl(key);
      return res.status(429).json({
        error: 'Too many requests',
        retry_after: ttl,
      });
    }

    // ผ่าน rate limit
    res.json({
      data: 'success',
      requests_remaining: limit - current,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Hit Counter API running on port ${PORT}`);
});
