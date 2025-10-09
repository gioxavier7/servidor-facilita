const express = require('express')
const router = express.Router()
const servicoController = require('../controller/servico/servicoController')
const authMiddleware = require('../middleware/authMiddleware')

//autenticação em todas as rotas
router.use(authMiddleware)

//cadastrar serviço (apenas contratantes)
router.post('/', servicoController.cadastrarServico)

//listar serviços disponíveis (apenas prestadores)
router.get('/disponiveis', servicoController.listarServicosDisponiveis)

//aceitar serviço (apenas prestadores)
router.patch('/:id/aceitar', servicoController.aceitarServico)

//finalizar serviço (apenas prestadores)
router.patch('/:id/finalizar', servicoController.finalizarServico)

//listar meus serviços (apenas prestadores)
router.get('/meus-servicos', servicoController.listarMeusServicos)

//ROTAS PARA CONTRATANTES - HISTÓRICO DE PEDIDOS
//listar pedidos do contratante (apenas contratantes)
router.get('/contratante/pedidos', servicoController.listarPedidosContratante)

//buscar pedido específico do contratante (apenas contratantes)
router.get('/contratante/pedidos/:id', servicoController.buscarPedidoContratante)

//rotas gerais (com verificação de permissões no controller)
router.put('/:id', servicoController.atualizarServico)
router.delete('/:id', servicoController.deletarServico)
router.get('/', servicoController.listarServicos)
router.get('/:id', servicoController.buscarServicoPorId)

//confirmar conclusão de um serviço (apenas contratantes)
router.patch('/:id/confirmar-conclusao', servicoController.confirmarConclusao);

//pesquisar serviços por descrição (rota geral, disponível para todos os usuários autenticados)
router.get('/pesquisar', servicoController.pesquisarPorDescricao);

//filtrar serviços por categoria (rota geral, disponível para todos os usuários autenticados)
router.get('/filtrar', servicoController.filtrarPorCategoria);

module.exports = router