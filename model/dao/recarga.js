import prisma from "../../prisma.js";

const insertRecarga = async (recarga) => {
  try {
    return await prisma.recarga_carteira.create({
      data: {
        id_usuario: recarga.id_usuario,
        valor: recarga.valor,
        metodo: recarga.metodo,
        status: recarga.status,
        id_pagbank: recarga.id_pagbank
      }
    })
  } catch (error) {
    console.error('Erro ao inserir recarga:', error)
    return null
  }
}

const selectRecargaById = async (id) => {
  try {
    return await prisma.recarga_carteira.findUnique({
      where: { id },
      include: { usuario: true }
    })
  } catch (error) {
    console.error('Erro ao buscar recarga:', error)
    return null
  }
}

const updateStatusRecarga = async (id, status, id_pagbank = null) => {
  try {
    const data = { status }
    if (id_pagbank) data.id_pagbank = id_pagbank
    if (status === 'CONFIRMADA') data.data_confirmacao = new Date()

    return await prisma.recarga_carteira.update({
      where: { id },
      data
    })
  } catch (error) {
    console.error('Erro ao atualizar recarga:', error)
    return null
  }
}

const selectRecargaByPagBankId = async (id_pagbank) => {
  try {
    return await prisma.recarga_carteira.findFirst({
      where: { id_pagbank },
      include: { usuario: true }
    })
  } catch (error) {
    console.error('Erro ao buscar recarga por id_pagbank:', error)
    return null
  }
}

module.exports = {
  insertRecarga,
  selectRecargaById,
  updateStatusRecarga,
  selectRecargaByPagBankId
}