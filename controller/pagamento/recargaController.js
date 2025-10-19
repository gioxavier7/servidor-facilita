const recargaDAO = require('../../model/dao/recarga')
const carteiraDAO = require('../../model/dao/carteira')
const transacaoDAO = require('../../model/dao/transacaoCarteira')
const notificacaoDAO = require('../../model/dao/notificacao')
const usuarioDAO = require('../../model/dao/usuario')
const contratanteDAO = require('../../model/dao/contratante')
const axios = require('axios')

const solicitarRecarga = async function(req, res){
  try {
    const { valor, metodo = 'PIX' } = req.body
    const id_usuario = req.user.id

    console.log('💰 SOLICITANDO RECARGA PAGBANK:', { id_usuario, valor, metodo })

    if (!valor || valor <= 0) {
      return res.status(400).json({ message: 'Valor deve ser maior que zero.' })
    }

    //busca dados do usuario pro pagbank
    const usuario = await usuarioDAO.selectByIdUsuario(id_usuario)
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' })
    }

    const contratante = await contratanteDAO.selectContratanteByUsuarioId(id_usuario)
    
    //prepara informações do cliente
    const clienteNome = usuario.nome?.trim() || 'Cliente Teste'
    const clienteEmail = usuario.email?.trim() || 'teste@teste.com'
    let clienteCPF = contratante?.cpf?.replace(/\D/g, '') || ''

    //se o CPF não for válido, usar CPF de teste
    if (clienteCPF.length !== 11) clienteCPF = '11144477735'

    //body do pagamento
    const body = {
      reference_id: `recarga-${id_usuario}-${Date.now()}`,
      customer: {
        name: clienteNome,
        email: clienteEmail,
        tax_id: clienteCPF,
        phones: [
          { country: "55", area: "11", number: "999999999", type: "MOBILE" }
        ]
      },
      items: [{ 
        name: "Recarga de Carteira - Facilita", 
        quantity: 1, 
        unit_amount: Math.round(valor * 100) // centavos
      }],
      qr_codes: [
        { 
          amount: { value: Math.round(valor * 100) }, 
          expiration_date: new Date(Date.now() + 24*60*60*1000).toISOString() 
        }
      ],
      notification_urls: ["https://servidor-facilita.onrender.com/v1/facilita/pagamento/webhook"]
    }

    //criar pedido pagbank
    const response = await axios.post('https://sandbox.api.pagseguro.com/orders', body, {
      headers: { 
        Authorization: `Bearer ${process.env.PAGBANK_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    const pedido = response.data
    //salva recarga como pendente
    const recarga = await recargaDAO.insertRecarga({
      id_usuario: id_usuario,
      valor: Number(valor),
      metodo: metodo,
      status: 'PENDENTE',
      id_pagbank: pedido.id
    })

    if (!recarga) {
      return res.status(500).json({ message: 'Erro ao solicitar recarga' })
    }

    //notificacao de solicitacao
    await notificacaoDAO.criarNotificacao({
      id_usuario: id_usuario,
      tipo: 'pagamento',
      titulo: 'Recarga Solicitada 💰',
      mensagem: `Recarga de R$ ${valor} solicitada. Aguardando pagamento PIX.`
    })

    res.status(201).json({
      message: 'Recarga solicitada com sucesso. Aguardando pagamento.',
      recarga: {
        id: recarga.id,
        status: 'PENDENTE',
        valor: Number(valor),
        metodo: metodo
      },
      pedido: {
        id: pedido.id,
        qr_codes: pedido.qr_codes,
        reference_id: pedido.reference_id
      }
    })

  } catch (error) {
    console.error('❌ Erro ao solicitar recarga:', error.response?.data || error.message)
    res.status(500).json({ 
      message: 'Erro ao solicitar recarga',
      detalhes: error.response?.data || error.message
    })
  }
}

const listarRecargas = async function(req, res) {
  try {
    const id_usuario = req.user.id
    res.json({ message: 'Em desenvolvimento' })
  } catch (error) {
    console.error('Erro ao listar recargas:', error)
    res.status(500).json({ message: 'Erro interno' })
  }
}

module.exports = {
  solicitarRecarga,
  listarRecargas
}