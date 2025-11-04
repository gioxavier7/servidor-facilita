const express = require('express');
const router = express.Router();
const prestadorController = require('../controller/prestador/prestadorController');
const documentoController = require('../controller/prestador/documentoController');
const autenticarToken = require('../middleware/authMiddleware');

// fluxo progressivo
router.post('/', autenticarToken, prestadorController.criarPrestadorBasico);
router.post('/documentos', autenticarToken, documentoController.cadastrarDocumento);
router.post('/cnh', autenticarToken, prestadorController.cadastrarCNH);
router.post('/modalidades', autenticarToken, prestadorController.adicionarModalidades);
router.patch('/finalizar', autenticarToken, prestadorController.finalizarCadastro);

// CRUD geral
//router.get('/', prestadorController.listarPrestadores);
router.get('/', prestadorController.buscarPrestador);
router.put('/:id', autenticarToken, prestadorController.atualizarPrestador);
router.delete('/:id', autenticarToken, prestadorController.deletarPrestador);

module.exports = router;
