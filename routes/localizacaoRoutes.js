const express = require('express');
const router = express.Router();
const localizacaoController = require('../controller/localizacao/localizacaoController');

router.post('/', localizacaoController.criarLocalizacao);
router.get('/', localizacaoController.listarLocalizacoes);
router.get('/:id', localizacaoController.buscarLocalizacao);
router.put('/:id', localizacaoController.atualizarLocalizacao);
router.delete('/:id', localizacaoController.deletarLocalizacao);

module.exports = router;
