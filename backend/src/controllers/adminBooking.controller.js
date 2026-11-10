const bookingService = require('../services/bookingService');
const asyncHandler = require('../utils/asyncHandler');

const getAdminBookings = asyncHandler(async (req, res) => {
  const data = await bookingService.getAdminBookings(req.query);
  res.status(200).json({
    success: true,
    message: 'Daftar pesanan admin berhasil diambil',
    data,
  });
});

const getAdminBookingById = asyncHandler(async (req, res) => {
  const data = await bookingService.getAdminBookingById(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Detail pesanan admin berhasil diambil',
    data,
  });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const data = await bookingService.updateBookingStatus(req.params.id, req.body, req.user._id);
  res.status(200).json({
    success: true,
    message: 'Status pesanan berhasil diperbarui',
    data,
  });
});

const createManualBooking = asyncHandler(async (req, res) => {
  const data = await bookingService.createManualBooking(req.body, req.user._id);
  res.status(201).json({
    success: true,
    message: 'Pesanan manual berhasil dibuat',
    data,
  });
});

const recordSettlement = asyncHandler(async (req, res) => {
  const data = await bookingService.recordSettlement(req.params.id, req.body, req.user._id);
  res.status(200).json({
    success: true,
    message: 'Pelunasan pesanan berhasil dicatat',
    data,
  });
});

module.exports = {
  getAdminBookings,
  getAdminBookingById,
  updateBookingStatus,
  createManualBooking,
  recordSettlement,
};

