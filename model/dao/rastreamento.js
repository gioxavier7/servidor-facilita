/**
 * objetivo: DAO responsável pelo CRUD de rastreamento de serviços
 * data: 18/10/2025
 * dev: Giovanna
 * versão: 1.0
 */

const { PrismaClient, StatusRastreamento } = require('../../prisma/generated/client')
const prisma = new PrismaClient()

/**
 * cria um novo registro de rastreamento
 * @param {Object} rastreamento - {id_servico, status, latitude?, longitude?, endereco?, observacao?}
 * @returns {Object|false} - rastreamento criado ou false em caso de erro
 */
const insertRastreamento = async (rastreamento) => {
  try {
    const novoRastreamento = await prisma.rastreamento_servico.create({
      data: {
        id_servico: rastreamento.id_servico,
        status: rastreamento.status,
        latitude: rastreamento.latitude,
        longitude: rastreamento.longitude,
        endereco: rastreamento.endereco,
        observacao: rastreamento.observacao
      },
      include: {
        servico: {
          include: {
            contratante: {
              include: { usuario: true }
            },
            prestador: {
              include: { usuario: true }
            }
          }
        }
      }
    })

    return novoRastreamento
  } catch (error) {
    console.error("Erro ao inserir rastreamento:", error)
    return false
  }
}

/**
 * busca histórico de rastreamento de um serviço
 * @param {number} servicoId 
 * @returns {Array|false} - lista de rastreamentos ordenados por data
 */
const selectRastreamentoByServico = async (servicoId) => {
  try {
    const rastreamentos = await prisma.rastreamento_servico.findMany({
      where: { id_servico: servicoId },
      orderBy: { data_hora: 'desc' },
      include: {
        servico: {
          include: {
            contratante: {
              include: { usuario: true }
            },
            prestador: {
              include: { usuario: true }
            }
          }
        }
      }
    })

    return rastreamentos
  } catch (error) {
    console.error('Erro ao buscar rastreamentos do serviço:', error)
    return false
  }
}

/**
 * busca o último status de rastreamento de um serviço
 * @param {number} servicoId 
 * @returns {Object|false} - último rastreamento ou false
 */
const selectUltimoRastreamento = async (servicoId) => {
  try {
    const ultimoRastreamento = await prisma.rastreamento_servico.findFirst({
      where: { id_servico: servicoId },
      orderBy: { data_hora: 'desc' },
      include: {
        servico: {
          include: {
            contratante: {
              include: { usuario: true }
            },
            prestador: {
              include: { usuario: true }
            }
          }
        }
      }
    })

    return ultimoRastreamento
  } catch (error) {
    console.error('Erro ao buscar último rastreamento:', error)
    return false
  }
}

/**
 * atualiza o status do serviço e cria registro de rastreamento
 * @param {number} servicoId 
 * @param {string} status - StatusRastreamento
 * @param {Object} localizacao - {latitude?, longitude?, endereco?}
 * @param {string} observacao 
 * @returns {Object|false} - rastreamento criado ou false
 */
const atualizarStatusServico = async (servicoId, status, localizacao = {}, observacao = '') => {
  try {
    // primeiro cria o rastreamento
    const rastreamento = await insertRastreamento({
      id_servico: servicoId,
      status: status,
      latitude: localizacao.latitude,
      longitude: localizacao.longitude,
      endereco: localizacao.endereco,
      observacao: observacao
    })

    if (!rastreamento) {
      throw new Error('Falha ao criar registro de rastreamento')
    }

    //atuakiza o serviço principal
    if (status === 'INICIADO') {
      await prisma.servico.update({
        where: { id: servicoId },
        data: { 
          status: 'EM_ANDAMENTO',
          data_inicio: new Date()
        }
      })
    } else if (status === 'FINALIZADO') {
      await prisma.servico.update({
        where: { id: servicoId },
        data: { 
          status: 'FINALIZADO',
          data_conclusao: new Date()
        }
      })
    }

    return rastreamento
  } catch (error) {
    console.error('Erro ao atualizar status do serviço:', error)
    return false
  }
}

