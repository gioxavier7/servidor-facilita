const express = require('express')
const router = express.Router()
const categoriaController = require('../controller/categoria/categoriaController')

// Cadastrar categoria
router.post('/', categoriaController.cadastrarCategoria)

// Atualizar categoria
router.put('/:id', categoriaController.atualizarCategoria)

// Deletar categoria
router.delete('/:id', categoriaController.deletarCategoria)

// Listar todas as categorias
router.get('/', categoriaController.listarCategorias)

// Buscar categoria por ID
router.get('/:id', categoriaController.buscarCategoriaPorId)

module.exports = router
