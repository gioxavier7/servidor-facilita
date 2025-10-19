/**
 * Controller de Serviço
 * Fluxo:
 *  - Cadastro (apenas contratantes)
 *  - Atualização (com validações de propriedade)
 *  - Exclusão (apenas donos do serviço)
 *  - Listagem / Buscar por ID
 *
 * dev: Giovanna
 * data: 18/10/2025
 */

const servicoDAO = require('../../model/dao/servico')
const contratanteDAO = require('../../model/dao/contratante')
const prestadorDAO = require('../../model/dao/prestador')
const categoriaDAO = require('../../model/dao/categoria')
const { statusServico } = require('@prisma/client')
const notificacaoDAO = require('../../model/dao/notificacao')
const CalculoValorService = require('../../utils/calcularValorService')
const carteiraDAO = require('../../model/dao/carteira')
const transacaoDAO = require('../../model/dao/transacaoCarteira')
const pagamentoDAO = require('../../model/dao/pagamento')

/**
 *cadastrar um novo serviço (APENAS CONTRATANTES) - ATUALIZADO
 */
const cadastrarServico = async (req, res) => {
  try {
    if (req.headers['content-type'] !== 'application/json') {
      return res.status(415).json({ status_code: 415, message: 'Content-type inválido. Use application/json' })
    }

    //verifica se é contratante
    if (!req.user || req.user.tipo_conta !== 'CONTRATANTE') {
      return res.status(403).json({ 
        status_code: 403, 
        message: 'Acesso permitido apenas para contratantes' 
      })
    }

    const { 
      id_categoria, 
      descricao, 
      id_localizacao, 
      valor_adicional = 0,
      origem_lat,
      origem_lng, 
      destino_lat,
      destino_lng
    } = req.body

    if (!descricao || !id_categoria) {
      return res.status(400).json({ 
        status_code: 400, 
        message: 'Campos obrigatórios: descricao, id_categoria' 
      })
    }

    const contratante = await contratanteDAO.selectContratanteByUsuarioId(req.user.id)
    if (!contratante) {
      return res.status(404).json({ 
        status_code: 404, 
        message: 'Perfil de contratante não encontrado' 
      })
    }

    // CALCULAR VALOR AUTOMATICAMENTE
    const calculoValor = await CalculoValorService.calcularValorServico({
      id_categoria,
      valor_adicional,
      origem_lat,
      origem_lng,
      destino_lat,
      destino_lng
    })

    const novoServico = await servicoDAO.insertServico({
      id_contratante: contratante.id,
      id_prestador: null,
      id_categoria: id_categoria,
      descricao,
      id_localizacao: id_localizacao || null,
      valor: calculoValor.valor_total, // valor calculado automaticamente
      status: statusServico.PENDENTE
    })

    if (!novoServico) {
      return res.status(500).json({ status_code: 500, message: 'Erro ao cadastrar serviço' })
    }

    //adicionar detalhes do cálculo na resposta
    novoServico.detalhes_valor = calculoValor

    res.status(201).json({ 
      status_code: 201, 
      message: 'Serviço cadastrado com sucesso', 
      data: novoServico,
      detalhes_calculo: calculoValor
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status_code: 500, message: 'Erro interno do servidor' })
  }
}
/**
 * atualizar um serviço (APENAS DONO DO SERVIÇO)
 */
