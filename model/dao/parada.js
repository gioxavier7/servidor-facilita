/**
 * DAO para operações com paradas de serviço
 * dev: Giovanna Xavier
 * data: 23/10/2025
 */
const { PrismaClient } = require('../../prisma/generated/client')
const prisma = new PrismaClient()

const insertParadas = async (paradas) => {
  try {
    const paradasCriadas = await prisma.servico_parada.createMany({
      data: paradas,
    })

    // buscar as paradas criadas para retornar com ID
    const primeiraParada = paradas[0]
    const paradasCompletas = await prisma.servico_parada.findMany({
      where: {
        id_servico: primeiraParada.id_servico,
    },
    orderBy: {
        ordem: "asc",
      },
    })

    return paradasCompletas
  } catch (error) {
    console.error("Erro ao inserir paradas:", error)
    return false
  }
}
/**
 * busca todas as paradas de um serviço ordenadas pela ordem
 * @param {number} id_servico - ID do serviço
 * @returns {Array|false} - array de paradas ou false em caso de erro
 */
const selectParadasByServico = async (id_servico) => {
    try {
        const paradas = await prisma.servico_parada.findMany({
            where: { id_servico },
            orderBy: { ordem: 'asc' },
        })
        return paradas
    } catch (error) {
        console.error("Erro ao buscar paradas do serviço:", error)
        return false
    }
}
/**
 * atualiza o tempo estimado de chegada para uma parada
 * @param {number} id_parada - ID da parada
 * @param {number} tempo_estimado_chegada - tempo em minutos
 * @returns {Object|false} - parada atualizada ou false em caso de erro
 */
const updateTempoEstimado = async (id_parada, tempo_estimado_chegada) => {
    try {
        const paradaAtualizada = await prisma.servico_parada.update({
            where: { id: id_parada },
            data: { tempo_estimado_chegada },
        })
        return paradaAtualizada
    } catch (error) {
        console.error("Erro ao atualizar tempo estimado de chegada:", error)
        return false
    }
}
/**
 * remove todas as paradas de um serviço
 * @param {number} id_servico - ID do serviço
 * @returns {boolean} - true se sucesso, false se erro
 */
const deleteParadasByServico = async (id_servico) => {
    try {
        await prisma.servico_parada.deleteMany({
            where: { id_servico },
        })
        return true
    } catch (error) {
        console.error("Erro ao deletar paradas do serviço:", error)
        return false
    }
}

/**
 * busca uma parada específica por ID
 * @param {number} id_parada - ID da parada
 * @returns {Object|false} - parada encontrada ou false em caso de erro
 */
const selectParadaById = async (id_parada) => {
    try {
        const parada = await prisma.servico_parada.findUnique({
            where: { id: id_parada },
        })
        return parada
    } catch (error) {
        console.error("Erro ao buscar parada por ID:", error)
        return false
    }
}
/**
 * atualiza uma parada específica
 * @param {number} id_parada - ID da parada
 * @param {Object} dados - dados para atualizar
 * @returns {Object|false} - parada atualizada ou false em caso de erro
 */
const updateParada = async (id_parada, dados) => {
    try {
        const paradaAtualizada = await prisma.servico_parada.update({
            where: { id: id_parada },
            data: dados,
        })
        return paradaAtualizada
    } catch (error) {
        console.error("Erro ao atualizar parada:", error)
        return false
    }
}

module.exports = {
    insertParadas,
    selectParadasByServico,
    updateTempoEstimado,
    deleteParadasByServico,
    selectParadaById,
    updateParada,
}