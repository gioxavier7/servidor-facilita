const express = require('express')
const router = express.Router()
const carteiraController = require('../controller/carteira/carteiraController')
const authMiddleware = require('../middleware/authMiddleware')

router.use(authMiddleware)

router.post('/', carteiraController.criarCarteira)
router.get('/minha-carteira', carteiraController.buscarCarteira)

//transferências e recargas
router.post('/transferir', carteiraController.transferirValor)
router.post('/recarregar', carteiraController.adicionarSaldo)

module.exports = router