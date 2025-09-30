const express = require('express')
const router = express.Router()
const pagbankWebhookController = require('../controller/pagamento/pagbankWebhookController')

router.post('/', pagbankWebhookController.receberNotificacao)

module.exports = router
