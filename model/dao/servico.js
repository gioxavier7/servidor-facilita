/**
 * objetivo: DAO responsável pelo CRUD de serviços usando Prisma
 * data: 25/09/2025
 * dev: Giovanna
 * versão: 1.1
 */

const { PrismaClient, StatusServico } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * cadastra um novo serviço
 * @param {Object} servico - {id_contratante, id_prestador?, id_categoria?, descricao, id_localizacao?, status?}
 * @returns {Object|false} - serviço criado ou false em caso de erro
 */
const insertServico = async (servico) => {
  try {
    const novoServico = await prisma.servico.create({
      data: {
        id_contratante: servico.id_contratante,
        id_prestador: servico.id_prestador,
        id_categoria: servico.id_categoria,
        descricao: servico.descricao,
        id_localizacao: servico.id_localizacao,
        status: servico.status
      },
      include: {
        contratante: true,
        prestador: true,
        categoria: true,
        localizacao: true,
        pagamentos: true
      }
    })

    return novoServico
  } catch (error) {
    console.error("Erro ao inserir serviço:", error)
    return false
  }
}

/**
 * atualiza um serviço existente
 * @param {Object} servico - {id, id_prestador?, id_categoria?, descricao?, id_localizacao?, status?}
 * @returns {Object|false} - serviço atualizado ou false
 */
const updateServico = async (servico) => {
  try {
    const atualizado = await prisma.servico.update({
      where: { id: servico.id },
      data: {
        id_prestador: servico.id_prestador,
        id_categoria: servico.id_categoria,
        descricao: servico.descricao,
        id_localizacao: servico.id_localizacao,
        status: servico.status
      },
      include: {
        contratante: true,
        prestador: true,
        categoria: true,
        localizacao: true,
        pagamentos: true
      }
    })

    return atualizado
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error)
    return false
  }
}

/**
 * deleta um serviço pelo ID
 * @param {number} id
 * @returns {Object|false} - serviço deletado ou false
 */
const deleteServico = async (id) => {
  try {
    const deletado = await prisma.servico.delete({
      where: { id: id },
      include: {
        contratante: true,
        prestador: true,
        categoria: true,
        localizacao: true
      }
    })

    return deletado
  } catch (error) {
    console.error('Erro ao deletar serviço:', error)  
    return false
  }
}

/**
 * retorna todos os serviços
 * @returns {Array|false} - lista de serviços ou false
 */
const selectAllServico = async () => {
  try {
    const servicos = await prisma.servico.findMany({
      orderBy: { id: 'desc' },
      include: {
        contratante: true,
        prestador: true,
        categoria: true,
        localizacao: true,
        pagamentos: true
      }
    })

    return servicos
  } catch (error) {
    console.error('Erro ao buscar serviços: ', error)   
    return false
  }
}

/**
 * retorna um serviço pelo ID
 * @param {number} id
 * @returns {Object|false} - serviço ou false
 */
const selectByIdServico = async (id) => {
  try {
    const servico = await prisma.servico.findUnique({
      where: { id: id },
      include: {
        contratante: true,
        prestador: true,
        categoria: true,
        localizacao: true,
        pagamentos: true
      }
    })

    return servico || false
  } catch (error) {
    console.error("Erro ao buscar serviço por ID:", error)
    return false
  }
}

/**
 * retorna um serviço pelo ID incluindo apenas contratante e prestador
 * @param {number} id
 * @returns {Object|false} - serviço ou false
 */
const selectServicoById = async (id) => {
  try {
    const servico = await prisma.servico.findUnique({
      where: { id },
      include: {
        contratante: true,
        prestador: true
      }
    });

    return servico || false;
  } catch (error) {
    console.error("Erro ao buscar serviço por ID (PagBank):", error);
    return false;
  }
}

/**
 * Retorna serviços por contratante
 * @param {number} contratanteId 
 * @returns {Array|false} - lista de serviços do contratante
 */
const selectServicosPorContratante = async (contratanteId) => {
  try {
    const servicos = await prisma.servico.findMany({
      where: { 
        id_contratante: contratanteId 
      },
      orderBy: { data_solicitacao: 'desc' },
      include: {
        prestador: {
          include: {
            usuario: true
          }
        },
        categoria: true,
        localizacao: true
      }
    })

    return servicos
  } catch (error) {
    console.error('Erro ao buscar serviços do contratante: ', error)   
    return false
  }
}

