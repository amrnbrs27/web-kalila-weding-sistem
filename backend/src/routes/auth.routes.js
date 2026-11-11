const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const ctrl = require('../controllers/auth.controller');

// Lapisan 1: Pembatas percobaan login per IP (tanpa email)
const loginIpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: () => Number(process.env.AUTH_LOGIN_IP_MAX) || 50,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login yang gagal dari alamat IP ini. Silakan coba lagi setelah 15 menit.',
  },
});

// Lapisan 2: Pembatas percobaan login per kombinasi IP + Email
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: () => Number(process.env.AUTH_LOGIN_MAX) || 10,
  skipSuccessfulRequests: true,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    const email = (req.body?.email || '').toLowerCase().trim();
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    return `${ip}_${email}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login yang gagal. Silakan coba lagi setelah 15 menit.',
  },
});

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login', loginIpRateLimiter, loginRateLimiter, validate(loginSchema), ctrl.login);
router.get('/me', authenticate, ctrl.me);

module.exports = router;