/**
 * Objetivo: API responsável pelas requisições do TCC Facilita
 * Data: 13/09/2025
 * Dev: giovanna
 * Versões: 1.5
 */

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');

// carregar variáveis de ambiente dependendo do ambiente
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.development' });
}

// ========== CONFIGURAÇÃO DO SERVIDOR ==========
const app = express();
const PORT = process.env.PORT || 3000;

// ========== WEBSOCKET (Tempo Real) ==========
const socketService = require('./utils/socketService');
const server = http.createServer(app);

// Inicializar WebSocket
socketService.init(server);

// ========== MIDDLEWARES GLOBAIS ==========
app.use(bodyParser.json());

// CORS dinâmico
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

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

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

// ===== Middlewares =====
const cacheMiddleware = require('./middleware/cache');
const rateLimit = require('./middleware/rateLimit');

// ---------- RATE LIMIT DEDICADO ----------
const publicRateLimit = rateLimit({
  windowMs: 60000,
  max: 50,
  keyType: "ip"
});

const userRateLimit = rateLimit({
  windowMs: 60000,
  max: 200,
  keyType: "user"
});

// ========== ROTAS SEM RATE LIMIT ==========

// Health — SEM rate limit
app.use('/v1/facilita/health', healthRoutes);

// Webhook PagBank — SEM rate limit
app.use('/v1/facilita/pagamento/webhook', pagbankWebhookRoutes);

// ========== ROTAS PÚBLICAS COM RATE LIMIT (IP) ==========

app.use('/v1/facilita/usuario', publicRateLimit, usuarioRoutes);
app.use('/v1/facilita/contratante', publicRateLimit, contratanteRoutes);

// ========== ROTAS COM CACHE ==========
app.use('/v1/facilita/categoria', cacheMiddleware(3600), categoriaRoutes);

// ========== ROTAS AUTENTICADAS COM RATE LIMIT (USER) ==========

app.use('/v1/facilita/prestador', userRateLimit, prestadorRoutes);
app.use('/v1/facilita/localizacao', userRateLimit, localizacaoRoutes);
app.use('/v1/facilita/servico', userRateLimit, servicoRoutes);
app.use('/v1/facilita/pagamento', userRateLimit, pagamentoRoutes);
app.use('/v1/facilita/carteira', userRateLimit, carteiraRoutes);
app.use('/v1/facilita/transacao', userRateLimit, transacaoCarteiraRoutes);
app.use('/v1/facilita/avaliacao', userRateLimit, avaliacaoRoutes);
app.use('/v1/facilita/notificacao', userRateLimit, notificacaoRoutes);
app.use('/v1/facilita/rastreamento', userRateLimit, rastreamentoRoutes);
app.use('/v1/facilita/chat', userRateLimit, chatRoutes);
app.use('/v1/facilita/recarga', userRateLimit, recargaRoutes);

// ========== ROTA DE FALLBACK PARA 404 (Express 5 compatível) ==========
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.originalUrl} não existe nesta API`,
    timestamp: new Date().toISOString(),
  });
});


// ========== MIDDLEWARE DE ERRO GLOBAL ==========
app.use((error, req, res, next) => {
  console.error('Erro global:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'production' ? 'Algo deu errado' : error.message,
    timestamp: new Date().toISOString()
  });
});

// ========== START DO SERVIDOR ==========
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}...`);
  console.log(`🔌 WebSocket ativo na porta ${PORT}`);
  console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
