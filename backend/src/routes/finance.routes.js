/**
 * Rute API Dashboard Keuangan Admin & Ekspor Laporan (PRD 5.2)
 * Seluruh endpoint hanya membaca data (read-only) dan membutuhkan autentikasi admin.
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  getSummary,
  getChart,
  getTransactions,
  getRecap,
  getOutstanding,
  exportReport,
} = require('../controllers/finance.controller');
const {
  financeSummaryQuerySchema,
  financeChartQuerySchema,
  financeTransactionsQuerySchema,
  financeRecapQuerySchema,
  financeOutstandingQuerySchema,
  financeExportQuerySchema,
} = require('../validators/finance.validator');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { validateQuery } = require('../middlewares/validate');
const AppError = require('../utils/AppError');

const router = express.Router();

// Seluruh rute keuangan hanya untuk admin yang terautentikasi
router.use(authenticate, requireAdmin);

// Catatan deployment:
// 1. Jika backend berjalan di belakang reverse proxy / load balancer, atur app.set('trust proxy', ...) di app.js.
// 2. Penyimpanan rate limiter berada di memori server (hilang saat restart, tidak dibagi antar-instance).
const exportRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 menit
  max: () => Number(process.env.FINANCE_EXPORT_MAX) || 10,
  keyGenerator: (req) => (req.user ? req.user._id.toString() : 'anonymous'),
  validate: { keyGeneratorIpFallback: false },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    const currentLimit = Number(process.env.FINANCE_EXPORT_MAX) || 10;
    next(
      new AppError(
        `Batas ekspor laporan keuangan tercapai (maksimal ${currentLimit} kali per 10 menit per admin). Silakan coba lagi nanti.`,
        429
      )
    );
  },
});

router.get('/summary', validateQuery(financeSummaryQuerySchema), getSummary);
router.get('/chart', validateQuery(financeChartQuerySchema), getChart);
router.get('/transactions', validateQuery(financeTransactionsQuerySchema), getTransactions);
router.get('/recap', validateQuery(financeRecapQuerySchema), getRecap);
router.get('/outstanding', validateQuery(financeOutstandingQuerySchema), getOutstanding);
router.get('/export', validateQuery(financeExportQuerySchema), exportRateLimiter, exportReport);

module.exports = router;

