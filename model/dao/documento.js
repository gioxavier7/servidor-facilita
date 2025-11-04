/**
 * objetivo: DAO responsável pelo CRUD de documentos usando Prisma
 * data: 16/09/2025
 * dev: giovanna
 * versão: 2.0 - Atualizado para novo schema
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Cadastra um novo documento
 * @param {Object} documento - {tipo_documento, valor, data_validade, arquivo_url, id_prestador}
 * @returns {Object|false}
 */
const insertDocumento = async (documento) => {
  try {
    const novoDocumento = await prisma.documento.create({
      data: {
        tipo_documento: documento.tipo_documento,
        valor: documento.valor,
        data_validade: documento.data_validade ? new Date(documento.data_validade) : null,
        arquivo_url: documento.arquivo_url,
        id_prestador: documento.id_prestador
      }
    })
    return novoDocumento
  } catch (error) {
    console.error("Erro ao inserir documento:", error)
    return false
  }
}


/**
 * Lista todos os documentos
 */
const selectAllDocumentos = async () => {
  try {
    return await prisma.documento.findMany({
      include: { prestador: true }
    })
  } catch (error) {
    console.error("Erro ao listar documentos:", error)
    return false
  }
}

/**
 * Busca documentos por prestador
 */
const selectDocumentosByPrestador = async (id_prestador) => {
  try {
    return await prisma.documento.findMany({
      where: { id_prestador },
      include: { prestador: true }
    })
  } catch (error) {
    console.error("Erro ao buscar documentos por prestador:", error)
    return false
  }
}

/**
 * Busca documento por ID
 */
const selectDocumentoById = async (id) => {
  try {
    return await prisma.documento.findUnique({
      where: { id },
      include: { prestador: true }
    })
  } catch (error) {
    console.error("Erro ao buscar documento:", error)
    return false
  }
}

/**
 * Atualiza documento
 * @param {Number} id 
 * @param {Object} dados - {tipo_documento, valor, data_validade, arquivo_url}
 */
const updateDocumento = async (id, dados) => {
  try {
    return await prisma.documento.update({
      where: { id },
      data: dados
    })
  } catch (error) {
    console.error("Erro ao atualizar documento:", error)
    return false
  }
}

/**
 * Deleta documento
 */
const deleteDocumento = async (id) => {
  try {
    return await prisma.documento.delete({ where: { id } })
  } catch (error) {
    console.error("Erro ao deletar documento:", error)
    return false
  }
}

module.exports = {
  insertDocumento,
  selectAllDocumentos,
  selectDocumentosByPrestador,
  selectDocumentoById,
  updateDocumento,
  deleteDocumento
}