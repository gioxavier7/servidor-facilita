// middleware/rateLimit.js - VERSÃO CORRIGIDA
const redisClient = require('../utils/redis');
const logger = require('../utils/logger');

const rateLimit = (windowMs = 60000, maxRequests = 100) => {
  return async (req, res, next) => {
    // Skip rate limiting para health e webhooks
    if (req.path.includes('health') || req.path.includes('webhook')) {
      return next();
    }

    const clientIP = req.ip || req.connection.remoteAddress;
    const key = `rate_limit:${clientIP}:${Math.floor(Date.now() / windowMs)}`;

    try {
      const current = await redisClient.incr(key);
      
      // Se é a primeira requisição neste intervalo, setar expire
      if (current === 1) {
        await redisClient.expire(key, Math.ceil(windowMs / 1000));
      }
      
      if (current > maxRequests) {
        logger.warn(`Rate limit exceeded for IP: ${clientIP}, Path: ${req.path}`);
        return res.status(429).json({
          error: 'Muitas requisições',
          message: `Limite de ${maxRequests} requisições por ${windowMs / 1000} segundos excedido`,
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      // Add headers para informar sobre rate limit
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': Math.max(0, maxRequests - current),
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