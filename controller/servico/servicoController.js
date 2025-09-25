/**
 * Controller de Serviço
 * Fluxo:
 *  - Cadastro
 *  - Atualização
 *  - Exclusão
 *  - Listagem / Buscar por ID
 *
 * dev: Giovanna
 * data: 25/09/2025
 */

const servicoDAO = require('../../model/dao/servico')

/**
 * Cadastrar um novo serviço
 */
const cadastrarServico = async (req, res) => {
  try {
    if (req.headers['content-type'] !== 'application/json') {
      return res.status(415).json({ status_code: 415, message: 'Content-type inválido. Use application/json' })
    }

    const { id_contratante, id_prestador, id_categoria, descricao, id_localizacao, status } = req.body

    if (!id_contratante || !descricao) {
      return res.status(400).json({ status_code: 400, message: 'Campos obrigatórios: id_contratante, descricao' })
    }

    const novoServico = await servicoDAO.insertServico({
      id_contratante,
      id_prestador: id_prestador || null,
      id_categoria: id_categoria || null,
      descricao,
      id_localizacao: id_localizacao || null,
      status: status || 'pendente'
    })

    if (!novoServico) {
      return res.status(500).json({ status_code: 500, message: 'Erro ao cadastrar serviço' })
    }

    res.status(201).json({ status_code: 201, message: 'Serviço cadastrado com sucesso', data: novoServico })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status_code: 500, message: 'Erro interno do servidor' })
  }
}

/**
 * Atualizar um serviço
 */
const atualizarServico = async (req, res) => {
  try {
    if (req.headers['content-type'] !== 'application/json') {
      return res.status(415).json({ status_code: 415, message: 'Content-type inválido. Use application/json' })
    }

    const { id } = req.params
    const { id_prestador, id_categoria, descricao, id_localizacao, status } = req.body

    if (!id) {
      return res.status(400).json({ status_code: 400, message: 'ID do serviço é obrigatório' })
    }

    const atualizado = await servicoDAO.updateServico({
      id: Number(id),
      id_prestador: id_prestador || null,
      id_categoria: id_categoria || null,
      descricao,
      id_localizacao: id_localizacao || null,
      status
    })

    if (!atualizado) {
      return res.status(404).json({ status_code: 404, message: 'Serviço não encontrado ou erro ao atualizar' })
    }

    res.status(200).json({ status_code: 200, message: 'Serviço atualizado com sucesso', data: atualizado })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status_code: 500, message: 'Erro interno do servidor' })
  }
}

/**
 * Deletar um serviço
 */
const deletarServico = async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ status_code: 400, message: 'ID do serviço é obrigatório' })
    }

    const deletado = await servicoDAO.deleteServico(Number(id))

    if (!deletado) {
      return res.status(404).json({ status_code: 404, message: 'Serviço não encontrado' })
    }

    res.status(200).json({ status_code: 200, message: 'Serviço deletado com sucesso', data: deletado })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status_code: 500, message: 'Erro interno do servidor' })
  }
}

/**
 * Listar todos os serviços
 */
const listarServicos = async (req, res) => {
  try {
    const servicos = await servicoDAO.selectAllServico()

    if (!servicos) {
      return res.status(404).json({ status_code: 404, message: 'Nenhum serviço encontrado' })
    }

    res.status(200).json({ status_code: 200, data: servicos })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status_code: 500, message: 'Erro interno do servidor' })
  }
}

/**
 * Buscar serviço por ID
 */
const buscarServicoPorId = async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ status_code: 400, message: 'ID do serviço é obrigatório' })
    }

    const servico = await servicoDAO.selectByIdServico(Number(id))

    if (!servico) {
      return res.status(404).json({ status_code: 404, message: 'Serviço não encontrado' })
    }

    res.status(200).json({ status_code: 200, data: servico })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status_code: 500, message: 'Erro interno do servidor' })
  }
}

module.exports = {
  cadastrarServico,
  atualizarServico,
  deletarServico,
  listarServicos,
  buscarServicoPorId
}
