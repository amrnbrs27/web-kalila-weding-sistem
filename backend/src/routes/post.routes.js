const express = require('express');
const router = express.Router();
const { validateQuery } = require('../middlewares/validate');
const { publicPostQuerySchema } = require('../validators/post.validator');
const postController = require('../controllers/post.controller');

// GET /api/posts - Daftar artikel terbit publik
router.get('/', validateQuery(publicPostQuerySchema), postController.getPublicPosts);

// GET /api/posts/tags - Daftar tag unik artikel terbit (wajib didaftarkan sebelum /:slug)
router.get('/tags', postController.getPublicTags);

// GET /api/posts/:slug - Detail artikel terbit publik
router.get('/:slug', postController.getPublicPostBySlug);

module.exports = router;

