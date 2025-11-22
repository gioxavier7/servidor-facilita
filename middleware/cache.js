const redisClient = require('../utils/redis');
const logger = require('../utils/logger');

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {

    // Detecta se a requisição está autenticada
    const hasAuth = req.headers.authorization && req.headers.authorization.startsWith('Bearer');

    // Só cacheia GET públicos (sem token)
    if (req.method !== 'GET' || hasAuth || req.query.nocache) {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cachedData = await redisClient.get(key);
      
      if (cachedData) {
        logger.debug(`Cache HIT for: ${req.originalUrl}`);
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cachedData));
      }

      // Sobrescreve o res.json para gravar no cache
      const originalJson = res.json;
      res.json = function(data) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient
            .set(key, JSON.stringify(data), 'EX', duration)
            .then(() => logger.debug(`Cached: ${req.originalUrl} (${duration}s)`))
            .catch(err => logger.error('Cache set error:', err));
        }
        
        res.set('X-Cache', 'MISS');
        originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

module.exports = cacheMiddleware;
