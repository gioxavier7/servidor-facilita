const transacaoDAO = require('../../model/dao/transacaoCarteira')

const registrarTransacao = async function(req, res){
    try {
        const { id_carteira, tipo, valor, descricao } = req.body;
        if (!id_carteira || !tipo || !valor)
            return res.status(400).json({ status_code: 400, message: 'Dados inválidos ou incorretos' });

        const valorNum = Number(valor);
        if (isNaN(valorNum)) return res.status(400).json({ status_code: 400, message: 'Valor inválido' });

        const transacao = await transacaoDAO.insertTransacao({ id_carteira, tipo, valor: valorNum, descricao });
        if (!transacao)
            return res.status(500).json({ status_code: 500, message: 'Erro ao registrar transação' });

        res.status(201).json({ status_code: 201, data: transacao });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status_code: 500, message: 'Erro interno no servidor' });
    }
}

const listarTransacoes = async function(req, res){
    try {
        const id_carteira = Number(req.params.id);
        if (!id_carteira) return res.status(400).json({ status_code: 400, message: 'ID da carteira obrigatório' });

        const transacoes = await transacaoDAO.selectTransacoesByCarteira(id_carteira);
        if (!transacoes || transacoes.length === 0)
            return res.status(404).json({ status_code: 404, message: 'Nenhuma transação encontrada' });

        res.status(200).json({ status_code: 200, data: transacoes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status_code: 500, message: 'Erro interno no servidor' });
    }
}

module.exports = { registrarTransacao, listarTransacoes };