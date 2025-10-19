const carteiraDAO = require('../../model/dao/carteira')
const transacaoDAO = require('../../model/dao/transacaoCarteira')

//criar carteira
const criarCarteira = async function(req, res){
    try {
        const { chave_pagbank, saldo } = req.body
        const id_usuario = req.user.id

        if(!chave_pagbank){
            return res.status(400).json({status_code: 400, message: 'Chave PagBank é obrigatória.'})
        }

        const carteiraExistente = await carteiraDAO.selectCarteiraByUsuario(id_usuario)
        if (carteiraExistente) {
            return res.status(400).json({ 
                status_code: 400, 
                message: 'Usuário já possui uma carteira.' 
            })
        }

        const carteira = await carteiraDAO.insertCarteira({
            id_usuario,
            chave_pagbank, 
            saldo: saldo || 0
        })
        
        if(!carteira)
            return res.status(500).json({status_code: 500, message: 'Erro ao criar carteira.'})

        res.status(201).json({status_code: 201, data: carteira})
    } catch (error) {
        console.error(error)
        res.status(500).json({status_code: 500, message: 'Erro interno no servidor.'})
    }
}

const buscarCarteira = async function(req, res){
    try {
        const id_usuario = req.user.id

        const carteira = await carteiraDAO.selectCarteiraByUsuario(id_usuario)
        if(!carteira)
            return res.status(404).json({ status_code: 404, message: 'Carteira não encontrada.' })

        res.status(200).json({ status_code: 200, data: carteira })
    } catch (error) {
        console.error(error)
        res.status(500).json({ status_code: 500, message: 'Erro interno no servidor' })
    }
}
/**
 * transferir valor entre usuários
 */
const transferirValor = async function(req, res) {
  try {
    const { id_destinatario, valor, descricao } = req.body
    const id_remetente = req.user.id

    if (!id_destinatario || !valor) {
      return res.status(400).json({
        status_code: 400,
        message: 'ID do destinatário e valor são obrigatórios'
      })
    }

    //valida valor
    const valorNum = Number(valor)
    if (isNaN(valorNum) || valorNum <= 0) {
      return res.status(400).json({
        status_code: 400,
        message: 'Valor deve ser maior que zero'
      })
    }

    //buscar carteiras
    const carteiraRemetente = await carteiraDAO.selectCarteiraByUsuario(id_remetente)
    const carteiraDestinatario = await carteiraDAO.selectCarteiraByUsuario(id_destinatario)

    if (!carteiraRemetente || !carteiraDestinatario) {
      return res.status(404).json({
        status_code: 404,
        message: 'Carteira não encontrada para um dos usuários'
      })
    }

    //verificar saldo
    if (Number(carteiraRemetente.saldo) < valorNum) {
      return res.status(400).json({
        status_code: 400,
        message: 'Saldo insuficiente'
      })
    }

    // PROCESSAR TRANSFERÊNCIA
    // 1. debitar do remetente
    const novoSaldoRemetente = Number(carteiraRemetente.saldo) - valorNum
    await carteiraDAO.atualizarSaldo(carteiraRemetente.id, novoSaldoRemetente)
    
    // 2. registrar transação de saída
    await transacaoDAO.insertTransacao({
      id_carteira: carteiraRemetente.id,
      tipo: 'SAIDA',
      valor: valorNum,
      descricao: descricao || `Transferência para usuário ${id_destinatario}`
    })

    // 3. creditar no destinatário
    const novoSaldoDestinatario = Number(carteiraDestinatario.saldo) + valorNum
    await carteiraDAO.atualizarSaldo(carteiraDestinatario.id, novoSaldoDestinatario)
    
    // 4. registrat transação de entrada
    await transacaoDAO.insertTransacao({
      id_carteira: carteiraDestinatario.id,
      tipo: 'ENTRADA',
      valor: valorNum,
      descricao: descricao || `Recebimento de usuário ${id_remetente}`
    })

    res.status(200).json({
      status_code: 200,
      message: 'Transferência realizada com sucesso',
      data: {
        valor_transferido: valorNum,
        saldo_remetente: novoSaldoRemetente,
        saldo_destinatario: novoSaldoDestinatario
      }
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({
      status_code: 500,
      message: 'Erro interno no servidor'
    })
  }
}

/**
 * adicionar saldo (recarga)
 */
const adicionarSaldo = async function(req, res) {
  try {
    const { valor } = req.body
    const id_usuario = req.user.id

    if (!valor) {
      return res.status(400).json({
        status_code: 400,
        message: 'Valor é obrigatório'
      })
    }

    const valorNum = Number(valor)
    if (isNaN(valorNum) || valorNum <= 0) {
      return res.status(400).json({
        status_code: 400,
        message: 'Valor deve ser maior que zero'
      })
    }

    const carteira = await carteiraDAO.selectCarteiraByUsuario(id_usuario)
    if (!carteira) {
      return res.status(404).json({
        status_code: 404,
        message: 'Carteira não encontrada'
      })
    }

    const novoSaldo = Number(carteira.saldo) + valorNum
    await carteiraDAO.atualizarSaldo(carteira.id, novoSaldo)

    //registrar transação
    await transacaoDAO.insertTransacao({
      id_carteira: carteira.id,
      tipo: 'ENTRADA',
      valor: valorNum,
      descricao: 'Recarga de saldo'
    })

    res.status(200).json({
      status_code: 200,
      message: 'Saldo adicionado com sucesso',
      data: {
        saldo_anterior: Number(carteira.saldo),
        saldo_atual: novoSaldo,
        valor_adicionado: valorNum
      }
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({
      status_code: 500,
      message: 'Erro interno no servidor'
    })
  }
}

module.exports = {
    criarCarteira,
    buscarCarteira,
    transferirValor,
    adicionarSaldo
}