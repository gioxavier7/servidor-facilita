/**
 * Controller responsável pelas regras e autentificação de prestador
 * Data: 16/09/2025
 * Dev: Giovanna
 * Versão: 1.1
 */

const prestadorDAO = require('../../model/dao/prestador')

// ================= CADASTRAR PRESTADOR =================
const cadastrarPrestador = async (req, res) => {
  try {
    const id_usuario = req.usuario.id // do JWT
    const { locais, documentos } = req.body

    // validação básica
    if (!locais || !Array.isArray(locais) || locais.length === 0) {
      return res.status(400).json({ message: 'É necessário informar pelo menos um local.' })
    }

    const novoPrestador = await prestadorDAO.insertPrestador({
      id_usuario,
      locais,
      documentos: documentos || []
    })

    return res.status(201).json({
      message: 'Prestador criado com sucesso!',
      prestador: novoPrestador
    })

  } catch (error) {
    console.error('Erro ao cadastrar prestador:', error)
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' })
  }
}

// ================= LISTAR TODOS OS PRESTADORES =================
const listarPrestadores = async (req, res) => {
  try {
    const prestadores = await prestadorDAO.selectAllPrestadores()
    return res.status(200).json(prestadores)
  } catch (error) {
    console.error('Erro ao listar prestadores:', error)
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' })
  }
}

// ================= BUSCAR PRESTADOR POR ID =================
const buscarPrestador = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const prestador = await prestadorDAO.selectPrestadorById(id)
    return res.status(200).json(prestador)
  } catch (error) {
    console.error('Erro ao buscar prestador:', error)
    if (error.message === 'Prestador não encontrado.') {
      return res.status(404).json({ message: error.message })
    }
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' })
  }
}

// ================= ATUALIZAR PRESTADOR =================
const atualizarPrestador = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { locais, documentos } = req.body

    const prestadorAtualizado = await prestadorDAO.updatePrestador(id, { locais, documentos })

    return res.status(200).json({
      message: 'Prestador atualizado com sucesso!',
      prestador: prestadorAtualizado
    })
  } catch (error) {
    console.error('Erro ao atualizar prestador:', error)
    if (error.message === 'Prestador não encontrado.') {
      return res.status(404).json({ message: error.message })
    }
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' })
  }
}

// ================= DELETAR PRESTADOR =================
const deletarPrestador = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const prestadorDeletado = await prestadorDAO.deletePrestador(id)

    return res.status(200).json({
      message: 'Prestador deletado com sucesso!',
      prestador: prestadorDeletado
    })
  } catch (error) {
    console.error('Erro ao deletar prestador:', error)
    if (error.message === 'Prestador não encontrado.') {
      return res.status(404).json({ message: error.message })
    }
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' })
  }
}

module.exports = {
  cadastrarPrestador,
  listarPrestadores,
  buscarPrestador,
  atualizarPrestador,
  deletarPrestador
}
