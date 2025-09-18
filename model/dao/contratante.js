/**
 * Controller responsável pelas regras e autentificação de contratante
 * Data: 13/09/2025
 * Dev: Giovanna
 * Versão: 1.1
 */

const contratanteDAO = require('../../model/dao/contratante')

// ================= CADASTRAR CONTRATANTE =================
const cadastrarContratante = async (req, res) => {
  try {
    const { id_localizacao, necessidade } = req.body
    const id_usuario = req.usuario.id // do JWT

    // validação básica
    if (!id_localizacao || !necessidade) {
      return res.status(400).json({ message: 'Dados inválidos ou insuficientes.' })
    }

    const novoContratante = await contratanteDAO.insertContratante({
      id_usuario,
      id_localizacao,
      necessidade
    })

    return res.status(201).json({
      message: 'Contratante criado com sucesso!',
      contratante: novoContratante
    })

  } catch (error) {
    console.error('Erro ao cadastrar contratante:', error)
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' })
  }
}

// ================= LISTAR TODOS OS CONTRATANTES =================
const listarContratantes = async (req, res) => {
  try {
    const contratantes = await contratanteDAO.selectAllContratante()
    return res.status(200).json(contratantes)
  } catch (error) {
    console.error('Erro ao listar contratantes:', error)
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' })
  }
}

// ================= BUSCAR CONTRATANTE POR ID =================
const buscarContratante = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido.' })
    }

    const contratante = await contratanteDAO.selectByIdContratante(id)
    if (!contratante) {
      return res.status(404).json({ message: 'Contratante não encontrado.' })
    }

    return res.status(200).json(contratante)
  } catch (error) {
    console.error('Erro ao buscar contratante:', error)
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' })
  }
}

// ================= ATUALIZAR CONTRATANTE =================
const atualizarContratante = async (req, res) => {
  try {
    const { id_localizacao, necessidade } = req.body
    const id = parseInt(req.params.id)

    if (!id_localizacao || !necessidade) {
      return res.status(400).json({ message: 'Dados inválidos ou insuficientes.' })
    }

    const atualizado = await contratanteDAO.updateContratante({
      id,
      id_localizacao,
      necessidade
    })

    if (!atualizado) {
      return res.status(404).json({ message: 'Contratante não encontrado ou erro ao atualizar.' })
    }

    return res.status(200).json({
      message: 'Contratante atualizado com sucesso!',
      contratante: atualizado
    })
  } catch (error) {
    console.error('Erro ao atualizar contratante:', error)
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' })
  }
}

// ================= DELETAR CONTRATANTE =================
const deletarContratante = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const deletado = await contratanteDAO.deleteContratante(id)

    if (!deletado) {
      return res.status(404).json({ message: 'Contratante não encontrado ou erro ao deletar.' })
    }

    return res.status(200).json({
      message: 'Contratante deletado com sucesso!',
      contratante: deletado
    })
  } catch (error) {
    console.error('Erro ao deletar contratante:', error)
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' })
  }
}

module.exports = {
  cadastrarContratante,
  listarContratantes,
  buscarContratante,
  atualizarContratante,
  deletarContratante
}
