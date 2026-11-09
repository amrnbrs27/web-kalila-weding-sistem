const asyncHandler = require('../utils/asyncHandler');
const packageService = require('../services/packageService');

// GET /api/packages (Publik)
exports.getPackages = asyncHandler(async (req, res) => {
  const result = await packageService.getPublicPackages(req.query);

  res.json({
    success: true,
    message: 'Daftar paket berhasil diambil',
    data: result,
  });
});

// GET /api/packages/:slug (Publik)
exports.getPackageBySlug = asyncHandler(async (req, res) => {
  const pkg = await packageService.getPublicPackageBySlug(req.params.slug);

  res.json({
    success: true,
    message: 'Detail paket berhasil diambil',
    data: { package: pkg },
  });
});
