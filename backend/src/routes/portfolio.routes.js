const express = require('express');
const router = express.Router();
const { validateQuery } = require('../middlewares/validate');
const { publicPortfolioQuerySchema } = require('../validators/portfolio.validator');
const portfolioController = require('../controllers/portfolio.controller');

// GET /api/portfolios
router.get('/', validateQuery(publicPortfolioQuerySchema), portfolioController.getPublicPortfolios);

// GET /api/portfolios/:slug
router.get('/:slug', portfolioController.getPublicPortfolioBySlug);

module.exports = router;

