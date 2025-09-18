/**
 * objetivo: DAO responsável pelo CRUD de contratantes usando Prisma
 * data: 13/09/2025
 * dev: Giovanna
 * versão: 1.0
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * cadastra um novo contratante
 * @param {Object} contratante - {id_usuario, id_localizacao, necessidade}
 * @returns {Object|false} - contratante criado ou false em caso de erro
 */
const insertContratante = async (contratante) => {
  try {
    const novoContratante = await prisma.contratante.create({
      data: {
        id_usuario: contratante.id_usuario,
        id_localizacao: contratante.id_localizacao,
        necessidade: contratante.necessidade
      },
      include: {
        usuario: true,
        localizacao: true
      }
    })

    return novoContratante
  } catch (error) {
    console.error("Erro ao inserir contratante:", error)
    return false
  }
}

/**
 * atualiza um contratante existente
 * @param {Object} contratante - {id, id_localizacao, necessidade}
 * @returns {Object|false} - contratante atualizado (com dados completos) ou false
 */
const updateContratante = async function (contratante) {
  try {
    const atualizado = await prisma.contratante.update({
      where: { id: contratante.id },
      data: {
        id_localizacao: contratante.id_localizacao,
        necessidade: contratante.necessidade
      },
      include: {
        usuario: true,
        localizacao: true
      }
    })

    return atualizado
  } catch (error) {
    console.error('Erro ao atualizar contratante:', error)
    return false
  }
}

/**
 * deleta um contratante pelo ID
 * @param {number} id
 * @returns {Object|false} - contratante deletado (com dados completos) ou false
 */
const deleteContratante = async function(id){
  try {
    const deletado = await prisma.contratante.delete({
      where: { id: id },
      include: {
        usuario: true,
        localizacao: true
      }
    })

    return deletado
  } catch (error) {
    console.error('Erro ao deletar contratante:', error)  
    return false
  }
}

/**
 * retorna todos os contratantes (com dados completos)
 * @returns {Array|false} - lista de contratantes ou false
 */
const selectAllContratante = async function(){
  try {
    const contratantes = await prisma.contratante.findMany({
      orderBy: { id: 'desc' },
      include: {
        usuario: true,
        localizacao: true
      }
    })

    return contratantes
  } catch (error) {
    console.error('Erro ao buscar contratantes: ', error)   
    return false
  }
}

/**
 * Retorna um contratante pelo ID (com dados completos)
 * @param {number} id
 * @returns {Object|false} - contratante ou false
 */
const selectByIdContratante = async (id) => {
  try {
    const contratante = await prisma.contratante.findUnique({
      where: { id: id },
      include: {
        usuario: true,
        localizacao: true
      }
    })

    return contratante || false;
  } catch (error) {
    console.error("Erro ao buscar contratante por ID:", error)
    return false
  }
}


module.exports = {
  insertContratante,
  selectAllContratante,
  selectByIdContratante,
  updateContratante,
  deleteContratante
}