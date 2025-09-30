/**
 * objetivo: DAO responsável pelo CRUD de serviços usando Prisma
 * data: 25/09/2025
 * dev: Giovanna
 * versão: 1.1
 */

const { PrismaClient } = require('@prisma/client')
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

module.exports = {
  insertServico,
  selectAllServico,
  selectByIdServico,
  updateServico,
  deleteServico,
  selectServicoById 
};