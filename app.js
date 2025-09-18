/**
 * Objetivo: API responsável pelas requisições do TCC Facilita
 * Data: 13/09/2025
 * Dev: giovanna
 * Versões: 1.0 
 */

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
require('dotenv').config()

//import das routes
const usuarioRoutes = require('./routes/usuarioRoutes')
const contratanteRoutes = require('./routes/contratanteRoutes')
const prestadorRoutes = require('./routes/prestadorRoutes')

const app = express()
app.use(bodyParser.json())

//configuração de CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200)  // resposta pro preflight
    }
  
    next()
  })


// ========== ROTAS =========

// ROTAS DE USUÁRIO (auth + CRUD)
app.use('/v1/facilita/usuario', usuarioRoutes)

// ROTAS DE CONTRATANTE
app.use('/v1/facilita/contratante', contratanteRoutes)

// ROTAS DE PRESTADOR
app.use('/v1/facilita/prestador', prestadorRoutes)

// ========== START DO SERVIDOR =========
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`servidor aguardando novas requisições...`))