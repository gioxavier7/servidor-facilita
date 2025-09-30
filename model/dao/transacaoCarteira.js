const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Inserir transação
const insertTransacao = async function({ id_carteira, tipo, valor, descricao }) {
    try {
        return await prisma.transacaoCarteira.create({
            data: {
                id_carteira,
                tipo,
                valor: Number(valor),
                descricao
            }
        });
    } catch (error) {
        console.error('Erro ao criar transação', error);
        return false;
    }
}

// Listar transações por carteira
const selectTransacoesByCarteira = async function(id_carteira) {
    try {
        return await prisma.transacaoCarteira.findMany({
            where: { id_carteira: Number(id_carteira) },
            orderBy: { id: 'desc' }
        });
    } catch (error) {
        console.error('Erro ao listar transações', error);
        return false;
    }
}

module.exports = { insertTransacao, selectTransacoesByCarteira };
