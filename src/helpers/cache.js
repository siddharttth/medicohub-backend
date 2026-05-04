const { getRedis, ensureRedisConnected } = require('../config/redis');

// Returns cached value or calls fn(), caches result for ttlSeconds, returns it
const cached = async (key, ttlSeconds, fn) => {
  const redis = getRedis();
  try {
    await ensureRedisConnected(redis);
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit);
  } catch {
    // Redis unavailable — fall through to DB
  }

  const value = await fn();

  try {
    await ensureRedisConnected(redis);
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Best-effort
  }

  return value;
};

const invalidate = async (...keys) => {
  const redis = getRedis();
  try {
    await ensureRedisConnected(redis);
    if (keys.length) await redis.del(...keys);
  } catch {
    // Best-effort
  }
};

const CACHE_TTL = {
  TRENDING: 6 * 60 * 60,   // 6 hours
  USER_STATS: 60 * 60,      // 1 hour
  EXAM_PACK: 24 * 60 * 60,  // 24 hours (matches MongoDB TTL)
};

module.exports = { cached, invalidate, CACHE_TTL };
