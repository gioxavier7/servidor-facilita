/**
 * objetivo: DAO responsável pelo CRUD de serviços usando Prisma
 * data: 25/09/2025
 * dev: Giovanna
 * versão: 1.1
 */

const {statusServico } = require('../../prisma/generated/client')
const prisma = require("../../prisma.js");

/**
 * cadastra um novo serviço
 * @param {Object} servico - {id_contratante, id_prestador?, id_categoria?, descricao, valor?, id_localizacao?, status?}
 * @returns {Object|false} - serviço criado ou false em caso de erro
 */
const insertServico = async (servico) => {
  try {
    const novoServico = await prisma.servico.create({
      data: {
        id_contratante: servico.id_contratante,
        id_prestador: servico.id_prestador,
        id_categoria: servico.id_categoria,
        descricao: servico.descricao,
        valor: servico.valor,
        id_localizacao: servico.id_localizacao,
        status: servico.status
      },
      include: {
        contratante: {
          include: {
            usuario: true
          }
        },
        prestador: true,
        categoria: true,
        localizacao: true,
        pagamentos: true
      }
    })

    return novoServico
  } catch (error) {
    console.error("Erro ao inserir serviço:", error)
    return false
  }
}

/**
 * atualiza um serviço existente
 * @param {Object} servico - {id, id_prestador?, id_categoria?, descricao?, id_localizacao?, status?}
 * @returns {Object|false} - serviço atualizado ou false
 */
const updateServico = async (servico) => {
  try {
    const atualizado = await prisma.servico.update({
      where: { id: servico.id },
      data: {
        id_prestador: servico.id_prestador,
        id_categoria: servico.id_categoria,
        descricao: servico.descricao,
        id_localizacao: servico.id_localizacao,
        status: servico.status
      },
      include: {
        contratante: {
          include: {
            usuario: true
          }
        },
        prestador: true,
        categoria: true,
        localizacao: true,
        pagamentos: true
      }
    })

    return atualizado
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error)
    return false
  }
}
/**
 * deleta um serviço pelo ID
 * @param {number} id
 * @returns {Object|false} - serviço deletado ou false
 */
const deleteServico = async (id) => {
  try {
    const deletado = await prisma.servico.delete({
      where: { id: id },
      include: {
        contratante: true,
        prestador: true,
        categoria: true,
        localizacao: true
      }
    })

    return deletado
  } catch (error) {
    console.error('Erro ao deletar serviço:', error)  
    return false
  }
}

/**
 * retorna todos os serviços
 * @returns {Array|false} - lista de serviços ou false
 */
const selectAllServico = async () => {
  try {
    const servicos = await prisma.servico.findMany({
      orderBy: { id: 'desc' },
      include: {
        contratante: true,
        prestador: true,
        categoria: true,
        localizacao: true,
        pagamentos: true
      }
    })

    return servicos
  } catch (error) {
    console.error('Erro ao buscar serviços: ', error)   
    return false
  }
}

/**
 * Buscar serviço por ID com relacionamentos
 */
