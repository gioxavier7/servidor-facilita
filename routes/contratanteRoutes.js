const express = require('express')
const router = express.Router()
const contratanteController = require('../controller/contratante/contratanteController')
const autenticarToken = require('../middleware/authMiddleware')

//auth
router.post('/register', autenticarToken, contratanteController.cadastrarContratante)

router.get('/', contratanteController.listarContratantes)//retornar todos os contratantes
router.get('/:id', contratanteController.buscarContratante)//buscar por id
router.put('/:id', autenticarToken, contratanteController.atualizarContratante) //atualizar contratante
router.delete('/:id', autenticarToken, contratanteController.deletarContratante)

module.exports = router