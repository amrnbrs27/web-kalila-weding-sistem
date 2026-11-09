const router = require('express').Router();
const { validateQuery } = require('../middlewares/validate');
const { queryPublicPackagesSchema } = require('../validators/package.validator');
const ctrl = require('../controllers/package.controller');

// GET /api/packages - Mengambil daftar paket aktif untuk publik
router.get('/', validateQuery(queryPublicPackagesSchema), ctrl.getPackages);

// GET /api/packages/:slug - Mengambil detail paket aktif berdasarkan slug
router.get('/:slug', ctrl.getPackageBySlug);

module.exports = router;