/**
 * deslocamento do prestador
 * @param {number} servicoId 
 * @param {number} prestadorId 
 * @param {Object} localizacao - {latitude, longitude, endereco?}
 * @returns {Object|false} - rastreamento criado ou false
 */
const iniciarDeslocamento = async (servicoId, usuarioId, localizacao) => {
  try {
    //busca o prestador pelo ID do usuário
    const prestador = await prisma.prestador.findUnique({
      where: { id_usuario: usuarioId },
      select: { 
        id: true,
        usuario: {
          select: {
            nome: true,
            email: true
          }
        }
      }
    })

    if (!prestador) {
      throw new Error('Prestador não encontrado para este usuário')
    }

    //busca o serviço
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId },
      select: {
        id_prestador: true,
        status: true,
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

    if (!servico) {
      throw new Error('Serviço não encontrado')
    }

    if (!servico.id_prestador) {
      throw new Error('Serviço não tem prestador atribuído')
    }

    if (servico.id_prestador !== prestador.id) {
      throw new Error(`Prestador não autorizado. Serviço pertence ao prestador ${servico.id_prestador} (${servico.prestador?.usuario?.nome}), mas tentativa de acesso por ${prestador.id} (${prestador.usuario.nome})`)
    }

    //verifica se o serviço está em andamento
    if (servico.status !== 'EM_ANDAMENTO') {
      throw new Error(`Serviço não está em andamento. Status atual: ${servico.status}`)
    }

    return await atualizarStatusServico(
      servicoId, 
      'A_CAMINHO', 
      localizacao, 
      'Prestador a caminho do local'
    )
  } catch (error) {
    console.error('Erro ao iniciar deslocamento:', error)
    return false
  }
}

/**
 * marca chegada no local
 * @param {number} servicoId 
 * @param {number} prestadorId 
 * @param {Object} localizacao - {latitude, longitude, endereco?}
 * @returns {Object|false} - rastreamento criado ou false
 */
const chegouNoLocal = async (servicoId, usuarioId, localizacao) => {
  try {
    console.log('🔍 DEBUG - Chegou no local - Usuário ID:', usuarioId)

    //busca prestador pelo ID do usuário
    const prestador = await prisma.prestador.findUnique({
      where: { id_usuario: usuarioId },
      select: { 
        id: true,
        usuario: {
          select: {
            nome: true,
            email: true
          }
        }
      }
    })

    console.log('Prestador encontrado:', prestador)

    if (!prestador) {
      throw new Error('Prestador não encontrado para este usuário')
    }

    //busca o serviço
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId },
      select: {
        id_prestador: true,
        status: true,
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

    if (!servico) {
      throw new Error('Serviço não encontrado')
    }

    if (!servico.id_prestador) {
      throw new Error('Serviço não tem prestador atribuído')
    }

    if (servico.id_prestador !== prestador.id) {
      throw new Error(`Prestador não autorizado. Serviço pertence ao prestador ${servico.id_prestador} (${servico.prestador?.usuario?.nome}), mas tentativa de acesso por ${prestador.id} (${prestador.usuario.nome})`)
    }

    //verifica se o status anterior é A_CAMINHO
    const ultimoRastreamento = await prisma.rastreamento_servico.findFirst({
      where: { id_servico: servicoId },
      orderBy: { data_hora: 'desc' }
    })

    if (ultimoRastreamento && ultimoRastreamento.status !== 'A_CAMINHO') {
      throw new Error(`Não é possível marcar chegada. Status atual: ${ultimoRastreamento.status}. Deve estar em A_CAMINHO.`)
    }

    return await atualizarStatusServico(
      servicoId, 
      'CHEGOU_LOCAL', 
      localizacao, 
      'Prestador chegou no local'
    )
  } catch (error) {
    console.error('Erro ao marcar chegada no local:', error)
    return false
  }
}
/**
 * inicia o serviço
 * @param {number} servicoId 
 * @param {number} usuarioId 
 * @returns {Object|false} - rastreamento criado ou false
 */
