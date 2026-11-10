const express = require('express');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { validate, validateQuery } = require('../middlewares/validate');
const {
  getAdminCalendarQuerySchema,
  createCalendarBlockSchema,
} = require('../validators/calendar.validator');
const {
  getAdminCalendar,
  createCalendarBlocks,
  deleteCalendarBlock,
} = require('../controllers/calendar.controller');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', validateQuery(getAdminCalendarQuerySchema), getAdminCalendar);
router.post('/blocks', validate(createCalendarBlockSchema), createCalendarBlocks);
router.delete('/blocks/:id', deleteCalendarBlock);

module.exports = router;

