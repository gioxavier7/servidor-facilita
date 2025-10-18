/**
 * objetivo: Rotas para gerenciamento de chat de serviços
 * data: 18/10/2025
 * dev: Giovanna
 * versão: 1.0
 */

const express = require('express')
const router = express.Router()
const chatController = require('../controller/chat/chatController')
const autenticarToken = require('../middleware/authMiddleware')

//autenticação em todas as rotas
router.use(autenticarToken)

//chat
router.post('/:id/mensagem', chatController.enviarMensagem)
router.get('/:id/mensagens', chatController.buscarMensagens)
router.patch('/:id/marcar-lidas', chatController.marcarComoLidas)

module.exports = router