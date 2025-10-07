const express = require('express');
const router = express.Router();
const avaliacaoController = require('../controller/avaliacao/avaliacaoController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

//avaliar serviço (apenas contratantes)
router.post('/', avaliacaoController.avaliarServico);

//buscar avaliações de um prestador
router.get('/prestador/:id_prestador', avaliacaoController.buscarAvaliacoesPrestador);

//buscar avaliação de um serviço
router.get('/servico/:id_servico', avaliacaoController.buscarAvaliacaoServico);

module.exports = router;