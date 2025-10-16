const express = require('express')
const router = express.Router()
const usuarioController = require('../controller/usuario/usuarioController')
const autenticarToken = require('../middleware/authMiddleware')

// ================= ROTAS PÚBLICAS =================
router.post('/register', usuarioController.cadastrarUsuario)
router.post('/login', usuarioController.login)

// Recuperação de senha (pública)
router.post('/recuperar-senha', usuarioController.solicitarRecuperacaoSenha)
router.post('/redefinir-senha', usuarioController.redefinirSenha)

// ================= ROTAS AUTENTICADAS =================
router.use(autenticarToken)

// Perfil do usuário autenticado
router.get('/perfil', usuarioController.buscarPerfilUsuario)
router.put('/perfil', usuarioController.atualizarPerfil)             

// Buscar próprio usuário (alternativa ao /perfil)
router.get('/:id', usuarioController.buscarUsuario)                   

// ================= ROTAS ADMINISTRATIVAS (SE NECESSÁRIO) =================
// router.get('/', usuarioController.listarUsuarios)              
// router.put('/:id', usuarioController.atualizarUsuario)             
// router.delete('/:id', usuarioController.deletarUsuario)         

module.exports = router