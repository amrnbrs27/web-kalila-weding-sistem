const { z } = require('zod');
const { normalizePhoneNumber } = require('../utils/phone');

const passwordPolicy = z
  .string({ required_error: 'Password wajib diisi' })
  .min(8, 'Password minimal 8 karakter')
  .refine((val) => Buffer.byteLength(val, 'utf8') <= 72, {
    message: 'Password maksimal 72 byte',
  })
  .refine((val) => /[a-zA-Z]/.test(val), {
    message: 'Password harus mengandung minimal satu huruf',
  })
  .refine((val) => /[0-9]/.test(val), {
    message: 'Password harus mengandung minimal satu angka',
  });

const createAdminSchema = z
  .object({
    name: z
      .string({ required_error: 'Nama wajib diisi' })
      .trim()
      .min(2, 'Nama minimal 2 karakter')
      .max(100, 'Nama maksimal 100 karakter'),
    email: z
      .string({ required_error: 'Email wajib diisi' })
      .trim()
      .toLowerCase()
      .email('Format email tidak valid'),
    phone: z
      .string()
      .trim()
      .transform((val) => (val ? normalizePhoneNumber(val) : ''))
      .optional()
      .default(''),
    password: passwordPolicy,
    confirmPassword: z
      .string({ required_error: 'Konfirmasi password admin login wajib diisi' })
      .min(1, 'Konfirmasi password wajib diisi'),
  })
  .strict({ message: 'Terdapat field yang tidak diizinkan pada penambahan admin' })
  .refine(
    (data) => data.password.toLowerCase() !== data.email.toLowerCase(),
    {
      message: 'Password tidak boleh sama dengan email',
      path: ['password'],
    }
  );

const updateAdminSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Nama minimal 2 karakter')
      .max(100, 'Nama maksimal 100 karakter')
      .optional(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Format email tidak valid')
      .optional(),
    phone: z
      .string()
      .trim()
      .transform((val) => (val ? normalizePhoneNumber(val) : ''))
      .optional(),
  })
  .strict({ message: 'Terdapat field yang tidak diizinkan (role, password, atau isActive tidak boleh diubah lewat endpoint ini)' });

const updateAdminStatusSchema = z
  .object({
    isActive: z.boolean({ required_error: 'Status isActive wajib berupa boolean (true/false)' }),
  })
  .strict({ message: 'Hanya field isActive yang diizinkan' });

const changeOwnPasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'Password saat ini wajib diisi' })
      .min(1, 'Password saat ini wajib diisi'),
    newPassword: passwordPolicy,
  })
  .strict({ message: 'Terdapat field yang tidak diizinkan pada ganti password' });

const resetOtherPasswordSchema = z
  .object({
    newPassword: passwordPolicy,
    confirmPassword: z
      .string({ required_error: 'Konfirmasi password admin login wajib diisi' })
      .min(1, 'Konfirmasi password wajib diisi'),
  })
  .strict({ message: 'Terdapat field yang tidak diizinkan pada reset password' });

const adminUserQuerySchema = z
  .object({
    isActive: z
      .enum(['true', 'false'])
      .optional()
      .transform((val) => (val !== undefined ? val === 'true' : undefined)),
    q: z.string().trim().optional(),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => !isNaN(val) && val >= 1, { message: 'Page minimal 1' }),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine((val) => !isNaN(val) && val >= 1 && val <= 100, {
        message: 'Limit admin maksimal 100 dan minimal 1',
      }),
    sort: z
      .enum(['terbaru', 'terlama', 'nama'], {
        errorMap: () => ({ message: 'Sort harus salah satu dari: terbaru, terlama, nama' }),
      })
      .optional()
      .default('terbaru'),
  })
  .strict();

module.exports = {
  createAdminSchema,
  updateAdminSchema,
  updateAdminStatusSchema,
  changeOwnPasswordSchema,
  resetOtherPasswordSchema,
  adminUserQuerySchema,
  passwordPolicy,
};

