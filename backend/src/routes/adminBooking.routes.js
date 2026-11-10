const express = require('express');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { validate, validateQuery } = require('../middlewares/validate');
const {
  adminBookingQuerySchema,
  createManualBookingSchema,
  updateBookingStatusSchema,
  recordSettlementSchema,
} = require('../validators/booking.validator');
const {
  getAdminBookings,
  getAdminBookingById,
  updateBookingStatus,
  createManualBooking,
  recordSettlement,
} = require('../controllers/adminBooking.controller');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', validateQuery(adminBookingQuerySchema), getAdminBookings);
router.post('/manual', validate(createManualBookingSchema), createManualBooking);
router.get('/:id', getAdminBookingById);
router.patch('/:id/status', validate(updateBookingStatusSchema), updateBookingStatus);
router.patch('/:id/settlement', validate(recordSettlementSchema), recordSettlement);

module.exports = router;

