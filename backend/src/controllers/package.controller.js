const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const packageService = require('../services/package.service');
const uploadService = require('../services/upload.service');

// GET /api/packages
exports.getAll = asyncHandler(async (req, res) => {
  const isAdmin = req.user && req.user.role === 'admin';
  const result = await packageService.getAllPackages(req.query, isAdmin);

  res.json({
    success: true,
    message: 'Daftar paket berhasil diambil',
    data: result,
  });
});

// GET /api/packages/:id
exports.getById = asyncHandler(async (req, res) => {
  const isAdmin = req.user && req.user.role === 'admin';
  const pkg = await packageService.getPackageById(req.params.id, isAdmin);

  res.json({
    success: true,
    message: 'Detail paket berhasil diambil',
    data: { package: pkg },
  });
});

// POST /api/packages (Admin only)
exports.create = asyncHandler(async (req, res) => {
  const pkg = await packageService.createPackage(req.body);

  res.status(201).json({
    success: true,
    message: 'Paket berhasil dibuat',
    data: { package: pkg },
  });
});

// PUT /api/packages/:id (Admin only)
exports.update = asyncHandler(async (req, res) => {
  const pkg = await packageService.updatePackage(req.params.id, req.body);

  res.json({
    success: true,
    message: 'Paket berhasil diperbarui',
    data: { package: pkg },
  });
});

// DELETE /api/packages/:id (Admin only)
exports.remove = asyncHandler(async (req, res) => {
  const permanent = req.query.permanent === 'true';
  await packageService.deletePackage(req.params.id, permanent);

  res.json({
    success: true,
    message: permanent ? 'Paket berhasil dihapus permanen' : 'Paket berhasil dinonaktifkan',
  });
});

// POST /api/packages/:id/images (Admin only, upload up to 5 images to package)
exports.uploadPackageImages = asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files || files.length === 0) {
    throw new AppError('Silakan pilih minimal satu file gambar untuk diunggah', 400);
  }

  const uploadPromises = files.map((file) =>
    uploadService.uploadImage(file.buffer, file.originalname, 'packages')
  );
  const imageUrls = await Promise.all(uploadPromises);

  const updatedPackage = await packageService.addImagesToPackage(req.params.id, imageUrls);

  res.status(201).json({
    success: true,
    message: 'Foto berhasil diunggah ke paket',
    data: {
      uploadedImages: imageUrls,
      package: updatedPackage,
    },
  });
});

// DELETE /api/packages/:id/images (Admin only)
exports.removePackageImage = asyncHandler(async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    throw new AppError('Field imageUrl wajib disertakan', 400);
  }

  const updatedPackage = await packageService.removeImageFromPackage(req.params.id, imageUrl);

  res.json({
    success: true,
    message: 'Foto berhasil dihapus dari paket',
    data: { package: updatedPackage },
  });
});

// POST /api/packages/upload (Admin only, generic single photo upload)
exports.uploadSingleImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('Silakan pilih file gambar untuk diunggah', 400);
  }

  const imageUrl = await uploadService.uploadImage(
    req.file.buffer,
    req.file.originalname,
    'packages'
  );

  res.status(201).json({
    success: true,
    message: 'Foto berhasil diunggah',
    data: { imageUrl },
  });
});

