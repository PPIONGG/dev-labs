const Redis = require('ioredis');

// Subscriber ต้องใช้ connection แยก (dedicated connection)
// เพราะเมื่อ subscribe แล้ว connection จะถูกล็อค
// ไม่สามารถใช้คำสั่งอื่น (SET, GET, etc.) ได้
const subscriber = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

console.log('=== Redis Subscriber ===\n');

// -----------------------------------------------
// 1. SUBSCRIBE — ลงทะเบียนรับจาก channels เฉพาะ
// -----------------------------------------------
subscriber.subscribe('news', 'sports', 'notifications', (err, count) => {
  if (err) {
    console.error('Failed to subscribe:', err.message);
    return;
  }
  console.log(`Subscribed to ${count} channel(s)`);
});

// -----------------------------------------------
// 2. PSUBSCRIBE — subscribe ด้วย pattern
// -----------------------------------------------
subscriber.psubscribe('chat:room:*', (err, count) => {
  if (err) {
    console.error('Failed to psubscribe:', err.message);
    return;
  }
  console.log(`Pattern-subscribed, total subscriptions: ${count}`);
});

// -----------------------------------------------
// 3. รับข้อความจาก SUBSCRIBE
// -----------------------------------------------
subscriber.on('message', (channel, message) => {
  const timestamp = new Date().toLocaleTimeString();

  console.log(`\n[${timestamp}] Channel: "${channel}"`);

  // พยายาม parse JSON
  try {
    const parsed = JSON.parse(message);
    console.log('  Data:', parsed);
  } catch {
    console.log(`  Message: ${message}`);
  }
});

// -----------------------------------------------
// 4. รับข้อความจาก PSUBSCRIBE
// -----------------------------------------------
subscriber.on('pmessage', (pattern, channel, message) => {
  const timestamp = new Date().toLocaleTimeString();

  console.log(`\n[${timestamp}] Pattern: "${pattern}" → Channel: "${channel}"`);

  try {
    const parsed = JSON.parse(message);
    console.log(`  [${parsed.user}]: ${parsed.text}`);
  } catch {
    console.log(`  Message: ${message}`);
  }
});

// -----------------------------------------------
// 5. Events อื่นๆ
// -----------------------------------------------
subscriber.on('subscribe', (channel, count) => {
  console.log(`  → Subscribed to "${channel}" (total: ${count})`);
});

subscriber.on('psubscribe', (pattern, count) => {
  console.log(`  → Pattern-subscribed to "${pattern}" (total: ${count})`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nUnsubscribing and disconnecting...');
  subscriber.unsubscribe();
  subscriber.punsubscribe();
  subscriber.disconnect();
  process.exit(0);
});

console.log('\nWaiting for messages... (press Ctrl+C to quit)\n');
