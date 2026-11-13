const asyncHandler = require('../utils/asyncHandler');
const postService = require('../services/postService');

/**
 * GET /api/admin/posts - Mengambil daftar artikel untuk admin (semua status)
 */
exports.getAdminPosts = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const result = await postService.getAdminPosts(query);
  res.status(200).json({
    success: true,
    message: 'Daftar artikel admin berhasil diambil',
    data: result,
  });
});

/**
 * GET /api/admin/posts/:id - Mengambil detail lengkap artikel untuk admin
 */
exports.getAdminPostById = asyncHandler(async (req, res) => {
  const post = await postService.getAdminPostById(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Detail artikel admin berhasil diambil',
    data: post,
  });
});

/**
 * POST /api/admin/posts - Membuat artikel baru (selalu status draft)
 */
exports.createPost = asyncHandler(async (req, res) => {
  const post = await postService.createPost(req.body, req.user);
  res.status(201).json({
    success: true,
    message: 'Artikel berhasil dibuat',
    data: post,
  });
});

/**
 * PUT /api/admin/posts/:id - Memperbarui artikel
 */
exports.updatePost = asyncHandler(async (req, res) => {
  const post = await postService.updatePost(req.params.id, req.body);
  res.status(200).json({
    success: true,
    message: 'Artikel berhasil diperbarui',
    data: post,
  });
});

/**
 * PATCH /api/admin/posts/:id/status - Mengubah status artikel (draft / published)
 */
exports.updatePostStatus = asyncHandler(async (req, res) => {
  const post = await postService.updatePostStatus(req.params.id, req.body.status);
  res.status(200).json({
    success: true,
    message: 'Status artikel berhasil diperbarui',
    data: post,
  });
});

/**
 * DELETE /api/admin/posts/:id - Menghapus artikel dan aset Cloudinary-nya
 */
exports.deletePost = asyncHandler(async (req, res) => {
  const result = await postService.deletePost(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Artikel berhasil dihapus',
    data: result,
  });
});

/**
 * POST /api/admin/posts/:id/cover - Mengunggah gambar sampul artikel
 */
exports.uploadCover = asyncHandler(async (req, res) => {
  const result = await postService.uploadCover(req.params.id, req.file.buffer);
  res.status(200).json({
    success: true,
    message: 'Gambar sampul artikel berhasil diunggah',
    data: result,
  });
});

/**
 * DELETE /api/admin/posts/:id/cover - Menghapus gambar sampul artikel
 */
exports.deleteCover = asyncHandler(async (req, res) => {
  const result = await postService.deleteCover(req.params.id);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * POST /api/admin/posts/:id/images - Mengunggah 1 sampai 5 gambar isi artikel
 */
exports.uploadContentImages = asyncHandler(async (req, res) => {
  const images = await postService.uploadContentImages(req.params.id, req.files);
  res.status(200).json({
    success: true,
    message: 'Gambar isi artikel berhasil diunggah',
    data: images,
  });
});

/**
 * DELETE /api/admin/posts/:id/images/:imageId - Menghapus satu gambar isi artikel
 */
exports.deleteContentImage = asyncHandler(async (req, res) => {
  const result = await postService.deleteContentImage(
    req.params.id,
    req.params.imageId
  );
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

