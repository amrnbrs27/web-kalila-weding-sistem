const AppError = require('./AppError');

/**
 * In-Memory Rate Limiter untuk percobaan gagal konfirmasi password admin.
 *
 * CATATAN ARSITEKTUR & KEAMANAN:
 * 1. Data percobaan disimpan murni di memori server (in-memory store), sehingga
 *    hitungan akan hilang saat server restart dan tidak dibagi antar-instance (non-shared).
 * 2. Di belakang reverse proxy / load balancer, pastikan app.set("trust proxy", ...)
 *    dikonfigurasi dengan benar agar alamat IP pengguna terbaca akurat pada middleware rate limit lainnya.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 menit

// Map<adminId, Array<timestamp>>
const failureRecords = new Map();

/**
 * Membersihkan data yang sudah kedaluwarsa di luar jendela 15 menit
 */
function cleanupExpired(adminIdKey, now) {
  const timestamps = failureRecords.get(adminIdKey);
  if (!timestamps) return;
  const valid = timestamps.filter((t) => now - t < WINDOW_MS);
  if (valid.length === 0) {
    failureRecords.delete(adminIdKey);
  } else {
    failureRecords.set(adminIdKey, valid);
  }
}

/**
 * Memeriksa apakah adminId telah melampaui batas percobaan konfirmasi gagal
 */
function checkConfirmPasswordLimit(adminId) {
  if (!adminId) return;
  const key = adminId.toString();
  const now = Date.now();
  cleanupExpired(key, now);

  const maxAttempts = Number(process.env.AUTH_CONFIRM_MAX) || 5;
  const attempts = failureRecords.get(key) || [];

  if (attempts.length >= maxAttempts) {
    throw new AppError(
      'Terlalu banyak percobaan konfirmasi password yang salah. Silakan coba lagi setelah 15 menit.',
      429
    );
  }
}

/**
 * Mencatat satu kegagalan konfirmasi password untuk adminId
 */
function recordConfirmPasswordFailure(adminId) {
  if (!adminId) return;
  const key = adminId.toString();
  const now = Date.now();
  cleanupExpired(key, now);

  const attempts = failureRecords.get(key) || [];
  attempts.push(now);
  failureRecords.set(key, attempts);
}

/**
 * Reset data untuk admin tertentu (atau semua data bila adminId tidak diberikan, untuk pengujian)
 */
function resetConfirmPasswordLimit(adminId = null) {
  if (adminId) {
    failureRecords.delete(adminId.toString());
  } else {
    failureRecords.clear();
  }
}

module.exports = {
  checkConfirmPasswordLimit,
  recordConfirmPasswordFailure,
  resetConfirmPasswordLimit,
};

