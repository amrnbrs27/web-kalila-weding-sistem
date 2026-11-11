const asyncHandler = require('../utils/asyncHandler');
const paymentService = require('../services/paymentService');

/**
 * Pelanggan: Mengambil informasi rekening/QRIS untuk pembayaran DP
 * GET /api/bookings/:id/payment-info
 */
const getPaymentInfo = asyncHandler(async (req, res) => {
  const result = await paymentService.getPaymentInfo(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Informasi pembayaran berhasil diambil',
    data: result,
  });
});

/**
 * Pelanggan: Mengunggah bukti transfer DP
 * POST /api/bookings/:id/payment-proof
 */
const uploadPaymentProof = asyncHandler(async (req, res) => {
  const result = await paymentService.uploadPaymentProof(
    req.params.id,
    req.file,
    req.user._id
  );

  res.status(201).json({
    success: true,
    message: 'Bukti transfer berhasil diunggah. Menunggu verifikasi admin.',
    data: result,
  });
});

/**
 * Pelanggan & Admin: Mengambil / streaming file gambar bukti transfer dari penyimpanan privat
 * GET /api/payments/:id/proof
 */
const streamPaymentProof = asyncHandler(async (req, res) => {
  await paymentService.streamPaymentProof(req.params.id, req.user, res);
});

module.exports = {
  getPaymentInfo,
  uploadPaymentProof,
  streamPaymentProof,
};