const atualizarServico = async (req, res) => {
  try {
    if (req.headers['content-type'] !== 'application/json') {
      return res.status(415).json({ status_code: 415, message: 'Content-type inválido. Use application/json' })
    }

    const { id } = req.params
    const { id_categoria, descricao, id_localizacao } = req.body // remove campos sensíveis

    if (!id) {
      return res.status(400).json({ status_code: 400, message: 'ID do serviço é obrigatório' })
    }

    // verifica se o serviço existe e se pertence ao usuairo
    const servicoExistente = await servicoDAO.selectByIdServico(Number(id))
    if (!servicoExistente) {
      return res.status(404).json({ status_code: 404, message: 'Serviço não encontrado' })
    }

    //somente o  dono do serviço pode atualizar
    if (servicoExistente.id_contratante !== req.user.id) {
      return res.status(403).json({ 
        status_code: 403, 
        message: 'Acesso negado. Você não é o proprietário deste serviço' 
      })
    }

    // impede a atualizacao de serviços ja aceitos
    if (servicoExistente.status !== statusServico.PENDENTE) {
      return res.status(400).json({ 
        status_code: 400, 
        message: 'Não é possível atualizar um serviço que já foi aceito' 
      })
    }

    const atualizado = await servicoDAO.updateServico({
      id: Number(id),
      id_prestador: servicoExistente.id_prestador,
      id_categoria: id_categoria || servicoExistente.id_categoria,
      descricao: descricao || servicoExistente.descricao,
      id_localizacao: id_localizacao || servicoExistente.id_localizacao,
      status: servicoExistente.status
    })

    if (!atualizado) {
      return res.status(500).json({ status_code: 500, message: 'Erro ao atualizar serviço' })
    }

    res.status(200).json({ status_code: 200, message: 'Serviço atualizado com sucesso', data: atualizado })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status_code: 500, message: 'Erro interno do servidor' })
  }
}

/**
 * deletar um serviço (APENAS DONO DO SERVIÇO)
 */
const deletarServico = async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ status_code: 400, message: 'ID do serviço é obrigatório' })
    }

    const servicoExistente = await servicoDAO.selectByIdServico(Number(id))
    if (!servicoExistente) {
      return res.status(404).json({ status_code: 404, message: 'Serviço não encontrado' })
    }

    //apenas o dono do serviço pode deletar
    if (servicoExistente.id_contratante !== req.user.id) {
      return res.status(403).json({ 
        status_code: 403, 
        message: 'Acesso negado. Você não é o proprietário deste serviço' 
      })
    }

    if (servicoExistente.status !== statusServico.PENDENTE) {
      return res.status(400).json({ 
        status_code: 400, 
        message: 'Não é possível excluir um serviço que já foi aceito' 
      })
    }

    const deletado = await servicoDAO.deleteServico(Number(id))

    if (!deletado) {
      return res.status(500).json({ status_code: 500, message: 'Erro ao deletar serviço' })
    }

    res.status(200).json({ status_code: 200, message: 'Serviço deletado com sucesso', data: deletado })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status_code: 500, message: 'Erro interno do servidor' })
  }
}

/**
 * Listar todos os serviços (COM FILTROS POR TIPO DE USUÁRIO)
 */
const listarServicos = async (req, res) => {
  try {
    let servicos

    // CONTRATANTES tem apenas seus próprios serviços
    if (req.user.tipo_conta === 'CONTRATANTE') {
      const contratante = await contratanteDAO.selectContratanteByUsuarioId(req.user.id)
      if (!contratante) {
        return res.status(404).json({ 
          status_code: 404, 
          message: 'Perfil de contratante não encontrado' 
        })
      }
      servicos = await servicoDAO.selectServicosPorContratante(contratante.id)
    } 
    // PRESTADORES tem serviços disponíveis + seus serviços aceitos
    else if (req.user.tipo_conta === 'PRESTADOR') {
      
      const prestador = await prestadorDAO.selectPrestadorByUsuarioId(req.user.id)
      
      if (!prestador) {
        return res.status(404).json({ 
          status_code: 404, 
          message: 'Perfil de prestador não encontrado' 
        })
      }

      const [disponiveis, meusServicos] = await Promise.all([
        servicoDAO.selectServicosDisponiveis(),
        servicoDAO.selectServicosPorPrestador(prestador.id) 
      ])
      servicos = {
        disponiveis: disponiveis || [],
        meus_servicos: meusServicos || []
      }
    }
    // ADMIN pode ver todos
    else {
      servicos = await servicoDAO.selectAllServico()
    }

    if (!servicos || (Array.isArray(servicos) && servicos.length === 0)) {
      return res.status(404).json({ status_code: 404, message: 'Nenhum serviço encontrado' })
    }

    res.status(200).json({ status_code: 200, data: servicos })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status_code: 500, message: 'Erro interno do servidor' })
  }
}

