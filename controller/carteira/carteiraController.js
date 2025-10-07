const carteiraDAO = require('../../model/dao/carteira')

//criar carteira
//criar carteira
const criarCarteira = async function(req, res){
    try {
        const { chave_pagbank, saldo } = req.body
        const id_usuario = req.user.id

        if(!chave_pagbank){
            return res.status(400).json({status_code: 400, message: 'Chave PagBank é obrigatória.'})
        }

        // ✅ VERIFICAR SE O USUÁRIO JÁ TEM CARTEIRA
        const carteiraExistente = await carteiraDAO.selectCarteiraByUsuario(id_usuario);
        if (carteiraExistente) {
            return res.status(400).json({ 
                status_code: 400, 
                message: 'Usuário já possui uma carteira.' 
            });
        }

        const carteira = await carteiraDAO.insertCarteira({
            id_usuario,
            chave_pagbank, 
            saldo: saldo || 0
        })
        
        if(!carteira)
            return res.status(500).json({status_code: 500, message: 'Erro ao criar carteira.'})

        res.status(201).json({status_code: 201, data: carteira})
    } catch (error) {
        console.error(error)
        res.status(500).json({status_code: 500, message: 'Erro interno no servidor.'})
    }
}

const buscarCarteira = async function(req, res){
    try {
        const id_usuario = req.user.id;

        const carteira = await carteiraDAO.selectCarteiraByUsuario(id_usuario);
        if(!carteira)
            return res.status(404).json({ status_code: 404, message: 'Carteira não encontrada.' });

        res.status(200).json({ status_code: 200, data: carteira });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status_code: 500, message: 'Erro interno no servidor' });
    }
}

module.exports = {
    criarCarteira,
    buscarCarteira
}