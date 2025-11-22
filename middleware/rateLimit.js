const jwt = require('jsonwebtoken');
const redis = require('../utils/redis');
const logger = require('../utils/logger');

const rateLimit = ({ windowMs = 60000, max = 100, keyType = "ip" }) => {
  return async (req, res, next) => {
    try {
      // Ignorar rotas especiais
      if (
        req.path.includes("health") ||
        req.path.includes("webhook") ||
        req.path.includes("socket.io")
      ) {
        return next();
      }

      let keyIdentifier = "";

      // ----------- Chave por IP (rotas públicas) ----------
      if (keyType === "ip") {
        keyIdentifier =
          (req.headers["x-forwarded-for"] || req.ip || "")
            .replace("::ffff:", "")
            .split(",")[0]
            .trim();
      }

      // ----------- Chave por usuário (rotas autenticadas) ----------
      if (keyType === "user") {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
          try {
            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (decoded?.id) {
              keyIdentifier = `user:${decoded.id}`;
            } else {
              keyIdentifier = "anonymous";
            }
          } catch {
            keyIdentifier = "invalid-token";
          }
        } else {
          keyIdentifier = "no-token";
        }
      }

      const key = `rate:${keyIdentifier}:${Math.floor(Date.now() / windowMs)}`;

      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }

      if (current > max) {
        return res.status(429).json({
          error: "Muitas requisições",
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      next();
    } catch (err) {
      logger.error("Rate limit erro:", err);
      next();
    }
  };
};

module.exports = rateLimit;