/**
 * buscar serviço por ID
 */
const buscarServicoPorId = async (req, res) => {
  try {
    const { id } = req.params

    // validacao
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ 
        status_code: 400, 
        message: 'ID do serviço é obrigatório e deve ser um número válido' 
      })
    }

    const servico = await servicoDAO.selectByIdServico(Number(id))

    if (!servico) {
      return res.status(404).json({ 
        status_code: 404, 
        message: 'Serviço não encontrado' 
      })
    }

    //apenas dono ou prestador atribuído podem ver
    const contratante = await contratanteDAO.selectContratanteByUsuarioId(req.user.id)
    const isDono = servico.id_contratante === contratante?.id
    const isPrestadorAtribuido = servico.id_prestador === req.user.id
    
    if (!isDono && !isPrestadorAtribuido && req.user.tipo_conta !== 'ADMIN') {
      return res.status(403).json({ 
        status_code: 403, 
        message: 'Acesso negado a este serviço' 
      })
    }

    res.status(200).json({ status_code: 200, data: servico })
  } catch (error) {
    console.error('Erro ao buscar serviço por ID:', error)
    res.status(500).json({ 
      status_code: 500, 
      message: 'Erro interno do servidor' 
    })
  }
}

/**
 * listar serviços disponíveis para prestadores
 */
const listarServicosDisponiveis = async (req, res) => {
  try {
    // verifica se o usuário é um prestador
    if (!req.user || req.user.tipo_conta !== 'PRESTADOR') {
      return res.status(403).json({ 
        status_code: 403, 
        message: 'Acesso permitido apenas para prestadores' 
      })
    }

    const servicos = await servicoDAO.selectServicosDisponiveis()

    if (!servicos) {
      return res.status(404).json({ 
        status_code: 404, 
        message: 'Nenhum serviço disponível encontrado' 
      })
    }

    res.status(200).json({ 
      status_code: 200, 
      data: servicos 
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ 
      status_code: 500, 
      message: 'Erro interno do servidor' 
    })
  }
}

const aceitarServico = async (req, res) => {
  try {
    if (!req.user || req.user.tipo_conta !== 'PRESTADOR') {
      return res.status(403).json({ 
        status_code: 403, 
        message: 'Acesso permitido apenas para prestadores' 
      })
    }

    const { id } = req.params

    if (!id) {
      return res.status(400).json({ 
        status_code: 400, 
        message: 'ID do serviço é obrigatório' 
      })
    }

    const prestador = await prestadorDAO.selectPrestadorByUsuarioId(req.user.id)
    
    if (!prestador) {
      return res.status(404).json({ 
        status_code: 404, 
        message: 'Perfil de prestador não encontrado' 
      })
    }

    const servicoAceito = await servicoDAO.aceitarServico(Number(id), prestador.id)

    try {
      await notificacaoDAO.criarNotificacao({
        id_usuario: servicoAceito.contratante.id_usuario,
        id_servico: servicoAceito.id,
        tipo: 'servico',
        titulo: 'Serviço Aceito! 🎉',
        mensagem: `O prestador ${prestador.usuario.nome} aceitou seu serviço "${servicoAceito.descricao.substring(0, 50)}..."`
      })
    } catch (notificacaoError) {
      console.error('Erro ao criar notificação:', notificacaoError)
    }

    res.status(200).json({ 
      status_code: 200, 
      message: 'Serviço aceito com sucesso', 
      data: servicoAceito 
    })
  } catch (error) {
    console.error(error)
    
    if (error.message.includes('já possui um serviço em andamento')) {
      return res.status(400).json({ 
        status_code: 400, 
        message: error.message 
      })
    }
    
    if (error.message.includes('não está mais disponível')) {
      return res.status(400).json({ 
        status_code: 400, 
        message: error.message 
      })
    }

    res.status(500).json({ 
      status_code: 500, 
      message: 'Erro interno do servidor' 
    })
  }
}

