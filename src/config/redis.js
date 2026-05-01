const Redis = require('ioredis');

let client = null;

const getRedis = () => {
  if (!client) {
    client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    client.on('connect', () => console.log('Redis connected'));
    client.on('error', (err) => {
      // Log but don't crash — cache is best-effort
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[Redis] connection error:', err.message);
      }
    });
  }
  return client;
};

module.exports = { getRedis };
