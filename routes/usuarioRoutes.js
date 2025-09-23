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
router.put('/:id', autenticarToken, usuarioController.atualizarUsuario)
router.delete('/:id', autenticarToken, usuarioController.deletarUsuario)

//update perfil
router.put('/:id/perfil', usuarioController.atualizarPerfil);

//redefinir senha
router.post('/recuperar-senha', usuarioController.solicitarRecuperacaoSenha);
router.post('/redefinir-senha', usuarioController.redefinirSenha);

module.exports = router