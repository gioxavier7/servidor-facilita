const express = require('express')
const router = express.Router()
const prestadorController = require('../controller/prestador/prestadorController')
const autenticarToken = require('../middleware/authMiddleware')

//auth
router.post('/register', autenticarToken, prestadorController.cadastrarPrestador)

router.get('/', prestadorController.listarPrestadores)//retornar todos os prestadors
router.get('/:id', prestadorController.buscarPrestador)//buscar por id
router.put('/:id', autenticarToken, prestadorController.atualizarPrestador) //atualizar prestador
router.delete('/:id', autenticarToken, prestadorController.deletarPrestador)

module.exports = router