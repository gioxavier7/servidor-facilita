/**
 * objetivo: controller para gerenciar chat de serviços
 * data: 18/10/2025
 * dev: Giovanna
 * versão: 1.0
 */

const chatDAO = require('../../model/dao/chat')
const socketService = require('../../service/socketService')

/**
 * envia mensagem no chat do serviço
 */
const enviarMensagem = async (req, res) => {
  try {
    const { id } = req.params;
    const { mensagem, tipo = 'texto', url_anexo } = req.body;
    
    //autenticação
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Usuário não autenticado'
      });
    }

    const usuarioId = req.user.id;
    const userTipo = req.user.tipo_conta;

    //busca informações do serviço
    const servico = await chatDAO.buscarServicoComParticipantes(parseInt(id));

    if (!servico) {
      return res.status(404).json({
        error: 'Serviço não encontrado'
      });
    }

    //verifica se usuário é participante do serviço
    const isContratante = servico.contratante.usuario.id === usuarioId;
    const isPrestador = servico.prestador && servico.prestador.usuario.id === usuarioId;

    if (!isContratante && !isPrestador) {
      return res.status(403).json({
        error: 'Acesso negado. Você não é participante deste serviço.'
      });
    }

    //define quem está enviando
    const enviado_por = isContratante ? 'contratante' : 'prestador';

    //validar mensagem
    if (!mensagem || mensagem.trim() === '') {
      return res.status(400).json({
        error: 'Mensagem não pode estar vazia'
      });
    }

    //enviar mensagem
    const mensagemData = {
      id_servico: parseInt(id),
      id_contratante: servico.id_contratante,
      id_prestador: servico.id_prestador,
      mensagem: mensagem.trim(),
      tipo,
      enviado_por,
      url_anexo
    };

    const mensagemEnviada = await chatDAO.enviarMensagem(mensagemData);

    if (!mensagemEnviada) {
      return res.status(500).json({
        error: 'Erro ao enviar mensagem'
      });
    }

    //mensagem em tempo real
    socketService.emitNewMessage(parseInt(id), {
      ...mensagemEnviada,
      event: 'new_message',
      timestamp: new Date()
    });

    console.log(`💬 Mensagem enviada via WebSocket para serviço ${id}`);

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      mensagem: mensagemEnviada
    });

  } catch (error) {
    console.error('Erro no controller enviarMensagem:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
}

/**
 *busca mensagens do serviço
 */
const buscarMensagens = async (req, res) => {
  try {
    const { id } = req.params
    
    // Verificar autenticação
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Usuário não autenticado'
      })
    }

    const usuarioId = req.user.id

    //buscar serviço para validar participação
    const servico = await chatDAO.buscarServicoComParticipantes(parseInt(id))

    if (!servico) {
      return res.status(404).json({
        error: 'Serviço não encontrado'
      })
    }

    //verificar se usuário é participante
    const isContratante = servico.contratante.usuario.id === usuarioId
    const isPrestador = servico.prestador && servico.prestador.usuario.id === usuarioId

    if (!isContratante && !isPrestador) {
      return res.status(403).json({
        error: 'Acesso negado. Você não é participante deste serviço.'
      })
    }

    //buscar mensagens
    const mensagens = await chatDAO.buscarMensagensPorServico(parseInt(id))

    if (!mensagens) {
      return res.status(500).json({
        error: 'Erro ao buscar mensagens'
      })
    }

    //marca mensagens como lidas
    const usuarioTipo = isContratante ? 'contratante' : 'prestador'
    await chatDAO.marcarMensagensComoLidas(parseInt(id), usuarioTipo)

    res.json({
      success: true,
      mensagens: mensagens
    })

  } catch (error) {
    console.error('Erro no controller buscarMensagens:', error)
    res.status(500).json({
      error: 'Erro interno do servidor'
    })
  }
}

/**
 *marcar mensagens como lidas
 */
const marcarComoLidas = async (req, res) => {
  try {
    const { id } = req.params
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Usuário não autenticado'
      })
    }

    const usuarioId = req.user.id
    const userTipo = req.user.tipo_conta

    //validar tipo de usuário
    if (userTipo !== 'CONTRATANTE' && userTipo !== 'PRESTADOR') {
      return res.status(400).json({
        error: 'Tipo de usuário inválido'
      })
    }

    const resultado = await chatDAO.marcarMensagensComoLidas(
      parseInt(id), 
      userTipo.toLowerCase()
    )

    res.json({
      success: true,
      message: 'Mensagens marcadas como lidas',
      atualizadas: resultado.count
    })

  } catch (error) {
    console.error('Erro no controller marcarComoLidas:', error)
    res.status(500).json({
      error: 'Erro interno do servidor'
    })
  }
}

module.exports = {
  enviarMensagem,
  buscarMensagens,
  marcarComoLidas
}