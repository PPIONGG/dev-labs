const express = require('express');
const Redis = require('ioredis');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Main Redis connection (สำหรับ commands ทั่วไป)
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

// Separate connection สำหรับ XREAD BLOCK (blocking command ต้องใช้ connection แยก)
const blockingRedis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

// Pub/Sub publisher connection
const publisher = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

const RATE_LIMIT_MAX = 20; // max messages per window
const RATE_LIMIT_WINDOW = 60; // seconds

// ============================================
// Room API (Hashes)
// ============================================

// POST /rooms — สร้างห้องแชท
app.post('/rooms', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const roomId = crypto.randomUUID();
    const roomKey = `room:${roomId}`;

    await redis.hset(roomKey, {
      name,
      description: description || '',
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      message: 'Room created',
      roomId,
      name,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /rooms — แสดงรายการห้อง (ใช้ SCAN แทน KEYS)
app.get('/rooms', async (req, res) => {
  try {
    const rooms = [];
    let cursor = '0';

    // SCAN หา keys ที่ขึ้นต้นด้วย "room:"
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'room:*', 'COUNT', 100);
      cursor = nextCursor;

      for (const key of keys) {
        const room = await redis.hgetall(key);
        const roomId = key.replace('room:', '');

        // นับจำนวนข้อความ
        const messageCount = await redis.xlen(`messages:${roomId}`).catch(() => 0);

        rooms.push({
          roomId,
          ...room,
          messageCount,
        });
      }
    } while (cursor !== '0');

    res.json({ rooms, count: rooms.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// Message API (Streams + Pub/Sub + Rate Limiting)
// ============================================

// POST /rooms/:id/messages — ส่งข้อความ
app.post('/rooms/:id/messages', async (req, res) => {
  try {
    const { id: roomId } = req.params;
    const { user, text } = req.body;

    if (!user || !text) {
      return res.status(400).json({ error: 'user and text are required' });
    }

    // ตรวจสอบว่าห้องมีอยู่
    const roomExists = await redis.exists(`room:${roomId}`);
    if (!roomExists) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // --- Rate Limiting ---
    const rateKey = `rate:${roomId}:${user}`;
    const currentCount = await redis.incr(rateKey);

    // ถ้าเป็นครั้งแรก ตั้ง TTL
    if (currentCount === 1) {
      await redis.expire(rateKey, RATE_LIMIT_WINDOW);
    }

    // ตรวจสอบ rate limit
    if (currentCount > RATE_LIMIT_MAX) {
      const ttl = await redis.ttl(rateKey);
      return res.status(429).json({
        error: 'Rate limit exceeded',
        limit: `${RATE_LIMIT_MAX} messages per ${RATE_LIMIT_WINDOW} seconds`,
        retryAfter: `${ttl} seconds`,
      });
    }

    // --- เพิ่มข้อความลง Stream ---
    const timestamp = Date.now().toString();
    const messageId = await redis.xadd(
      `messages:${roomId}`,
      '*',
      'user', user,
      'text', text,
      'timestamp', timestamp
    );

    // --- Pub/Sub notification ---
    await publisher.publish(
      `chat:${roomId}`,
      JSON.stringify({ messageId, user, text, timestamp })
    );

    res.status(201).json({
      message: 'Message sent',
      messageId,
      user,
      text,
      remaining: RATE_LIMIT_MAX - currentCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /rooms/:id/messages — ดูข้อความ
app.get('/rooms/:id/messages', async (req, res) => {
  try {
    const { id: roomId } = req.params;
    const count = parseInt(req.query.count) || 50;

    // ตรวจสอบว่าห้องมีอยู่
    const roomExists = await redis.exists(`room:${roomId}`);
    if (!roomExists) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // XREVRANGE เอาข้อความล่าสุดก่อน แล้ว reverse กลับ
    const entries = await redis.xrevrange(`messages:${roomId}`, '+', '-', 'COUNT', count);

    const messages = entries.reverse().map(([id, fields]) => {
      const data = {};
      for (let i = 0; i < fields.length; i += 2) {
        data[fields[i]] = fields[i + 1];
      }
      return { id, ...data };
    });

    const totalMessages = await redis.xlen(`messages:${roomId}`);

    res.json({
      roomId,
      messages,
      returned: messages.length,
      total: totalMessages,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /rooms/:id/messages/latest — poll ข้อความใหม่ (blocking)
app.get('/rooms/:id/messages/latest', async (req, res) => {
  try {
    const { id: roomId } = req.params;
    const timeout = Math.min(parseInt(req.query.timeout) || 5, 30) * 1000; // max 30s
    const lastId = req.query.lastId || '$';

    // ตรวจสอบว่าห้องมีอยู่
    const roomExists = await redis.exists(`room:${roomId}`);
    if (!roomExists) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // XREAD BLOCK — รอจนกว่าจะมีข้อความใหม่
    const result = await blockingRedis.xread(
      'BLOCK', timeout,
      'COUNT', 10,
      'STREAMS', `messages:${roomId}`, lastId
    );

    if (!result) {
      return res.json({
        roomId,
        messages: [],
        info: 'No new messages (timeout)',
      });
    }

    const [, entries] = result[0];
    const messages = entries.map(([id, fields]) => {
      const data = {};
      for (let i = 0; i < fields.length; i += 2) {
        data[fields[i]] = fields[i + 1];
      }
      return { id, ...data };
    });

    res.json({
      roomId,
      messages,
      lastId: messages.length > 0 ? messages[messages.length - 1].id : lastId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
  console.log(`Chat Backend API running on port ${PORT}`);
  console.log(`Rate limit: ${RATE_LIMIT_MAX} messages per ${RATE_LIMIT_WINDOW}s`);
});
