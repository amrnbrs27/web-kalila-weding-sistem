const express = require('express');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { uploadSingleImageMiddleware, uploadRateLimiter } = require('../middlewares/upload');
const { updateSettingSchema } = require('../validators/setting.validator');
const {
  getAdminSettings,
  updateAdminSettings,
  uploadQris,
  deleteQris,
} = require('../controllers/setting.controller');

const router = express.Router();

// Proteksi seluruh rute admin
router.use(authenticate, requireAdmin);

router.get('/', getAdminSettings);
router.put('/', validate(updateSettingSchema), updateAdminSettings);
router.post('/qris', uploadRateLimiter, uploadSingleImageMiddleware('image'), uploadQris);
router.delete('/qris', uploadRateLimiter, deleteQris);

module.exports = router;

