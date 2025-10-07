const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * cria uma nova avaliação
 */
const insertAvaliacao = async (avaliacao) => {
  try {
    return await prisma.avaliacao.create({
      data: {
        id_servico: avaliacao.id_servico,
        id_contratante: avaliacao.id_contratante,
        id_prestador: avaliacao.id_prestador,
        nota: avaliacao.nota,
        comentario: avaliacao.comentario
      },
      include: {
        servico: true,
        contratante: {
          include: {
            usuario: true
          }
        },
        prestador: {
          include: {
            usuario: true
          }
        }
      }
    })
  } catch (error) {
    console.error('Erro ao criar avaliação:', error)
    throw error
  }
}

/**
 * busca avaliação por ID do serviço
 */
const selectAvaliacaoByServico = async (id_servico) => {
  try {
    return await prisma.avaliacao.findUnique({
      where: { id_servico },
      include: {
        contratante: {
          include: {
            usuario: true
          }
        }
      }
    })
  } catch (error) {
    console.error('Erro ao buscar avaliação:', error)
    return false
  }
}

/**
 * Busca todas as avaliações de um prestador
 */
const selectAvaliacoesByPrestador = async (id_prestador) => {
  try {
    return await prisma.avaliacao.findMany({
      where: { id_prestador },
      include: {
        contratante: {
          include: {
            usuario: true
          }
        },
        servico: true
      },
      orderBy: { data_avaliacao: 'desc' }
    })
  } catch (error) {
    console.error('Erro ao buscar avaliações do prestador:', error)
    return false
  }
}

/**
 * calcula a média de avaliações de um prestador
 */
const selectMediaAvaliacoesByPrestador = async (id_prestador) => {
  try {
    const result = await prisma.avaliacao.aggregate({
      where: { id_prestador },
      _avg: {
        nota: true
      },
      _count: {
        nota: true
      }
    })

    return {
      media: result._avg.nota || 0,
      total_avaliacoes: result._count.nota || 0
    }
  } catch (error) {
    console.error('Erro ao calcular média:', error)
    return { media: 0, total_avaliacoes: 0 }
  }
}

module.exports = {
  insertAvaliacao,
  selectAvaliacaoByServico,
  selectAvaliacoesByPrestador,
  selectMediaAvaliacoesByPrestador
}