/**
 * finaliza um serviço (prestador)
 */
const finalizarServico = async (req, res) => {
  try {
    if (!req.user || req.user.tipo_conta !== 'PRESTADOR') {
      return res.status(403).json({ 
        status_code: 403, 
        message: 'Acesso permitido apenas para prestadores' 
      })
    }

    const { id } = req.params

    if (!id) {
      return res.status(400).json({ 
        status_code: 400, 
        message: 'ID do serviço é obrigatório' 
      })
    }
    
    const prestador = await prestadorDAO.selectPrestadorByUsuarioId(req.user.id)
    
    if (!prestador) {
      return res.status(404).json({ 
        status_code: 404, 
        message: 'Perfil de prestador não encontrado' 
      })
    }

    const servicoFinalizado = await servicoDAO.finalizarServico(Number(id), prestador.id)

    try {
      await notificacaoDAO.criarNotificacao({
        id_usuario: servicoFinalizado.contratante.id_usuario,
        id_servico: servicoFinalizado.id,
        tipo: 'servico_finalizado',
        titulo: 'Serviço Finalizado! ✅',
        mensagem: `O prestador ${prestador.usuario.nome} finalizou o serviço "${servicoFinalizado.descricao.substring(0, 30)}...". Aguarde sua confirmação.`
      })
    } catch (notificacaoError) {
      console.error('Erro ao criar notificação:', notificacaoError)
    }

    res.status(200).json({ 
      status_code: 200, 
      message: 'Serviço finalizado com sucesso', 
      data: servicoFinalizado 
    })
  } catch (error) {
    console.error(error)
    
    if (error.message.includes('não autorizado') || 
        error.message.includes('não está em andamento')) {
      return res.status(400).json({ 
        status_code: 400, 
        message: error.message 
      })
    }

    res.status(500).json({ 
      status_code: 500, 
      message: 'Erro interno do servidor' 
    })
  }
}
/**
 * listar serviços do prestador autenticado
 */
const listarMeusServicos = async (req, res) => {
  try {
    // verifica se o usuário é um prestador
    if (!req.user || req.user.tipo_conta !== 'PRESTADOR') {
      return res.status(403).json({ 
        status_code: 403, 
        message: 'Acesso permitido apenas para prestadores' 
      })
    }
  
    const prestador = await prestadorDAO.selectPrestadorByUsuarioId(req.user.id)
    
    if (!prestador) {
      return res.status(404).json({ 
        status_code: 404, 
        message: 'Perfil de prestador não encontrado' 
      })
    }

    const servicos = await servicoDAO.selectServicosPorPrestador(prestador.id)

    if (!servicos || servicos.length === 0) {
      return res.status(404).json({ 
        status_code: 404, 
        message: 'Nenhum serviço encontrado' 
      })
    }

    res.status(200).json({ 
      status_code: 200, 
      data: servicos 
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ 
      status_code: 500, 
      message: 'Erro interno do servidor' 
    })
  }
}

/**
 *listar pedidos/histórico de serviços do contratante autenticado
 */
