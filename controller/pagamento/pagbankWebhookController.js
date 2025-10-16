const pagamentoDAO = require('../../model/dao/pagamento');
const carteiraDAO = require('../../model/dao/carteira');
const transacaoDAO = require('../../model/dao/transacaoCarteira');
const notificacaoDAO = require('../../model/dao/notificacaoDAO'); // ✅ NOVO

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

        // mapear status do PagBank para status interno
        const statusMap = { 
            PAID: 'PAGO', 
            PENDING: 'PENDENTE', 
            EXPIRED: 'CANCELADO', 
            CANCELED: 'CANCELADO', 
            FAILED: 'FALHOU' 
        };
        const novoStatus = statusMap[status] || 'PENDENTE';

        await pagamentoDAO.updateStatusPagamento(pagamento.id, novoStatus);
        console.log(`Pagamento #${pagamento.id} atualizado para status: ${novoStatus}`);

        if (novoStatus === 'PAGO') {
            // Notificar PRESTADOR - Pagamento recebido
            await notificacaoDAO.criarNotificacao({
                id_usuario: pagamento.prestador.id_usuario,
                id_servico: pagamento.id_servico,
                tipo: 'pagamento',
                titulo: 'Pagamento Recebido! 💸',
                mensagem: `Você recebeu R$ ${(pagamento.valor / 100).toFixed(2)} pelo serviço #${pagamento.id_servico}. Valor creditado na sua carteira.`
            });

            // Notificar CONTRATANTE - Pagamento confirmado
            await notificacaoDAO.criarNotificacao({
                id_usuario: pagamento.contratante.id_usuario,
                id_servico: pagamento.id_servico,
                tipo: 'pagamento',
                titulo: 'Pagamento Confirmado! ✅',
                mensagem: `Seu pagamento de R$ ${(pagamento.valor / 100).toFixed(2)} foi confirmado com sucesso.`
            });

        } else if (novoStatus === 'CANCELADO' || novoStatus === 'FALHOU') {
            // Notificar CONTRATANTE - Pagamento falhou
            await notificacaoDAO.criarNotificacao({
                id_usuario: pagamento.contratante.id_usuario,
                id_servico: pagamento.id_servico,
                tipo: 'pagamento',
                titulo: 'Pagamento Não Processado ⚠️',
                mensagem: `Seu pagamento de R$ ${(pagamento.valor / 100).toFixed(2)} não foi processado. Status: ${novoStatus}.`
            });

        } else if (novoStatus === 'PENDENTE') {
            // Notificar CONTRATANTE - Pagamento pendente
            await notificacaoDAO.criarNotificacao({
                id_usuario: pagamento.contratante.id_usuario,
                id_servico: pagamento.id_servico,
                tipo: 'pagamento',
                titulo: 'Pagamento Pendente ⏳',
                mensagem: `Aguardando confirmação do pagamento de R$ ${(pagamento.valor / 100).toFixed(2)}.`
            });
        }

        // atualizar saldo e registrar transação se pago
        if (novoStatus === 'PAGO') {
            const carteira = await carteiraDAO.selectCarteiraByUsuario(pagamento.prestador.id_usuario);
            if (carteira) {
                const valorEmCentavos = Number(pagamento.valor);
                const valorEmReais = valorEmCentavos / 100;
                
                console.log(`Conversão: ${valorEmCentavos} centavos = R$ ${valorEmReais}`);
                
                const saldoAtual = Number(carteira.saldo) || 0;
                const novoSaldo = saldoAtual + valorEmReais;

                await carteiraDAO.atualizarSaldo(carteira.id, novoSaldo);
                console.log(`Saldo atualizado: R$ ${saldoAtual} → R$ ${novoSaldo}`);

                await transacaoDAO.insertTransacao({
                    id_carteira: carteira.id,
                    tipo: 'ENTRADA',
                    valor: valorEmReais,
                    descricao: `Pagamento do serviço #${pagamento.id_servico}`
                });
                console.log('Transação registrada com sucesso.');
            } else {
                console.log('Carteira do prestador não encontrada.');
            }
        }

        res.status(200).json({ message: 'Webhook processado com sucesso' });
    } catch (error) {
        console.error('❌ Erro ao processar webhook:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

module.exports = { receberNotificacao };