const selectByIdServico = async (id) => {
  try {
    // validação
    if (!id || isNaN(id)) {
      throw new Error('ID inválido')
    }

    return await prisma.servico.findUnique({
      where: { id: Number(id) },
      include: {
        categoria: true,
        localizacao: true,
        prestador: {
          include: {
            usuario: {
              select: {
                nome: true,
                email: true,
                telefone: true
              }
            }
          }
        },
        contratante: {
          include: {
            usuario: {
              select: {
                nome: true,
                email: true,
                telefone: true
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar serviço por ID:', error);
    throw error;
  }
}

/**
 * retorna um serviço pelo ID incluindo apenas contratante e prestador
 * @param {number} id
 * @returns {Object|false} - serviço ou false
 */
const selectServicoById = async (id) => {
  try {
    const servico = await prisma.servico.findUnique({
      where: { id: parseInt(id) },
      include: {
        contratante: {
          include: {
            usuario: true
          }
        },
        prestador: {
          include: {
            usuario: true
          }
        },
        categoria: true,
        localizacao: true,
        pagamentos: true,
        paradas: {
          orderBy: {
            ordem: 'asc'
          }
        }
      }
    })
    return servico
  } catch (error) {
    console.error("Erro ao buscar serviço por ID:", error)
    return false
  }
}

/**
 * retorna serviços disponíveis (PENDENTE) para prestadores
 * @returns {Array|false} - lista de serviços disponíveis ou false
 */
const selectServicosDisponiveis = async () => {
  try {
    const servicos = await prisma.servico.findMany({
      where: { 
        status: statusServico.PENDENTE
      },
      orderBy: { data_solicitacao: 'desc' },
      include: {
        contratante: {
          include: {
            usuario: true
          }
        },
        categoria: true,
        localizacao: true,
        paradas: {
          orderBy: {
            ordem: 'asc'
          }
        }
      }
    })

    return servicos
  } catch (error) {
    console.error('Erro ao buscar serviços disponíveis: ', error)   
    return false
  }
}

/**
 * Aceita um serviço (muda status para EM_ANDAMENTO e atribui ao prestador)
 * @param {number} servicoId 
 * @param {number} prestadorId 
 * @returns {Object|false} - serviço atualizado ou false
 */
const aceitarServico = async (servicoId, prestadorId) => {
  try {
    //verifica se o prestador já tem algum serviço em andamento
    const servicoEmAndamento = await prisma.servico.findFirst({
      where: {
        id_prestador: prestadorId,
        status: statusServico.EM_ANDAMENTO
      }
    })

    if (servicoEmAndamento) {
      throw new Error('Prestador já possui um serviço em andamento')
    }

    //verifica se o serviço ainda está disponível
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId }
    })

    if (!servico || servico.status !== statusServico.PENDENTE) {
      throw new Error('Serviço não está mais disponível')
    }

    // Atualiza o serviço
    const servicoAtualizado = await prisma.servico.update({
      where: { id: servicoId },
      data: {
        id_prestador: prestadorId,
        status: statusServico.EM_ANDAMENTO
      },
      include: {
        contratante: {
          include: {
            usuario: true
          }
        },
        prestador: {
          include: {
            usuario: true
          }
        },
        categoria: true,
        localizacao: true
      }
    })

    return servicoAtualizado
  } catch (error) {
    console.error('Erro ao aceitar serviço:', error)
    throw error
  }
}

/**
 * finaliza um serviço (muda status para FINALIZADO)
 * @param {number} servicoId 
 * @param {number} prestadorId 
 * @returns {Object|false} - serviço finalizado ou false
 */
const finalizarServico = async (servicoId, prestadorId) => {
  try {
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId }
    })

    if (!servico || servico.id_prestador !== prestadorId) {
      throw new Error('Serviço não encontrado ou prestador não autorizado')
    }

    if (servico.status !== statusServico.EM_ANDAMENTO) {
      throw new Error('Serviço não está em andamento')
    }

    const servicoFinalizado = await prisma.servico.update({
      where: { id: servicoId },
      data: {
        status: statusServico.FINALIZADO,
        data_conclusao: new Date()
      },
      include: {
        contratante: {
          include: {
            usuario: true
          }
        },
        prestador: {
          include: {
            usuario: true
          }
        },
        categoria: true,
        localizacao: true
      }
    })

    return servicoFinalizado
  } catch (error) {
    console.error('Erro ao finalizar serviço:', error)
    throw error
  }
}

const selectServicosPorPrestador = async (prestadorId) => {
  try {
    const servicos = await prisma.servico.findMany({
      where: { 
        id_prestador: prestadorId 
      },
      orderBy: { data_solicitacao: 'desc' },
      include: {
        contratante: {
          include: {
            usuario: true
          }
        },
        categoria: true,
        localizacao: true,
        paradas: {
          orderBy: { 
            ordem: 'asc'
          }
        }
      }
    })

    return servicos
  } catch (error) {
    console.error('Erro ao buscar serviços do prestador: ', error)   
    return false
  }
}

const selectServicosPorPrestadorEStatus = async (prestadorId, status, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit
    
    const servicos = await prisma.servico.findMany({
      where: { 
        id_prestador: prestadorId,
        status: status
      },
      skip: skip,
      take: parseInt(limit),
      orderBy: { data_solicitacao: 'desc' },
      include: {
        contratante: {
          include: {
            usuario: true
          }
        },
        categoria: true,
        localizacao: true,
        paradas: {
          orderBy: { 
            ordem: 'asc'
          }
        }
      }
    })

    return servicos
  } catch (error) {
    console.error('Erro ao buscar serviços do prestador por status: ', error)   
    return false
  }
}

