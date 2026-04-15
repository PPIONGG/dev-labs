const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

// ข้อความตัวอย่างที่จะส่ง
const messages = [
  { channel: 'news', message: 'Breaking: Redis 7.4 released with new features!' },
  { channel: 'news', message: 'Update: Docker Compose v3 is now default' },
  { channel: 'sports', message: 'Goal! Thailand wins 2-1' },
  { channel: 'sports', message: 'Tennis: Nadal retires from tournament' },
  { channel: 'notifications', message: JSON.stringify({ type: 'order', orderId: 1001, status: 'completed' }) },
  { channel: 'notifications', message: JSON.stringify({ type: 'payment', amount: 1500, currency: 'THB' }) },
  { channel: 'chat:room:general', message: JSON.stringify({ user: 'alice', text: 'Hello everyone!' }) },
  { channel: 'chat:room:general', message: JSON.stringify({ user: 'bob', text: 'Hi Alice!' }) },
  { channel: 'chat:room:random', message: JSON.stringify({ user: 'charlie', text: 'Anyone here?' }) },
];

async function publishMessages() {
  console.log('=== Redis Publisher ===\n');

  for (const { channel, message } of messages) {
    // PUBLISH ส่งข้อความไปที่ channel
    // return จำนวน subscribers ที่ได้รับข้อความ
    const receivers = await redis.publish(channel, message);

    console.log(`[PUBLISH] Channel: "${channel}"`);
    console.log(`  Message: ${message}`);
    console.log(`  Receivers: ${receivers}\n`);

    // รอ 1 วินาทีระหว่างข้อความ
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('All messages published!');
  redis.disconnect();
}

publishMessages().catch(console.error);
