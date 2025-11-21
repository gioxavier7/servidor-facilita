/**
 * objetivo: DAO responsável pelo CRUD de categorias usando Prisma
 * data: 25/09/2025
 * dev: Giovanna
 * versão: 1.0
 */

import prisma from "../../prisma.js";

/**
 * cadastra uma nova categoria
 * @param {Object} categoria - {nome}
 * @returns {Object|false} - categoria criada ou false em caso de erro
 */
const insertCategoria = async (categoria) => {
  try {
    const novaCategoria = await prisma.categoria.create({
      data: {
        nome: categoria.nome
      }
    })
    return novaCategoria
  } catch (error) {
    console.error('Erro ao inserir categoria:', error)
    return false
  }
}

/**
 * atualiza uma categoria existente
 * @param {Object} categoria - {id, nome}
 * @returns {Object|false} - categoria atualizada ou false
 */
const updateCategoria = async (categoria) => {
  try {
    const atualizado = await prisma.categoria.update({
      where: { id: categoria.id },
      data: { nome: categoria.nome }
    })
    return atualizado
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error)
    return false
  }
}

/**
 * deleta uma categoria pelo ID
 * @param {number} id
 * @returns {Object|false} - categoria deletada ou false
 */
const deleteCategoria = async (id) => {
  try {
    const deletado = await prisma.categoria.delete({
      where: { id: id }
    })
    return deletado
  } catch (error) {
    console.error('Erro ao deletar categoria:', error)
    return false
  }
}

/**
 * retorna todas as categorias
 * @returns {Array|false} - lista de categorias ou false
 */
const selectAllCategoria = async () => {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { id: 'desc' }
    })
    return categorias
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return false
  }
}

/**
 * retorna uma categoria pelo ID
 * @param {number} id
 * @returns {Object|false} - categoria ou false
 */
const selectByIdCategoria = async (id) => {
  try {
    const categoria = await prisma.categoria.findUnique({
      where: { id: id }
    })
    return categoria || false
  } catch (error) {
    console.error('Erro ao buscar categoria por ID:', error)
    return false
  }
}

module.exports = {
  insertCategoria,
  updateCategoria,
  deleteCategoria,
  selectAllCategoria,
  selectByIdCategoria
}
