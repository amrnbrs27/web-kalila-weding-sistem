const { z } = require('zod');
const {
  isValidDate,
  isValidMonthFormat,
  isDateInPast,
  getDateRange,
} = require('../utils/dateUtils');

const getAdminCalendarQuerySchema = z.object({
  month: z
    .string({ required_error: 'Parameter month wajib diisi (format YYYY-MM)' })
    .refine(isValidMonthFormat, 'Format month tidak valid (harus YYYY-MM)'),
  category: z.enum(['dekor', 'catering', 'wedding']).optional(),
});

const createCalendarBlockSchema = z
  .object({
    category: z.enum(['dekor', 'catering', 'wedding'], {
      required_error: 'Kategori wajib diisi (dekor, catering, wedding)',
      invalid_type_error: 'Kategori harus dekor, catering, atau wedding',
    }),
    reason: z.string().max(200, 'Alasan maksimal 200 karakter').optional(),
    date: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  })
  .strict('Field tidak dikenal pada pembuatan blokir kalender')
  .superRefine((data, ctx) => {
    const hasSingle = Boolean(data.date);
    const hasRange = Boolean(data.dateFrom || data.dateTo);

    if (hasSingle && hasRange) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Gunakan salah satu: tanggal tunggal (date) ATAU rentang tanggal (dateFrom & dateTo)',
        path: ['date'],
      });
      return;
    }

    if (!hasSingle && !hasRange) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Silakan isi tanggal (date) ATAU rentang tanggal (dateFrom & dateTo)',
        path: ['date'],
      });
      return;
    }

    if (hasSingle) {
      if (!isValidDate(data.date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Format tanggal date tidak valid kalender (harus YYYY-MM-DD)',
          path: ['date'],
        });
        return;
      }
      if (isDateInPast(data.date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tanggal yang diblokir tidak boleh tanggal lampau',
          path: ['date'],
        });
      }
      return;
    }

    // Has range
    if (!data.dateFrom || !data.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Rentang tanggal memerlukan dateFrom dan dateTo',
        path: ['dateFrom'],
      });
      return;
    }

    if (!isValidDate(data.dateFrom)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Format tanggal dateFrom tidak valid (harus YYYY-MM-DD)',
        path: ['dateFrom'],
      });
      return;
    }

    if (!isValidDate(data.dateTo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Format tanggal dateTo tidak valid (harus YYYY-MM-DD)',
        path: ['dateTo'],
      });
      return;
    }

    if (data.dateFrom > data.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dateFrom tidak boleh lebih besar dari dateTo',
        path: ['dateFrom'],
      });
      return;
    }

    if (isDateInPast(data.dateFrom)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Rentang tanggal tidak boleh mencakup tanggal lampau',
        path: ['dateFrom'],
      });
      return;
    }

    try {
      getDateRange(data.dateFrom, data.dateTo);
    } catch (err) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err.message,
        path: ['dateTo'],
      });
    }
  });

module.exports = {
  getAdminCalendarQuerySchema,
  createCalendarBlockSchema,
};

