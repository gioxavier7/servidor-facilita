
/**
 * objetivo: DAO responsável pelo CRUD de prestadores usando Prisma
 * data: 16/09/2025
 * dev: giovanna
 * versão: 1.0
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Cadastra um novo prestador com locais e documentos
 * @param {Object} prestador - {id_usuario, locais: [id_local], documentos: [{tipo_documento, valor, data_validade, arquivo_url}]}
 */
const insertPrestador = async (prestador) => {
  try {
    const novoPrestador = await prisma.prestador.create({
      data: {
        id_usuario: prestador.id_usuario,
        //conectando locais existentes
        locais: {
          connect: prestador.locais.map(id => ({ id }))
        },
        //criando documentos
        documentos: {
          create: prestador.documentos.map(doc => ({
            tipo_documento: doc.tipo_documento,
            valor: doc.valor,
            data_validade: doc.data_validade ? new Date(doc.data_validade) : null,
            arquivo_url: doc.arquivo_url || null
          }))
        }
      },
      include: {
        usuario: true,
        locais: true,
        documentos: true
      }
    })

    return novoPrestador
  } catch (error) {
    console.error("Erro ao inserir prestador:", error)
    return false
  }
}

/**
 * lista todos os prestadores
 */
const selectAllPrestadores = async () => {
  try {
    return await prisma.prestador.findMany({
      include: { usuario: true, locais: true, documentos: true }
    })
  } catch (error) {
    console.error('Erro ao listar prestadores:', error)
    return false
  }
}

/**
 * busca prestador por ID
 */
const selectPrestadorById = async (id) => {
  try {
    return await prisma.prestador.findUnique({
      where: { id },
      include: { usuario: true, locais: true, documentos: true }
    })
  } catch (error) {
    console.error('Erro ao buscar prestador:', error)
    return false
  }
}

/**
 * atualiza prestador
 * @param {Number} id 
 * @param {Object} dados - {locais, documentos}
 */
const updatePrestador = async (id, dados) => {
  try {
    return await prisma.prestador.update({
      where: { id },
      data: {
        locais: {
          set: dados.locais.map(idLocal => ({ id: idLocal }))
        },
        documentos: {
          deleteMany: {},
          create: dados.documentos.map(doc => ({
            tipo_documento: doc.tipo_documento,
            valor: doc.valor,
            data_validade: doc.data_validade ? new Date(doc.data_validade) : null,
            arquivo_url: doc.arquivo_url || null
          }))
        }
      },
      include: {
        usuario: true,
        locais: true,
        documentos: true
      }
    })
  } catch (error) {
    console.error("Erro ao atualizar prestador:", error)
    return false
  }
}

/**
 * deleta prestador
 */
const deletePrestador = async (id) => {
  try {
    //deleta documentos vinculados
    await prisma.documento.deleteMany({
      where: { id_prestador: id }
    })

    //remove relação N:N com locais
    await prisma.prestador.update({
      where: { id },
      data: {
        locais: {
          set: [] // limpa todas as conexões
        }
      }
    })

    //deleta o prestador
    return await prisma.prestador.delete({
      where: { id }
    })
  } catch (error) {
    console.error("Erro ao deletar prestador:", error)
    return false
  }
}


module.exports = {
  insertPrestador,
  selectAllPrestadores,
  selectPrestadorById,
  updatePrestador,
  deletePrestador
}
