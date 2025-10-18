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
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
})

// ========== CONFIGURAÇÃO DO SERVIDOR ==========
const app = express()
const PORT = process.env.PORT || 3000

// ========== WEBSOCKET (Tempo Real) ==========
const socketService = require('./utils/socketService');
const server = http.createServer(app);

// Inicializar WebSocket
socketService.init(server);

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

// ========== SWAGGER DOCUMENTATION ==========
try {
  const setupSwagger = require('./swagger');
  setupSwagger(app);
  console.log('📚 Swagger documentation available at: http://localhost:' + PORT + '/api-docs');
} catch (error) {
  console.log('⚠️  Swagger documentation not loaded:', error.message);
}

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

// ========== ROTAS ==========

// ROTAS DE USUÁRIO (auth + CRUD)
app.use('/v1/facilita/usuario', usuarioRoutes)

// ROTAS DE CONTRATANTE
app.use('/v1/facilita/contratante', contratanteRoutes)

// ROTAS DE PRESTADOR
app.use('/v1/facilita/prestador', prestadorRoutes)

// ROTAS DE LOCALIZACAO
app.use('/v1/facilita/localizacao', localizacaoRoutes)

// ROTAS DE SERVIÇO
app.use('/v1/facilita/servico', servicoRoutes)

// ROTAS DE CATEGORIA
app.use('/v1/facilita/categoria', categoriaRoutes)

// ROTAS DE PAGAMENTO
app.use('/v1/facilita/pagamento', pagamentoRoutes)

// ROTAS DE CARTEIRA
app.use('/v1/facilita/carteira', carteiraRoutes)

// ROTAS DE TRANSAÇÃO-CARTEIRA
app.use('/v1/facilita/transacao-carteira', transacaoCarteiraRoutes)

// ROTAS DE WEBHOOK PAGBANK
app.use('/v1/facilita/pagamento/webhook', pagbankWebhookRoutes)

// ROTAS DE AVALIACAO
app.use('/v1/facilita/avaliacao', avaliacaoRoutes)

// ROTAS DE NOTIFICAÇÃO
app.use('/v1/facilita/notificacao', notificacaoRoutes)

// ROTAS DE RASTREAMENTO
app.use('/v1/facilita/rastreamento', rastreamentoRoutes)

// ROTAS DE CHAT
app.use('/v1/facilita/chat', chatRoutes);

// ========== START DO SERVIDOR =========
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}...`)
  console.log(`🔌 WebSocket ativo na porta ${PORT}`)
  console.log(`📚 Documentação Swagger: http://localhost:${PORT}/api-docs`)
})