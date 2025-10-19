const pagamentoDAO = require('../../model/dao/pagamento')
const recargaDAO = require('../../model/dao/recarga')
const carteiraDAO = require('../../model/dao/carteira')
const transacaoDAO = require('../../model/dao/transacaoCarteira')
const notificacaoDAO = require('../../model/dao/notificacao')

/**
 *processar recarga confirmada
 */
const processarRecargaConfirmada = async (recarga) => {
  try {
    //atualiza o status da recarga
    await recargaDAO.updateStatusRecarga(recarga.id, 'CONFIRMADA')
    
    //creditar na carteira
    const carteira = await carteiraDAO.selectCarteiraByUsuario(recarga.id_usuario)
    if (carteira) {
      const valorEmReais = Number(recarga.valor)
      const saldoAtual = Number(carteira.saldo) || 0
      const novoSaldo = saldoAtual + valorEmReais
      
      await carteiraDAO.atualizarSaldo(carteira.id, novoSaldo)
      
      await transacaoDAO.insertTransacao({
        id_carteira: carteira.id,
        tipo: 'ENTRADA',
        valor: valorEmReais,
        descricao: `Recarga via ${recarga.metodo}`
      })

      await notificacaoDAO.criarNotificacao({
        id_usuario: recarga.id_usuario,
        tipo: 'pagamento',
        titulo: 'Recarga Confirmada! 💰',
        mensagem: `Sua carteira foi recarregada com R$ ${valorEmReais}. Saldo atual: R$ ${novoSaldo}`
      })
    } else {
      console.error('❌ Carteira não encontrada para usuário:', recarga.id_usuario)
    }

  } catch (error) {
    console.error('❌ Erro ao processar recarga confirmada:', error)
  }
}

/**
 * processar pagamento de serviço confirmado
 */
const processarPagamentoServicoConfirmado = async (pagamento) => {
  try {
    const carteiraPrestador = await carteiraDAO.selectCarteiraByUsuario(pagamento.prestador.id_usuario)
    if (carteiraPrestador) {
      const valorEmCentavos = Number(pagamento.valor)
      const valorEmReais = valorEmCentavos / 100
      
      const saldoAtual = Number(carteiraPrestador.saldo) || 0
      const novoSaldo = saldoAtual + valorEmReais

      await carteiraDAO.atualizarSaldo(carteiraPrestador.id, novoSaldo)
      
      await transacaoDAO.insertTransacao({
        id_carteira: carteiraPrestador.id,
        tipo: 'ENTRADA',
        valor: valorEmReais,
        descricao: `Pagamento do serviço #${pagamento.id_servico}`
      })

      //notificar PRESTADOR - pagamento recebido
      await notificacaoDAO.criarNotificacao({
        id_usuario: pagamento.prestador.id_usuario,
        id_servico: pagamento.id_servico,
        tipo: 'pagamento',
        titulo: 'Pagamento Recebido! 💸',
        mensagem: `Você recebeu R$ ${valorEmReais.toFixed(2)} pelo serviço #${pagamento.id_servico}. Valor creditado na sua carteira.`
      })

      //notificar CONTRATANTE - pagamento confirmado
      await notificacaoDAO.criarNotificacao({
        id_usuario: pagamento.contratante.id_usuario,
        id_servico: pagamento.id_servico,
        tipo: 'pagamento',
        titulo: 'Pagamento Confirmado! ✅',
        mensagem: `Seu pagamento de R$ ${valorEmReais.toFixed(2)} foi confirmado com sucesso.`
      })
    }

  } catch (error) {
    console.error('❌ Erro ao processar pagamento de serviço:', error)
  }
}

/**
 *processar notificações baseadas no tipo
 */
