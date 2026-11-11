const express = require('express');
const router = express.Router();
const adminPaymentController = require('../controllers/adminPayment.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { validate, validateQuery } = require('../middlewares/validate');
const {
  adminPaymentQuerySchema,
  rejectPaymentSchema,
  voidPaymentSchema,
} = require('../validators/payment.validator');

// Semua rute di bawah /api/admin/payments membutuhkan token admin
router.use(authenticate, requireAdmin);

// GET /api/admin/payments
router.get('/', validateQuery(adminPaymentQuerySchema), adminPaymentController.getAdminPayments);

// GET /api/admin/payments/:id
router.get('/:id', adminPaymentController.getAdminPaymentById);

// PATCH /api/admin/payments/:id/approve
router.patch('/:id/approve', adminPaymentController.approvePayment);

// PATCH /api/admin/payments/:id/reject
router.patch('/:id/reject', validate(rejectPaymentSchema), adminPaymentController.rejectPayment);

// PATCH /api/admin/payments/:id/void
router.patch('/:id/void', validate(voidPaymentSchema), adminPaymentController.voidPayment);

module.exports = router;
