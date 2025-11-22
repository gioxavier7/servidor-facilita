const redisClient = require('../utils/redis');
const logger = require('../utils/logger');

let redisAvailable = false;

// Verificar status do Redis uma vez no startup
const initializeRedis = async () => {
  try {
    await redisClient.ping();
    redisAvailable = true;
    logger.info('✅ Cache Redis disponível para uso');
  } catch (error) {
    redisAvailable = false;
    logger.warn('⚠️ Cache Redis indisponível - funcionando sem cache');
  }
};

// Inicializar na importação
initializeRedis();

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Se Redis não está disponível, pula o cache completamente
    if (!redisAvailable) {
      return next();
    }

    const hasAuth = req.headers.authorization && req.headers.authorization.startsWith('Bearer');

    // Não cachear requisições autenticadas ou não-GET
    if (req.method !== 'GET' || hasAuth || req.query.nocache) {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cachedData = await redisClient.get(key);
      
      if (cachedData) {
        logger.debug(`✅ Cache HIT: ${req.originalUrl}`);
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cachedData));
      }

      // Sobrescreve res.json para cachear a resposta
      const originalJson = res.json;
      res.json = function(data) {
        // Só cachea respostas bem-sucedidas
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.setex(key, duration, JSON.stringify(data))
            .then(() => logger.debug(`💾 Cache MISS (cached): ${req.originalUrl} (${duration}s)`))
            .catch(err => logger.error('❌ Erro ao salvar cache:', err));
        }
        
        res.set('X-Cache', 'MISS');
        originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('❌ Erro no middleware de cache:', error.message);
      // Em caso de erro, continua sem cache
      next();
    }
  };
};

module.exports = cacheMiddleware;