/**
 * Retorna serviços disponíveis (PENDENTE) para prestadores
 * @returns {Array|false} - lista de serviços disponíveis ou false
 */
const selectServicosDisponiveis = async () => {
  try {
    const servicos = await prisma.servico.findMany({
      where: { 
        status: StatusServico.PENDENTE
      },
      orderBy: { data_solicitacao: 'desc' },
      include: {
        contratante: {
          include: {
            usuario: true
          }
        },
        categoria: true,
        localizacao: true
      }
    })

    return servicos
  } catch (error) {
    console.error('Erro ao buscar serviços disponíveis: ', error)   
    return false
  }
}

/**
 * Aceita um serviço (muda status para EM_ANDAMENTO e atribui ao prestador)
 * @param {number} servicoId 
 * @param {number} prestadorId 
 * @returns {Object|false} - serviço atualizado ou false
 */
const aceitarServico = async (servicoId, prestadorId) => {
  try {
    //verifica se o prestador já tem algum serviço em andamento
    const servicoEmAndamento = await prisma.servico.findFirst({
      where: {
        id_prestador: prestadorId,
        status: StatusServico.EM_ANDAMENTO
      }
    })

    if (servicoEmAndamento) {
      throw new Error('Prestador já possui um serviço em andamento')
    }

    //verifica se o serviço ainda está disponível
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId }
    })

    if (!servico || servico.status !== StatusServico.PENDENTE) {
      throw new Error('Serviço não está mais disponível')
    }

    // Atualiza o serviço
    const servicoAtualizado = await prisma.servico.update({
      where: { id: servicoId },
      data: {
        id_prestador: prestadorId,
        status: StatusServico.EM_ANDAMENTO
      },
      include: {
        contratante: {
          include: {
            usuario: true
          }
        },
        prestador: {
          include: {
            usuario: true
          }
        },
        categoria: true,
        localizacao: true
      }
    })

    return servicoAtualizado
  } catch (error) {
    console.error('Erro ao aceitar serviço:', error)
    throw error
  }
}

/**
 * finaliza um serviço (muda status para FINALIZADO)
 * @param {number} servicoId 
 * @param {number} prestadorId 
 * @returns {Object|false} - serviço finalizado ou false
 */
const finalizarServico = async (servicoId, prestadorId) => {
  try {
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId }
    })

    if (!servico || servico.id_prestador !== prestadorId) {
      throw new Error('Serviço não encontrado ou prestador não autorizado')
    }

    if (servico.status !== StatusServico.EM_ANDAMENTO) {
      throw new Error('Serviço não está em andamento')
    }

    const servicoFinalizado = await prisma.servico.update({
      where: { id: servicoId },
      data: {
        status: StatusServico.FINALIZADO,
        data_conclusao: new Date()
      },
      include: {
        contratante: {
          include: {
            usuario: true
          }
        },
        prestador: {
          include: {
            usuario: true
          }
        },
        categoria: true,
        localizacao: true
      }
    })

    return servicoFinalizado
  } catch (error) {
    console.error('Erro ao finalizar serviço:', error)
    throw error
  }
}

/**
 * busca serviços por prestador
 * @param {number} prestadorId 
 * @returns {Array|false} - lista de serviços do prestador
 */
const selectServicosPorPrestador = async (prestadorId) => {
  try {
    const servicos = await prisma.servico.findMany({
      where: { 
        id_prestador: prestadorId 
      },
      orderBy: { data_solicitacao: 'desc' },
      include: {
        contratante: {
          include: {
            usuario: true
          }
        },
        categoria: true,
        localizacao: true
      }
    })

    return servicos
  } catch (error) {
    console.error('Erro ao buscar serviços do prestador: ', error)   
    return false
  }
}

module.exports = {
  insertServico,
  selectAllServico,
  selectByIdServico,
  updateServico,
  deleteServico,
  selectServicoById,
  selectServicosDisponiveis,
  aceitarServico,
  finalizarServico,
  selectServicosPorPrestador,
  selectServicosPorContratante
}