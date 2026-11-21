const { z } = require('zod');
const { isValidDate, getTodayWIB, getMonthStart, diffDays } = require('../utils/dateUtils');

/**
 * Menyelesaikan default rentang tanggal WIB ("YYYY-MM-DD", inklusif).
 * Default: awal bulan ini sampai hari ini (WIB).
 * Jika hanya `to` yang dikirim (mis. bulan lalu), `from` memakai awal bulan dari `to`.
 */
function resolveFinanceDateRange(from, to) {
  const today = getTodayWIB();
  const resolvedTo = to || today;
  const resolvedFrom = from || `${getMonthStart(resolvedTo)}-01`;
  return { today, from: resolvedFrom, to: resolvedTo };
}

/**
 * Memvalidasi rentang tanggal WIB pada superRefine Zod.
 */
function validateDateRange(data, ctx) {
  const { today, from, to } = resolveFinanceDateRange(data.from, data.to);

  if (to > today) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Tanggal to tidak boleh berada di masa depan',
      path: ['to'],
    });
  }

  if (from > to) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Tanggal from tidak boleh lebih besar dari tanggal to',
      path: ['from'],
    });
  }

  if (from <= to && diffDays(from, to) + 1 > 366) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Rentang tanggal maksimal 366 hari',
      path: ['to'],
    });
  }
}

/**
 * Memvalidasi parameter rekap bulanan / tahunan.
 */