const countServicosPorPrestador = async (prestadorId) => {
  try {
    const count = await prisma.servico.count({
      where: { 
        id_prestador: prestadorId 
      }
    })
    return count
  } catch (error) {
    console.error('Erro ao contar serviços do prestador: ', error)   
    return 0
  }
}

/**
 * busca serviços por contratante com paradas
 */
const selectServicosPorContratante = async (id_contratante, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit
    
    const servicos = await prisma.servico.findMany({
      where: {
        id_contratante: id_contratante
      },
      include: {
        contratante: {
          include: {
            usuario: true
          }
        },
        prestador: {
          include: {
            usuario: true
          }
        },
        categoria: true,
        localizacao: true,
        pagamentos: true,
        paradas: {
          orderBy: {
            ordem: 'asc'
          }
        }
      },
      orderBy: {
        data_solicitacao: 'desc'
      },
      skip: skip,
      take: parseInt(limit)
    })

    return servicos
  } catch (error) {
    console.error("Erro ao buscar serviços por contratante:", error)
    return false
  }
}

/**
 * Busca serviços por contratante e status com paradas
 */
const selectServicosPorContratanteEStatus = async (id_contratante, status, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit
    
    const servicos = await prisma.servico.findMany({
      where: {
        id_contratante: id_contratante,
        status: status
      },
      include: {
        contratante: {
          include: {
            usuario: true
          }
        },
        prestador: {
          include: {
            usuario: true
          }
        },
        categoria: true,
        localizacao: true,
        pagamentos: true,
        paradas: {
          orderBy: {
            ordem: 'asc'
          }
        }
      },
      orderBy: {
        data_solicitacao: 'desc'
      },
      skip: skip,
      take: parseInt(limit)
    })

    return servicos
  } catch (error) {
    console.error("Erro ao buscar serviços por contratante e status:", error)
    return false
  }
}

/**
 * Contar total de serviços do contratante
 */
const countServicosPorContratante = async (idContratante) => {
  try {
    return await prisma.servico.count({
      where: { id_contratante: idContratante }
    });
  } catch (error) {
    console.error('Erro ao contar serviços do contratante:', error);
    throw error;
  }
}

/**
 * Confirma a conclusão de um serviço (muda status para CONCLUIDO)
 * @param {number} servicoId 
 * @param {number} contratanteId 
 * @returns {Object|false} - serviço concluído ou false
 */
const confirmarConclusao = async (servicoId, contratanteId) => {
  try {
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId }
    });

    if (!servico || servico.id_contratante !== contratanteId) {
      throw new Error('Serviço não encontrado ou contratante não autorizado');
    }

    if (servico.status !== statusServico.FINALIZADO) {
      throw new Error('Serviço não está finalizado');
    }

    const servicoConcluido = await prisma.servico.update({
      where: { id: servicoId },
      data: {
        status: statusServico.CONCLUIDO,
        data_confirmacao: new Date()
      },
      include: {
        contratante: {
          include: {
            usuario: true
          }
        },
        prestador: {
          include: {
            usuario: true
          }
        },
        categoria: true,
        localizacao: true
      }
    });

    return servicoConcluido;
  } catch (error) {
    console.error('Erro ao confirmar conclusão do serviço:', error);
    throw error;
  }
};

/**
 * Pesquisa serviços por descrição
 * @param {string} descricao 
 * @returns {Array|false} - lista de serviços encontrados ou false
 */
const pesquisarPorDescricao = async (descricao) => {
  try {
    const servicos = await prisma.servico.findMany({
      where: {
        descricao: {
          contains: descricao
        }
      },
      orderBy: { data_solicitacao: 'desc' },
      include: {
        contratante: {
          include: {
            usuario: {
              select: {
                nome: true,
                email: true
              }
            }
          }
        },
        prestador: {
          include: {
            usuario: {
              select: {
                nome: true,
                email: true
              }
            }
          }
        },
        categoria: true,
        localizacao: true
      }
    });

    return servicos;
  } catch (error) {
    console.error('Erro ao pesquisar serviços por descrição:', error);
    return false;
  }
};

/**
 * Filtra serviços por categoria
 * @param {number} categoriaId 
 * @returns {Array|false} - lista de serviços filtrados ou false
 */
