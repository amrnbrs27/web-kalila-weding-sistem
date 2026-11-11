/**
 * Rute API Admin untuk Email Outbox dan Pengaturan Email
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  getEmails,
  getEmailById,
  retryEmail,
  getEmailStatus,
  sendTestEmail,
} = require('../controllers/adminEmail.controller');
const {
  emailQuerySchema,
  emailIdParamSchema,
} = require('../validators/email.validator');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { validateQuery, validateParams } = require('../middlewares/validate');
const AppError = require('../utils/AppError');

const router = express.Router();

// Proteksi seluruh rute admin
router.use(authenticate, requireAdmin);

// Rate limiter untuk endpoint pengiriman email pengujian (maksimal 5 per jam per admin)
const testEmailRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => (req.user ? req.user._id.toString() : 'anonymous'),
  validate: { keyGeneratorIpFallback: false },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new AppError(
        'Batas pengiriman email pengujian tercapai (maksimal 5 kali per jam per admin)',
        429
      )
    );
  },
});

router.get('/status', getEmailStatus);
router.post('/test', testEmailRateLimiter, sendTestEmail);

router.get('/', validateQuery(emailQuerySchema), getEmails);
router.get('/:id', validateParams(emailIdParamSchema), getEmailById);
router.post('/:id/retry', validateParams(emailIdParamSchema), retryEmail);

module.exports = router;
