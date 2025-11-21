/**
 * DAO responsável pelo CRUD de prestadores usando Prisma
 * Data: 16/09/2025
 * Dev: Giovanna
 * Versão: 2.0 - Atualizado para novo schema
 */

import prisma from "../../prisma.js";

// ================= CRIAR PRESTADOR BÁSICO =================
const insertPrestadorBasico = async (prestador) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: prestador.id_usuario }
    });

    if (!usuario) throw new Error('Usuário não encontrado.');

    if (usuario.tipo_conta && usuario.tipo_conta !== 'PRESTADOR') {
      throw new Error(`Este usuário já possui perfil de ${usuario.tipo_conta}.`);
    }

    // atualiza o tipo_conta e cria o prestador vazio
    const novoPrestador = await prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id: prestador.id_usuario },
        data: { tipo_conta: 'PRESTADOR' }
      });

      return await tx.prestador.create({
        data: {
          id_usuario: prestador.id_usuario,
          localizacao: {
            connect: prestador.localizacao.map(id => ({ id }))
          }
        },
        include: { localizacao: true }
      });
    });

    return novoPrestador;
  } catch (error) {
    console.error("Erro ao criar prestador básico:", error);
    throw new Error(error.message || 'Erro ao criar prestador básico.');
  }
};

// ================= FINALIZAR CADASTRO =================
// ================= FINALIZAR CADASTRO =================
const finishCadastro = async (id_prestador) => {
  try {
    const prestador = await prisma.prestador.findUnique({
      where: { id: Number(id_prestador) },
      include: { 
        documento: true, 
        modalidades: true,
        usuario: true // INCLUIR USUÁRIO PARA ATUALIZAR
      }
    })

    if (!prestador) throw new Error('Prestador não encontrado.')

    // validações mínimas
    const cpf = prestador.documento.find(d => d.tipo_documento === 'CPF')
    if (!cpf) throw new Error('CPF obrigatório para finalizar o cadastro.')

    // se tiver veículo, precisa de CNH
    const temVeiculo = prestador.modalidades.some(
      m => m.tipo !== 'A_PE' && m.tipo !== 'BICICLETA'
    )

    const cnh = prestador.documento.find(d => d.tipo_documento === 'CNH_EAR')
    if (temVeiculo && !cnh)
      throw new Error('CNH obrigatória para modalidades com veículo.')

    // ATUALIZAR TIPO_CONTA DO USUÁRIO para 'prestador'
    await prisma.usuario.update({
      where: { id: prestador.id_usuario },
      data: { tipo_conta: 'PRESTADOR' }
    })

    // marcar prestador como ativo
    return await prisma.prestador.update({
      where: { id: Number(id_prestador) },
      data: { ativo: true },
      include: { 
        documento: true, 
        modalidades: true,
        usuario: true // Incluir usuário atualizado na resposta
      }
    })
  } catch (error) {
    console.error('Erro ao finalizar cadastro:', error)
    throw new Error(error.message || 'Erro interno ao finalizar cadastro.')
  }
}


// ================= LISTAR TODOS PRESTADORES =================
const selectAllPrestadores = async () => {
  try {
    return await prisma.prestador.findMany({
      include: { 
        usuario: true, 
        localizacao: true, 
        documento: true,
        modalidades: true
      }
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
      include: { 
        usuario: true, 
        localizacao: true, 
        documento: true,
        modalidades: true
      }
    })
    if (!prestador) throw new Error('Prestador não encontrado.')
    return prestador
  } catch (error) {
    console.error('Erro ao buscar prestador:', error)
    throw new Error(error.message || 'Erro interno ao buscar prestador.')
  }
}

