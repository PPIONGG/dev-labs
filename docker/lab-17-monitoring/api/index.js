const express = require('express');

const app = express();
const PORT = 3000;

// Structured JSON logging
const log = (level, message, extra = {}) => {
  console.log(JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...extra,
  }));
};

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    log('info', 'request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
    });
  });
  next();
});

app.get('/', (req, res) => {
  res.json({ message: 'Monitoring Lab API' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Endpoint ที่จงใจช้า (สำหรับทดสอบ monitoring)
app.get('/slow', (req, res) => {
  const delay = Math.random() * 3000;
  setTimeout(() => {
    res.json({ message: 'slow response', delay: `${Math.round(delay)}ms` });
  }, delay);
});

// Endpoint ที่จงใจ error (สำหรับทดสอบ logging)
app.get('/error', (req, res) => {
  log('error', 'Intentional error for testing');
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  log('info', `Server started on port ${PORT}`);
});
