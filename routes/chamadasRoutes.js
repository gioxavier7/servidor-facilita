// routes/chamadaRoutes.js
const express = require('express');
const router = express.Router();
const logger = require('../logger');
const { gerarToken, livekitUrl } = require('../utils/livekit');

router.post('/token', (req, res) => {
  try {
    const { userId, roomName } = req.body;
    if (!userId || !roomName) {
      logger.warn('Parâmetros inválidos para gerar token LiveKit', { body: req.body });
      return res.status(400).json({ error: 'userId e roomName são obrigatórios' });
    }

    const token = gerarToken(String(userId), String(roomName));
    logger.info(`Token LiveKit gerado para userId=${userId} room=${roomName}`);

    return res.json({
      token,
      serverUrl: livekitUrl
    });
  } catch (error) {
    logger.error('Erro ao gerar token LiveKit', { error: error.message, stack: error.stack });
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
