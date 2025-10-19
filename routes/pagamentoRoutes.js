const express = require('express');
const router = express.Router();
const pagamentoController = require('../controller/pagamento/pagamentoController')
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', pagamentoController.cadastrarPagamento);
router.post('/pagbank', pagamentoController.criarPagamentoPagBank)
router.post('/recarregar', pagamentoController.recarregarCarteira);
router.get('/', pagamentoController.listarPagamentos);
router.get('/:id', pagamentoController.buscarPagamentoPorId);
router.patch('/atualizar-pagbank', pagamentoController.atualizarIdPagBank);
// router.post('/pagbank/pay', pagamentoController.pagarPedidoPagBank)

module.exports = router;
