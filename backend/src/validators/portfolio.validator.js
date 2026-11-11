const { z } = require('zod');
const { isValidDate } = require('../utils/dateUtils');

const categoryEnum = z.enum(['dekor', 'catering', 'wedding'], {
  errorMap: () => ({ message: 'Kategori harus salah satu dari: dekor, catering, wedding' }),
});

const eventDateSchema = z
  .string()
  .trim()
  .refine((val) => !val || isValidDate(val), {
    message: 'Tanggal acara tidak valid (harus format YYYY-MM-DD kalender)',
  })
  .optional()
  .nullable();

const createPortfolioSchema = z
  .object({
    category: categoryEnum,
    title: z
      .string({ required_error: 'Judul portofolio wajib diisi' })
      .trim()
      .min(3, 'Judul portofolio minimal 3 karakter')
      .max(120, 'Judul portofolio maksimal 120 karakter'),
    description: z
      .string()
      .trim()
      .max(2000, 'Deskripsi maksimal 2000 karakter')
      .optional()
      .default(''),
    eventDate: eventDateSchema,
    location: z
      .string()
      .trim()
      .max(200, 'Lokasi maksimal 200 karakter')
      .optional()
      .default(''),
    isPublished: z.boolean().optional().default(true),
    isFeatured: z.boolean().optional().default(false),
  })
  .strict({ message: 'Terdapat field yang tidak diizinkan pada data portofolio' });

const updatePortfolioSchema = z
  .object({
    category: categoryEnum.optional(),
    title: z
      .string()
      .trim()
      .min(3, 'Judul portofolio minimal 3 karakter')
      .max(120, 'Judul portofolio maksimal 120 karakter')
      .optional(),
    description: z
      .string()
      .trim()
      .max(2000, 'Deskripsi maksimal 2000 karakter')
      .optional(),
    eventDate: eventDateSchema,
    location: z
      .string()
      .trim()
      .max(200, 'Lokasi maksimal 200 karakter')
      .optional(),
    isPublished: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  })
  .strict({ message: 'Terdapat field yang tidak diizinkan pada data pembaruan portofolio' });

const updatePortfolioStatusSchema = z
  .object({
    isPublished: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  })
  .strict({ message: 'Hanya field isPublished dan isFeatured yang diizinkan' })
  .refine(
    (data) => data.isPublished !== undefined || data.isFeatured !== undefined,
    { message: 'Minimal salah satu dari isPublished atau isFeatured harus disertakan' }
  );

const publicPortfolioQuerySchema = z
  .object({
    category: categoryEnum.optional(),
    featured: z
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
      .transform((val) => (val ? parseInt(val, 10) : 12))
      .refine((val) => !isNaN(val) && val >= 1 && val <= 50, {
        message: 'Limit publik maksimal 50 dan minimal 1',
      }),
    sort: z
      .enum(['terbaru', 'terlama'], {
        errorMap: () => ({ message: 'Sort harus salah satu dari: terbaru, terlama' }),
      })
      .optional()
      .default('terbaru'),
  })
  .strict();

const adminPortfolioQuerySchema = z
  .object({
    category: categoryEnum.optional(),
    isPublished: z
      .enum(['true', 'false'])
      .optional()
      .transform((val) => (val !== undefined ? val === 'true' : undefined)),
    isFeatured: z
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
      .enum(['terbaru', 'terlama', 'title_asc', 'title_desc'], {
        errorMap: () => ({
          message: 'Sort admin harus salah satu dari: terbaru, terlama, title_asc, title_desc',
        }),
      })
      .optional()
      .default('terbaru'),
  })
  .strict();

module.exports = {
  createPortfolioSchema,
  updatePortfolioSchema,
  updatePortfolioStatusSchema,
  publicPortfolioQuerySchema,
  adminPortfolioQuerySchema,
};

