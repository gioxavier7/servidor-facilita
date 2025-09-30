/**
 * objetivo: controller responsável por lidar com as regras e autentificação de contratante
 * data: 13/09/2025
 * dev: giovanna
 * versão: 1.0
 */

const contratanteDAO = require('../../model/dao/contratante')

//========== CRIAR CONTRATANTE ==========
const cadastrarContratante = async function(req, res){
    try {
        const {id_localizacao, necessidade, cpf} = req.body
        const id_usuario = req.usuario.id //extraído do jwt

        if(!id_localizacao || !necessidade || !cpf){
            return res.status(400).json({message: 'Dados inválidos ou insuficientes.'})
        }

        const novoContratante = await contratanteDAO.insertContratante({
            id_usuario,
            id_localizacao,
            necessidade,
            cpf
        })

        if (novoContratante) {
            return res.status(201).json({ message: 'Contratante criado com sucesso!', contratante: novoContratante })
        } else {
            return res.status(500).json({ message: 'Erro ao criar contratante.' })
        }

    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erro interno no servidor.' })
    }
}


//========== LISTAR TODOS ==========
const listarContratantes = async function(req, res){
    try {
        const contratante = await contratanteDAO.selectAllContratante()
        return res.status(200).json(contratante)
    } catch (error) {
        return res.status(500).json({message: 'Erro ao listar usuários.'})
    }
}

//========== BUSCAR CONTRATANTE POR ID ==========
const buscarContratante = async function(req, res){
    try {
        const {id} = req.params

        if(!id || isNaN(id)){
            return res.status(400).json({message: 'ID inválido.'})
        }

        const contratante = await contratanteDAO.selectByIdContratante(Number(id))

        if(contratante){
            return res.status(200).json(contratante)
        } else {
            return res.status(404).json({message: 'Contratante não encontrado.'})
        }
    } catch (error) {
        console.error(error)
        return res.status(500).json({message: 'Erro interno no servidor.'})
    }
}


//========== ATUALIZAR CONTRATANTE ==========
const atualizarContratante = async function(req, res){
    try {
        const { id_localizacao, necessidade, cpf } = req.body
        const {id} = req.params

        if(!id_localizacao || !necessidade || !cpf){
            return res.status(400).json({message: 'Dados inválidos ou insuficientes.'})
        }

        const atualizado = await contratanteDAO.updateContratante({
            id: Number(id),
            id_localizacao,
            necessidade,
            cpf
        })

        if(atualizado){
            return res.status(200).json({
                message: 'Contratante atualizado com sucesso!',
                contratante: atualizado
            })
        } else {
            return res.status(404).json({message: 'Contratante não encontrado.'})
        }
    } catch (error) {
        console.error(error)
        return res.status(500).json({message: 'Erro interno no servidor.'})
    }
}


//========== DELETAR CONTRATANTE ==========
const deletarContratante = async function(req, res){
    try {
        const {id} = req.params

        const deletado = await contratanteDAO.deleteContratante(Number(id))

        if(deletado){
            return res.status(200).json({
                message: 'Contratante deletado com sucesso.',
                contratante: deletado
            })
        }else{
            return res.status(404).json({message: 'Contratante não encontrado'})
        }
    } catch (error) {
        console.error(error)
        return res.status(500).json({message: 'Erro interno do servidor'})
    }
}

module.exports = {
    cadastrarContratante,
    listarContratantes,
    buscarContratante,
    atualizarContratante,
    deletarContratante
}