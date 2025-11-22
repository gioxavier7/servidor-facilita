const express = require('express');
const router = express.Router();
const redisClient = require('../utils/redis');

router.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    redis: 'CHECKING'
  };

  try {
    await redisClient.ping();
    health.redis = 'OK';
  } catch (error) {
    health.redis = 'ERROR';
    health.redisError = error.message;
    health.status = 'DEGRADED';
  }

  res.status(health.status === 'OK' ? 200 : 503).json(health);
});

module.exports = router;