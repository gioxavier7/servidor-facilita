/**
 * objetivo: DAO responsável pelo gerenciamento do chat de serviços
 * data: 25/09/2025
 * dev: Giovanna
 * versão: 1.0
 */

const prisma = require("../../prismaClient.js");

/**
 * envia uma mensagem no chat do serviço
 * @param {Object} mensagemData - {id_servico, id_contratante, id_prestador, mensagem, tipo, enviado_por, url_anexo?}
 * @returns {Object|false} - mensagem criada ou false
 */
const enviarMensagem = async (mensagemData) => {
  try {
    const mensagem = await prisma.chat_servico.create({
      data: {
        id_servico: mensagemData.id_servico,
        id_contratante: mensagemData.id_contratante,
        id_prestador: mensagemData.id_prestador,
        mensagem: mensagemData.mensagem,
        tipo: mensagemData.tipo || 'texto',
        enviado_por: mensagemData.enviado_por,
        url_anexo: mensagemData.url_anexo
      },
      include: {
        contratante: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                foto_perfil: true
              }
            }
          }
        },
        prestador: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                foto_perfil: true
              }
            }
          }
        },
        servico: {
          select: {
            id: true,
            status: true,
            descricao: true
          }
        }
      }
    })
    return mensagem

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error)
    return false
  }
}

/**
 * busca mensagens de um serviço
 * @param {number} servicoId 
 * @returns {Array|false} - lista de mensagens ou false
 */
const buscarMensagensPorServico = async (servicoId) => {
  try {
    const mensagens = await prisma.chat_servico.findMany({
      where: { id_servico: servicoId },
      include: {
        contratante: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                foto_perfil: true
              }
            }
          }
        },
        prestador: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                foto_perfil: true
              }
            }
          }
        }
      },
      orderBy: { data_envio: 'asc' }
    })

    return mensagens
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error)
    return false
  }
}

/**
 * marca mensagens como lidas
 * @param {number} servicoId 
 * @param {string} usuarioTipo - 'contratante' ou 'prestador'
 * @returns {Object|false} - resultado da atualização ou false
 */
const marcarMensagensComoLidas = async (servicoId, usuarioTipo) => {
  try {
    const campoParaMarcar = usuarioTipo === 'contratante' ? 'prestador' : 'contratante'

    const resultado = await prisma.chat_servico.updateMany({
      where: { 
        id_servico: servicoId,
        enviado_por: campoParaMarcar,
        lida: false
      },
      data: { lida: true }
    })

    return resultado
  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error)
    return false
  }
}

/**
 * busca informações do serviço para validação
 * @param {number} servicoId 
 * @returns {Object|false} - serviço com participantes ou false
 */
const buscarServicoComParticipantes = async (servicoId) => {
  try {
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId },
      select: {
        id: true,
        id_contratante: true,
        id_prestador: true,
        status: true,
        contratante: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        },
        prestador: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        }
      }
    })

    return servico
  } catch (error) {
    console.error('Erro ao buscar serviço:', error)
    return false
  }
}

module.exports = {
  enviarMensagem,
  buscarMensagensPorServico,
  marcarMensagensComoLidas,
  buscarServicoComParticipantes
}