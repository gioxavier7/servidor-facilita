const express = require('express')
const router =  express.Router()
const usuarioController = require('../controller/usuario/usuarioController')
const autenticarToken = require('../middleware/authMiddleware')

// auth
router.post('/register', usuarioController.cadastrarUsuario)
router.post('/login', usuarioController.login)

// crud
router.get('/', usuarioController.listarUsuarios)
router.get('/:id', usuarioController.buscarUsuario)
router.put('/:id', usuarioController.atualizarUsuario)
router.delete('/:id', usuarioController.deletarUsuario)

// definir tipo de conta
router.put('/tipo-conta', autenticarToken, usuarioController.definirTipoConta)


module.exports = router