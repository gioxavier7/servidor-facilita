/**
 * Objetivo: API responsável pelas requisições do TCC Facilita
 * Data: 13/09/2025
 * Dev: giovanna
 * Versões: 1.0 
 */

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')
const http = require('http')

// carregar variáveis de ambiente dependendo do ambiente
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.development' });
}

// ========== CONFIGURAÇÃO DO SERVIDOR ==========
const app = express()
const PORT = process.env.PORT || 3000

// ========== WEBSOCKET (Tempo Real) ==========
const socketService = require('./utils/socketService');
const server = http.createServer(app);

// Inicializar WebSocket
socketService.init(server);

// ========== MIDDLEWARES GLOBAIS ==========
app.use(bodyParser.json())

// configuração de CORS (local + produção)
const allowedOrigins = [
  'http://localhost:5173',     // frontend local
  process.env.FRONTEND_URL     // frontend em produção
]

app.use((req, res, next) => {
  const origin = req.headers.origin
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin)
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200) // resposta pro preflight
  }

  next()
})

// ========== IMPORTAÇÃO DAS ROTAS ==========
const usuarioRoutes = require('./routes/usuarioRoutes')
const contratanteRoutes = require('./routes/contratanteRoutes')
const prestadorRoutes = require('./routes/prestadorRoutes')
const localizacaoRoutes = require('./routes/localizacaoRoutes')
const servicoRoutes = require('./routes/servicoRoutes')
const categoriaRoutes = require('./routes/categoriaRoutes')
const pagamentoRoutes = require('./routes/pagamentoRoutes')
const carteiraRoutes = require('./routes/carteiraRoutes')
const transacaoCarteiraRoutes = require('./routes/transacaoCarteiraRoutes')
const pagbankWebhookRoutes = require('./routes/pagbankWebhookRoutes')
const avaliacaoRoutes = require('./routes/avaliacaoRoutes')
const notificacaoRoutes = require('./routes/notificacaoRoutes')
const rastreamentoRoutes = require('./routes/rastreamentoRoutes')
const chatRoutes = require('./routes/chatRoutes');
const recargaRoutes = require('./routes/recargasRoutes')
const healthRoutes = require('./routes/healthRoutes');

// ===== Middleware Gerais =====
const cacheMiddleware = require('./middleware/cache');
const rateLimit = require('./middleware/rateLimit');

// ========== CONFIGURAÇÃO DE ROTAS COM MIDDLEWARES ESPECÍFICOS ==========

// ✅ CORREÇÃO: Health Check PRIMEIRO (sem rate limit)
app.use('/v1/facilita/health', healthRoutes)

// ✅ CORREÇÃO: Webhooks SEGUNDO (sem rate limit)
app.use('/v1/facilita/pagamento/webhook', pagbankWebhookRoutes)

// ✅ Aplicar rate limit global (exceto health e webhooks que já foram definidos)
app.use(rateLimit(60000, 120)); // 120 req/minuto

// ========== ROTAS COM CACHE ESTRATÉGICO ==========

// CATEGORIAS - Cache longo (dados estáticos)
app.use('/v1/facilita/categoria', cacheMiddleware(3600), categoriaRoutes) // 1 hora

// SERVIÇOS - Cache médio (apenas rotas públicas) - ⚠️ LEMBRETE: Só funciona se tiver rotas públicas
app.use('/v1/facilita/servico', servicoRoutes)

// LOCALIZAÇÃO - Cache médio - ⚠️ LEMBRETE: Só funciona se tiver rotas públicas
app.use('/v1/facilita/localizacao', localizacaoRoutes)

// PRESTADORES - Cache médio (apenas listagem pública) - ⚠️ LEMBRETE: Só funciona se tiver rotas públicas
app.use('/v1/facilita/prestador', prestadorRoutes)

// AVALIAÇÕES - Cache médio - ⚠️ LEMBRETE: Só funciona se tiver rotas públicas
app.use('/v1/facilita/avaliacao', avaliacaoRoutes)

// ========== ROTAS SEM CACHE ==========

// Dados sensíveis/dinâmicos (SEM cache)
app.use('/v1/facilita/usuario', usuarioRoutes)
app.use('/v1/facilita/contratante', contratanteRoutes)
app.use('/v1/facilita/pagamento', pagamentoRoutes)
app.use('/v1/facilita/carteira', carteiraRoutes)
app.use('/v1/facilita/transacao', transacaoCarteiraRoutes)
app.use('/v1/facilita/notificacao', notificacaoRoutes)
app.use('/v1/facilita/rastreamento', rastreamentoRoutes)
app.use('/v1/facilita/chat', chatRoutes)
app.use('/v1/facilita/recarga', recargaRoutes)

// ========== ROTA DE FALLBACK PARA 404 ==========
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.originalUrl} não existe nesta API`,
    timestamp: new Date().toISOString()
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

// ========== START DO SERVIDOR =========
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}...`)
  console.log(`🔌 WebSocket ativo na porta ${PORT}`)
  console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`)
})