const express = require('express')
const router = express.Router()
const servicoController = require('../controller/servico/servicoController')
const authMiddleware = require('../middleware/authMiddleware')

//autenticação em todas as rotas
router.use(authMiddleware)

//rotas específicas 
router.get('/pesquisar', servicoController.pesquisarPorDescricao)
router.get('/filtrar', servicoController.filtrarPorCategoria)
router.get('/disponiveis', servicoController.listarServicosDisponiveis)
router.get('/meus-servicos', servicoController.listarMeusServicos)

router.get('/contratante/pedidos', servicoController.listarPedidosContratante)
router.get('/prestador/pedidos', authMiddleware, servicoController.listarPedidosPrestador)

//rota de pagamento
router.post('/pagar', servicoController.pagarServicoComCarteira)
//router.post('/liberar-pagamento', servicoController.liberarPagamentoServico)

//rotas com parametros específicos
router.get('/contratante/pedidos/:id', servicoController.buscarPedidoContratante)

// rotas de acao com parametros
router.patch('/:id/aceitar', servicoController.aceitarServico)
router.patch('/:id/finalizar', servicoController.finalizarServico)
router.patch('/:id/confirmar-conclusao', servicoController.confirmarConclusao)
router.post('/from-categoria/:categoriaId', servicoController.criarServicoPorCategoria)
router.get('/:id/detalhes', servicoController.getDetalhesPedido)
router.post('/:id/recusar', authMiddleware, servicoController.recusarServico)

//rotas basicas com parametros
router.get('/:id', servicoController.buscarServicoPorId)
router.put('/:id', servicoController.atualizarServico)
router.delete('/:id', servicoController.deletarServico)

//rotas sem parametros
router.post('/', servicoController.cadastrarServico)
router.get('/', servicoController.listarServicos)

//router.get('/:id/acompanhamento', servicoController.acompanhamentoServico)

module.exports = router