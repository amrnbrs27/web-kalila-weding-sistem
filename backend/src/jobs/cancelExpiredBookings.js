const cron = require('node-cron');
const Booking = require('../models/Booking');
const { processEmailOutbox } = require('./sendEmails');

/**
 * Membatalkan semua pesanan berstatus "menunggu_dp" yang telah melewati batas waktu (expiresAt < now)
 * Operasi updateMany atomik.
 * Mengembalikan jumlah pesanan yang dibatalkan.
 */
async function cancelExpiredBookings(now = new Date()) {
  const result = await Booking.updateMany(
    {
      status: 'menunggu_dp',
      expiresAt: { $lt: now },
    },
    {
      status: 'dibatalkan',
      cancelReason: 'Batas waktu pembayaran habis',
      $push: {
        statusHistory: {
          status: 'dibatalkan',
          at: now,
          by: null,
          note: 'Dibatalkan otomatis',
        },
      },
    }
  );

  return result.modifiedCount;
}

let cronTask = null;

/**
 * Memulai penjadwal pembatalan otomatis tiap menit
 */
function startBookingJobs() {
  if (cronTask) return cronTask;

  // Jalankan pembersihan satu kali saat start
  cancelExpiredBookings()
    .then((count) => {
      if (count > 0) {
        console.log(`[Cron Job] Pembersihan awal: ${count} pesanan kedaluwarsa berhasil dibatalkan`);
      }
    })
    .catch((err) => {
      console.error('[Cron Job Error] Gagal menjalankan pembersihan awal:', err.message);
    });

  // Jadwalkan tiap menit (* * * * *)
  cronTask = cron.schedule('* * * * *', async () => {
    try {
      const count = await cancelExpiredBookings();
      if (count > 0) {
        console.log(`[Cron Job] ${count} pesanan kedaluwarsa berhasil dibatalkan otomatis`);
      }
    } catch (err) {
      console.error('[Cron Job Error] Pembatalan otomatis gagal:', err.message);
    }

    try {
      await processEmailOutbox();
    } catch (err) {
      console.error('[Cron Job Error] Pemrosesan antrean email gagal:', err.message);
    }
  });

  return cronTask;
}

module.exports = {
  cancelExpiredBookings,
  startBookingJobs,
};

