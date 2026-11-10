const CalendarBlock = require('../models/CalendarBlock');
const { getDateRange } = require('../utils/dateUtils');
const { getMonthCalendarForAdmin } = require('./availabilityService');
const AppError = require('../utils/AppError');

/**
 * Mengambil ikhtisar kalender admin untuk bulan tertentu
 */
async function getAdminCalendar(month, category) {
  return await getMonthCalendarForAdmin(month, category);
}

/**
 * Membuat blokir tanggal kalender (tunggal atau rentang), aman dari race condition (E11000)
 */
async function createCalendarBlocks({ category, date, dateFrom, dateTo, reason }, userId) {
  let datesToBlock = [];

  if (date) {
    datesToBlock = [date];
  } else if (dateFrom && dateTo) {
    datesToBlock = getDateRange(dateFrom, dateTo);
  }

  const created = [];
  const skipped = [];

  for (const d of datesToBlock) {
    // Cek keberadaan awal
    const existing = await CalendarBlock.findOne({ date: d, category });
    if (existing) {
      skipped.push({ date: d, reason: 'Sudah diblokir sebelumnya' });
      continue;
    }

    try {
      const block = await CalendarBlock.create({
        date: d,
        category,
        reason: reason || '',
        createdBy: userId,
      });
      created.push({
        id: block._id,
        date: block.date,
        category: block.category,
        reason: block.reason,
      });
    } catch (err) {
      // Tangani race condition jika ada bentrok indeks unik E11000
      if (err.code === 11000) {
        skipped.push({ date: d, reason: 'Sudah diblokir sebelumnya' });
      } else {
        throw err;
      }
    }
  }

  return { created, skipped };
}

/**
 * Menghapus blokir tanggal kalender berdasarkan ID
 */
async function deleteCalendarBlock(id) {
  const block = await CalendarBlock.findByIdAndDelete(id);
  if (!block) {
    throw new AppError('Blokir kalender tidak ditemukan', 404);
  }

  return {
    message: 'Blokir tanggal kalender berhasil dihapus',
  };
}

module.exports = {
  getAdminCalendar,
  createCalendarBlocks,
  deleteCalendarBlock,
};

