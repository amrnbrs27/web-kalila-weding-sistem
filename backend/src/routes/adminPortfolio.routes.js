const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { validate, validateQuery } = require('../middlewares/validate');
const { uploadImagesMiddleware, uploadRateLimiter } = require('../middlewares/upload');
const {
  createPortfolioSchema,
  updatePortfolioSchema,
  updatePortfolioStatusSchema,
  adminPortfolioQuerySchema,
} = require('../validators/portfolio.validator');
const portfolioController = require('../controllers/portfolio.controller');

// Semua rute admin portofolio wajib login dan berstatus admin
router.use(authenticate, requireAdmin);

// GET /api/admin/portfolios
router.get('/', validateQuery(adminPortfolioQuerySchema), portfolioController.getAdminPortfolios);

// GET /api/admin/portfolios/:id
router.get('/:id', portfolioController.getAdminPortfolioById);

// POST /api/admin/portfolios
router.post('/', validate(createPortfolioSchema), portfolioController.createPortfolio);

// PUT /api/admin/portfolios/:id
router.put('/:id', validate(updatePortfolioSchema), portfolioController.updatePortfolio);

// PATCH /api/admin/portfolios/:id/status
router.patch('/:id/status', validate(updatePortfolioStatusSchema), portfolioController.updatePortfolioStatus);

// DELETE /api/admin/portfolios/:id
router.delete('/:id', portfolioController.deletePortfolio);

// POST /api/admin/portfolios/:id/images
router.post(
  '/:id/images',
  uploadRateLimiter,
  uploadImagesMiddleware,
  portfolioController.uploadPortfolioImages
);

// DELETE /api/admin/portfolios/:id/images/:imageId
router.delete('/:id/images/:imageId', portfolioController.deletePortfolioImage);

// PATCH /api/admin/portfolios/:id/images/:imageId/cover
router.patch('/:id/images/:imageId/cover', portfolioController.setPortfolioCoverImage);

module.exports = router;

