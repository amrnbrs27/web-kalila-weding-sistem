const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

exports.objectIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Format ID tidak valid'),
});

exports.packageImageParamsSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Format ID paket tidak valid'),
  imageId: z.string().regex(objectIdRegex, 'Format ID gambar tidak valid'),
});

exports.createPackageSchema = z
  .object({
    category: z.enum(['dekor', 'catering', 'wedding'], {
      errorMap: () => ({ message: 'Kategori harus salah satu dari: dekor, catering, wedding' }),
    }),
    name: z.string().trim().min(1, 'Nama paket wajib diisi'),
    price: z.coerce
      .number({ required_error: 'Harga paket wajib diisi' })
      .int('Harga paket harus berupa bilangan bulat')
      .min(0, 'Harga paket tidak boleh negatif'),
    description: z.string().trim().optional().default(''),
    inclusions: z
      .array(z.string().trim().min(1, 'Item isi paket tidak boleh kosong'))
      .optional()
      .default([]),
    decorWidthCm: z.coerce.number().optional(),
    isActive: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.category === 'dekor') {
      if (data.decorWidthCm === undefined || data.decorWidthCm === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Lebar dekor (decorWidthCm) wajib diisi untuk kategori dekor',
          path: ['decorWidthCm'],
        });
      } else if (typeof data.decorWidthCm !== 'number' || data.decorWidthCm <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Lebar dekor (decorWidthCm) harus berupa angka lebih dari 0 cm',
          path: ['decorWidthCm'],
        });
      }
    } else {
      if (data.decorWidthCm !== undefined && data.decorWidthCm !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Lebar dekor (decorWidthCm) tidak boleh diisi untuk kategori selain dekor',
          path: ['decorWidthCm'],
        });
      }
    }
  });

exports.updatePackageSchema = z
  .object({
    category: z
      .enum(['dekor', 'catering', 'wedding'], {
        errorMap: () => ({ message: 'Kategori harus salah satu dari: dekor, catering, wedding' }),
      })
      .optional(),
    name: z.string().trim().min(1, 'Nama paket tidak boleh kosong').optional(),
    price: z.coerce
      .number()
      .int('Harga paket harus berupa bilangan bulat')
      .min(0, 'Harga paket tidak boleh negatif')
      .optional(),
    description: z.string().trim().optional(),
    inclusions: z
      .array(z.string().trim().min(1, 'Item isi paket tidak boleh kosong'))
      .optional(),
    decorWidthCm: z.coerce.number().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.category) {
      if (data.category === 'dekor') {
        if (data.decorWidthCm !== undefined && (data.decorWidthCm === null || data.decorWidthCm <= 0)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Lebar dekor (decorWidthCm) harus berupa angka lebih dari 0 cm',
            path: ['decorWidthCm'],
          });
        }
      } else {
        if (data.decorWidthCm !== undefined && data.decorWidthCm !== null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Lebar dekor (decorWidthCm) tidak boleh diisi untuk kategori selain dekor',
            path: ['decorWidthCm'],
          });
        }
      }
    } else if (data.decorWidthCm !== undefined && data.decorWidthCm !== null) {
      if (data.decorWidthCm <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Lebar dekor (decorWidthCm) harus berupa angka lebih dari 0 cm',
          path: ['decorWidthCm'],
        });
      }
    }
  });

exports.updateStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'Status isActive wajib diisi' }),
});

exports.queryPublicPackagesSchema = z.object({
  category: z.enum(['dekor', 'catering', 'wedding']).optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50, 'Maksimal limit 50').optional().default(12),
  sort: z.enum(['terbaru', 'harga_asc', 'harga_desc']).optional().default('terbaru'),
});

exports.queryAdminPackagesSchema = z.object({
  category: z.enum(['dekor', 'catering', 'wedding']).optional(),
  isActive: z.enum(['true', 'false', 'all']).optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(12),
  sort: z.enum(['terbaru', 'terlama', 'harga_asc', 'harga_desc']).optional().default('terbaru'),
});
