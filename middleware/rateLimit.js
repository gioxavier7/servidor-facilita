const redisClient = require('../utils/redis');
const logger = require('../utils/logger');

const rateLimit = (windowMs = 60000, maxRequests = 100) => {
  return async (req, res, next) => {
    // Skip rate limiting for webhooks and health checks
    if (req.path.includes('webhook') || req.path === '/health') {
      return next();
    }

    const clientIP = req.ip || req.connection.remoteAddress;
    const key = `rate_limit:${clientIP}:${Math.floor(Date.now() / windowMs)}`;

    try {
      const current = await redisClient.get(key);
      
      if (current === null) {
        await redisClient.set(key, '1', Math.ceil(windowMs / 1000));
      } else if (parseInt(current) < maxRequests) {
        await redisClient.set(key, (parseInt(current) + 1).toString(), Math.ceil(windowMs / 1000));
      } else {
        logger.warn(`Rate limit exceeded for IP: ${clientIP}, Path: ${req.path}`);
        return res.status(429).json({
          error: 'Muitas requisições',
          message: `Limite de ${maxRequests} requisições por ${windowMs / 1000} segundos excedido`,
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      // Add headers to inform client about rate limit status
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': Math.max(0, maxRequests - (parseInt(current) || 0) - 1),
        'X-RateLimit-Reset': Math.ceil(Date.now() / 1000) + Math.ceil(windowMs / 1000)
      });

      next();
    } catch (error) {
      logger.error('Rate limit error:', error);
      next(); // Em caso de erro no Redis, permite a requisição
    }
  };
};

module.exports = rateLimit;