const processarNotificacoes = async (item, novoStatus, tipo) => {
  const valorEmReais = tipo === 'recarga' 
    ? Number(item.valor).toFixed(2)
    : (Number(item.valor) / 100).toFixed(2)

  if (tipo === 'recarga') {
    if (novoStatus === 'CONFIRMADA') {
      await notificacaoDAO.criarNotificacao({
        id_usuario: item.id_usuario,
        tipo: 'pagamento',
        titulo: 'Recarga Confirmada! 💰',
        mensagem: `Sua carteira foi recarregada com R$ ${valorEmReais}.`
      })
    } else if (novoStatus === 'CANCELADA' || novoStatus === 'FALHOU') {
      await notificacaoDAO.criarNotificacao({
        id_usuario: item.id_usuario,
        tipo: 'pagamento',
        titulo: 'Recarga Não Processada ⚠️',
        mensagem: `Sua recarga de R$ ${valorEmReais} não foi processada. Status: ${novoStatus}.`
      })
    }
  } else {
    //notificações para pagamento de serviço (já existentes)
    if (novoStatus === 'PAGO') {
      await notificacaoDAO.criarNotificacao({
        id_usuario: item.prestador.id_usuario,
        id_servico: item.id_servico,
        tipo: 'pagamento',
        titulo: 'Pagamento Recebido! 💸',
        mensagem: `Você recebeu R$ ${valorEmReais} pelo serviço #${item.id_servico}.`
      })

      await notificacaoDAO.criarNotificacao({
        id_usuario: item.contratante.id_usuario,
        id_servico: item.id_servico,
        tipo: 'pagamento',
        titulo: 'Pagamento Confirmado! ✅',
        mensagem: `Seu pagamento de R$ ${valorEmReais} foi confirmado com sucesso.`
      })
    } else if (novoStatus === 'CANCELADO' || novoStatus === 'FALHOU') {
      await notificacaoDAO.criarNotificacao({
        id_usuario: item.contratante.id_usuario,
        id_servico: item.id_servico,
        tipo: 'pagamento',
        titulo: 'Pagamento Não Processado ⚠️',
        mensagem: `Seu pagamento de R$ ${valorEmReais} não foi processado. Status: ${novoStatus}.`
      })
    }
  }
}

/**
 * webhook principal
 */
const receberNotificacao = async function(req, res){
  try {
    const { id, status } = req.body
    
    if (!id || !status) {
      console.error('❌ Webhook inválido - ID ou status faltando')
      return res.status(400).json({ message: 'ID e status obrigatórios' })
    }

    //busca como recarga
    let recarga = await recargaDAO.selectRecargaByPagBankId(id)
    
    if (recarga) {
      //mapear status do PagBank para status interno de recarga
      const statusMap = { 
        PAID: 'CONFIRMADA', 
        PENDING: 'PENDENTE', 
        EXPIRED: 'CANCELADA', 
        CANCELED: 'CANCELADA', 
        FAILED: 'FALHOU' 
      }
      const novoStatus = statusMap[status] || 'PENDENTE'

      //atualizar status da recarga
      await recargaDAO.updateStatusRecarga(recarga.id, novoStatus)

      //processar se confirmada
      if (novoStatus === 'CONFIRMADA') {
        await processarRecargaConfirmada(recarga)
      }

      //notificações
      await processarNotificacoes(recarga, novoStatus, 'recarga')
      
    } else {
      //se nao for recarga busca como pagamento de serviço
      const pagamento = await pagamentoDAO.selectByIdPagBank(id)
      
      if (!pagamento) {
        return res.status(404).json({ message: 'Registro não encontrado' })
      }

      //mapeia status do PagBank para status interno de pagamento
      const statusMap = { 
        PAID: 'PAGO', 
        PENDING: 'PENDENTE', 
        EXPIRED: 'CANCELADO', 
        CANCELED: 'CANCELADO', 
        FAILED: 'FALHOU' 
      }
      const novoStatus = statusMap[status] || 'PENDENTE'

      await pagamentoDAO.updateStatusPagamento(pagamento.id, novoStatus)

      //processar se pago
      if (novoStatus === 'PAGO') {
        await processarPagamentoServicoConfirmado(pagamento)
      }

      //notificacao
      await processarNotificacoes(pagamento, novoStatus, 'pagamento')
    }

    res.status(200).json({ message: 'Webhook processado com sucesso' })

  } catch (error) {
    console.error('❌ ERRO CRÍTICO no webhook:')
    console.error('Mensagem:', error.message)
    console.error('Stack:', error.stack)
    
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
}

module.exports = { receberNotificacao }