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

// Perfil do usuário autenticado (AGORA COM DADOS COMPLETOS)
router.get('/perfil', usuarioController.buscarUsuarioCompleto)
router.put('/perfil', usuarioController.atualizarPerfil)             

// Buscar próprio usuário (alternativa ao /perfil) - MANTÉM O ATUAL
//router.get('/:id', usuarioController.buscarUsuario)                   

// ================= ROTAS ADMINISTRATIVAS (SE NECESSÁRIO) =================
router.get('/', usuarioController.listarUsuarios)                         
router.delete('/:id', usuarioController.deletarUsuario)         

module.exports = router