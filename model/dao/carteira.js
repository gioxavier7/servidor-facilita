const {PrismaClient} = require('@prisma/client')
const prisma = new PrismaClient()

//inserir carteira
const insertCarteira = async function(carteira){
    try {
        return await prisma.carteira.create({data: carteira})
    } catch (error) {
        console.error('Erro ao criar carteira', error)
        return false
    }
}

//buscar carteira por usuario
const selectByIdCarteira = async function(id_usuario){
    try {
        return await prisma.carteira.findUnique({where: {id_usuario}})
    } catch (error) {
        console.error('Erro ao buscar carteira', error)
    }
}

const atualizarSaldo = async function(id, novoSaldo){
  try {
    return await prisma.carteira.update({ 
        where: { id }, 
        data: { saldo: novoSaldo } 
    })
  } catch (error) {
    console.error(error)
    return false
  }
};


module.exports = {
    insertCarteira,
    selectByIdCarteira,
    atualizarSaldo
}