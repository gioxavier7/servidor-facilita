const notificacaoDAO = require('../../model/dao/notificacaoDAO')

/**
 * listar notificações do usuário
 */
const listarNotificacoes = async (req, res) => {
  try {
    const id_usuario = req.user.id
    const { apenas_nao_lidas } = req.query

    const notificacoes = await notificacaoDAO.listarNotificacoes(
      id_usuario, 
      apenas_nao_lidas === 'true'
    )

    const naoLidas = await notificacaoDAO.contarNaoLidas(id_usuario)

    res.status(200).json({
      status_code: 200,
      data: {
        notificacoes,
        total_nao_lidas: naoLidas
      }
    })

  } catch (error) {
    console.error('Erro ao listar notificações:', error)
    res.status(500).json({
      status_code: 500,
      message: 'Erro interno do servidor'
    })
  }
}

/**
 * marcar notificação como lida
 */
const marcarComoLida = async (req, res) => {
  try {
    const { id } = req.params
    const id_usuario = req.user.id

    //verifica se a notificação pertence ao usuário
    const notificacao = await notificacaoDAO.listarNotificacoes(id_usuario)
    const pertenceAoUsuario = notificacao.some(n => n.id === parseInt(id))

    if (!pertenceAoUsuario) {
      return res.status(403).json({
        status_code: 403,
        message: 'Notificação não pertence ao usuário'
      })
    }

    await notificacaoDAO.marcarComoLida(parseInt(id))

    res.status(200).json({
      status_code: 200,
      message: 'Notificação marcada como lida'
    })

  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error)
    res.status(500).json({
      status_code: 500,
      message: 'Erro interno do servidor'
    })
  }
}

/**
 *marcar todas como lidas
 */
const marcarTodasComoLidas = async (req, res) => {
  try {
    const id_usuario = req.user.id

    await notificacaoDAO.marcarTodasComoLidas(id_usuario)

    res.status(200).json({
      status_code: 200,
      message: 'Todas notificações marcadas como lidas'
    })

  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error)
    res.status(500).json({
      status_code: 500,
      message: 'Erro interno do servidor'
    })
  }
}

module.exports = {
  listarNotificacoes,
  marcarComoLida,
  marcarTodasComoLidas
}