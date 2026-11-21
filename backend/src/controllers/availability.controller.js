const availabilityService = require('../services/availabilityService');
const asyncHandler = require('../utils/asyncHandler');

const getAvailability = asyncHandler(async (req, res) => {
  const data = await availabilityService.getMonthAvailability(
    req.query.category,
    req.query.month
  );
  res.status(200).json({
    success: true,
    message: 'Ketersediaan tanggal berhasil diambil',
    data,
  });
});

module.exports = {
  getAvailability,
};

