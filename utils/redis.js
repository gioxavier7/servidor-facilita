const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  tls: {} // obrigatório para Azure Redis
});

// Eventos úteis (debug/log)
redis.on('connect', () => {
  console.log('🔌 Redis conectado com sucesso!');
});

redis.on('error', (err) => {
  console.error('❌ Erro no Redis:', err);
});

module.exports = redis;
