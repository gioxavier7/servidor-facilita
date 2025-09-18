/**
 * objetivo: controller responsável por lidar com as regras e autentificação de prestador
 * data: 16/09/2025
 * dev: giovanna
 * versão: 1.0
 */

const prestadorDAO = require('../../model/dao/prestador')

//========== CRIAR PRESTADOR ==========
const cadastrarPrestador = async function(req, res) {
    try {
        const id_usuario = req.usuario.id  // do JWT
        const { locais, documentos } = req.body

        // validação básica
        if (!locais || !Array.isArray(locais) || locais.length === 0) {
            return res.status(400).json({ message: 'É necessário informar pelo menos um local.' })
        }

        const novoPrestador = await prestadorDAO.insertPrestador({
            id_usuario,
            locais,
            documentos
        })

        if (novoPrestador) {
            return res.status(201).json({ message: 'Prestador criado com sucesso!', prestador: novoPrestador })
        } else {
            return res.status(500).json({ message: 'Erro ao criar prestador.' })
        }

    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erro interno no servidor.' })
    }
}

//========== LISTAR TODOS OS PRESTADORES ==========
const listarPrestadores = async function(req, res) {
    try {
        const prestadores = await prestadorDAO.selectAllPrestadores()
        return res.status(200).json(prestadores)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erro ao listar prestadores.' })
    }
}

//========== BUSCAR PRESTADOR POR ID ==========
const buscarPrestador = async function(req, res) {
    try {
        const id = parseInt(req.params.id)
        const prestador = await prestadorDAO.selectPrestadorById(id)

        if (!prestador) {
            return res.status(404).json({ message: 'Prestador não encontrado.' })
        }

        return res.status(200).json(prestador)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erro ao buscar prestador.' })
    }
}

//========== ATUALIZAR PRESTADOR ==========
const atualizarPrestador = async function(req, res) {
    try {
        const id = parseInt(req.params.id)
        const { locais, documentos } = req.body

        const prestadorAtualizado = await prestadorDAO.updatePrestador(id, { locais, documentos })

        if (!prestadorAtualizado) {
            return res.status(404).json({ message: 'Prestador não encontrado ou erro ao atualizar.' })
        }

        return res.status(200).json({ message: 'Prestador atualizado com sucesso!', prestador: prestadorAtualizado })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erro ao atualizar prestador.' })
    }
}

//========== DELETAR PRESTADOR ==========
const deletarPrestador = async function(req, res) {
    try {
        const id = parseInt(req.params.id)

        const prestadorDeletado = await prestadorDAO.deletePrestador(id)

        if (!prestadorDeletado) {
            return res.status(404).json({ message: 'Prestador não encontrado ou erro ao deletar.' })
        }

        return res.status(200).json({ message: 'Prestador deletado com sucesso!' })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erro ao deletar prestador.' })
    }
}

module.exports = {
    cadastrarPrestador,
    listarPrestadores,
    buscarPrestador,
    atualizarPrestador,
    deletarPrestador
}