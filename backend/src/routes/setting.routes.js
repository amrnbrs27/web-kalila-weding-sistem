const express = require('express');
const { getPublicSettings } = require('../controllers/setting.controller');

const router = express.Router();

// GET /api/settings (publik)
router.get('/', getPublicSettings);

module.exports = router;

