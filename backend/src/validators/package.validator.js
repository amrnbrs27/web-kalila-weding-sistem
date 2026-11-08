const { z } = require('zod');

exports.createPackageSchema = z
  .object({
    name: z.string().min(2, 'Nama paket minimal 2 karakter'),
    category: z.enum(['dekor', 'catering', 'wedding'], {
      errorMap: () => ({ message: 'Kategori harus salah satu dari: dekor, catering, wedding' }),
    }),
    price: z.coerce.number().min(0, 'Harga paket tidak boleh negatif'),
    description: z.string().optional().default(''),
    packageItems: z
      .array(z.string().min(1, 'Item paket tidak boleh kosong'))
      .optional()
      .default([]),
    images: z.array(z.string()).optional().default([]),
    decorWidth: z.coerce.number().positive('Lebar dekor harus berupa angka positif').optional(),
    cateringDetails: z
      .object({
        minOrder: z.coerce.number().min(0).optional().default(0),
        menuType: z.string().optional().default(''),
        notes: z.string().optional().default(''),
      })
      .optional(),
    weddingDetails: z
      .object({
        guestCapacity: z.coerce.number().min(0).optional().default(0),
        includedServices: z.array(z.string()).optional().default([]),
        notes: z.string().optional().default(''),
      })
      .optional(),
    isActive: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      if (data.category === 'dekor') {
        return typeof data.decorWidth === 'number' && data.decorWidth > 0;
      }
      return true;
    },
    {
      message: 'Lebar dekor wajib diisi untuk kategori dekor (angka positif dalam meter)',
      path: ['decorWidth'],
    }
  );

exports.updatePackageSchema = z
  .object({
    name: z.string().min(2, 'Nama paket minimal 2 karakter').optional(),
    category: z
      .enum(['dekor', 'catering', 'wedding'], {
        errorMap: () => ({ message: 'Kategori harus salah satu dari: dekor, catering, wedding' }),
      })
      .optional(),
    price: z.coerce.number().min(0, 'Harga paket tidak boleh negatif').optional(),
    description: z.string().optional(),
    packageItems: z.array(z.string().min(1, 'Item paket tidak boleh kosong')).optional(),
    images: z.array(z.string()).optional(),
    decorWidth: z.coerce.number().positive('Lebar dekor harus berupa angka positif').optional(),
    cateringDetails: z
      .object({
        minOrder: z.coerce.number().min(0).optional(),
        menuType: z.string().optional(),
        notes: z.string().optional(),
      })
      .optional(),
    weddingDetails: z
      .object({
        guestCapacity: z.coerce.number().min(0).optional(),
        includedServices: z.array(z.string()).optional(),
        notes: z.string().optional(),
      })
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.category === 'dekor' && data.decorWidth !== undefined) {
        return typeof data.decorWidth === 'number' && data.decorWidth > 0;
      }
      return true;
    },
    {
      message: 'Lebar dekor harus berupa angka positif untuk kategori dekor',
      path: ['decorWidth'],
    }
  );

exports.queryPackageSchema = z.object({
  category: z.enum(['dekor', 'catering', 'wedding']).optional(),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false', 'all']).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sort: z
    .enum(['newest', 'oldest', 'cheapest', 'expensive', 'name_asc', 'name_desc'])
    .optional()
    .default('newest'),
});

