const express = require('express');
const router = express.Router();
const carteiraController = require('../controller/carteira/carteiraController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', carteiraController.criarCarteira);

router.get('/minha-carteira', carteiraController.buscarCarteira);

module.exports = router;