const filtrarPorCategoria = async (categoriaId) => {
  try {
    const servicos = await prisma.servico.findMany({
      where: {
        id_categoria: categoriaId
      },
      orderBy: { data_solicitacao: 'desc' },
      include: {
        contratante: true,
        prestador: true,
        categoria: true,
        localizacao: true
      }
    });

    return servicos;
  } catch (error) {
    console.error('Erro ao filtrar serviços por categoria:', error);
    return false;
  }
}

/**
 * Recusa um serviço pelo prestador
 * @param {number} servicoId - ID do serviço
 * @param {number} prestadorId - ID do prestador
 * @param {string} motivoRecusa - Motivo opcional da recusa
 * @returns {Object|false} - Serviço atualizado ou false em caso de erro
 */
const recusarServico = async (servicoId, prestadorId, motivoRecusa = null) => {
  try {
    // Verifica se o serviço existe e está disponível
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId }
    })

    if (!servico) {
      throw new Error('Serviço não encontrado')
    }

    // Verifica se o serviço está pendente
    if (servico.status !== statusServico.PENDENTE) {
      throw new Error('Serviço não está disponível para recusa')
    }

    // Verifica se o prestador já recusou este serviço anteriormente
    const recusaExistente = await prisma.recusaServico.findFirst({
      where: {
        id_servico: servicoId,
        id_prestador: prestadorId
      }
    })

    if (recusaExistente) {
      throw new Error('Você já recusou este serviço anteriormente')
    }

    // Cria registro de recusa
    await prisma.recusaServico.create({
      data: {
        id_servico: servicoId,
        id_prestador: prestadorId,
        motivo: motivoRecusa,
        data_recusa: new Date()
      }
    })

    // Opcional: Contar quantas recusas o serviço teve
    const totalRecusas = await prisma.recusaServico.count({
      where: { id_servico: servicoId }
    })

    // Se o serviço foi recusado muitas vezes, pode-se mudar o status
    if (totalRecusas >= 5) { // Ajuste o limite conforme necessário
      await prisma.servico.update({
        where: { id: servicoId },
        data: {
          status: statusServico.CANCELADO,
          motivo_cancelamento: 'Serviço recusado por múltiplos prestadores'
        }
      })
    }

    return {
      servico: servico,
      recusaRegistrada: true,
      totalRecusas: totalRecusas,
      mensagem: 'Serviço recusado com sucesso'
    }

  } catch (error) {
    console.error('Erro ao recusar serviço:', error)
    throw error
  }
}

/**
 * busca serviços recusados por um prestador
 * @param {number} prestadorId - ID do prestador
 * @returns {Array} - Lista de serviços recusados
 */
const selectServicosRecusados = async (prestadorId) => {
  try {
    const recusas = await prisma.recusaServico.findMany({
      where: { id_prestador: prestadorId },
      include: {
        servico: {
          include: {
            contratante: {
              include: {
                usuario: true
              }
            },
            categoria: true,
            localizacao: true
          }
        }
      },
      orderBy: { data_recusa: 'desc' }
    })

    return recusas
  } catch (error) {
    console.error('Erro ao buscar serviços recusados:', error)
    throw error
  }
}

/**
 * Cancela um serviço pelo contratante
 * @param {number} servicoId - ID do serviço
 * @param {number} usuarioId - ID do usuário contratante
 * @param {string} motivoCancelamento - Motivo opcional do cancelamento
 * @returns {Object} - Serviço atualizado
 */
