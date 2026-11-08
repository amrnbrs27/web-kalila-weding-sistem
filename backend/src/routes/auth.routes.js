const router = require('express').Router();
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const ctrl = require('../controllers/auth.controller');

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login', validate(loginSchema), ctrl.login);
router.get('/me', authenticate, ctrl.me);

module.exports = router;