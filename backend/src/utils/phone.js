/**
 * Utilitas normalisasi dan validasi nomor telepon seluler Indonesia
 */

/**
 * Mengubah format nomor telepon:
 * "08...", "+628...", atau "628..." diubah menjadi "628..." (tanpa tanda plus atau awalan 0)
 */
function normalizePhoneNumber(val) {
  if (typeof val !== 'string') return val;
  const digitsOnly = val.replace(/\D/g, '');
  if (digitsOnly.startsWith('0')) {
    return '62' + digitsOnly.slice(1);
  }
  return digitsOnly;
}

/**
 * Memvalidasi apakah nomor telepon seluler Indonesia valid
 * Format: 628 diikuti digit 1-9 dan 7-11 digit berikutnya (total 10-14 digit)
 */
function isValidPhoneNumber(val) {
  if (typeof val !== 'string') return false;
  return /^628[1-9][0-9]{7,11}$/.test(val);
}

module.exports = {
  normalizePhoneNumber,
  normalizeWhatsapp: normalizePhoneNumber, // alias
  isValidPhoneNumber,
};

