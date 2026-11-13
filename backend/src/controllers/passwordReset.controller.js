const passwordResetService = require('../services/passwordResetService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * 1. POST /api/auth/forgot-password
 * Minta kode OTP reset password lewat email
 */
const forgotPassword = asyncHandler(async (req, res) => {
  // Pengecekan konfigurasi secret wajib dilakukan pertama
  passwordResetService.ensureConfigured();

  const { email } = req.body;
  const config = passwordResetService.getConfig();

  // HANYA pencarian akun yang dilakukan sebelum respons (menyamakan waktu respons & mencegah enumerasi)
  const account = await passwordResetService.findEligibleUser(email);

  // Kirim respons 200 seragam sebelum proses pembuatan OTP & enqueue email
  res.status(200).json({
    success: true,
    message: 'Jika email terdaftar, kode OTP telah dikirim.',
    data: {
      expiresInMinutes: config.ttlMinutes,
      resendAfterSeconds: config.cooldownSeconds,
    },
  });

  // Pembuatan OTP dan enqueue email dilakukan sesudahnya di latar belakang
  if (account.eligible) {
    setImmediate(async () => {
      try {
        await passwordResetService.requestPasswordReset(account);
      } catch (err) {
        console.error('[PasswordReset] Kesalahan latar belakang forgot-password:', err.message);
      }
    });
  }
});

/**
 * 2. POST /api/auth/verify-reset-otp
 * Verifikasi kode OTP dan dapatkan token reset sekali pakai
 */
const verifyResetOtp = asyncHandler(async (req, res) => {
  passwordResetService.ensureConfigured();

  const { email, otp } = req.body;
  const data = await passwordResetService.verifyResetOtp(email, otp);

  res.status(200).json({
    success: true,
    message: 'Kode OTP berhasil diverifikasi',
    data,
  });
});

/**
 * 3. POST /api/auth/reset-password
 * Ubah password dengan token reset sekali pakai
 */
const resetPassword = asyncHandler(async (req, res) => {
  passwordResetService.ensureConfigured();

  const { resetToken, newPassword } = req.body;
  await passwordResetService.resetPassword(resetToken, newPassword);

  res.status(200).json({
    success: true,
    message: 'Password berhasil diubah. Silakan masuk dengan password baru.',
  });
});

module.exports = {
  forgotPassword,
  verifyResetOtp,
  resetPassword,
};

