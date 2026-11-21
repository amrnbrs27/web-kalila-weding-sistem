const mongoose = require('mongoose');
const SlotLock = require('../models/SlotLock');
const { isDateAvailable } = require('./availabilityService');
const AppError = require('../utils/AppError');

/**
 * Mendapatkan daftar kategori yang terpengaruh dalam urutan alfabetik tetap (mencegah deadlock)
 */
function getAffectedCategories(category) {
  if (category === 'dekor') return ['dekor'];
  if (category === 'catering') return ['catering'];
  if (category === 'wedding') return ['catering', 'dekor', 'wedding'];
  throw new AppError(`Kategori "${category}" tidak valid`, 400);
}

/**
 * Menjalankan operasi fungsi bisnis di dalam MongoDB transaction dengan penguncian slot
 * Menggunakan serialisasi kunci slot (write conflict serialization) dan pemeriksaan ketersediaan
 */
async function withSlotLock({ category, date }, fn) {
  const affected = getAffectedCategories(category);

  return await mongoose.connection.transaction(async (session) => {
    // 1. Sentuh dokumen SlotLock untuk semua kategori terdampak (sorted order)
    for (const cat of affected) {
      await SlotLock.findOneAndUpdate(
        { date, category: cat },
        { $inc: { version: 1 } },
        {
          upsert: true,
          session,
          returnDocument: 'after',
        }
      );
    }

    // 2. Periksa ketersediaan kuota slot tanggal secara atomik memakai session
    const avail = await isDateAvailable(category, date, { session });
    if (!avail.available) {
      throw new AppError(
        avail.reason || `Tanggal ${date} sudah tidak tersedia untuk kategori ${category} (${avail.status})`,
        409
      );
    }

    // 3. Eksekusi fungsi bisnis di dalam transaksi
    return await fn(session);
  });
}

module.exports = {
  withSlotLock,
  getAffectedCategories,
};

