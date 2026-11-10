const calendarService = require('../services/calendarService');
const asyncHandler = require('../utils/asyncHandler');

const getAdminCalendar = asyncHandler(async (req, res) => {
  const data = await calendarService.getAdminCalendar(req.query.month, req.query.category);
  res.status(200).json({
    success: true,
    message: 'Data kalender berhasil diambil',
    data,
  });
});

const createCalendarBlocks = asyncHandler(async (req, res) => {
  const data = await calendarService.createCalendarBlocks(req.body, req.user._id);
  res.status(201).json({
    success: true,
    message: 'Proses pemblokiran kalender selesai',
    data,
  });
});

const deleteCalendarBlock = asyncHandler(async (req, res) => {
  const data = await calendarService.deleteCalendarBlock(req.params.id);
  res.status(200).json({
    success: true,
    message: data.message,
  });
});

module.exports = {
  getAdminCalendar,
  createCalendarBlocks,
  deleteCalendarBlock,
};

