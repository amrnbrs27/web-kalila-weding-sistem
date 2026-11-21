const express = require('express');
const { validateQuery } = require('../middlewares/validate');
const { getAvailabilityQuerySchema } = require('../validators/availability.validator');
const { getAvailability } = require('../controllers/availability.controller');

const router = express.Router();

// GET /api/availability?category=...&month=YYYY-MM (publik)
router.get('/', validateQuery(getAvailabilityQuerySchema), getAvailability);

module.exports = router;

