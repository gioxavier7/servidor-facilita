const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Criar carteira
const insertCarteira = async function(carteira){
    try {
        return await prisma.carteira.create({ data: carteira });
    } catch (error) {
        console.error('Erro ao criar carteira', error);
        return false;
    }
}

// Buscar carteira por id_usuario
const selectCarteiraByUsuario = async function(id_usuario){
    try {
        return await prisma.carteira.findUnique({ where: { id_usuario: Number(id_usuario) } });
    } catch (error) {
        console.error('Erro ao buscar carteira', error);
        return false;
    }
}

// Atualizar saldo
const atualizarSaldo = async function(id, novoSaldo){
    try {
        return await prisma.carteira.update({ where: { id }, data: { saldo: novoSaldo } });
    } catch (error) {
        console.error('Erro ao atualizar saldo', error);
        return false;
    }
}

module.exports = {
    insertCarteira,
    selectCarteiraByUsuario,
    atualizarSaldo
};
