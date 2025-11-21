import prisma from "../../prisma.js";

/**
 * criar notificação
 */
const criarNotificacao = async (dados) => {
  try {
    return await prisma.notificacao.create({
      data: {
        id_usuario: dados.id_usuario,
        id_servico: dados.id_servico,
        tipo: dados.tipo,
        titulo: dados.titulo,
        mensagem: dados.mensagem
      }
    })
  } catch (error) {
    console.error('Erro ao criar notificação:', error)
    throw error
  }
}

/**
 * listar notificações do usuário
 */
const listarNotificacoes = async (id_usuario, apenasNaoLidas = false) => {
  try {
    const where = { id_usuario }
    if (apenasNaoLidas) {
      where.lida = false
    }

    return await prisma.notificacao.findMany({
      where,
      include: {
        servico: {
          select: {
            id: true,
            descricao: true,
            status: true
          }
        }
      },
      orderBy: {
        data_criacao: 'desc'
      },
      take: 100
    })
  } catch (error) {
    console.error('Erro ao listar notificações:', error)
    throw error
  }
}

/**
 * marcar notificação como lida
 */
const marcarComoLida = async (id) => {
  try {
    return await prisma.notificacao.update({
      where: { id },
      data: { lida: true }
    })
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error)
    throw error
  }
}

/**
 * marcar todas como lidas
 */
const marcarTodasComoLidas = async (id_usuario) => {
  try {
    return await prisma.notificacao.updateMany({
      where: { 
        id_usuario,
        lida: false
      },
      data: { lida: true }
    })
  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error)
    throw error
  }
}

/**
 * contar notificações não lidas
 */
const contarNaoLidas = async (id_usuario) => {
  try {
    return await prisma.notificacao.count({
      where: {
        id_usuario,
        lida: false
      }
    })
  } catch (error) {
    console.error('Erro ao contar notificações não lidas:', error)
    throw error
  }
}

module.exports = {
  criarNotificacao,
  listarNotificacoes,
  marcarComoLida,
  marcarTodasComoLidas,
  contarNaoLidas
}