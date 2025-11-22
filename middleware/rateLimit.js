const redis = require('../utils/redis');
const logger = require('../utils/logger');

const rateLimit = (windowMs = 60000, maxRequests = 100) => {
  return async (req, res, next) => {

    // Ignorar webhooks e healthcheck
    if (req.path.includes('health') || req.path.includes('webhook')) {
      return next();
    }

    const clientIP = (req.headers['x-forwarded-for'] || req.ip || '')
      .replace('::ffff:', '')
      .split(',')[0]
      .trim();

    const key = `rate_limit:${clientIP}:${Math.floor(Date.now() / windowMs)}`;

    try {
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }

      if (current > maxRequests) {
        logger.warn(`Rate limit exceeded for ${clientIP}`);

        return res.status(429).json({
          error: 'Muitas requisições',
          message: `Limite de ${maxRequests} requisições por ${windowMs / 1000}s excedido`,
          retryAfter: Math.ceil(windowMs / 1000),
        });
      }

      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': Math.max(0, maxRequests - current),
        'X-RateLimit-Reset': Math.ceil(Date.now() / 1000) + Math.ceil(windowMs / 1000)
      });

      next();
    } catch (error) {
      logger.error('Rate limit error:', error);
      next();
    }
  };
};

module.exports = rateLimit;