function validateRecapParams(data, ctx) {
  const currentYear = Number(getTodayWIB().slice(0, 4));
  const groupBy = data.groupBy || 'month';

  if (groupBy === 'month') {
    const year = data.year ?? currentYear;
    if (!Number.isInteger(year) || year < 2000 || year > currentYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Tahun harus bilangan bulat antara 2000 dan ${currentYear}`,
        path: ['year'],
      });
    }
    return;
  }

  const toYear = data.toYear ?? currentYear;
  const fromYear = data.fromYear ?? Math.max(2000, toYear - 2);

  if (!Number.isInteger(fromYear) || fromYear < 2000 || fromYear > currentYear) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `fromYear harus bilangan bulat antara 2000 dan ${currentYear}`,
      path: ['fromYear'],
    });
  }

  if (!Number.isInteger(toYear) || toYear < 2000 || toYear > currentYear) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `toYear harus bilangan bulat antara 2000 dan ${currentYear}`,
      path: ['toYear'],
    });
  }

  if (fromYear > toYear) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'fromYear tidak boleh lebih besar dari toYear',
      path: ['fromYear'],
    });
  } else if (toYear - fromYear + 1 > 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Rentang tahun maksimal 10 tahun',
      path: ['toYear'],
    });
  }
}

const dateStringOptionalSchema = z
  .string()
  .refine(isValidDate, 'Format atau nilai tanggal tidak valid kalender (harus YYYY-MM-DD)')
  .optional();

const booleanQuerySchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    if (val === 'true') return true;
    if (val === 'false') return false;
  }
  return val;
}, z.boolean({ invalid_type_error: 'Parameter harus berupa boolean (true/false)' }));

const strictIntYearSchema = z.coerce
  .number({ invalid_type_error: 'Tahun harus berupa angka' })
  .int('Tahun harus berupa bilangan bulat')
  .optional();

const financeSummaryQuerySchema = z
  .object({
    from: dateStringOptionalSchema,
    to: dateStringOptionalSchema,
  })
  .strict('Parameter query tidak dikenal pada summary keuangan')
  .superRefine(validateDateRange);

const financeChartQuerySchema = z
  .object({
    from: dateStringOptionalSchema,
    to: dateStringOptionalSchema,
    groupBy: z
      .enum(['day', 'week', 'month'], {
        errorMap: () => ({ message: 'groupBy harus berupa "day", "week", atau "month"' }),
      })
      .default('day'),
    breakdown: z
      .enum(['category', 'type'], {
        errorMap: () => ({ message: 'breakdown harus berupa "category" atau "type"' }),
      })
      .default('category'),
  })
  .strict('Parameter query tidak dikenal pada chart keuangan')
  .superRefine(validateDateRange);

const financeTransactionsQuerySchema = z
  .object({
    from: dateStringOptionalSchema,
    to: dateStringOptionalSchema,
    type: z
      .enum(['dp', 'pelunasan', 'pengembalian'], {
        errorMap: () => ({ message: 'type harus berupa "dp", "pelunasan", atau "pengembalian"' }),
      })
      .optional(),
    category: z
      .enum(['dekor', 'catering', 'wedding'], {
        errorMap: () => ({ message: 'category harus berupa "dekor", "catering", atau "wedding"' }),
      })
      .optional(),
    method: z
      .enum(['transfer', 'qris', 'tunai', 'lainnya'], {
        errorMap: () => ({
          message: 'method harus berupa "transfer", "qris", "tunai", atau "lainnya"',
        }),
      })
      .optional(),
    source: z
      .enum(['customer', 'manual'], {
        errorMap: () => ({ message: 'source harus berupa "customer" atau "manual"' }),
      })
      .optional(),
    status: z
      .enum(['approved', 'void', 'pending', 'rejected'], {
        errorMap: () => ({
          message: 'status harus berupa "approved", "void", "pending", atau "rejected"',
        }),
      })
      .default('approved'),
    q: z.string().trim().max(100, 'Kata kunci pencarian maksimal 100 karakter').optional(),
    page: z.coerce
      .number({ invalid_type_error: 'page harus berupa angka' })
      .int('page harus berupa bilangan bulat')
      .min(1, 'page minimal 1')
      .default(1),
    limit: z.coerce
      .number({ invalid_type_error: 'limit harus berupa angka' })
      .int('limit harus berupa bilangan bulat')
      .min(1, 'limit minimal 1')
      .max(100, 'limit maksimal 100')
      .default(20),
    sort: z
      .enum(['terbaru', 'terlama', 'nominal_besar', 'nominal_kecil'], {
        errorMap: () => ({
          message: 'sort harus berupa "terbaru", "terlama", "nominal_besar", atau "nominal_kecil"',
        }),
      })
      .default('terbaru'),
  })
  .strict('Parameter query tidak dikenal pada daftar transaksi keuangan')
  .superRefine(validateDateRange);

const financeRecapQuerySchema = z
  .object({
    groupBy: z
      .enum(['month', 'year'], {
        errorMap: () => ({ message: 'groupBy harus berupa "month" atau "year"' }),
      })
      .default('month'),
    year: strictIntYearSchema,
    fromYear: strictIntYearSchema,
    toYear: strictIntYearSchema,
  })
  .strict('Parameter query tidak dikenal pada rekap keuangan')
  .superRefine(validateRecapParams);

const financeOutstandingQuerySchema = z
  .object({
    page: z.coerce
      .number({ invalid_type_error: 'page harus berupa angka' })
      .int('page harus berupa bilangan bulat')
      .min(1, 'page minimal 1')
      .default(1),
    limit: z.coerce
      .number({ invalid_type_error: 'limit harus berupa angka' })
      .int('limit harus berupa bilangan bulat')
      .min(1, 'limit minimal 1')
      .max(100, 'limit maksimal 100')
      .default(20),
    overdueOnly: booleanQuerySchema.default(false),
    sort: z
      .enum(['acara_terdekat', 'sisa_terbesar'], {
        errorMap: () => ({
          message: 'sort harus berupa "acara_terdekat" atau "sisa_terbesar"',
        }),
      })
      .default('acara_terdekat'),
  })
  .strict('Parameter query tidak dikenal pada daftar piutang');

const financeExportQuerySchema = z
  .object({
    report: z.enum(['recap', 'transactions'], {
      required_error: 'Parameter report wajib diisi ("recap" atau "transactions")',
      errorMap: () => ({ message: 'report harus berupa "recap" atau "transactions"' }),
    }),
    format: z.enum(['pdf', 'xlsx'], {
      required_error: 'Parameter format wajib diisi ("pdf" atau "xlsx")',
      errorMap: () => ({ message: 'format harus berupa "pdf" atau "xlsx"' }),
    }),
    // Parameter untuk report=recap
    groupBy: z
      .enum(['month', 'year'], {
        errorMap: () => ({ message: 'groupBy harus berupa "month" atau "year"' }),
      })
      .optional(),
    year: strictIntYearSchema,
    fromYear: strictIntYearSchema,
    toYear: strictIntYearSchema,
    // Parameter untuk report=transactions
    from: dateStringOptionalSchema,
    to: dateStringOptionalSchema,
    type: z
      .enum(['dp', 'pelunasan', 'pengembalian'], {
        errorMap: () => ({ message: 'type harus berupa "dp", "pelunasan", atau "pengembalian"' }),
      })
      .optional(),
    category: z
      .enum(['dekor', 'catering', 'wedding'], {
        errorMap: () => ({ message: 'category harus berupa "dekor", "catering", atau "wedding"' }),
      })
      .optional(),
    method: z
      .enum(['transfer', 'qris', 'tunai', 'lainnya'], {
        errorMap: () => ({
          message: 'method harus berupa "transfer", "qris", "tunai", atau "lainnya"',
        }),
      })
      .optional(),
    source: z
      .enum(['customer', 'manual'], {
        errorMap: () => ({ message: 'source harus berupa "customer" atau "manual"' }),
      })
      .optional(),
    status: z
      .enum(['approved', 'void', 'pending', 'rejected'], {
        errorMap: () => ({
          message: 'status harus berupa "approved", "void", "pending", atau "rejected"',
        }),
      })
      .optional(),
    q: z.string().trim().max(100, 'Kata kunci pencarian maksimal 100 karakter').optional(),
    sort: z
      .enum(['terbaru', 'terlama', 'nominal_besar', 'nominal_kecil'], {
        errorMap: () => ({
          message: 'sort harus berupa "terbaru", "terlama", "nominal_besar", atau "nominal_kecil"',
        }),
      })
      .optional(),
  })
  .strict('Parameter query tidak dikenal pada ekspor keuangan')
  .superRefine((data, ctx) => {
    if (data.report === 'recap') {
      validateRecapParams(data, ctx);
    } else if (data.report === 'transactions') {
      validateDateRange(data, ctx);
    }
  });

module.exports = {
  resolveFinanceDateRange,
  financeSummaryQuerySchema,
  financeChartQuerySchema,
  financeTransactionsQuerySchema,
  financeRecapQuerySchema,
  financeOutstandingQuerySchema,
  financeExportQuerySchema,
};

