const express = require('express');
const router = express.Router();
const transacaoController = require('../controller/carteira/transacaoCarteira');

router.post('/', transacaoController.registrarTransacao);
router.get('/:id', transacaoController.listarTransacoes);

module.exports = router;
