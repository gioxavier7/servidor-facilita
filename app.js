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

// Carregar variáveis de ambiente dependendo do ambiente
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
})

// import das routes
const usuarioRoutes = require('./routes/usuarioRoutes')
const contratanteRoutes = require('./routes/contratanteRoutes')
const prestadorRoutes = require('./routes/prestadorRoutes')
const localizacaoRoutes = require('./routes/localizacaoRoutes')
const servicoRoutes = require('./routes/servicoRoutes')
const categoriaRoutes = require('./routes/categoriaRoutes')

const app = express()
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

// ========== START DO SERVIDOR =========
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}...`))
