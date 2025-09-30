/**
 * DAO responsável pelo CRUD de prestadores usando Prisma
 * Data: 16/09/2025
 * Dev: Giovanna
 * Versão: 1.1
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ================= INSERIR PRESTADOR =================
const insertPrestador = async (prestador) => {
  try {
    // validação de CPF obrigatório
    const cpfDoc = (prestador.documentos || []).find(doc => doc.tipo_documento === 'CPF');
    if (!cpfDoc) {
      throw new Error('Documento CPF obrigatório.');
    }

    const regexCPF = /^\d{11}$/;
    if (!regexCPF.test(cpfDoc.valor)) {
      throw new Error('CPF inválido, use 11 dígitos numéricos.');
    }

    const novoPrestador = await prisma.prestador.create({
      data: {
        id_usuario: prestador.id_usuario,
        locais: {
          connect: prestador.locais.map(id => ({ id }))
        },
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
    });

    return novoPrestador;
  } catch (error) {
    console.error("Erro ao inserir prestador:", error);
    throw new Error(error.message || 'Erro interno ao criar prestador.');
  }
};

// ================= LISTAR TODOS PRESTADORES =================
const selectAllPrestadores = async () => {
  try {
    return await prisma.prestador.findMany({
      include: { usuario: true, locais: true, documentos: true }
    })
  } catch (error) {
    console.error('Erro ao listar prestadores:', error)
    throw new Error('Erro interno ao listar prestadores.')
  }
}

// ================= BUSCAR PRESTADOR POR ID =================
const selectPrestadorById = async (id) => {
  try {
    const prestador = await prisma.prestador.findUnique({
      where: { id },
      include: { usuario: true, locais: true, documentos: true }
    })
    if (!prestador) throw new Error('Prestador não encontrado.')
    return prestador
  } catch (error) {
    console.error('Erro ao buscar prestador:', error)
    throw new Error(error.message || 'Erro interno ao buscar prestador.')
  }
}

// ================= ATUALIZAR PRESTADOR =================
const updatePrestador = async (id, dados) => {
  try {
    const prestadorAtualizado = await prisma.prestador.update({
      where: { id },
      data: {
        locais: dados.locais ? { set: dados.locais.map(idLocal => ({ id: idLocal })) } : undefined,
        documentos: dados.documentos ? {
          deleteMany: {},
          create: dados.documentos.map(doc => ({
            tipo_documento: doc.tipo_documento,
            valor: doc.valor,
            data_validade: doc.data_validade ? new Date(doc.data_validade) : null,
            arquivo_url: doc.arquivo_url || null
          }))
        } : undefined
      },
      include: {
        usuario: true,
        locais: true,
        documentos: true
      }
    })
    return prestadorAtualizado
  } catch (error) {
    console.error("Erro ao atualizar prestador:", error)
    if (error.code === 'P2025') throw new Error('Prestador não encontrado.')
    throw new Error('Erro interno ao atualizar prestador.')
  }
}

// ================= DELETAR PRESTADOR =================
const deletePrestador = async (id) => {
  try {
    // deleta documentos vinculados
    await prisma.documento.deleteMany({ where: { id_prestador: id } })

    // remove relação N:N com locais
    await prisma.prestador.update({ where: { id }, data: { locais: { set: [] } } })

    // deleta prestador
    const prestadorDeletado = await prisma.prestador.delete({
      where: { id }
    })
    return prestadorDeletado
  } catch (error) {
    console.error("Erro ao deletar prestador:", error)
    if (error.code === 'P2025') throw new Error('Prestador não encontrado.')
    throw new Error('Erro interno ao deletar prestador.')
  }
}

module.exports = {
  insertPrestador,
  selectAllPrestadores,
  selectPrestadorById,
  updatePrestador,
  deletePrestador
}