const listarPedidosContratante = async (req, res) => {
  try {
    // verifica se é contratante
    if (!req.user || req.user.tipo_conta !== 'CONTRATANTE') {
      return res.status(403).json({ 
        status_code: 403, 
        message: 'Acesso permitido apenas para contratantes' 
      })
    }

    const { status, page = 1, limit = 10 } = req.query

    //busca o perfil do contratante
    const contratante = await contratanteDAO.selectContratanteByUsuarioId(req.user.id)
    
    if (!contratante) {
      return res.status(404).json({ 
        status_code: 404, 
        message: 'Perfil de contratante não encontrado' 
      })
    }

    //busca os serviços do contratante com possíveis filtros
    let servicos
    if (status) {
      //valida se o status é válido
      if (!Object.values(statusServico).includes(status)) {
        return res.status(400).json({
          status_code: 400,
          message: `Status inválido. Status válidos: ${Object.values(statusServico).join(', ')}`
        })
      }
      servicos = await servicoDAO.selectServicosPorContratanteEStatus(
        contratante.id, 
        status,
        parseInt(page),
        parseInt(limit)
      )
    } else {
      servicos = await servicoDAO.selectServicosPorContratante(
        contratante.id,
        parseInt(page),
        parseInt(limit)
      )
    }

    if (!servicos || servicos.length === 0) {
      return res.status(404).json({ 
        status_code: 404, 
        message: 'Nenhum pedido encontrado' 
      })
    }

    //resposta com os campos corretos do schema
    const pedidosFormatados = servicos.map(servico => ({
      id: servico.id,
      descricao: servico.descricao,
      status: servico.status,
      valor: servico.valor ? servico.valor.toNumber() : null, //decimal para number
      data_solicitacao: servico.data_solicitacao,
      data_conclusao: servico.data_conclusao,
      categoria: servico.categoria ? {
        id: servico.categoria.id,
        nome: servico.categoria.nome
      } : null,
      localizacao: servico.localizacao ? {
        id: servico.localizacao.id,
        endereco: servico.localizacao.endereco,
        cidade: servico.localizacao.cidade,
        estado: servico.localizacao.estado
      } : null,
      prestador: servico.prestador ? {
        id: servico.prestador.id,
        usuario: {
          nome: servico.prestador.usuario.nome,
          email: servico.prestador.usuario.email
        }
      } : null
    }))

    //paginação
    const totalPedidos = await servicoDAO.countServicosPorContratante(contratante.id)
    const totalPages = Math.ceil(totalPedidos / parseInt(limit))

    res.status(200).json({
      status_code: 200,
      data: {
        pedidos: pedidosFormatados,
        paginacao: {
          pagina_atual: parseInt(page),
          total_paginas: totalPages,
          total_pedidos: totalPedidos,
          por_pagina: parseInt(limit)
        }
      }
    })

  } catch (error) {
    console.error('Erro ao listar pedidos do contratante:', error)
    res.status(500).json({ 
      status_code: 500, 
      message: 'Erro interno do servidor' 
    })
  }
}

/**
 * buscar pedido específico do contratante
 */
const buscarPedidoContratante = async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ 
        status_code: 400, 
        message: 'ID do pedido é obrigatório' 
      })
    }

    //verifica se é contratante
    if (!req.user || req.user.tipo_conta !== 'CONTRATANTE') {
      return res.status(403).json({ 
        status_code: 403, 
        message: 'Acesso permitido apenas para contratantes' 
      })
    }

    const servico = await servicoDAO.selectByIdServico(Number(id))

    if (!servico) {
      return res.status(404).json({ 
        status_code: 404, 
        message: 'Pedido não encontrado' 
      })
    }

    //verifica se o pedido pertence ao contratante
    const contratante = await contratanteDAO.selectContratanteByUsuarioId(req.user.id)
    if (servico.id_contratante !== contratante.id) {
      return res.status(403).json({ 
        status_code: 403, 
        message: 'Acesso negado a este pedido' 
      })
    }

    //resposta com detalhes completos usando campos corretos
    const pedidoDetalhado = {
      id: servico.id,
      descricao: servico.descricao,
      status: servico.status,
      valor: servico.valor ? servico.valor.toNumber() : null,
      data_solicitacao: servico.data_solicitacao,
      data_conclusao: servico.data_conclusao,
      categoria: servico.categoria ? {
        id: servico.categoria.id,
        nome: servico.categoria.nome,
        descricao: servico.categoria.descricao
      } : null,
      localizacao: servico.localizacao ? {
        id: servico.localizacao.id,
        endereco: servico.localizacao.endereco,
        cidade: servico.localizacao.cidade,
        estado: servico.localizacao.estado,
        cep: servico.localizacao.cep
      } : null,
      prestador: servico.prestador ? {
        id: servico.prestador.id,
        telefone: servico.prestador.telefone,
        usuario: {
          nome: servico.prestador.usuario.nome,
          email: servico.prestador.usuario.email
        }
      } : null
    }

    res.status(200).json({ 
      status_code: 200, 
      data: pedidoDetalhado 
    })

  } catch (error) {
    console.error('Erro ao buscar pedido:', error)
    res.status(500).json({ 
      status_code: 500, 
      message: 'Erro interno do servidor' 
    })
  }
}

