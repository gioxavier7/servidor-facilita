const express = require('express');
const router = express.Router();
const carteiraController = require('../controller/carteira/carteiraController');

router.post('/', carteiraController.criarCarteira);
router.get('/:id', carteiraController.buscarCarteira);

module.exports = router;
