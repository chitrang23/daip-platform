const { redis } = require('../config/database');

/**
 * Robust fallback rate limiter.
 * If Redis is absent, it bypasses the limit gracefully to keep your app running.
 */
async function rateLimitTier(req, res, next) {
  const tenantId = req.tenantId;
  const limit = 500; 
  const windowSeconds = 3600;
  const key = `ratelimit:${tenantId}`;

  try {
    // Check if redis client status is actually connected
    if (redis.status !== 'ready') {
      return next(); // Quietly fail-open
    }
    
    const currentRequests = await redis.incr(key);
    if (currentRequests === 1) {
      await redis.expire(key, windowSeconds);
    }
    if (currentRequests > limit) {
      return res.status(429).json({ error: 'Rate limit exceeded. Maximum 500 actions per hour window allocations.' });
    }
    next();
  } catch (err) {
    next(); 
  }
}

module.exports = { rateLimitTier };