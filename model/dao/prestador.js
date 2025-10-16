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
    const cpfDoc = (prestador.documento || []).find(doc => doc.tipo_documento === 'CPF');
    if (!cpfDoc) {
      throw new Error('Documento CPF obrigatório.');
    }

    const regexCPF = /^\d{11}$/;
    if (!regexCPF.test(cpfDoc.valor)) {
      throw new Error('CPF inválido, use 11 dígitos numéricos.');
    }

    const result = await prisma.$transaction(async (prisma) => {
      //verificação se usuário existe e não possui outro tipo de conta
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { id: prestador.id_usuario }
      });

      if (!usuarioExistente) {
        throw new Error('Usuário não encontrado.');
      }

      if (usuarioExistente.tipo_conta && usuarioExistente.tipo_conta !== 'PRESTADOR') {
        throw new Error(`Este usuário já possui perfil de ${usuarioExistente.tipo_conta}.`);
      }

      //atualiza o tipo_conta do usuário primeiro
      await prisma.usuario.update({
        where: { id: prestador.id_usuario },
        data: { tipo_conta: 'PRESTADOR' }
      });

      //cria o prestador
      const novoPrestador = await prisma.prestador.create({
        data: {
          id_usuario: prestador.id_usuario,
          localizacao: {
            connect: prestador.localizacao.map(id => ({ id }))
          },
          documento: {
            create: prestador.documento.map(doc => ({
              tipo_documento: doc.tipo_documento,
              valor: doc.valor,
              data_validade: doc.data_validade ? new Date(doc.data_validade) : null,
              arquivo_url: doc.arquivo_url || null
            }))
          }
        },
        include: {
          usuario: true,
          localizacao: true,
          documento: true
        }
      });

      return novoPrestador;
    });

    return result;
  } catch (error) {
    console.error("Erro ao inserir prestador:", error);
    
    if (error.code === 'P2002') {
      throw new Error('Já existe um perfil de prestador para este usuário.');
    }
    
    throw new Error(error.message || 'Erro interno ao criar prestador.');
  }
};

// ================= LISTAR TODOS PRESTADORES =================
const selectAllPrestadores = async () => {
  try {
    return await prisma.prestador.findMany({
      include: { usuario: true, localizacao: true, documento: true }
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
      include: { usuario: true, localizacao: true, documento: true }
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
        localizacao: dados.localizacao ? { set: dados.localizacao.map(idLocal => ({ id: idLocal })) } : undefined,
        documento: dados.documento ? {
          deleteMany: {},
          create: dados.documento.map(doc => ({
            tipo_documento: doc.tipo_documento,
            valor: doc.valor,
            data_validade: doc.data_validade ? new Date(doc.data_validade) : null,
            arquivo_url: doc.arquivo_url || null
          }))
        } : undefined
      },
      include: {
        usuario: true,
        localizacao: true,
        documento: true
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
    // deleta documento vinculados
    await prisma.documento.deleteMany({ where: { id_prestador: id } })

    // remove relação N:N com localizacao
    await prisma.prestador.update({ where: { id }, data: { localizacao: { set: [] } } })

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

const selectPrestadorByUsuarioId = async (usuarioId) => {
  try {
    const prestador = await prisma.prestador.findFirst({
      where: { 
        id_usuario: usuarioId 
      },
      include: {
        usuario: true
      }
    })

    return prestador || false
  } catch (error) {
    console.error("Erro ao buscar prestador por usuário ID:", error)
    return false
  }
}

/**
 * atualizar locais do prestador
 */
const atualizarLocaisPrestador = async (usuarioId, locaisIds) => {
  try {
    //busca o prestador
    const prestador = await prisma.prestador.findUnique({
      where: { id_usuario: usuarioId }
    });

    if (!prestador) {
      throw new Error('Prestador não encontrado');
    }

    // atualiza os locais
    await prisma.prestador.update({
      where: { id: prestador.id },
      data: {
        localizacao: {
          set: locaisIds.map(id => ({ id }))
        }
      }
    });

    // retorna os locais atualizados
    return await prisma.localizacao.findMany({
      where: {
        id: { in: locaisIds }
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar locais do prestador:', error);
    throw error;
  }
};

/**
 * Atualizar documentos do prestador
 */
const atualizarDocumentosPrestador = async (usuarioId, documentos) => {
  try {
    const prestador = await prisma.prestador.findUnique({
      where: { id_usuario: usuarioId },
      include: { documento: true }
    });

    if (!prestador) {
      throw new Error('Prestador não encontrado');
    }

    const resultados = [];

    for (const doc of documentos) {
      if (doc.id) {
        if (doc.action === 'update' || doc.action === 'delete') {
          const resultado = await prisma.documento.update({
            where: { id: doc.id },
            data: {
              valor: doc.valor,
              data_validade: doc.data_validade ? new Date(doc.data_validade) : null,
              arquivo_url: doc.arquivo_url
            }
          });
          resultados.push(resultado);
        }
      } else {
        if (doc.action === 'create') {
          const novoDoc = await prisma.documento.create({
            data: {
              tipo_documento: doc.tipo_documento,
              valor: doc.valor,
              data_validade: doc.data_validade ? new Date(doc.data_validade) : null,
              arquivo_url: doc.arquivo_url,
              id_prestador: prestador.id
            }
          });
          resultados.push(novoDoc);
        }
      }
    }

    return resultados;

  } catch (error) {
    console.error('Erro ao atualizar documentos do prestador:', error);
    throw error;
  }
};

/**
 * buscar prestador por usuario ID com relacionamentos
 */
const selectPrestadorCompletoByUsuarioId = async (usuarioId) => {
  try {
    return await prisma.prestador.findUnique({
      where: { id_usuario: usuarioId },
      include: {
        usuario: {
          select: {
            nome: true,
            email: true,
            telefone: true
          }
        },
        localizacao: true,
        documento: true
      }
    });
  } catch (error) {
    console.error('Erro ao buscar prestador completo:', error);
    throw error;
  }
};

module.exports = {
  insertPrestador,
  selectAllPrestadores,
  selectPrestadorById,
  updatePrestador,
  deletePrestador,
  selectPrestadorByUsuarioId,
  atualizarLocaisPrestador,
  atualizarDocumentosPrestador,
  selectPrestadorCompletoByUsuarioId
}
