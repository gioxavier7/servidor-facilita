const Redis = require('ioredis');
const logger = require('./logger');

// Configuração para Azure Redis mais resiliente
const redisConfig = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  tls: {}, // obrigatório para Azure Redis
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  connectTimeout: 10000,
  lazyConnect: true
};

const redis = new Redis(redisConfig);

// Eventos melhorados
redis.on('connect', () => {
  logger.info('✅ Redis conectado com sucesso ao Azure!');
});

redis.on('ready', () => {
  logger.info('🚀 Redis pronto para uso');
});

redis.on('error', (err) => {
  logger.error('❌ Erro crítico no Redis:', {
    message: err.message,
    code: err.code,
    stack: err.stack
  });
});

redis.on('close', () => {
  logger.warn('🔌 Conexão Redis fechada');
});

redis.on('reconnecting', (time) => {
  logger.info(`🔄 Redis reconectando em ${time}ms`);
});

// Teste de conexão assíncrona
const testRedisConnection = async () => {
  try {
    await redis.ping();
    logger.info('🏓 Redis PONG - Conexão testada e funcionando');
  } catch (error) {
    logger.error('💥 Falha no teste de conexão Redis:', error);
  }
};

// Executar teste após 2 segundos
setTimeout(testRedisConnection, 2000);

module.exports = redis;