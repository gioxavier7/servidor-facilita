const videoService = require("../services/videoService");

module.exports = {
    iniciarChamada: async (req, res) => {
        try {
            const { idServico, usuarioId } = req.body;

            if (!idServico || !usuarioId) {
                return res.status(400).json({ erro: "idServico e usuarioId são obrigatórios" });
            }

            const roomName = `servico_${idServico}`;

            // Cria sala se não existir
            await videoService.createOrGetRoom(roomName);

            // Gera token para o usuário
            const token = videoService.generateVideoToken(
                `usuario_${usuarioId}`,
                roomName
            );

            return res.status(200).json({
                sala: roomName,
                token
            });

        } catch (err) {
            return res.status(500).json({
                erro: "Erro ao iniciar chamada",
                detalhes: err.message
            });
        }
    }
};
