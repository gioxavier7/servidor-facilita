import prisma from "../../prisma.js";

//criar carteira
const insertCarteira = async function(carteira){
    try {
        return await prisma.carteira.create({ 
            data: {
                id_usuario: carteira.id_usuario,
                chave_pagbank: carteira.chave_pagbank,
                saldo: carteira.saldo || 0
            } 
        })
    } catch (error) {
        console.error('Erro ao criar carteira', error)
        return false
    }
}

//burca carteira por id_usuario
const selectCarteiraByUsuario = async function(id_usuario){
    try {
        return await prisma.carteira.findUnique({ where: { id_usuario: Number(id_usuario) } })
    } catch (error) {
        console.error('Erro ao buscar carteira', error)
        return false
    }
}

/**
 * atualizar saldo da carteira
 */
const atualizarSaldo = async (id_carteira, novo_saldo) => {
  try {
    return await prisma.carteira.update({
      where: { id: id_carteira },
      data: { saldo: novo_saldo }
    })
  } catch (error) {
    console.error('Erro ao atualizar saldo:', error)
    return null
  }
}

//busvcar por id
const selectCarteiraById = async (id) => {
  try {
    return await prisma.carteira.findUnique({
      where: { id }
    })
  } catch (error) {
    console.error('Erro ao buscar carteira por ID:', error)
    return null
  }
}

module.exports = {
    insertCarteira,
    selectCarteiraByUsuario,
    atualizarSaldo,
    selectCarteiraById
}
