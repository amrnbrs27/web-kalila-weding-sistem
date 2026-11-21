const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middlewares/auth');
const {
  validate,
  validateQuery,
  validateParams,
} = require('../middlewares/validate');
const {
  uploadSingleImageMiddleware,
  uploadImagesMiddleware,
  uploadRateLimiter,
} = require('../middlewares/upload');
const {
  createPostSchema,
  updatePostSchema,
  updatePostStatusSchema,
  adminPostQuerySchema,
  postIdParamSchema,
  contentImageParamSchema,
} = require('../validators/post.validator');
const adminPostController = require('../controllers/adminPost.controller');

// Semua rute admin artikel wajib terautentikasi dan memiliki role admin
router.use(authenticate, requireAdmin);

// GET /api/admin/posts
router.get(
  '/',
  validateQuery(adminPostQuerySchema),
  adminPostController.getAdminPosts
);

// GET /api/admin/posts/:id
router.get(
  '/:id',
  validateParams(postIdParamSchema),
  adminPostController.getAdminPostById
);

// POST /api/admin/posts
router.post(
  '/',
  validate(createPostSchema),
  adminPostController.createPost
);

// PUT /api/admin/posts/:id
router.put(
  '/:id',
  validateParams(postIdParamSchema),
  validate(updatePostSchema),
  adminPostController.updatePost
);

// PATCH /api/admin/posts/:id/status
router.patch(
  '/:id/status',
  validateParams(postIdParamSchema),
  validate(updatePostStatusSchema),
  adminPostController.updatePostStatus
);

// DELETE /api/admin/posts/:id
router.delete(
  '/:id',
  validateParams(postIdParamSchema),
  adminPostController.deletePost
);

// POST /api/admin/posts/:id/cover
router.post(
  '/:id/cover',
  validateParams(postIdParamSchema),
  uploadRateLimiter,
  uploadSingleImageMiddleware('image'),
  adminPostController.uploadCover
);

// DELETE /api/admin/posts/:id/cover
router.delete(
  '/:id/cover',
  validateParams(postIdParamSchema),
  adminPostController.deleteCover
);

// POST /api/admin/posts/:id/images
router.post(
  '/:id/images',
  validateParams(postIdParamSchema),
  uploadRateLimiter,
  uploadImagesMiddleware,
  adminPostController.uploadContentImages
);

// DELETE /api/admin/posts/:id/images/:imageId
router.delete(
  '/:id/images/:imageId',
  validateParams(contentImageParamSchema),
  adminPostController.deleteContentImage
);

module.exports = router;

