const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middlewares/auth');

// GET /api/payments/:id/proof (streaming bukti transfer, hanya admin atau pemilik pesanan)
router.get('/:id/proof', authenticate, paymentController.streamPaymentProof);

module.exports = router;

