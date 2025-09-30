/**
 * objetivo: controller responsável pelo CRUD de documentos
 * data: 16/09/2025
 * dev: giovanna
 * versão: 1.0
 */

const documentoDAO = require('../../model/dao/documento')

//========== CRIAR DOCUMENTO ==========
const cadastrarDocumento = async function(req, res) {
  try {
    const { tipo_documento, valor, data_validade, arquivo_url, id_prestador } = req.body

    // validação básica
    if (!tipo_documento || !valor || !id_prestador) {
      return res.status(400).json({ message: 'Dados insuficientes ou inválidos.' })
    }

    // validação de CPF se o tipo_documento for CPF
    if (tipo_documento === 'CPF') {
      const regexCPF = /^\d{11}$/;
      if (!regexCPF.test(valor)) {
        return res.status(400).json({ message: 'CPF inválido, use 11 dígitos numéricos.' })
      }
    }

    const novoDocumento = await documentoDAO.insertDocumento({
      tipo_documento,
      valor,
      data_validade,
      arquivo_url,
      id_prestador
    })

    if (novoDocumento) {
      return res.status(201).json({ message: 'Documento criado com sucesso!', documento: novoDocumento })
    } else {
      return res.status(500).json({ message: 'Erro ao criar documento.' })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Erro interno no servidor.' })
  }
}


//========== LISTAR TODOS DOCUMENTOS ==========
const listarDocumentos = async function(req, res) {
  try {
    const documentos = await documentoDAO.selectAllDocumentos()
    return res.status(200).json(documentos)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Erro ao listar documentos.' })
  }
}

//========== BUSCAR DOCUMENTO POR ID ==========
const buscarDocumento = async function(req, res) {
  try {
    const id = parseInt(req.params.id)
    const documento = await documentoDAO.selectDocumentoById(id)

    if (!documento) {
      return res.status(404).json({ message: 'Documento não encontrado.' })
    }

    return res.status(200).json(documento)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Erro ao buscar documento.' })
  }
}

//========== ATUALIZAR DOCUMENTO ==========
const atualizarDocumento = async function(req, res) {
  try {
    const id = parseInt(req.params.id)
    const { tipo_documento, valor, data_validade, arquivo_url } = req.body

    const documentoAtualizado = await documentoDAO.updateDocumento(id, {
      tipo_documento,
      valor,
      data_validade,
      arquivo_url
    })

    if (!documentoAtualizado) {
      return res.status(404).json({ message: 'Documento não encontrado ou erro ao atualizar.' })
    }

    return res.status(200).json({ message: 'Documento atualizado com sucesso!', documento: documentoAtualizado })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Erro ao atualizar documento.' })
  }
}

//========== DELETAR DOCUMENTO ==========
const deletarDocumento = async function(req, res) {
  try {
    const id = parseInt(req.params.id)

    const documentoDeletado = await documentoDAO.deleteDocumento(id)

    if (!documentoDeletado) {
      return res.status(404).json({ message: 'Documento não encontrado ou erro ao deletar.' })
    }

    return res.status(200).json({ message: 'Documento deletado com sucesso!' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Erro ao deletar documento.' })
  }
}

module.exports = {
  cadastrarDocumento,
  listarDocumentos,
  buscarDocumento,
  atualizarDocumento,
  deletarDocumento
}