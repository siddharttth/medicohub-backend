const Redis = require('ioredis');

let client = null;

const getRedis = () => {
  if (!client) {
    client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
      enableOfflineQueue: true,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
    });

    client.on('connect', () => console.log('Redis connected'));
    client.on('ready', () => console.log('Redis ready'));
    client.on('error', (err) => {
      // Log but don't crash — cache is best-effort
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[Redis] connection error:', err.message);
      }
    });
    client.on('close', () => console.log('Redis connection closed'));
  }
  return client;
};

// Helper function to ensure Redis is connected before use
const ensureRedisConnected = async (redis) => {
  if (redis.status === 'ready') return;
  
  // For lazy connections, we need to connect explicitly
  if (redis.status === 'wait') {
    await redis.connect();
    return;
  }
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Redis connection timeout')), 10000);
    
    const onReady = () => {
      clearTimeout(timeout);
      redis.removeListener('ready', onReady);
      redis.removeListener('error', onError);
      resolve();
    };
    
    const onError = (err) => {
      clearTimeout(timeout);
      redis.removeListener('ready', onReady);
      redis.removeListener('error', onError);
      reject(err);
    };
    
    if (redis.status === 'ready') {
      clearTimeout(timeout);
      resolve();
    } else {
      redis.once('ready', onReady);
      redis.once('error', onError);
    }
  });
};

module.exports = { getRedis, ensureRedisConnected };
