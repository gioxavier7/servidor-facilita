const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const insertPagamento = async (pagamento) => {
  try {
    return await prisma.pagamento.create({
      data: pagamento,
       include: { servico: true, contratante: true, prestador: true } 
      });
  } catch (error) {
    console.error('Erro ao inserir pagamento:', error);
    return false;
  }
};

const selectAllPagamentos = async () => {
  try {
    return await prisma.pagamento.findMany({ 
      orderBy: { id: 'desc' },
       include: { servico: true, contratante: true, prestador: true } 
      });
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    return false;
  }
};

const selectByIdPagamento = async (id) => {
  try {
    return await prisma.pagamento.findUnique({ 
      where: { id }, 
      include: { servico: true, contratante: true, prestador: true } 
    })
  } catch (error) {
    console.error('Erro ao buscar pagamento por ID:', error);
    return false;
  }
}

const selectByIdPagBank = async function(id_pagbank){
  try {
    return await prisma.pagamento.findFirst({ 
      where: { id_pagbank } 
    })
  } catch (error) {
    console.error(error)
    return false
  }
}

const updateStatusPagamento = async function(id, status){
  try {
    return await prisma.pagamento.update({ 
      where: { id }, 
      data: { status } 
    });
  } catch (error) {
    console.error(error)
    return false
  }
}

module.exports = { 
  insertPagamento,
  selectAllPagamentos,
  selectByIdPagamento,
  selectByIdPagBank,
  updateStatusPagamento
}
