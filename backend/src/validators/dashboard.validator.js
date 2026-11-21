const { z } = require('zod');
const { isValidDate, getTodayWIB, diffDays, addDays } = require('../utils/dateUtils');

const ordersOverviewQuerySchema = z
  .object({
    recentLimit: z.coerce.number().int().min(1, 'recentLimit minimal 1').max(20, 'recentLimit maksimal 20').default(10),
    upcomingDays: z.coerce.number().int().min(1, 'upcomingDays minimal 1').max(90, 'upcomingDays maksimal 90').default(30),
    upcomingLimit: z.coerce.number().int().min(1, 'upcomingLimit minimal 1').max(20, 'upcomingLimit maksimal 20').default(10),
  })
  .strict('Parameter query tidak dikenal pada overview dashboard');

const ordersChartQuerySchema = z
  .object({
    from: z
      .string()
      .refine(isValidDate, 'Format tanggal from tidak valid kalender (harus YYYY-MM-DD)')
      .optional(),
    to: z
      .string()
      .refine(isValidDate, 'Format tanggal to tidak valid kalender (harus YYYY-MM-DD)')
      .optional(),
    groupBy: z
      .enum(['day', 'week', 'month'], {
        errorMap: () => ({ message: 'groupBy harus berupa "day", "week", atau "month"' }),
      })
      .default('day'),
    includeCancelled: z
      .preprocess((val) => {
        if (typeof val === 'string') {
          if (val === 'true') return true;
          if (val === 'false') return false;
        }
        return val;
      }, z.boolean({ invalid_type_error: 'includeCancelled harus berupa boolean' }))
      .default(true),
  })
  .strict('Parameter query tidak dikenal pada chart dashboard')
  .superRefine((data, ctx) => {
    const today = getTodayWIB();
    const toDate = data.to || today;
    const fromDate = data.from || addDays(toDate, -29);

    if (toDate > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tanggal to tidak boleh berada di masa depan',
        path: ['to'],
      });
    }

    if (fromDate > toDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tanggal from tidak boleh lebih besar dari tanggal to',
        path: ['from'],
      });
    }

    const totalDays = diffDays(fromDate, toDate) + 1;
    if (totalDays > 366) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Rentang tanggal maksimal 366 hari',
        path: ['to'],
      });
    }
  });

module.exports = {
  ordersOverviewQuerySchema,
  ordersChartQuerySchema,
};