// ================= DELETAR PRESTADOR =================
const deletePrestador = async (id) => {
  try {
    // deleta documentos vinculados
    await prisma.documento.deleteMany({ where: { id_prestador: id } })
    
    // deleta CNH vinculada
    await prisma.cnh.deleteMany({ where: { id_prestador: id } })
    
    // deleta modalidades vinculadas
    await prisma.modalidade_prestador.deleteMany({ where: { id_prestador: id } })

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

// ================= ADICIONAR MODALIDADES =================
const adicionarModalidades = async (id_prestador, modalidades) => {
  try {
    // Primeiro, deleta modalidades existentes para evitar duplicatas
    await prisma.modalidade_prestador.deleteMany({
      where: { id_prestador }
    })

    // Cria as novas modalidades com os dados completos
    const modalidadesData = modalidades.map(modalidade => ({
      id_prestador,
      tipo: modalidade.tipo.toUpperCase(),
      modelo_veiculo: modalidade.modelo_veiculo || null,
      ano_veiculo: modalidade.ano_veiculo || null,
      possui_seguro: modalidade.possui_seguro || false,
      compartimento_adequado: modalidade.compartimento_adequado || false,
      revisao_em_dia: modalidade.revisao_em_dia || false,
      antecedentes_criminais: modalidade.antecedentes_criminais || false
    }))

    await prisma.modalidade_prestador.createMany({
      data: modalidadesData,
      skipDuplicates: true
    })

    // Retorna as modalidades criadas
    return await prisma.modalidade_prestador.findMany({
      where: { id_prestador },
      select: {
        id: true,
        tipo: true,
        modelo_veiculo: true,
        ano_veiculo: true,
        possui_seguro: true,
        compartimento_adequado: true,
        revisao_em_dia: true,
        antecedentes_criminais: true,
        data_criacao: true
      }
    })
  } catch (error) {
    console.error('Erro ao adicionar modalidades:', error)
    throw error
  }
}

// ================= BUSCAR MODALIDADES =================
const buscarModalidadesPorPrestador = async (id_prestador) => {
  try {
    return await prisma.modalidade_prestador.findMany({
      where: { id_prestador },
      select: {
        id: true,
        tipo: true,
        modelo_veiculo: true,
        ano_veiculo: true,
        possui_seguro: true,
        compartimento_adequado: true,
        revisao_em_dia: true,
        antecedentes_criminais: true,
        data_criacao: true
      }
    })
  } catch (error) {
    console.error('Erro ao buscar modalidades:', error)
    throw error
  }
}

// ================= ATUALIZAR LOCAIS PRESTADOR =================
const atualizarLocaisPrestador = async (userId, locais) => {
  try {
    // Primeiro busca o prestador pelo userId
    const prestador = await prisma.prestador.findFirst({
      where: { id_usuario: userId }
    });

    if (!prestador) {
      throw new Error('Prestador não encontrado');
    }

    // Atualiza os locais do prestador
    const prestadorAtualizado = await prisma.prestador.update({
      where: { id: prestador.id },
      data: {
        localizacao: {
          set: locais.map(idLocal => ({ id: idLocal }))
        }
      },
      include: {
        localizacao: true
      }
    });

    return prestadorAtualizado.localizacao;
  } catch (error) {
    console.error("Erro ao atualizar locais do prestador:", error);
    throw new Error('Erro ao atualizar locais do prestador');
  }
}

// ================= ATUALIZAR DOCUMENTOS PRESTADOR =================
const atualizarDocumentosPrestador = async (userId, documentos) => {
  try {
    // Primeiro busca o prestador pelo userId
    const prestador = await prisma.prestador.findFirst({
      where: { id_usuario: userId },
      include: { documento: true }
    });

    if (!prestador) {
      throw new Error('Prestador não encontrado');
    }

    const resultados = [];

    for (const doc of documentos) {
      // Verifica se o documento já existe para este prestador
      const documentoExistente = prestador.documento.find(
        d => d.tipo_documento === doc.tipo_documento
      );

      if (documentoExistente) {
        // Atualiza documento existente
        const atualizado = await prisma.documento.update({
          where: { id: documentoExistente.id },
          data: {
            valor: doc.valor,
            data_validade: doc.data_validade ? new Date(doc.data_validade) : null,
            arquivo_url: doc.arquivo_url
          }
        });
        resultados.push(atualizado);
      } else {
        // Cria novo documento
        const novo = await prisma.documento.create({
          data: {
            tipo_documento: doc.tipo_documento,
            valor: doc.valor,
            data_validade: doc.data_validade ? new Date(doc.data_validade) : null,
            arquivo_url: doc.arquivo_url,
            id_prestador: prestador.id
          }
        });
        resultados.push(novo);
      }
    }

    return resultados;
  } catch (error) {
    console.error("Erro ao atualizar documentos do prestador:", error);
    throw new Error('Erro ao atualizar documentos do prestador');
  }
}

// ================= ATUALIZAR PRESTADOR COMPLETO =================
const updatePrestador = async (id, dados) => {
  try {
    const prestadorAtualizado = await prisma.prestador.update({
      where: { id },
      data: {
        localizacao: dados.localizacao ? { 
          set: dados.localizacao.map(idLocal => ({ id: idLocal })) 
        } : undefined,
        documento: dados.documento ? {
          deleteMany: {},
          create: dados.documento.map(doc => ({
            tipo_documento: doc.tipo_documento,
            valor: doc.valor,
            data_validade: doc.data_validade ? new Date(doc.data_validade) : null,
            arquivo_url: doc.arquivo_url || null
          }))
        } : undefined,
        modalidades: dados.modalidades ? {
          deleteMany: {},
          create: dados.modalidades.map(modalidade => ({
            tipo: modalidade
          }))
        } : undefined
      },
      include: {
        usuario: true,
        localizacao: true,
        documento: true,
        modalidades: true
      }
    })
    return prestadorAtualizado
  } catch (error) {
    console.error("Erro ao atualizar prestador:", error)
    if (error.code === 'P2025') throw new Error('Prestador não encontrado.')
    throw new Error('Erro interno ao atualizar prestador.')
  }
}

/**
 * buscar prestador por usuario ID com relacionamentos
 */
const selectPrestadorCompletoByUsuarioId = async (usuarioId) => {
  try {
    return await prisma.prestador.findFirst({
      where: { id_usuario: usuarioId },
      include: {
        usuario: {
          select: {
            nome: true,
            email: true,
            telefone: true,
            foto_perfil: true
          }
        },
        localizacao: true,
        documento: true,
        modalidades: true
      }
    });
  } catch (error) {
    console.error('Erro ao buscar prestador completo:', error);
    throw error;
  }
};

// ================= BUSCAR PRESTADOR POR USUÁRIO =================
const buscarPrestadorPorUsuario = async (id_usuario) => {
  try {
    return await prisma.prestador.findUnique({
      where: { id_usuario: Number(id_usuario) },
      include: {
        usuario: true,
        documento: true,
        modalidades: true
      }
    })
  } catch (error) {
    console.error('Erro ao buscar prestador por usuário:', error)
    throw new Error('Erro interno ao buscar prestador.')
  }
}

const selectPrestadorByUsuarioId = async (usuarioId) => {
  try {
    const prestador = await prisma.prestador.findFirst({
      where: { 
        id_usuario: usuarioId 
      }
    })
    return prestador
  } catch (error) {
    console.error('Erro ao buscar prestador por usuário ID: ', error)   
    return false
  }
}

module.exports = {
  insertPrestadorBasico,
  finishCadastro,
  selectAllPrestadores,
  selectPrestadorById,
  updatePrestador,
  deletePrestador,
  adicionarModalidades,
  adicionarModalidades,
  buscarModalidadesPorPrestador,
  atualizarLocaisPrestador,
  atualizarDocumentosPrestador,
  selectPrestadorCompletoByUsuarioId,
  buscarPrestadorPorUsuario,
  selectPrestadorByUsuarioId
}