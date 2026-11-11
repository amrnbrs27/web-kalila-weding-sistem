const asyncHandler = require('../utils/asyncHandler');
const paymentService = require('../services/paymentService');

/**
 * Admin: Mengambil daftar pembayaran masuk
 * GET /api/admin/payments
 */
const getAdminPayments = asyncHandler(async (req, res) => {
  const result = await paymentService.getAdminPayments(req.query);

  res.status(200).json({
    success: true,
    message: 'Daftar pembayaran berhasil diambil',
    data: result.items,
    pagination: result.pagination,
  });
});

/**
 * Admin: Mengambil detail satu pembayaran
 * GET /api/admin/payments/:id
 */
const getAdminPaymentById = asyncHandler(async (req, res) => {
  const result = await paymentService.getAdminPaymentById(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Detail pembayaran berhasil diambil',
    data: result,
  });
});

/**
 * Admin: Menyetujui pembayaran DP (mengunci slot tanggal)
 * PATCH /api/admin/payments/:id/approve
 */
const approvePayment = asyncHandler(async (req, res) => {
  const result = await paymentService.approvePayment(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Pembayaran DP berhasil disetujui. Pesanan kini terkonfirmasi dan slot tanggal telah terkunci.',
    data: result,
  });
});

/**
 * Admin: Menolak bukti pembayaran DP
 * PATCH /api/admin/payments/:id/reject
 */
const rejectPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.rejectPayment(req.params.id, req.body, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Bukti pembayaran berhasil ditolak',
    data: result,
  });
});

/**
 * Admin: Melakukan void pada pembayaran manual
 * PATCH /api/admin/payments/:id/void
 */
const voidPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.voidPayment(req.params.id, req.body, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Pembayaran berhasil di-void',
    data: result,
  });
});

module.exports = {
  getAdminPayments,
  getAdminPaymentById,
  approvePayment,
  rejectPayment,
  voidPayment,
};

