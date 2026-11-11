const asyncHandler = require('../utils/asyncHandler');
const portfolioService = require('../services/portfolioService');

// Publik
const getPublicPortfolios = asyncHandler(async (req, res) => {
  const result = await portfolioService.getPublicPortfolios(req.query);
  res.status(200).json({
    success: true,
    message: 'Daftar portofolio berhasil diambil',
    data: result.items,
    pagination: result.pagination,
  });
});

const getPublicPortfolioBySlug = asyncHandler(async (req, res) => {
  const result = await portfolioService.getPublicPortfolioBySlug(req.params.slug);
  res.status(200).json({
    success: true,
    message: 'Detail portofolio berhasil diambil',
    data: result,
  });
});

// Admin
const getAdminPortfolios = asyncHandler(async (req, res) => {
  const result = await portfolioService.getAdminPortfolios(req.query);
  res.status(200).json({
    success: true,
    message: 'Daftar portofolio admin berhasil diambil',
    data: result.items,
    pagination: result.pagination,
  });
});

const getAdminPortfolioById = asyncHandler(async (req, res) => {
  const result = await portfolioService.getAdminPortfolioById(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Detail portofolio berhasil diambil',
    data: result,
  });
});

const createPortfolio = asyncHandler(async (req, res) => {
  const result = await portfolioService.createPortfolio(req.body);
  res.status(201).json({
    success: true,
    message: 'Portofolio berhasil dibuat',
    data: result,
  });
});

const updatePortfolio = asyncHandler(async (req, res) => {
  const result = await portfolioService.updatePortfolio(req.params.id, req.body);
  res.status(200).json({
    success: true,
    message: 'Portofolio berhasil diperbarui',
    data: result,
  });
});

const updatePortfolioStatus = asyncHandler(async (req, res) => {
  const result = await portfolioService.updatePortfolioStatus(req.params.id, req.body);
  res.status(200).json({
    success: true,
    message: 'Status portofolio berhasil diperbarui',
    data: result,
  });
});

const deletePortfolio = asyncHandler(async (req, res) => {
  const result = await portfolioService.deletePortfolio(req.params.id);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

const uploadPortfolioImages = asyncHandler(async (req, res) => {
  const result = await portfolioService.uploadPortfolioImages(req.params.id, req.files);
  res.status(200).json({
    success: true,
    message: 'Gambar portofolio berhasil diunggah',
    data: result,
  });
});

const deletePortfolioImage = asyncHandler(async (req, res) => {
  const result = await portfolioService.deletePortfolioImage(
    req.params.id,
    req.params.imageId
  );
  res.status(200).json({
    success: true,
    message: 'Gambar portofolio berhasil dihapus',
    data: result,
  });
});

const setPortfolioCoverImage = asyncHandler(async (req, res) => {
  const result = await portfolioService.setPortfolioCoverImage(
    req.params.id,
    req.params.imageId
  );
  res.status(200).json({
    success: true,
    message: 'Sampul portofolio berhasil diperbarui',
    data: result,
  });
});

module.exports = {
  getPublicPortfolios,
  getPublicPortfolioBySlug,
  getAdminPortfolios,
  getAdminPortfolioById,
  createPortfolio,
  updatePortfolio,
  updatePortfolioStatus,
  deletePortfolio,
  uploadPortfolioImages,
  deletePortfolioImage,
  setPortfolioCoverImage,
};