const cancelarServico = async (servicoId, usuarioId, motivoCancelamento = null) => {
  try {
    // Busca o contratante baseado no usuarioId
    const contratante = await prisma.contratante.findUnique({
      where: { id_usuario: usuarioId },
      select: { id: true }
    })

    if (!contratante) {
      throw new Error('Contratante não encontrado')
    }

    const contratanteId = contratante.id

    // Verifica se o serviço existe
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId },
      include: {
        prestador: {
          select: {
            id: true,
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          }
        },
        contratante: {
          select: {
            id: true,
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          }
        },
        pagamentos: {
          where: {
            status: {
              in: ['PAGO', 'PENDENTE']
            }
          },
          select: {
            id: true,
            status: true,
            valor: true
          }
        }
      }
    })

    if (!servico) {
      throw new Error('Serviço não encontrado')
    }

    // Verifica se o serviço pertence ao contratante
    if (servico.id_contratante !== contratanteId) {
      throw new Error('Este serviço não pertence ao contratante')
    }

    // Verifica se o serviço já está cancelado
    if (servico.status === 'CANCELADO') {
      throw new Error('Serviço já está cancelado')
    }

    // Verifica se o serviço já foi concluído ou finalizado
    if (servico.status === 'CONCLUIDO' || servico.status === 'FINALIZADO') {
      throw new Error('Não é possível cancelar um serviço já concluído/finalizado')
    }

    // Status permitidos para cancelamento
    const statusPermitidos = ['PENDENTE', 'EM_ANDAMENTO']

    if (!statusPermitidos.includes(servico.status)) {
      throw new Error(`Serviço não pode ser cancelado no status: ${servico.status}`)
    }

    // Se o serviço está em andamento, requer um motivo
    if (servico.status === 'EM_ANDAMENTO' && !motivoCancelamento) {
      throw new Error('Motivo é obrigatório para cancelar serviço em andamento')
    }

    // Inicia transação para garantir consistência
    const resultado = await prisma.$transaction(async (tx) => {
      // Atualiza o serviço para cancelado
      const servicoAtualizado = await tx.servico.update({
        where: { id: servicoId },
        data: {
          status: 'CANCELADO',
          data_conclusao: new Date()
        },
        include: {
          prestador: {
            select: {
              id: true,
              usuario: {
                select: {
                  id: true,
                  nome: true,
                  email: true
                }
              }
            }
          },
          contratante: {
            select: {
              id: true,
              usuario: {
                select: {
                  id: true,
                  nome: true,
                  email: true
                }
              }
            }
          }
        }
      })

      // Cancela pagamentos pendentes
      if (servico.pagamentos && servico.pagamentos.length > 0) {
        await tx.pagamento.updateMany({
          where: {
            id_servico: servicoId,
            status: 'PENDENTE'
          },
          data: {
            status: 'CANCELADO'
          }
        })
      }

      // Se havia pagamento pago, processa reembolso
      const pagamentoPago = servico.pagamentos.find(p => p.status === 'PAGO')
      if (pagamentoPago) {
        //implementar a lógica de reembolso
        //por enquanto só atualiza o status
        await tx.pagamento.update({
          where: { id: pagamentoPago.id },
          data: { status: 'CANCELADO' }
        })

        // Adiciona registro de reembolso se necessário
        // await processarReembolso(pagamentoPago.id, servicoAtualizado)
      }

      // Cria notificação para o prestador se houver
      if (servico.id_prestador) {
        await tx.notificacao.create({
          data: {
            id_usuario: servico.prestador.usuario.id,
            id_servico: servicoId,
            tipo: 'CANCELAMENTO_SERVICO',
            titulo: 'Serviço Cancelado',
            mensagem: `O serviço #${servicoId} foi cancelado pelo contratante.${motivoCancelamento ? ` Motivo: ${motivoCancelamento}` : ''}`,
            data_criacao: new Date()
          }
        })
      }

      // Registra no rastreamento
      await tx.rastreamento_servico.create({
        data: {
          id_servico: servicoId,
          status: 'FINALIZADO',
          observacao: `Serviço cancelado pelo contratante.${motivoCancelamento ? ` Motivo: ${motivoCancelamento}` : ''}`,
          data_hora: new Date()
        }
      })

      return {
        servico: servicoAtualizado,
        mensagem: 'Serviço cancelado com sucesso',
        reembolsoProcessado: !!pagamentoPago,
        motivoCancelamento: motivoCancelamento
      }
    })

    return resultado

  } catch (error) {
    console.error('Erro ao cancelar serviço:', error)
    throw error
  }
}

module.exports = {
  insertServico,
  selectAllServico,
  selectByIdServico,
  updateServico,
  deleteServico,
  selectServicoById,
  selectServicosDisponiveis,
  aceitarServico,
  finalizarServico,
  selectServicosPorPrestador,
  selectServicosPorContratante,
  selectServicosPorContratanteEStatus,
  countServicosPorContratante,
  confirmarConclusao,
  pesquisarPorDescricao,
  filtrarPorCategoria,
  recusarServico,
  selectServicosRecusados,
  selectServicosPorPrestadorEStatus,
  countServicosPorPrestador,
  cancelarServico
}