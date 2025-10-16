const express = require('express')
const router = express.Router()
const notificacaoController = require('../controller/notificacao/notificacaoController')
const authMiddleware = require('../middleware/authMiddleware')

//todas as rotas precisam de autenticação
router.use(authMiddleware)

//listar notificações
router.get('/', notificacaoController.listarNotificacoes)

//marcar como lida
router.patch('/:id/lida', notificacaoController.marcarComoLida)

//marcar todas como lidas
router.patch('/todas-lidas', notificacaoController.marcarTodasComoLidas)

module.exports = router