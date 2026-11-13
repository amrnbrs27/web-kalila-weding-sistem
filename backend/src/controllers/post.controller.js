const asyncHandler = require('../utils/asyncHandler');
const postService = require('../services/postService');

/**
 * GET /api/posts - Mengambil daftar artikel publik yang berstatus published
 */
exports.getPublicPosts = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const result = await postService.getPublicPosts(query);
  res.status(200).json({
    success: true,
    message: 'Daftar artikel berhasil diambil',
    data: result,
  });
});

/**
 * GET /api/posts/tags - Mengambil daftar tag unik artikel published beserta jumlahnya
 */
exports.getPublicTags = asyncHandler(async (req, res) => {
  const tags = await postService.getPublicTags();
  res.status(200).json({
    success: true,
    message: 'Daftar tag artikel berhasil diambil',
    data: tags,
  });
});

/**
 * GET /api/posts/:slug - Mengambil detail artikel published berdasarkan slug
 */
exports.getPublicPostBySlug = asyncHandler(async (req, res) => {
  const post = await postService.getPublicPostBySlug(req.params.slug);
  res.status(200).json({
    success: true,
    message: 'Detail artikel berhasil diambil',
    data: post,
  });
});

