const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboardService');

/**
 * Admin: Mengambil ringkasan overview dashboard pesanan (PRD 5.1)
 * GET /api/admin/dashboard/orders-overview
 */
const getOrdersOverview = asyncHandler(async (req, res) => {
  const data = await dashboardService.getOrdersOverview(req.query);

  res.status(200).json({
    success: true,
    message: 'Overview pesanan dashboard berhasil diambil',
    data,
  });
});

/**
 * Admin: Mengambil grafik data pesanan masuk per kategori (PRD 5.1)
 * GET /api/admin/dashboard/orders-chart
 */
const getOrdersChart = asyncHandler(async (req, res) => {
  const data = await dashboardService.getOrdersChart(req.query);

  res.status(200).json({
    success: true,
    message: 'Data grafik pesanan berhasil diambil',
    data,
  });
});

module.exports = {
  getOrdersOverview,
  getOrdersChart,
};

