const pagamentoDAO = require('../../model/dao/pagamento')
const servicoDAO = require('../../model/dao/servico')
const axios = require('axios')
const notificacaoDAO = require('../../model/dao/notificacao')
const usuarioDAO = require('../../model/dao/usuario')
const carteiraDAO = require('../../model/dao/carteira')
const transacaoDAO = require('../../model/dao/transacaoCarteira')

/**
 * cadastrar um pagamento simples (sem PagBank, local/teste)
 */
const cadastrarPagamento = async function(req, res){
  try {
    if (req.headers['content-type'] !== 'application/json') {
      return res.status(415).json({ status_code: 415, message: 'Content-type inválido. Use application/json' })
    }

    const { id_servico, id_contratante, id_prestador, valor, metodo, status, id_pagbank } = req.body

    if (!id_servico || !id_contratante || !id_prestador || !valor) {
      return res.status(400).json({ status_code: 400, message: 'Dados inválidos ou incompletos' })
    }

    const novoPagamento = await pagamentoDAO.insertPagamento({
      id_servico,
      id_contratante,
      id_prestador,
      valor,
      metodo: metodo || 'CARTEIRA_PAGBANK',
      status: status || 'PENDENTE',
      id_pagbank: id_pagbank || null
    })

    if (!novoPagamento) {
      return res.status(500).json({ status_code: 500, message: 'Erro ao cadastrar pagamento' })
    }

    res.status(201).json({ status_code: 201, message: 'Pagamento cadastrado com sucesso', data: novoPagamento })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status_code: 500, message: 'Erro interno do servidor' })
  }
}

/**
 * criar pagamento PagBank
 */
const criarPagamentoPagBank = async function(req, res){
  try {
    const { id_servico, valor, metodo } = req.body

    if (!id_servico || !valor || !metodo) {
      return res.status(400).json({ message: 'Campos inválidos ou incompletos.' })
    }

    // buscar serviço via DAO
    const servico = await servicoDAO.selectServicoById(id_servico)
    if (!servico) return res.status(404).json({ message: 'Serviço não encontrado' })

    // preparar informações do cliente para testes
    const clienteNome = servico.contratante.usuario?.nome?.trim() || 'Cliente Teste'
    const clienteEmail = servico.contratante.usuario?.email?.trim() || 'teste@teste.com'
    let clienteCPF = servico.contratante.cpf.replace(/\D/g, '')

    // se o CPF não for válido, usar um CPF de teste homologado pela PagBank
    if (clienteCPF.length !== 11) clienteCPF = '11144477735' // CPF válido de teste

    // preparar body do PagBank
    const body = {
      reference_id: `pedido-${id_servico}-${Date.now()}`,
      customer: {
        name: clienteNome,
        email: clienteEmail,
        tax_id: clienteCPF,
        phones: [
          { country: "55", area: "11", number: "999999999", type: "MOBILE" }
        ]
      },
      items: [{ name: "Serviço contratado", quantity: 1, unit_amount: valor }],
      qr_codes: [
        { amount: { value: valor }, expiration_date: new Date(Date.now() + 24*60*60*1000).toISOString() }
      ],
      notification_urls: ["https://servidor-facilita.onrender.com/v1/facilita/pagamento/webhook"]
    }

    // criar pedido na API PagBank
    const response = await axios.post('https://sandbox.api.pagseguro.com/orders', body, {
      headers: { Authorization: `Bearer ${process.env.PAGBANK_TOKEN}` }
    })

    const pedido = response.data

    // salvar pagamento local via DAO
    const pagamento = await pagamentoDAO.insertPagamento({
      id_servico,
      id_contratante: servico.id_contratante,
      id_prestador: servico.id_prestador,
      valor,
      metodo,
      status: 'PENDENTE',
      id_pagbank: pedido.id
    })

    await notificacaoDAO.criarNotificacao({
      id_usuario: servico.id_contratante,
      id_servico: servico.id,
      tipo: 'pagamento',
      titulo: 'Pagamento Criado 💰',
      mensagem: `Pagamento de R$ ${(valor/100).toFixed(2)} criado. Aguardando confirmação.`
    })

    res.status(201).json({ pagamento, pedido })

  } catch (error) {
    console.error(error.response?.data || error.message)
    res.status(500).json({ message: 'Erro ao criar pagamento PagBank' })
  }
}

/**
 * listar todos os pagamentos
 */
