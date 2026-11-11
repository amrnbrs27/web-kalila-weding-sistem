const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { validateQuery } = require('../middlewares/validate');
const {
  ordersOverviewQuerySchema,
  ordersChartQuerySchema,
} = require('../validators/dashboard.validator');

// Seluruh rute dashboard khusus admin
router.use(authenticate, requireAdmin);

// GET /api/admin/dashboard/orders-overview
router.get(
  '/orders-overview',
  validateQuery(ordersOverviewQuerySchema),
  dashboardController.getOrdersOverview
);

// GET /api/admin/dashboard/orders-chart
router.get(
  '/orders-chart',
  validateQuery(ordersChartQuerySchema),
  dashboardController.getOrdersChart
);

module.exports = router;

