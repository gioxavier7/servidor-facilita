const pagamentoDAO = require('../../model/dao/pagamento')
const carteiraDAO = require('../../model/dao/carteira')
const transacaoDAO = require('../../model/dao/transacaoCarteira')

/**
 * Webhook PagBank - Recebe notificações de status de pagamento
 */
const receberNotificacao = async function(req, res) {
  try {
    console.log('Webhook recebido:', req.body)

    const { id, status } = req.body // id do pedido PagBank e status do pagamento

    if (!id || !status) {
      return res.status(400).json({ message: 'ID e status obrigatórios' })
    }

    // buscar pagamento local pelo id_pagbank
    const pagamento = await pagamentoDAO.selectByIdPagBank(id)
    if (!pagamento) {
      console.log(`Pagamento não encontrado para id_pagbank: ${id}`)
      return res.status(404).json({ message: 'Pagamento não encontrado' })
    }

    // mapear status do PagBank para status interno
    const statusMap = {
      PAID: 'PAGO',
      PENDING: 'PENDENTE',
      EXPIRED: 'CANCELADO',
      CANCELED: 'CANCELADO',
      FAILED: 'FALHOU'
    }
    const novoStatus = statusMap[status] || 'PENDENTE'

    // atualizar status do pagamento
    await pagamentoDAO.updateStatusPagamento(pagamento.id, novoStatus)
    console.log(`Pagamento #${pagamento.id} atualizado para status: ${novoStatus}`)

    // se pagamento aprovado, adicionar saldo ao prestador e registrar transação
    if (novoStatus === 'PAGO') {
      const carteira = await carteiraDAO.selectCarteiraByUsuario(pagamento.id_prestador)
      if (carteira) {
        const valorPagamento = Number(pagamento.valor) || 0
        const novoSaldo = Number(carteira.saldo) + valorPagamento

        await carteiraDAO.atualizarSaldo(carteira.id, novoSaldo)
        console.log(`Saldo do prestador atualizado para: ${novoSaldo}`)

        await transacaoDAO.insertTransacao({
          id_carteira: carteira.id,
          tipo: 'ENTRADA',
          valor: valorPagamento,
          descricao: `Pagamento do serviço #${pagamento.id_servico}`
        })
        console.log('Transação registrada.')
      } else {
        console.log('Carteira do prestador não encontrada.')
      }
    }

    res.status(200).json({ message: 'Webhook processado com sucesso' })

  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
}

module.exports = { receberNotificacao }
