const { z } = require('zod');
const { isValidMonthFormat, isWithinNextMonths } = require('../utils/dateUtils');

const getAvailabilityQuerySchema = z.object({
  category: z.enum(['dekor', 'catering', 'wedding'], {
    required_error: 'Parameter category wajib diisi (dekor, catering, wedding)',
    invalid_type_error: 'Kategori harus berupa dekor, catering, atau wedding',
  }),
  month: z
    .string({ required_error: 'Parameter month wajib diisi (format YYYY-MM)' })
    .refine(isValidMonthFormat, 'Format month tidak valid (harus YYYY-MM)')
    .refine(
      (val) => isWithinNextMonths(val, 24),
      'Pengecekan ketersediaan maksimal 24 bulan ke depan dari bulan berjalan'
    ),
});

module.exports = {
  getAvailabilityQuerySchema,
};

