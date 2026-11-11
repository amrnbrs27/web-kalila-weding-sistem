const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middlewares/auth');
const { validate, validateQuery } = require('../middlewares/validate');
const { uploadProofMiddleware, uploadRateLimiter } = require('../middlewares/upload');
const AppError = require('../utils/AppError');
const {
  createBookingSchema,
  customerBookingQuerySchema,
} = require('../validators/booking.validator');
const {
  createBooking,
  getMyBookings,
  getMyBookingById,
} = require('../controllers/booking.controller');
const {
  getPaymentInfo,
  uploadPaymentProof,
} = require('../controllers/payment.controller');

const router = express.Router();

const bookingRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 30, // Maksimal 30 pesanan per IP per 15 menit
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan pemesanan, silakan coba beberapa saat lagi',
  },
});

const requireCustomer = (req, res, next) => {
  if (req.user?.role !== 'customer') {
    return next(new AppError('Akses khusus pelanggan', 403));
  }
  next();
};

router.use(authenticate, requireCustomer);

router.post('/', bookingRateLimiter, validate(createBookingSchema), createBooking);
router.get('/me', validateQuery(customerBookingQuerySchema), getMyBookings);
router.get('/:id/payment-info', getPaymentInfo);
router.post('/:id/payment-proof', uploadRateLimiter, uploadProofMiddleware, uploadPaymentProof);
router.get('/:id', getMyBookingById);

module.exports = router;

