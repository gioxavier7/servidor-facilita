/**
 * objetivo: Rotas para gerenciamento de rastreamento de serviços
 * data: 18/10/2025
 * dev: Giovanna
 * versão: 1.0
 */

const express = require('express')
const router = express.Router()
const rastreamentoController = require('../controller/rastreamento/rastreamentoController')
const authMiddleware = require('../middleware/authMiddleware')

// Aplicar autenticação em todas as rotas
router.use(authMiddleware)

//rastreamento - prestador
router.post('/:id/iniciar-deslocamento', rastreamentoController.iniciarDeslocamento)
router.post('/:id/chegou-local', rastreamentoController.chegouNoLocal)
router.post('/:id/iniciar-servico', rastreamentoController.iniciarServico)
router.post('/:id/finalizar-servico', rastreamentoController.finalizarServico)

//consultas - ambos (contratante e prestador)
router.get('/:id/historico', rastreamentoController.getRastreamentoByServico)
router.get('/:id/ultimo-status', rastreamentoController.getUltimoRastreamento)

module.exports = router