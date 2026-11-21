const router = require('express').Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const validate = require('../middlewares/validate');
const {
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
} = require('../validators/passwordReset.validator');
const ctrl = require('../controllers/passwordReset.controller');

// 1. Rate limiter forgot-password per IP
const forgotIpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: () => Number(process.env.RESET_FORGOT_IP_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan reset password dari alamat IP ini. Silakan coba lagi setelah 15 menit.',
  },
});

// 2. Rate limiter verify-reset-otp per IP
const verifyIpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: () => Number(process.env.RESET_VERIFY_IP_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan verifikasi kode OTP dari alamat IP ini. Silakan coba lagi setelah 15 menit.',
  },
});

// 3. Rate limiter verify-reset-otp per kunci hash email
const verifyEmailRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: () => Number(process.env.RESET_VERIFY_EMAIL_MAX) || 10,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    const email = (req.body?.email || '').toLowerCase().trim();
    if (!email) return 'anonymous';
    return crypto.createHash('sha256').update(email).digest('hex');
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan verifikasi kode OTP untuk email ini. Silakan coba lagi setelah 15 menit.',
  },
});

// 4. Rate limiter reset-password per IP
const resetPasswordIpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: () => Number(process.env.RESET_PASSWORD_IP_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan penggantian password dari alamat IP ini. Silakan coba lagi setelah 15 menit.',
  },
});

router.post(
  '/forgot-password',
  forgotIpRateLimiter,
  validate(forgotPasswordSchema),
  ctrl.forgotPassword
);

router.post(
  '/verify-reset-otp',
  verifyIpRateLimiter,
  verifyEmailRateLimiter,
  validate(verifyResetOtpSchema),
  ctrl.verifyResetOtp
);

router.post(
  '/reset-password',
  resetPasswordIpRateLimiter,
  validate(resetPasswordSchema),
  ctrl.resetPassword
);

module.exports = router;

