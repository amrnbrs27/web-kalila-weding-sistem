/**
 * Utilitas penanganan dan validasi tanggal dalam zona waktu Indonesia Barat (WIB / Asia/Jakarta)
 */

const TIMEZONE_WIB = 'Asia/Jakarta';

/**
 * Mendapatkan string tanggal hari ini dalam format "YYYY-MM-DD" pada zona waktu WIB
 */
function getTodayWIB() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_WIB,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/**
 * Mendapatkan string bulan berjalan "YYYY-MM" pada zona waktu WIB
 */
function getCurrentMonthWIB() {
  return getTodayWIB().slice(0, 7);
}

/**
 * Memeriksa apakah string sesuai format "YYYY-MM-DD"
 */
function isValidDateFormat(dateStr) {
  if (typeof dateStr !== 'string') return false;
  return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(dateStr);
}

/**
 * Memeriksa apakah string tanggal valid kalender (menolak 2026-02-30, 2026-04-31, dll.)
 */
function isValidDate(dateStr) {
  if (!isValidDateFormat(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

/**
 * Memeriksa apakah string sesuai format "YYYY-MM" yang valid
 */
function isValidMonthFormat(monthStr) {
  if (typeof monthStr !== 'string') return false;
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(monthStr);
}

/**
 * Memeriksa apakah tanggal sudah lewat dibandingkan hari ini di WIB
 */
function isDateInPast(dateStr) {
  const today = getTodayWIB();
  return dateStr < today;
}

/**
 * Mengembalikan array string seluruh tanggal "YYYY-MM-DD" dalam bulan "YYYY-MM"
 */
function getDatesInMonth(yearMonthStr) {
  if (!isValidMonthFormat(yearMonthStr)) {
    throw new Error('Format bulan tidak valid (harus YYYY-MM)');
  }

  const [year, month] = yearMonthStr.split('-').map(Number);
  // Hari terakhir dalam bulan (tanggal 0 bulan berikutnya)
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const dates = [];
  const monthPadded = String(month).padStart(2, '0');
  for (let day = 1; day <= lastDay; day++) {
    const dayPadded = String(day).padStart(2, '0');
    dates.push(`${year}-${monthPadded}-${dayPadded}`);
  }
  return dates;
}

/**
 * Menghasilkan rentang tanggal dari dateFrom ke dateTo (inklusif)
 * Maksimal 31 hari.
 */
function getDateRange(dateFrom, dateTo) {
  if (!isValidDate(dateFrom) || !isValidDate(dateTo)) {
    throw new Error('Tanggal awal atau tanggal akhir tidak valid');
  }

  if (dateFrom > dateTo) {
    throw new Error('Tanggal awal tidak boleh lebih besar dari tanggal akhir');
  }

  const [y1, m1, d1] = dateFrom.split('-').map(Number);
  const [y2, m2, d2] = dateTo.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);

  const diffDays = Math.round((t2 - t1) / (24 * 3600 * 1000)) + 1;
  if (diffDays > 31) {
    throw new Error('Rentang tanggal maksimal 31 hari');
  }

  const dates = [];
  let current = new Date(t1);
  while (current.getTime() <= t2) {
    const cy = current.getUTCFullYear();
    const cm = String(current.getUTCMonth() + 1).padStart(2, '0');
    const cd = String(current.getUTCDate()).padStart(2, '0');
    dates.push(`${cy}-${cm}-${cd}`);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

/**
 * Memeriksa apakah bulan "YYYY-MM" berada dalam rentang maksimal maxMonths (default 24) ke depan dari bulan berjalan (WIB)
 */
function isWithinNextMonths(yearMonthStr, maxMonths = 24) {
  if (!isValidMonthFormat(yearMonthStr)) return false;

  const currentYm = getCurrentMonthWIB();
  const [curY, curM] = currentYm.split('-').map(Number);
  const [targetY, targetM] = yearMonthStr.split('-').map(Number);

  const diffMonths = (targetY - curY) * 12 + (targetM - curM);
  return diffMonths >= 0 && diffMonths <= maxMonths;
}

/**
 * Mengubah string tanggal "YYYY-MM-DD" menjadi batas awal (00:00:00.000 WIB)
 * dan batas akhir (23:59:59.999 WIB) dalam bentuk objek Date UTC
 */
function getDayRangeWIB(dateStr) {
  if (!isValidDate(dateStr)) {
    throw new Error(`Format atau nilai tanggal tidak valid: ${dateStr}`);
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  // 00:00:00.000 WIB = 17:00:00.000 UTC hari sebelumnya (-7 jam)
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - 7 * 3600 * 1000);
  // 23:59:59.999 WIB = 16:59:59.999 UTC hari ini (-7 jam)
  const end = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - 7 * 3600 * 1000);
  return { start, end };
}

/**
 * Menghitung selisih hari antar dua string tanggal "YYYY-MM-DD" (dateStrB - dateStrA)
 */
function diffDays(dateStrA, dateStrB) {
  const [y1, m1, d1] = dateStrA.split('-').map(Number);
  const [y2, m2, d2] = dateStrB.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((t2 - t1) / (24 * 3600 * 1000));
}

/**
 * Menambahkan n hari ke string tanggal "YYYY-MM-DD" (n bisa negatif)
 */
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  const ry = dt.getUTCFullYear();
  const rm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const rd = String(dt.getUTCDate()).padStart(2, '0');
  return `${ry}-${rm}-${rd}`;
}

/**
 * Menentukan tanggal awal minggu (Senin) dalam format "YYYY-MM-DD" dari string tanggal
 */
function getMondayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(dateStr, diff);
}

/**
 * Menentukan string awal bulan format "YYYY-MM" dari tanggal "YYYY-MM-DD"
 */
function getMonthStart(dateStr) {
  return dateStr.slice(0, 7);
}

module.exports = {
  TIMEZONE_WIB,
  getTodayWIB,
  getCurrentMonthWIB,
  isValidDateFormat,
  isValidDate,
  isValidMonthFormat,
  isDateInPast,
  getDatesInMonth,
  getDateRange,
  isWithinNextMonths,
  getDayRangeWIB,
  diffDays,
  addDays,
  getMondayOfWeek,
  getMonthStart,
};

