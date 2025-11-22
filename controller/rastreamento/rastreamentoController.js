/**
 * objetivo: Controller para gerenciar rastreamento de serviços
 * data: 25/09/2025
 * dev: Giovanna
 * versão: 1.1 - Com WebSocket
 */

const rastreamentoDAO = require('../../model/dao/rastreamento')
const servicoDAO = require('../../model/dao/servico')
const socketService = require('../../service/socketService')

/**
 * inicia deslocamento do prestador
 */
const iniciarDeslocamento = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, endereco } = req.body;
    const usuarioId = req.user.id;
    const userTipo = req.user.tipo_conta;

    //verifica se o usuário é um prestador
    if (userTipo !== 'PRESTADOR') {
      return res.status(403).json({
        error: 'Acesso negado. Apenas prestadores podem iniciar deslocamento.'
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Localização é obrigatória'
      });
    }

    const resultado = await rastreamentoDAO.iniciarDeslocamento(
      parseInt(id),
      usuarioId,
      { latitude, longitude, endereco }
    );

    if (!resultado) {
      return res.status(400).json({
        error: 'Não foi possível iniciar o deslocamento'
      });
    }

    // websocket faz atualização de status
    socketService.emitStatusUpdate(parseInt(id), {
      status: 'A_CAMINHO',
      rastreamento: resultado,
      event: 'status_updated',
      timestamp: new Date(),
      message: 'Prestador a caminho do local'
    });

    console.log(`🔄 Status A_CAMINHO emitido via WebSocket para serviço ${id}`);

    res.json({
      success: true,
      message: 'Deslocamento iniciado com sucesso',
      rastreamento: resultado
    });

  } catch (error) {
    console.error('Erro no controller iniciarDeslocamento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
}

/**
 * marca chegada no local
 */
const chegouNoLocal = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, endereco } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Usuário não autenticado'
      });
    }

    const usuarioId = req.user.id
    const userTipo = req.user.tipo_conta;

    //verifica se o usuário é um prestador
    if (userTipo !== 'PRESTADOR') {
      return res.status(403).json({
        error: 'Acesso negado. Apenas prestadores podem marcar chegada no local.'
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Localização é obrigatória'
      });
    }

    const resultado = await rastreamentoDAO.chegouNoLocal(
      parseInt(id),
      usuarioId,
      { latitude, longitude, endereco }
    );

    if (!resultado) {
      return res.status(400).json({
        error: 'Não foi possível marcar chegada no local'
      });
    }

    //websocket faz atualização de status
    socketService.emitStatusUpdate(parseInt(id), {
      status: 'CHEGOU_LOCAL',
      rastreamento: resultado,
      event: 'status_updated',
      timestamp: new Date(),
      message: 'Prestador chegou no local',
      location: { latitude, longitude, endereco }
    });

    console.log(`📍 Status CHEGOU_LOCAL emitido via WebSocket para serviço ${id}`);

    res.json({
      success: true,
      message: 'Chegada no local registrada com sucesso',
      rastreamento: resultado
    });

  } catch (error) {
    console.error('Erro no controller chegouNoLocal:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
}

/**
 * inicia o serviço
 */
const iniciarServico = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Usuário não autenticado'
      });
    }

    const usuarioId = req.user.id;
    const userTipo = req.user.tipo_conta;

    if (userTipo !== 'PRESTADOR') {
      return res.status(403).json({
        error: 'Acesso negado. Apenas prestadores podem iniciar serviços.'
      });
    }

    const resultado = await rastreamentoDAO.iniciarServico(
      parseInt(id),
      usuarioId
    );

    if (!resultado) {
      return res.status(400).json({
        error: 'Não foi possível iniciar o serviço'
      });
    }

    // websocket faz atualização de status
    socketService.emitStatusUpdate(parseInt(id), {
      status: 'INICIADO',
      rastreamento: resultado,
      event: 'status_updated',
      timestamp: new Date(),
      message: 'Serviço iniciado'
    });

    console.log(`🔧 Status INICIADO emitido via WebSocket para serviço ${id}`);

    res.json({
      success: true,
      message: 'Serviço iniciado com sucesso',
      rastreamento: resultado
    });

  } catch (error) {
    console.error('Erro no controller iniciarServico:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
}

/**
 * finaliza o serviço
 */
const finalizarServico = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Usuário não autenticado'
      });
    }

    const usuarioId = req.user.id;
    const userTipo = req.user.tipo_conta;

    if (userTipo !== 'PRESTADOR') {
      return res.status(403).json({
        error: 'Acesso negado. Apenas prestadores podem finalizar serviços.'
      });
    }

    const resultado = await rastreamentoDAO.finalizarServico(
      parseInt(id),
      usuarioId
    );

    if (!resultado) {
      return res.status(400).json({
        error: 'Não foi possível finalizar o serviço'
      });
    }

    socketService.emitStatusUpdate(parseInt(id), {
      status: 'FINALIZADO',
      rastreamento: resultado,
      event: 'status_updated',
      timestamp: new Date(),
      message: 'Serviço finalizado'
    });

    console.log(`✅ Status FINALIZADO emitido via WebSocket para serviço ${id}`);

    res.json({
      success: true,
      message: 'Serviço finalizado com sucesso',
      rastreamento: resultado
    });

  } catch (error) {
    console.error('Erro no controller finalizarServico:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
}

/**
 * atualiza localização em tempo real (rastreamento contínuo)
 */
const atualizarLocalizacao = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Usuário não autenticado'
      });
    }

    const usuarioId = req.user.id;
    const userTipo = req.user.tipo_conta;

    if (userTipo !== 'PRESTADOR') {
      return res.status(403).json({
        error: 'Acesso negado. Apenas prestadores podem atualizar localização.'
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Localização é obrigatória'
      });
    }

    //apenas broadcast em tempo real
    socketService.emitLocationUpdate(parseInt(id), {
      servicoId: parseInt(id),
      latitude: latitude,
      longitude: longitude,
      prestadorId: usuarioId,
      timestamp: new Date(),
      event: 'location_updated'
    });

    console.log(`📍 Localização atualizada via WebSocket para serviço ${id}: ${latitude}, ${longitude}`);

    res.json({
      success: true,
      message: 'Localização atualizada em tempo real',
      location: { latitude, longitude }
    });

  } catch (error) {
    console.error('Erro no controller atualizarLocalizacao:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
}

/**
 *busca histórico de rastreamento de um serviço
 */
const getRastreamentoByServico = async (req, res) => {
  try {
    const { id } = req.params

    const rastreamentos = await rastreamentoDAO.selectRastreamentoByServico(parseInt(id))

    if (!rastreamentos) {
      return res.status(404).json({
        error: 'Nenhum registro de rastreamento encontrado'
      })
    }

    res.json({
      success: true,
      rastreamentos: rastreamentos
    })

  } catch (error) {
    console.error('Erro no controller getRastreamentoByServico:', error)
    res.status(500).json({
      error: 'Erro interno do servidor'
    })
  }
}

/**
 *busca último status de rastreamento
 */
const getUltimoRastreamento = async (req, res) => {
  try {
    const { id } = req.params

    const ultimoRastreamento = await rastreamentoDAO.selectUltimoRastreamento(parseInt(id))

    if (!ultimoRastreamento) {
      return res.status(404).json({
        error: 'Nenhum registro de rastreamento encontrado'
      })
    }

    res.json({
      success: true,
      rastreamento: ultimoRastreamento
    })

  } catch (error) {
    console.error('Erro no controller getUltimoRastreamento:', error)
    res.status(500).json({
      error: 'Erro interno do servidor'
    })
  }
}

module.exports = {
  iniciarDeslocamento,
  chegouNoLocal,
  iniciarServico,
  finalizarServico,
  atualizarLocalizacao,
  getRastreamentoByServico,
  getUltimoRastreamento
}