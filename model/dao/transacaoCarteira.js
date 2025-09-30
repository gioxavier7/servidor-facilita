const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const insertTransacao = async function (transacao){
  try {
    return await prisma.transacaoCarteira.create({ data: transacao });
  } catch (error) {
    console.error('Erro ao registrar transação:', error);
    return false;
  }
};

const selectTransacoesByCarteira = async function (id_carteira){
  try {
    return await prisma.transacaoCarteira.findMany({ where: { id_carteira }, orderBy: { data_transacao: 'desc' } });
  } catch (error) {
    console.error('Erro ao listar transações:', error);
    return false;
  }
};

module.exports = { insertTransacao, selectTransacoesByCarteira };