/**
 * confirmar a conclusão de um serviço (contratante)
 */
const confirmarConclusao = async (req, res) => {
  try {
    if (!req.user || req.user.tipo_conta !== 'CONTRATANTE') {
      return res.status(403).json({
        status_code: 403,
        message: 'Acesso permitido apenas para contratantes'
      })
    }

    const { id } = req.params

    if (!id) {
      return res.status(400).json({
        status_code: 400,
        message: 'ID do serviço é obrigatório'
      })
    }

    const contratante = await contratanteDAO.selectContratanteByUsuarioId(req.user.id)

    if (!contratante) {
      return res.status(404).json({
        status_code: 404,
        message: 'Perfil de contratante não encontrado'
      })
    }

    const servicoConcluido = await servicoDAO.confirmarConclusao(Number(id), contratante.id)

    try {
      await notificacaoDAO.criarNotificacao({
        id_usuario: servicoConcluido.prestador.id_usuario,
        id_servico: servicoConcluido.id,
        tipo: 'servico_confirmado',
        titulo: 'Serviço Confirmado! 🎊',
        mensagem: `O contratante confirmou a conclusão do serviço "${servicoConcluido.descricao.substring(0, 30)}...". Pagamento liberado!`
      })
    } catch (notificacaoError) {
      console.error('Erro ao criar notificação:', notificacaoError)
    }

    res.status(200).json({
      status_code: 200,
      message: 'Serviço concluído com sucesso',
      data: servicoConcluido
    })
  } catch (error) {
    console.error('Erro ao confirmar conclusão do serviço:', error)

    if (error.message.includes('não autorizado') || error.message.includes('não está finalizado')) {
      return res.status(400).json({
        status_code: 400,
        message: error.message
      })
    }

    res.status(500).json({
      status_code: 500,
      message: 'Erro interno do servidor'
    })
  }
}

/**
 * pesquisar serviços por descrição
 */
const pesquisarPorDescricao = async (req, res) => {
  try {
    const { descricao } = req.query

    if (!descricao) {
      return res.status(400).json({
        status_code: 400,
        message: 'O parâmetro "descricao" é obrigatório'
      })
    }

    const servicos = await servicoDAO.pesquisarPorDescricao(descricao)

    if (!servicos || servicos.length === 0) {
      return res.status(404).json({
        status_code: 404,
        message: 'Nenhum serviço encontrado com a descrição fornecida'
      })
    }

    res.status(200).json({
      status_code: 200,
      data: servicos
    })
  } catch (error) {
    console.error('Erro ao pesquisar serviços por descrição:', error)
    res.status(500).json({
      status_code: 500,
      message: 'Erro interno do servidor'
    })
  }
}

/**
 * filtrar serviços por categoria
 */
