const { z } = require('zod');
const { passwordPolicy } = require('./adminUser.validator');

const forgotPasswordSchema = z
  .object({
    email: z
      .string({ required_error: 'Email wajib diisi' })
      .trim()
      .toLowerCase()
      .email('Format email tidak valid'),
  })
  .strict({ message: 'Terdapat field yang tidak diizinkan' });

const verifyResetOtpSchema = z
  .object({
    email: z
      .string({ required_error: 'Email wajib diisi' })
      .trim()
      .toLowerCase()
      .email('Format email tidak valid'),
    otp: z
      .string({ required_error: 'Kode OTP wajib diisi' })
      .trim()
      .regex(/^\d{6}$/, 'Kode OTP harus berupa 6 digit angka'),
  })
  .strict({ message: 'Terdapat field yang tidak diizinkan' });

const resetPasswordSchema = z
  .object({
    resetToken: z
      .string({ required_error: 'Token reset wajib diisi' })
      .trim()
      .min(1, 'Token reset wajib diisi'),
    newPassword: passwordPolicy,
  })
  .strict({ message: 'Terdapat field yang tidak diizinkan' });

module.exports = {
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
};

