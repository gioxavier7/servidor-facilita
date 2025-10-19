const express = require('express')
const router = express.Router()
const recargaController = require('../controller/pagamento/recargaController')
const authMiddleware = require('../middleware/authMiddleware')

router.use(authMiddleware)

router.post('/solicitar', recargaController.solicitarRecarga)
router.get('/minhas-recargas', recargaController.listarRecargas)

module.exports = router