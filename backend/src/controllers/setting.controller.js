const settingService = require('../services/settingService');
const asyncHandler = require('../utils/asyncHandler');

const getPublicSettings = asyncHandler(async (req, res) => {
  const data = await settingService.getPublicSettings();
  res.status(200).json({
    success: true,
    message: 'Pengaturan publik berhasil diambil',
    data,
  });
});

const getAdminSettings = asyncHandler(async (req, res) => {
  const data = await settingService.getAdminSettings();
  res.status(200).json({
    success: true,
    message: 'Pengaturan admin berhasil diambil',
    data,
  });
});

const updateAdminSettings = asyncHandler(async (req, res) => {
  const data = await settingService.updateAdminSettings(req.body);
  res.status(200).json({
    success: true,
    message: 'Pengaturan berhasil diperbarui',
    data,
  });
});

const uploadQris = asyncHandler(async (req, res) => {
  const data = await settingService.uploadQrisImage(req.file.buffer);
  res.status(200).json({
    success: true,
    message: 'Gambar QRIS berhasil diunggah',
    data,
  });
});

const deleteQris = asyncHandler(async (req, res) => {
  const data = await settingService.deleteQrisImage();
  res.status(200).json({
    success: true,
    message: data.message,
  });
});

module.exports = {
  getPublicSettings,
  getAdminSettings,
  updateAdminSettings,
  uploadQris,
  deleteQris,
};

