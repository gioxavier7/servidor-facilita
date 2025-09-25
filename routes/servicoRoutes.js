const express = require('express')
const router = express.Router()
const servicoController = require('../controller/servico/servicoController')

// Cadastrar serviço
router.post('/', servicoController.cadastrarServico)

// Atualizar serviço
router.put('/:id', servicoController.atualizarServico)

// Deletar serviço
router.delete('/:id', servicoController.deletarServico)

// Listar todos os serviços
router.get('/', servicoController.listarServicos)

// Buscar serviço por ID
router.get('/:id', servicoController.buscarServicoPorId)

module.exports = router
