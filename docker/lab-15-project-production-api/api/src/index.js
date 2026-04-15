const express = require('express');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware: JSON logging ---
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(JSON.stringify({
      level: 'info',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
      timestamp: new Date().toISOString(),
    }));
  });
  next();
});

app.use(express.json());

// --- Routes ---

app.get('/', (req, res) => {
  res.json({ message: 'Production API', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/info', (req, res) => {
  res.json({
    hostname: os.hostname(),
    platform: os.platform(),
    nodeVersion: process.version,
    env: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
  });
});

// --- Start server ---
const server = app.listen(PORT, () => {
  console.log(JSON.stringify({
    level: 'info',
    message: `Server started on port ${PORT}`,
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  }));
});

// --- Graceful shutdown ---
const shutdown = (signal) => {
  console.log(JSON.stringify({
    level: 'info',
    message: `${signal} received, shutting down gracefully...`,
    timestamp: new Date().toISOString(),
  }));

  server.close(() => {
    console.log(JSON.stringify({
      level: 'info',
      message: 'Server closed',
      timestamp: new Date().toISOString(),
    }));
    process.exit(0);
  });

  // Force close หลัง 10 วินาทีถ้าปิดไม่ได้
  setTimeout(() => {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Forced shutdown after timeout',
      timestamp: new Date().toISOString(),
    }));
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
