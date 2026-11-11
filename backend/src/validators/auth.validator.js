const { z } = require('zod');

exports.registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().min(9, 'Nomor WhatsApp tidak valid'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .refine((val) => Buffer.byteLength(val, 'utf8') <= 72, {
      message: 'Password maksimal 72 byte',
    }),
});

exports.loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});