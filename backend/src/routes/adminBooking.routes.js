const express = require('express');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { validate, validateQuery } = require('../middlewares/validate');
const {
  adminBookingQuerySchema,
  createManualBookingSchema,
  updateBookingStatusSchema,
} = require('../validators/booking.validator');
const {
  recordSettlementSchema,
  updateBookingTotalPriceSchema,
  recordRefundSchema,
} = require('../validators/payment.validator');
const {
  getAdminBookings,
  getAdminBookingById,
  updateBookingStatus,
  createManualBooking,
  recordSettlement,
  updateBookingTotalPrice,
  recordRefund,
} = require('../controllers/adminBooking.controller');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', validateQuery(adminBookingQuerySchema), getAdminBookings);
router.post('/manual', validate(createManualBookingSchema), createManualBooking);
router.get('/:id', getAdminBookingById);
router.patch('/:id/status', validate(updateBookingStatusSchema), updateBookingStatus);
router.patch('/:id/settlement', validate(recordSettlementSchema), recordSettlement);
router.patch('/:id/total', validate(updateBookingTotalPriceSchema), updateBookingTotalPrice);
router.post('/:id/refund', validate(recordRefundSchema), recordRefund);

module.exports = router;