const filtrarPorCategoria = async (req, res) => {
  try {
    const { categoriaId } = req.query

    if (!categoriaId) {
      return res.status(400).json({
        status_code: 400,
        message: 'O parâmetro "categoriaId" é obrigatório'
      })
    }

    const servicos = await servicoDAO.filtrarPorCategoria(Number(categoriaId))

    if (!servicos || servicos.length === 0) {
      return res.status(404).json({
        status_code: 404,
        message: 'Nenhum serviço encontrado para a categoria fornecida'
      })
    }

    res.status(200).json({
      status_code: 200,
      data: servicos
    })
  } catch (error) {
    console.error('Erro ao filtrar serviços por categoria:', error)
    res.status(500).json({
      status_code: 500,
      message: 'Erro interno do servidor'
    })
  }
}

/**
 * criar serviço a partir de categoria pré-defina
 */
const criarServicoPorCategoria = async (req, res) => {
  try {
    // verifica se é contratante
    if (!req.user || req.user.tipo_conta !== 'CONTRATANTE') {
      return res.status(403).json({
        status_code: 403,
        message: 'Acesso permitido apenas para contratantes'
      })
    }

    const { categoriaId } = req.params
    const { 
      descricao_personalizada, 
      id_localizacao, 
      valor_adicional = 0,
      origem_lat, 
      origem_lng, 
      destino_lat, 
      destino_lng 
    } = req.body

    if (!categoriaId) {
      return res.status(400).json({
        status_code: 400,
        message: 'ID da categoria é obrigatório'
      })
    }

    // busca perfil do contratante
    const contratante = await contratanteDAO.selectContratanteByUsuarioId(req.user.id)
    if (!contratante) {
      return res.status(404).json({
        status_code: 404,
        message: 'Perfil de contratante não encontrado'
      })
    }

    const categoria = await categoriaDAO.selectByIdCategoria(Number(categoriaId))
    if (!categoria) {
      return res.status(404).json({
        status_code: 404,
        message: 'Categoria não encontrada'
      })
    }

    const calculoValor = await CalculoValorService.calcularValorServico({
      id_categoria: categoria.id,
      valor_adicional: valor_adicional,
      origem_lat: origem_lat,
      origem_lng: origem_lng,
      destino_lat: destino_lat,
      destino_lng: destino_lng
    })

    // prepara dados do serviço
    const dadosServico = {
      id_contratante: contratante.id,
      id_categoria: categoria.id,
      descricao: descricao_personalizada || `Serviço de ${categoria.nome}`,
      id_localizacao: id_localizacao || contratante.id_localizacao,
      valor: calculoValor.valor_total,
      status: 'PENDENTE'
    }

    // cria o serviço
    const novoServico = await servicoDAO.insertServico(dadosServico)

    if (!novoServico) {
      return res.status(500).json({
        status_code: 500,
        message: 'Erro ao criar o serviço'
      })
    }

    res.status(201).json({
      status_code: 201,
      message: `Serviço de ${categoria.nome} criado com sucesso`,
      data: {
        servico: novoServico,
        categoria: {
          nome: categoria.nome,
          descricao: categoria.descricao,
          icone: categoria.icone,
          preco_base: categoria.preco_base,
          tempo_medio: categoria.tempo_medio
        },
        detalhes_calculo: {
          valor_base: calculoValor.valor_base,
          valor_adicional: calculoValor.valor_adicional,
          valor_distancia: calculoValor.valor_distancia,
          valor_total: calculoValor.valor_total,
          distancia_km: calculoValor.detalhes.distancia_km
        }
      }
    })

  } catch (error) {
    console.error('Erro ao criar serviço por categoria:', error)
    res.status(500).json({
      status_code: 500,
      message: 'Erro interno do servidor'
    })
  }
}

/**
 * pagar serviço com saldo da carteira (transferência interna)
 */
