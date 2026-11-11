const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { validate, validateQuery } = require('../middlewares/validate');
const {
  createAdminSchema,
  updateAdminSchema,
  updateAdminStatusSchema,
  changeOwnPasswordSchema,
  resetOtherPasswordSchema,
  adminUserQuerySchema,
} = require('../validators/adminUser.validator');
const adminUserController = require('../controllers/adminUser.controller');

// Semua endpoint admin user membutuhkan token admin
router.use(authenticate, requireAdmin);

// GET /api/admin/users
router.get('/', validateQuery(adminUserQuerySchema), adminUserController.getAdminUsers);

// PATCH /api/admin/users/me/password (ganti password sendiri, harus sebelum :id)
router.patch('/me/password', validate(changeOwnPasswordSchema), adminUserController.changeOwnPassword);

// POST /api/admin/users (tambah admin baru)
router.post('/', validate(createAdminSchema), adminUserController.createAdminUser);

// GET /api/admin/users/:id
router.get('/:id', adminUserController.getAdminUserById);

// PUT /api/admin/users/:id (update name, email, phone)
router.put('/:id', validate(updateAdminSchema), adminUserController.updateAdminUser);

// PATCH /api/admin/users/:id/status (aktifkan / nonaktifkan)
router.patch('/:id/status', validate(updateAdminStatusSchema), adminUserController.updateAdminStatus);

// POST /api/admin/users/:id/reset-password (reset password admin lain)
router.post('/:id/reset-password', validate(resetOtherPasswordSchema), adminUserController.resetOtherPassword);

module.exports = router;

