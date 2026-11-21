const { z } = require('zod');
const mongoose = require('mongoose');

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Format ID tidak valid',
});

const tagItemSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, 'Tag minimal 2 karakter')
  .max(30, 'Tag maksimal 30 karakter')
  .regex(
    /^[a-z0-9 -]+$/,
    'Tag hanya boleh berisi huruf, angka, spasi, dan strip'
  );

const tagsSchema = z
  .array(tagItemSchema)
  .max(5, 'Maksimal 5 tag per artikel')
  .refine((tags) => new Set(tags).size === tags.length, {
    message: 'Tag tidak boleh memiliki nilai duplikat',
  })
  .optional()
  .default([]);

const createPostSchema = z
  .object({
    title: z
      .string({ required_error: 'Judul artikel wajib diisi' })
      .trim()
      .min(3, 'Judul artikel minimal 3 karakter')
      .max(150, 'Judul artikel maksimal 150 karakter'),
    content: z
      .string({ required_error: 'Isi artikel wajib diisi' })
      .max(200000, 'Isi artikel maksimal 200.000 karakter'),
    excerpt: z
      .string()
      .trim()
      .max(300, 'Ringkasan artikel maksimal 300 karakter')
      .optional()
      .default(''),
    metaDescription: z
      .string()
      .trim()
      .max(160, 'Meta deskripsi maksimal 160 karakter')
      .optional()
      .default(''),
    authorName: z
      .string()
      .trim()
      .max(80, 'Nama penulis maksimal 80 karakter')
      .optional()
      .default(''),
    tags: tagsSchema,
  })
  .strict('Terdapat field yang tidak diizinkan pada data artikel');

const updatePostSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Judul artikel minimal 3 karakter')
      .max(150, 'Judul artikel maksimal 150 karakter')
      .optional(),
    content: z
      .string()
      .max(200000, 'Isi artikel maksimal 200.000 karakter')
      .optional(),
    excerpt: z
      .string()
      .trim()
      .max(300, 'Ringkasan artikel maksimal 300 karakter')
      .optional(),
    metaDescription: z
      .string()
      .trim()
      .max(160, 'Meta deskripsi maksimal 160 karakter')
      .optional(),
    authorName: z
      .string()
      .trim()
      .max(80, 'Nama penulis maksimal 80 karakter')
      .optional(),
    tags: tagsSchema,
  })
  .strict('Terdapat field yang tidak diizinkan pada pembaruan artikel');

const updatePostStatusSchema = z
  .object({
    status: z.enum(['draft', 'published'], {
      required_error: 'Status artikel wajib diisi (draft atau published)',
      errorMap: () => ({ message: 'Status artikel harus berupa draft atau published' }),
    }),
  })
  .strict('Terdapat field yang tidak diizinkan pada status artikel');

const publicPostQuerySchema = z
  .object({
    q: z.string().trim().max(100, 'Kata kunci pencarian maksimal 100 karakter').optional(),
    tag: z.string().trim().max(50, 'Filter tag maksimal 50 karakter').optional(),
    page: z.coerce
      .number({ invalid_type_error: 'page harus berupa angka' })
      .int('page harus berupa bilangan bulat')
      .min(1, 'page minimal 1')
      .default(1),
    limit: z.coerce
      .number({ invalid_type_error: 'limit harus berupa angka' })
      .int('limit harus berupa bilangan bulat')
      .min(1, 'limit minimal 1')
      .max(50, 'limit publik maksimal 50')
      .default(12),
    sort: z
      .enum(['terbaru', 'terlama'], {
        errorMap: () => ({ message: 'sort publik harus berupa "terbaru" atau "terlama"' }),
      })
      .default('terbaru'),
  })
  .strict('Parameter query tidak dikenal pada daftar artikel publik');

const adminPostQuerySchema = z
  .object({
    status: z
      .enum(['draft', 'published'], {
        errorMap: () => ({ message: 'status harus berupa draft atau published' }),
      })
      .optional(),
    tag: z.string().trim().max(50, 'Filter tag maksimal 50 karakter').optional(),
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
      .max(100, 'limit admin maksimal 100')
      .default(10),
    sort: z
      .enum(['terbaru', 'terlama', 'judul'], {
        errorMap: () => ({
          message: 'sort admin harus berupa "terbaru", "terlama", atau "judul"',
        }),
      })
      .default('terbaru'),
  })
  .strict('Parameter query tidak dikenal pada daftar artikel admin');

const postIdParamSchema = z
  .object({
    id: objectIdSchema,
  })
  .strict('Parameter URL tidak valid');

const contentImageParamSchema = z
  .object({
    id: objectIdSchema,
    imageId: objectIdSchema,
  })
  .strict('Parameter URL gambar tidak valid');

module.exports = {
  createPostSchema,
  updatePostSchema,
  updatePostStatusSchema,
  publicPostQuerySchema,
  adminPostQuerySchema,
  postIdParamSchema,
  contentImageParamSchema,
};

