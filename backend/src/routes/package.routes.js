const router = require('express').Router();
const { authenticate, requireAdmin, optionalAuthenticate } = require('../middlewares/auth');
const { validate, validateQuery } = require('../middlewares/validate');
const {
  uploadSingle,
  uploadMultiple,
  uploadRateLimiter,
} = require('../middlewares/upload');
const {
  createPackageSchema,
  updatePackageSchema,
  queryPackageSchema,
} = require('../validators/package.validator');
const ctrl = require('../controllers/package.controller');

// Rute Publik (dengan optionalAuthenticate untuk admin yang ingin melihat paket nonaktif)
router.get('/', optionalAuthenticate, validateQuery(queryPackageSchema), ctrl.getAll);
router.get('/:id', optionalAuthenticate, ctrl.getById);

// Rute Admin: CRUD Paket
router.post('/', authenticate, requireAdmin, validate(createPackageSchema), ctrl.create);
router.put('/:id', authenticate, requireAdmin, validate(updatePackageSchema), ctrl.update);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);

// Rute Admin: Upload & Manajemen Foto Paket
router.post('/upload', authenticate, requireAdmin, uploadRateLimiter, uploadSingle, ctrl.uploadSingleImage);
router.post('/:id/images', authenticate, requireAdmin, uploadRateLimiter, uploadMultiple, ctrl.uploadPackageImages);
router.delete('/:id/images', authenticate, requireAdmin, ctrl.removePackageImage);

module.exports = router;

