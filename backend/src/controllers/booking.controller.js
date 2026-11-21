const bookingService = require('../services/bookingService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const createBooking = asyncHandler(async (req, res) => {
  // Hanya role customer yang diizinkan (admin ditolak 403)
  if (req.user.role !== 'customer') {
    throw new AppError('Hanya akun pelanggan yang dapat membuat pesanan lewat endpoint ini', 403);
  }

  const data = await bookingService.createCustomerBooking(req.body, req.user);
  res.status(201).json({
    success: true,
    message: 'Pesanan berhasil dibuat, silakan lakukan pembayaran DP',
    data,
  });
});

const getMyBookings = asyncHandler(async (req, res) => {
  const data = await bookingService.getCustomerBookings(req.user._id, req.query);
  res.status(200).json({
    success: true,
    message: 'Riwayat pesanan berhasil diambil',
    data,
  });
});

const getMyBookingById = asyncHandler(async (req, res) => {
  const data = await bookingService.getCustomerBookingById(req.params.id, req.user._id);
  res.status(200).json({
    success: true,
    message: 'Detail pesanan berhasil diambil',
    data,
  });
});

module.exports = {
  createBooking,
  getMyBookings,
  getMyBookingById,
};

