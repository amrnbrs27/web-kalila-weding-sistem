const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const {
  getFinanceSummary,
  getFinanceChart,
  getFinanceTransactions,
  getFinanceRecap,
  getFinanceOutstanding,
} = require('../services/financeService');
const {
  prepareFinanceExport,
  streamXlsxExport,
  streamPdfExport,
} = require('../services/financeExportService');

/**
 * GET /api/admin/finance/summary
 */
exports.getSummary = asyncHandler(async (req, res) => {
  const data = await getFinanceSummary(req.query);
  res.json({
    success: true,
    message: 'Ringkasan keuangan berhasil diambil',
    data,
  });
});

/**
 * GET /api/admin/finance/chart
 */
exports.getChart = asyncHandler(async (req, res) => {
  const data = await getFinanceChart(req.query);
  res.json({
    success: true,
    message: 'Data grafik keuangan berhasil diambil',
    data,
  });
});

/**
 * GET /api/admin/finance/transactions
 */
exports.getTransactions = asyncHandler(async (req, res) => {
  const data = await getFinanceTransactions(req.query);
  res.json({
    success: true,
    message: 'Daftar transaksi keuangan berhasil diambil',
    data,
  });
});

/**
 * GET /api/admin/finance/recap
 */
exports.getRecap = asyncHandler(async (req, res) => {
  const data = await getFinanceRecap(req.query);
  res.json({
    success: true,
    message: 'Rekapitulasi keuangan berhasil diambil',
    data,
  });
});

/**
 * GET /api/admin/finance/outstanding
 */
exports.getOutstanding = asyncHandler(async (req, res) => {
  const data = await getFinanceOutstanding(req.query);
  res.json({
    success: true,
    message: 'Daftar pesanan belum lunas berhasil diambil',
    data,
  });
});

/**
 * GET /api/admin/finance/export
 */
exports.exportReport = asyncHandler(async (req, res, next) => {
  // Validasi dan hitung jumlah baris terlebih dahulu sebelum mengatur header unduhan
  const exportContext = await prepareFinanceExport(req.query, req.user);

  const contentType =
    exportContext.format === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${exportContext.filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Catat log audit ringkas tanpa data pribadi pelanggan
  console.info(
    `[FinanceExport] adminId=${req.user._id.toString()} report=${exportContext.report} format=${exportContext.format} period="${exportContext.periodLabel}" rows=${exportContext.rowCount}`
  );

  try {
    if (exportContext.format === 'xlsx') {
      await streamXlsxExport(res, exportContext, req.query);
    } else {
      await streamPdfExport(res, exportContext, req.query);
    }
  } catch (err) {
    console.error('[FinanceExport] Galat saat membuat berkas:', err.message);
    if (!res.headersSent) {
      return next(new AppError('Gagal membuat berkas ekspor laporan keuangan', 500));
    }
    if (!res.writableEnded) {
      res.destroy();
    }
  }
});

