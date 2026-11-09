const asyncHandler = require('../utils/asyncHandler');
const packageService = require('../services/packageService');

// GET /api/admin/packages
exports.getPackages = asyncHandler(async (req, res) => {
  const result = await packageService.getAdminPackages(req.query);

  res.json({
    success: true,
    message: 'Daftar semua paket berhasil diambil',
    data: result,
  });
});

// GET /api/admin/packages/:id
exports.getPackageById = asyncHandler(async (req, res) => {
  const pkg = await packageService.getAdminPackageById(req.params.id);

  res.json({
    success: true,
    message: 'Detail paket berhasil diambil',
    data: { package: pkg },
  });
});

// POST /api/admin/packages
exports.createPackage = asyncHandler(async (req, res) => {
  const pkg = await packageService.createPackage(req.body);

  res.status(201).json({
    success: true,
    message: 'Paket berhasil dibuat',
    data: { package: pkg },
  });
});

// PUT /api/admin/packages/:id
exports.updatePackage = asyncHandler(async (req, res) => {
  const pkg = await packageService.updatePackage(req.params.id, req.body);

  res.json({
    success: true,
    message: 'Paket berhasil diperbarui',
    data: { package: pkg },
  });
});

// PATCH /api/admin/packages/:id/status
exports.updateStatus = asyncHandler(async (req, res) => {
  const pkg = await packageService.updatePackageStatus(req.params.id, req.body.isActive);

  res.json({
    success: true,
    message: `Status paket berhasil diubah menjadi ${pkg.isActive ? 'aktif' : 'tidak aktif'}`,
    data: { package: pkg },
  });
});

// DELETE /api/admin/packages/:id
exports.deletePackage = asyncHandler(async (req, res) => {
  await packageService.deletePackage(req.params.id);

  res.json({
    success: true,
    message: 'Paket beserta gambarnya berhasil dihapus',
  });
});

// POST /api/admin/packages/:id/images
exports.uploadImages = asyncHandler(async (req, res) => {
  const pkg = await packageService.addImagesToPackage(req.params.id, req.files);

  res.status(200).json({
    success: true,
    message: 'Gambar berhasil diunggah ke paket',
    data: { package: pkg },
  });
});

// DELETE /api/admin/packages/:id/images/:imageId
exports.deleteImage = asyncHandler(async (req, res) => {
  const pkg = await packageService.removeImageFromPackage(req.params.id, req.params.imageId);

  res.json({
    success: true,
    message: 'Gambar berhasil dihapus dari paket',
    data: { package: pkg },
  });
});

