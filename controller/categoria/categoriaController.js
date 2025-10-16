/**
 * Controller de Categoria
 * Fluxo:
 *  - Cadastro
 *  - Atualização
 *  - Exclusão
 *  - Listagem / Buscar por ID
 *
 * dev: Giovanna
 * data: 25/09/2025
 */

const categoriaDAO = require('../../model/dao/categoria')

/**
 * Cadastrar categoria
 */
const cadastrarCategoria = async (req, res) => {
  try {
    if (req.headers['content-type'] !== 'application/json') {
      return res.status(415).json({ status_code: 415, message: 'Content-type inválido. Use application/json' })
    }

    const { nome } = req.body
    if (!nome) {
      return res.status(400).json({ status_code: 400, message: 'Campo obrigatório: nome' })
    }

    const nova = await categoriaDAO.insertCategoria({ nome })
    if (!nova) {
      return res.status(500).json({ status_code: 500, message: 'Erro ao cadastrar categoria' })
    }

    res.status(201).json({ status_code: 201, message: 'Categoria cadastrada com sucesso', data: nova })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status_code: 500, message: 'Erro interno do servidor' })
  }
}

/**
 * Atualizar categoria
 */
const atualizarCategoria = async (req, res) => {
  try {
    if (req.headers['content-type'] !== 'application/json') {
      return res.status(415).json({ status_code: 415, message: 'Content-type inválido. Use application/json' })
    }

    const { id } = req.params
    const { nome } = req.body
    if (!id || !nome) {
      return res.status(400).json({ status_code: 400, message: 'Campos obrigatórios: id, nome' })
    }

    const atualizado = await categoriaDAO.updateCategoria({ id: Number(id), nome })
    if (!atualizado) {
      return res.status(404).json({ status_code: 404, message: 'Categoria não encontrada ou erro ao atualizar' })
    }

    res.status(200).json({ status_code: 200, message: 'Categoria atualizada com sucesso', data: atualizado })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status_code: 500, message: 'Erro interno do servidor' })
  }
}

/**
 * Deletar categoria
 */
const deletarCategoria = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ status_code: 400, message: 'ID da categoria é obrigatório' })
    }

    const deletado = await categoriaDAO.deleteCategoria(Number(id))
    if (!deletado) {
      return res.status(404).json({ status_code: 404, message: 'Categoria não encontrada' })
    }

    res.status(200).json({ status_code: 200, message: 'Categoria deletada com sucesso', data: deletado })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status_code: 500, message: 'Erro interno do servidor' })
  }
}

/**
 * Listar todas as categorias
 */
/**
 * Listar todas as categorias
 */
const listarCategorias = async (req, res) => {
  try {
    const categorias = await categoriaDAO.selectAllCategoria()
    
    const categoriasFormatadas = categorias.map(cat => ({
      id: cat.id,
      nome: cat.nome,
      descricao: cat.descricao,
      icone: cat.icone,
      preco_base: cat.preco_base,
      tempo_medio: cat.tempo_medio
    }))

    res.status(200).json({
      status_code: 200,
      data: categoriasFormatadas
    })
  } catch (error) {
    console.error('Erro ao listar categorias:', error)
    res.status(500).json({
      status_code: 500,
      message: 'Erro interno do servidor'
    })
  }
}

/**
 * Buscar categoria por ID
 */
const buscarCategoriaPorId = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ status_code: 400, message: 'ID da categoria é obrigatório' })
    }

    const categoria = await categoriaDAO.selectByIdCategoria(Number(id))
    if (!categoria) {
      return res.status(404).json({ status_code: 404, message: 'Categoria não encontrada' })
    }

    res.status(200).json({ status_code: 200, data: categoria })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status_code: 500, message: 'Erro interno do servidor' })
  }
}

module.exports = {
  cadastrarCategoria,
  atualizarCategoria,
  deletarCategoria,
  listarCategorias,
  buscarCategoriaPorId
}
