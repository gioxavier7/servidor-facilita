/**
 * Objetivo: API responsável pelas requisições do TCC Facilita
 * Data: 13/09/2025
 * Dev: giovanna
 * Versões: 1.5 (SEM RATE LIMIT PARA TESTES JMETER)
 */

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.development' });
}

// ========== CONFIGURAÇÃO DO SERVIDOR ==========
const app = express();
const PORT = process.env.PORT || 3000;

// ========== WEBSOCKET ==========
const socketService = require('./service/socketService');
const server = http.createServer(app);
socketService.init(server);

// ========== MIDDLEWARES GLOBAIS ==========
app.use(bodyParser.json());

// CORS
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ========== IMPORTAÇÃO DAS ROTAS ==========
const usuarioRoutes = require('./routes/usuarioRoutes');
const contratanteRoutes = require('./routes/contratanteRoutes');
const prestadorRoutes = require('./routes/prestadorRoutes');
const localizacaoRoutes = require('./routes/localizacaoRoutes');
const servicoRoutes = require('./routes/servicoRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const pagamentoRoutes = require('./routes/pagamentoRoutes');
const carteiraRoutes = require('./routes/carteiraRoutes');
const transacaoCarteiraRoutes = require('./routes/transacaoCarteiraRoutes');
const pagbankWebhookRoutes = require('./routes/pagbankWebhookRoutes');
const avaliacaoRoutes = require('./routes/avaliacaoRoutes');
const notificacaoRoutes = require('./routes/notificacaoRoutes');
const rastreamentoRoutes = require('./routes/rastreamentoRoutes');
const chatRoutes = require('./routes/chatRoutes');
const recargaRoutes = require('./routes/recargasRoutes');
const healthRoutes = require('./routes/healthRoutes');
const chamadaRoutes = require('./routes/chamadasRoutes');

const cacheMiddleware = require('./middleware/cache');

// ========== ROTAS SEM RATE LIMIT ==========

app.use('/v1/facilita/health', healthRoutes);
app.use('/v1/facilita/pagamento/webhook', pagbankWebhookRoutes);

// ========== ROTAS PÚBLICAS ==========
app.use('/v1/facilita/usuario', usuarioRoutes);
app.use('/v1/facilita/contratante', contratanteRoutes);

// ========== ROTAS COM CACHE ==========
app.use('/v1/facilita/categoria', cacheMiddleware(3600), categoriaRoutes);

// ========== ROTAS AUTENTICADAS ==========
app.use('/v1/facilita/prestador', prestadorRoutes);
app.use('/v1/facilita/localizacao', localizacaoRoutes);
app.use('/v1/facilita/servico', servicoRoutes);
app.use('/v1/facilita/pagamento', pagamentoRoutes);
app.use('/v1/facilita/carteira', carteiraRoutes);
app.use('/v1/facilita/transacao', transacaoCarteiraRoutes);
app.use('/v1/facilita/avaliacao', avaliacaoRoutes);
app.use('/v1/facilita/notificacao', notificacaoRoutes);
app.use('/v1/facilita/rastreamento', rastreamentoRoutes);
app.use('/v1/facilita/chat', chatRoutes);
app.use('/v1/facilita/recarga', recargaRoutes);
app.use('/v1/facilita/chamada', chamadaRoutes);


// ========== FALLBACK 404 ==========
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.originalUrl} não existe nesta API`,
    timestamp: new Date().toISOString(),
  });
});

// ========== ERROS ==========
app.use((error, req, res, next) => {
  console.error('Erro global:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'production' ? 'Algo deu errado' : error.message,
    timestamp: new Date().toISOString()
  });
});

// ========== START ==========
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}...`);
  console.log(`🔌 WebSocket ativo na porta ${PORT}`);
  console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
