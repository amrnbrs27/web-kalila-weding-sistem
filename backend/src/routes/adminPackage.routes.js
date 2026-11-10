const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { validate, validateQuery, validateParams } = require('../middlewares/validate');
const {
  uploadPackageImagesMiddleware,
  uploadRateLimiter,
} = require('../middlewares/upload');
const {
  objectIdParamSchema,
  packageImageParamsSchema,
  createPackageSchema,
  updatePackageSchema,
  updateStatusSchema,
  queryAdminPackagesSchema,
} = require('../validators/package.validator');
const ctrl = require('../controllers/adminPackage.controller');

// Semua rute admin paket wajib authenticate dan requireAdmin
router.use(authenticate, requireAdmin);

// GET /api/admin/packages
router.get('/', validateQuery(queryAdminPackagesSchema), ctrl.getPackages);

// GET /api/admin/packages/:id
router.get('/:id', validateParams(objectIdParamSchema), ctrl.getPackageById);

// POST /api/admin/packages
router.post('/', validate(createPackageSchema), ctrl.createPackage);

// PUT /api/admin/packages/:id
router.put(
  '/:id',
  validateParams(objectIdParamSchema),
  validate(updatePackageSchema),
  ctrl.updatePackage
);

// PATCH /api/admin/packages/:id/status
router.patch(
  '/:id/status',
  validateParams(objectIdParamSchema),
  validate(updateStatusSchema),
  ctrl.updateStatus
);

// DELETE /api/admin/packages/:id
router.delete('/:id', validateParams(objectIdParamSchema), ctrl.deletePackage);

// POST /api/admin/packages/:id/images (1-5 gambar sekaligus, field 'images')
router.post(
  '/:id/images',
  validateParams(objectIdParamSchema),
  uploadRateLimiter,
  uploadPackageImagesMiddleware,
  ctrl.uploadImages
);

// DELETE /api/admin/packages/:id/images/:imageId
router.delete(
  '/:id/images/:imageId',
  validateParams(packageImageParamsSchema),
  ctrl.deleteImage
);

module.exports = router;

