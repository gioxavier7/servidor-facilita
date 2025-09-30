const carteiraDAO = require('../../model/dao/carteira')

//criar carteira
const criarCarteira = async function(req, res){
    try {
        const { id_usuario, chave_pagbank} = req.body

        if(!id_usuario || !chave_pagbank){
            return res.status(400).json({staus_code: 400, message: 'Dados inválidos ou incorretos.'})
        }

        const carteira = await carteiraDAO.insertCarteira({id_usuario, chave_pagbank})
        if(!carteira)
            return res.status(500).json({status_code: 500, message: 'Erro ao criar carteira.'})

        res.status(201).json({status_code: 201, data: carteira})
    } catch (error) {
        console.error(error)
        res.status(500).json({status_code: 500, message: 'Erro interno no servidor.'})
    }
}

//buscar carteira por id
const buscarCarteira = async function(req, res){
    try {
        const { id_usuario} = req.params
        const carteira = await carteiraDAO.selectByIdCarteira(id_usuario)

        if(!carteira)
            return res.status(404).json({status_code: 404, message: 'Carteira não encontrada.'})

        res.status(200).json({status_code: 200, data: carteira})
    } catch (error) {
        console.error(error)
        res.status(500).json({status_code: 500, message: 'Erro interno no servidor'})
    }
}

module.exports = {
    criarCarteira,
    buscarCarteira
}