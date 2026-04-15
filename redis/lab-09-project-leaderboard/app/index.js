const express = require('express');
const Redis = require('ioredis');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

const LEADERBOARD_KEY = 'leaderboard';
const SESSION_TTL = 1800; // 30 minutes

// ============================================
// Leaderboard API (Sorted Sets)
// ============================================

// POST /players/:name/score — เพิ่ม/อัพเดทคะแนน
app.post('/players/:name/score', async (req, res) => {
  try {
    const { name } = req.params;
    const { score } = req.body;

    if (score === undefined || typeof score !== 'number') {
      return res.status(400).json({ error: 'score (number) is required' });
    }

    await redis.zadd(LEADERBOARD_KEY, score, name);

    res.json({
      message: `Score updated for ${name}`,
      player: name,
      score,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /leaderboard — Top 10 ผู้เล่น
app.get('/leaderboard', async (req, res) => {
  try {
    const results = await redis.zrevrange(LEADERBOARD_KEY, 0, 9, 'WITHSCORES');

    // results = ['name1', 'score1', 'name2', 'score2', ...]
    const leaderboard = [];
    for (let i = 0; i < results.length; i += 2) {
      leaderboard.push({
        rank: i / 2 + 1,
        player: results[i],
        score: parseFloat(results[i + 1]),
      });
    }

    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /players/:name/rank — อันดับของผู้เล่น
app.get('/players/:name/rank', async (req, res) => {
  try {
    const { name } = req.params;

    const rank = await redis.zrevrank(LEADERBOARD_KEY, name);

    if (rank === null) {
      return res.status(404).json({ error: `Player "${name}" not found` });
    }

    const score = await redis.zscore(LEADERBOARD_KEY, name);

    res.json({
      player: name,
      rank: rank + 1, // 0-indexed → 1-indexed
      score: parseFloat(score),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// Session API (Hashes + EXPIRE)
// ============================================

// POST /sessions — สร้าง session
app.post('/sessions', async (req, res) => {
  try {
    const { userId, username, role } = req.body;

    if (!userId || !username) {
      return res.status(400).json({ error: 'userId and username are required' });
    }

    const sessionId = crypto.randomUUID();
    const sessionKey = `session:${sessionId}`;

    await redis.hset(sessionKey, {
      userId,
      username,
      role: role || 'user',
      createdAt: new Date().toISOString(),
    });

    await redis.expire(sessionKey, SESSION_TTL);

    res.status(201).json({
      message: 'Session created',
      sessionId,
      expiresIn: `${SESSION_TTL} seconds`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /sessions/:id — ดูข้อมูล session
app.get('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sessionKey = `session:${id}`;

    const session = await redis.hgetall(sessionKey);

    if (!session || Object.keys(session).length === 0) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    const ttl = await redis.ttl(sessionKey);

    res.json({
      sessionId: id,
      data: session,
      ttlRemaining: ttl,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /sessions/:id — ลบ session (logout)
app.delete('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sessionKey = `session:${id}`;

    const deleted = await redis.del(sessionKey);

    if (deleted === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session deleted (logged out)' });
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
  console.log(`Leaderboard & Session API running on port ${PORT}`);
});