const pagarServicoComCarteira = async (req, res) => {
  try {
    const { id_servico } = req.body
    const id_usuario = req.user.id

    console.log('💳 Pagando serviço:', id_servico, 'Usuário logado:', id_usuario)

    if (!id_servico) {
      return res.status(400).json({
        status_code: 400,
        message: 'ID do serviço é obrigatório'
      })
    }

    //buscar serviço
    const servico = await servicoDAO.selectServicoById(id_servico)
    if (!servico) {
      return res.status(404).json({
        status_code: 404,
        message: 'Serviço não encontrado'
      })
    }

    if (servico.contratante.id_usuario !== id_usuario) {
      console.log('❌ Acesso negado - IDs não coincidem:', {
        contratante_usuario_id: servico.contratante.id_usuario,
        usuario_logado: id_usuario
      })
      return res.status(403).json({
        status_code: 403,
        message: 'Acesso negado. Você não é o contratante deste serviço.'
      })
    }

    const valorServico = Number(servico.valor)

    const carteiraContratante = await carteiraDAO.selectCarteiraByUsuario(id_usuario)
    const carteiraPrestador = await carteiraDAO.selectCarteiraByUsuario(servico.prestador.id_usuario)

    if (!carteiraContratante || !carteiraPrestador) {
      return res.status(404).json({
        status_code: 404,
        message: 'Carteira não encontrada para um dos usuários'
      })
    }

    //verificar saldo do contratante
    const saldoContratante = Number(carteiraContratante.saldo)

    if (saldoContratante < valorServico) {
      return res.status(400).json({
        status_code: 400,
        message: 'Saldo insuficiente. Recarregue sua carteira.'
      })
    }

    // PROCESSAR TRANSFERÊNCIA INTERNA
    // 1. debitar do contratante
    const novoSaldoContratante = saldoContratante - valorServico
    await carteiraDAO.atualizarSaldo(carteiraContratante.id, novoSaldoContratante)
    
    // 2. registrar transação de saída (contratante)
    await transacaoDAO.insertTransacao({
      id_carteira: carteiraContratante.id,
      tipo: 'SAIDA',
      valor: valorServico,
      descricao: `Pagamento serviço #${servico.id}`
    })

    // 3. creditar no prestador
    const saldoPrestador = Number(carteiraPrestador.saldo)
    const novoSaldoPrestador = saldoPrestador + valorServico
    await carteiraDAO.atualizarSaldo(carteiraPrestador.id, novoSaldoPrestador)
    
    // 4. registrar transação de entrada (prestador)
    await transacaoDAO.insertTransacao({
      id_carteira: carteiraPrestador.id,
      tipo: 'ENTRADA',
      valor: valorServico,
      descricao: `Recebimento serviço #${servico.id}`
    })

    // 5. criar registro de pagamento interno
    await pagamentoDAO.insertPagamento({
      id_servico: servico.id,
      id_contratante: servico.id_contratante,
      id_prestador: servico.id_prestador,
      valor: valorServico * 100, // em centavos
      metodo: 'CARTEIRA_PAGBANK',
      status: 'PAGO',
      id_pagbank: null // pagamento interno
    })

    // 6. atualizar status do serviço (se necessário)
    if (servico.status !== 'FINALIZADO') {
      await servicoDAO.updateServico(servico.id, {
        status: 'FINALIZADO',
        data_conclusao: new Date()
      })
    }

    res.status(200).json({
      status_code: 200,
      message: 'Serviço pago com sucesso!',
      data: {
        servico_id: servico.id,
        valor_pago: valorServico,
        saldo_contratante: novoSaldoContratante,
        saldo_prestador: novoSaldoPrestador,
        status: 'PAGO'
      }
    })

  } catch (error) {
    console.error('❌ Erro ao pagar serviço:', error)
    res.status(500).json({
      status_code: 500,
      message: 'Erro interno do servidor'
    })
  }
}

module.exports = {
  cadastrarServico,
  atualizarServico,
  deletarServico,
  listarServicos,
  buscarServicoPorId,
  listarServicosDisponiveis,
  aceitarServico,
  finalizarServico,
  listarMeusServicos,
  listarPedidosContratante,
  buscarPedidoContratante,
  confirmarConclusao,
  pesquisarPorDescricao,
  filtrarPorCategoria,
  criarServicoPorCategoria,
  pagarServicoComCarteira
}
