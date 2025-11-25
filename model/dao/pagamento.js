const prisma = require("../../prismaClient.js");

const insertPagamento = async (pagamento) => {
  try {
    const resultado = await prisma.pagamento.create({
      data: {
        id_servico: pagamento.id_servico,
        id_contratante: pagamento.id_contratante, 
        id_prestador: pagamento.id_prestador,
        valor: pagamento.valor,
        metodo: pagamento.metodo,
        status: pagamento.status,
        id_pagbank: pagamento.id_pagbank
      }
    })
    return resultado
    
  } catch (error) {
    console.error('❌ Erro detalhado ao inserir pagamento:')
    console.error('Dados:', pagamento)
    console.error('Erro:', error.message)
    console.error('Stack:', error.stack)
    
    return null
  }
}

const selectAllPagamentos = async () => {
  try {
    return await prisma.pagamento.findMany({ 
      orderBy: { id: 'desc' },
       include: { servico: true, contratante: true, prestador: true } 
      })
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error)
    return false
  }
}

const selectByIdPagamento = async (id) => {
  try {
    return await prisma.pagamento.findUnique({ 
      where: { id }, 
      include: { servico: true, contratante: true, prestador: true } 
    })
  } catch (error) {
    console.error('Erro ao buscar pagamento por ID:', error)
    return false
  }
}

const selectByIdPagBank = async function(id_pagbank){
  try {
    return await prisma.pagamento.findFirst({ 
      where: { 
        id_pagbank: id_pagbank
      },
      include: { 
        prestador: {
          include: {
            usuario: true
          }
        }, 
        servico: true, 
        contratante: true 
      }
    })
  } catch (error) {
    console.error('Erro ao buscar pagamento por ID PagBank:', error)
    return false
  }
}


const updateStatusPagamento = async function(id, status){
  try {
    return await prisma.pagamento.update({ 
      where: { id }, 
      data: { status } 
    })
  } catch (error) {
    console.error(error)
    return false
  }
}

/**
 * buscar pagamento por ID do serviço
 */
const selectPagamentoByServico = async (id_servico) => {
  try {
    return await prisma.pagamento.findFirst({
      where: { id_servico },
      include: {
        contratante: { include: { usuario: true } },
        prestador: { include: { usuario: true } },
        servico: true
      }
    })
  } catch (error) {
    console.error('Erro ao buscar pagamento por serviço:', error)
    return null
  }
}

module.exports = { 
  insertPagamento,
  selectAllPagamentos,
  selectByIdPagamento,
  selectByIdPagBank,
  updateStatusPagamento,
  selectPagamentoByServico
}
