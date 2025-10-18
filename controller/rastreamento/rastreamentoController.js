/**
 * objetivo: Controller para gerenciar rastreamento de serviços
 * data: 25/09/2025
 * dev: Giovanna
 * versão: 1.0
 */

const rastreamentoDAO = require('../../model/dao/rastreamento')
const servicoDAO = require('../../model/dao/servico')

/**
 * Inicia deslocamento do prestador
 */
const iniciarDeslocamento = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, endereco } = req.body;
    const usuarioId = req.user.id;
    const userTipo = req.user.tipo_conta;

    // vrificar se o usuário é um prestador
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
 * Marca chegada no local
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
 * Inicia o serviço
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
      usuarioId // ← Enviando o ID correto
    );

    if (!resultado) {
      return res.status(400).json({
        error: 'Não foi possível iniciar o serviço'
      });
    }

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
 * Finaliza o serviço
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
 * Busca histórico de rastreamento de um serviço
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
 * Busca último status de rastreamento
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
  getRastreamentoByServico,
  getUltimoRastreamento
}