const listarPagamentos = async function(req, res){
  try {
    const pagamentos = await pagamentoDAO.selectAllPagamentos()
    if (!pagamentos) return res.status(404).json({ status_code: 404, message: 'Nenhum pagamento encontrado' })
    res.status(200).json({ status_code: 200, data: pagamentos })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status_code: 500, message: 'Erro interno do servidor' })
  }
}

/**
 * buscar pagamento por ID
 */
const buscarPagamentoPorId = async function(req, res){
  try {
    const { id } = req.params
    if (!id) return res.status(400).json({ status_code: 400, message: 'ID do pagamento é obrigatório' })

    const pagamento = await pagamentoDAO.selectByIdPagamento(Number(id))
    if (!pagamento) return res.status(404).json({ status_code: 404, message: 'Pagamento não encontrado' })

    res.status(200).json({ status_code: 200, data: pagamento })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status_code: 500, message: 'Erro interno do servidor' })
  }
}

/**
 * atualizar pagamento com ID do PagBank
 */
const atualizarIdPagBank = async function(req, res){
  try {
    const { id_pagamento, id_pagbank } = req.body

    if (!id_pagamento || !id_pagbank) {
      return res.status(400).json({ status_code: 400, message: 'ID do pagamento e ID PagBank são obrigatórios' })
    }

    const pagamentoAtualizado = await prisma.pagamento.update({
      where: { id: id_pagamento },
      data: { id_pagbank: id_pagbank }
    })

    res.status(200).json({ 
      status_code: 200, 
      message: 'ID PagBank atualizado com sucesso', 
      data: pagamentoAtualizado 
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status_code: 500, message: 'Erro interno do servidor' })
  }
}

/**
 * recarregar carteira via PIX
 */
const recarregarCarteira = async function(req, res){
  try {
    const { valor } = req.body
    const id_contratante = req.user.id

    if (!valor || valor <= 0) {
      return res.status(400).json({ message: 'Valor deve ser maior que zero.' })
    }

    // 1.verifica carteira
    const carteira = await carteiraDAO.selectCarteiraByUsuario(id_contratante)
    
    if (!carteira) {
      return res.status(404).json({ message: 'Carteira não encontrada. Crie uma carteira primeiro.' })
    }

    // 2.cria pagamento
    const pagamentoData = {
      id_servico: null,
      id_contratante: id_contratante,
      id_prestador: null,
      valor: Math.round(valor * 100), // em centavos
      metodo: 'PIX',
      status: 'PAGO',
      id_pagbank: `simulacao-${Date.now()}`
    }

    const pagamento = await pagamentoDAO.insertPagamento(pagamentoData)
    
    if (pagamento === null || !pagamento.id) {
      console.error('❌ insertPagamento retornou:', pagamento)
      return res.status(500).json({ 
        message: 'Falha ao registrar pagamento no banco de dados'
      })
    }

    // 3.atualiza saldo
    const saldoAtual = Number(carteira.saldo) || 0
    const novoSaldo = saldoAtual + Number(valor)    
    const carteiraAtualizada = await carteiraDAO.atualizarSaldo(carteira.id, novoSaldo)
    
    if (!carteiraAtualizada) {
      console.error('❌ Erro ao atualizar saldo da carteira')
    }

    // 4.registra transação
    const transacao = await transacaoDAO.insertTransacao({
      id_carteira: carteira.id,
      tipo: 'ENTRADA',
      valor: Number(valor),
      descricao: `Recarga de R$ ${valor}`
    })

    // 5.notificacao
    await notificacaoDAO.criarNotificacao({
      id_usuario: id_contratante,
      tipo: 'pagamento', 
      titulo: 'Recarga Confirmada! 💰',
      mensagem: `Sua carteira foi recarregada com R$ ${valor}. Saldo atual: R$ ${novoSaldo}`
    })

    res.status(201).json({ 
      message: 'Recarga realizada com sucesso!',
      valor_recarregado: Number(valor),
      saldo_anterior: saldoAtual,
      saldo_atual: novoSaldo,
      pagamento_id: pagamento.id,
      carteira_id: carteira.id
    })

  } catch (error) {
    console.error('❌ ERRO CRÍTICO na recarga:')
    console.error('Mensagem:', error.message)
    console.error('Stack:', error.stack)
    
    res.status(500).json({ 
      message: 'Erro interno ao processar recarga',
      detalhes: process.env.NODE_ENV === 'development' ? error.message : 'Contate o suporte'
    })
  }
}

module.exports = {
  cadastrarPagamento,
  criarPagamentoPagBank,
  listarPagamentos,
  buscarPagamentoPorId,
  atualizarIdPagBank,
  recarregarCarteira
}
