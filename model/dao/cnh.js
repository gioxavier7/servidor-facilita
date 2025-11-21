/**
 * DAO responsável pelo CRUD de CNH (tratada como documento)
 * Data: 16/09/2025
 * Dev: Giovanna
 * Versão: 1.0
 */

import prisma from "../../prisma.js";

// ================= INSERIR CNH =================
const insertCNH = async (cnh) => {
  try {
    const novaCNH = await prisma.documento.create({
      data: {
        id_prestador: cnh.id_prestador,
        tipo_documento: 'CNH_EAR',
        valor: cnh.numero_cnh,
        data_validade: cnh.validade,
        arquivo_url: cnh.arquivo_url
      }
    })
    return novaCNH
  } catch (error) {
    console.error('Erro ao inserir CNH:', error)
    return false
  }
}

// ================= BUSCAR CNH POR ID =================
const selectCNHById = async (id) => {
  try {
    const cnh = await prisma.cnh.findUnique({
      where: { id },
      include: { prestador: true }
    });
    
    if (!cnh) throw new Error('CNH não encontrada.');
    return cnh;
  } catch (error) {
    console.error('Erro ao buscar CNH:', error);
    throw new Error(error.message || 'Erro interno ao buscar CNH.');
  }
};

// ================= BUSCAR CNH POR PRESTADOR =================
const selectCNHByPrestador = async (id_prestador) => {
  try {
    const cnh = await prisma.cnh.findFirst({
      where: { id_prestador },
      include: { prestador: true }
    });
    return cnh;
  } catch (error) {
    console.error('Erro ao buscar CNH por prestador:', error);
    throw new Error(error.message || 'Erro interno ao buscar CNH.');
  }
};

// ================= ATUALIZAR CNH =================
const updateCNH = async (id, dados) => {
  try {
    const cnhAtualizada = await prisma.cnh.update({
      where: { id },
      data: {
        numero_cnh: dados.numero_cnh,
        categoria: dados.categoria,
        validade: dados.validade,
        possui_ear: dados.possui_ear,
        pontuacao_atual: dados.pontuacao_atual
      }
    });
    return cnhAtualizada;
  } catch (error) {
    console.error("Erro ao atualizar CNH:", error);
    if (error.code === 'P2025') throw new Error('CNH não encontrada.');
    throw new Error('Erro interno ao atualizar CNH.');
  }
};

// ================= DELETAR CNH =================
const deleteCNH = async (id) => {
  try {
    const cnhDeletada = await prisma.cnh.delete({
      where: { id }
    });
    return cnhDeletada;
  } catch (error) {
    console.error("Erro ao deletar CNH:", error);
    if (error.code === 'P2025') throw new Error('CNH não encontrada.');
    throw new Error('Erro interno ao deletar CNH.');
  }
};

module.exports = {
  insertCNH,
  selectCNHById,
  selectCNHByPrestador,
  updateCNH,
  deleteCNH
};