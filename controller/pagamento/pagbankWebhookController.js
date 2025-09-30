const pagamentoDAO = require('../../model/dao/pagamento');
const carteiraDAO = require('../../model/dao/carteira');
const transacaoDAO = require('../../model/dao/transacaoCarteira');

const receberNotificacao = async function(req, res){
    try {
        console.log('Webhook recebido:', req.body);
        const { id, status } = req.body;
        if (!id || !status) return res.status(400).json({ message: 'ID e status obrigatórios' });

        const pagamento = await pagamentoDAO.selectByIdPagBank(id);
        if (!pagamento) {
            console.log(`Pagamento não encontrado para id_pagbank: ${id}`);
            return res.status(404).json({ message: 'Pagamento não encontrado' });
        }

        // Mapear status do PagBank para status interno
        const statusMap = { PAID: 'PAGO', PENDING: 'PENDENTE', EXPIRED: 'CANCELADO', CANCELED: 'CANCELADO', FAILED: 'FALHOU' };
        const novoStatus = statusMap[status] || 'PENDENTE';

        await pagamentoDAO.updateStatusPagamento(pagamento.id, novoStatus);
        console.log(`Pagamento #${pagamento.id} atualizado para status: ${novoStatus}`);

        // Atualizar saldo e registrar transação se pago
        if (novoStatus === 'PAGO') {
            const carteira = await carteiraDAO.selectCarteiraByUsuario(pagamento.prestador.id_usuario);
            if (carteira) {
                const valorPagamento = Number(pagamento.valor) || 0;
                const novoSaldo = Number(carteira.saldo) + valorPagamento;

                await carteiraDAO.atualizarSaldo(carteira.id, novoSaldo);
                console.log(`Saldo do prestador atualizado para: ${novoSaldo}`);

                await transacaoDAO.insertTransacao({
                    id_carteira: carteira.id,
                    tipo: 'ENTRADA',
                    valor: valorPagamento,
                    descricao: `Pagamento do serviço #${pagamento.id_servico}`
                });
                console.log('Transação registrada.');
            } else {
                console.log('Carteira do prestador não encontrada.');
            }
        }

        res.status(200).json({ message: 'Webhook processado com sucesso' });
    } catch (error) {
        console.error('Erro ao processar webhook:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

module.exports = { receberNotificacao };