const iniciarServico = async (servicoId, usuarioId) => {
  try {
    //busca prestador pelo ID do usuário
    const prestador = await prisma.prestador.findUnique({
      where: { id_usuario: usuarioId },
      select: { 
        id: true,
        usuario: {
          select: {
            nome: true,
            email: true
          }
        }
      }
    })

    console.log('Prestador encontrado:', prestador)

    if (!prestador) {
      throw new Error('Prestador não encontrado para este usuário')
    }

    //busca o serviço
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId },
      select: {
        id_prestador: true,
        status: true,
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

    console.log('Serviço encontrado:', servico)

    if (!servico) {
      throw new Error('Serviço não encontrado')
    }

    if (!servico.id_prestador) {
      throw new Error('Serviço não tem prestador atribuído')
    }

    if (servico.id_prestador !== prestador.id) {
      throw new Error(`Prestador não autorizado. Serviço pertence ao prestador ${servico.id_prestador} (${servico.prestador?.usuario?.nome}), mas tentativa de acesso por ${prestador.id} (${prestador.usuario.nome})`)
    }

    //verifica se o status anterior é CHEGOU_LOCAL
    const ultimoRastreamento = await prisma.rastreamento_servico.findFirst({
      where: { id_servico: servicoId },
      orderBy: { data_hora: 'desc' }
    })

    if (ultimoRastreamento && ultimoRastreamento.status !== 'CHEGOU_LOCAL') {
      throw new Error(`Não é possível iniciar serviço. Status atual: ${ultimoRastreamento.status}. Deve estar em CHEGOU_LOCAL.`)
    }

    return await atualizarStatusServico(
      servicoId, 
      'INICIADO', 
      {}, 
      'Serviço iniciado'
    )
  } catch (error) {
    console.error('Erro ao iniciar serviço:', error)
    return false
  }
}

/**
 * finaliza o serviço
 * @param {number} servicoId 
 * @param {number} usuarioId - ID do usuário (do JWT)
 * @returns {Object|false} - rastreamento criado ou false
 */
const finalizarServico = async (servicoId, usuarioId) => {
  try {
    //busca prestador pelo ID do usuário
    const prestador = await prisma.prestador.findUnique({
      where: { id_usuario: usuarioId },
      select: { 
        id: true,
        usuario: {
          select: {
            nome: true,
            email: true
          }
        }
      }
    })

    console.log('Prestador encontrado:', prestador)

    if (!prestador) {
      throw new Error('Prestador não encontrado para este usuário')
    }

    //busca o serviço
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId },
      select: {
        id_prestador: true,
        status: true,
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

    if (!servico) {
      throw new Error('Serviço não encontrado')
    }

    if (!servico.id_prestador) {
      throw new Error('Serviço não tem prestador atribuído')
    }

    if (servico.id_prestador !== prestador.id) {
      throw new Error(`Prestador não autorizado. Serviço pertence ao prestador ${servico.id_prestador} (${servico.prestador?.usuario?.nome}), mas tentativa de acesso por ${prestador.id} (${prestador.usuario.nome})`)
    }

    //verifica se o status anterior é INICIADO
    const ultimoRastreamento = await prisma.rastreamento_servico.findFirst({
      where: { id_servico: servicoId },
      orderBy: { data_hora: 'desc' }
    })

    if (ultimoRastreamento && ultimoRastreamento.status !== 'INICIADO') {
      throw new Error(`Não é possível finalizar serviço. Status atual: ${ultimoRastreamento.status}. Deve estar em INICIADO.`)
    }

    return await atualizarStatusServico(
      servicoId, 
      'FINALIZADO', 
      {}, 
      'Serviço finalizado'
    )
  } catch (error) {
    console.error('Erro ao finalizar serviço:', error)
    return false
  }
}

module.exports = {
  insertRastreamento,
  selectRastreamentoByServico,
  selectUltimoRastreamento,
  atualizarStatusServico,
  iniciarDeslocamento,
  chegouNoLocal,
  iniciarServico,
  finalizarServico
}