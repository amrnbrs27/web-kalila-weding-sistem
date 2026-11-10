const { z } = require('zod');
const { isValidDate, isDateInPast } = require('../utils/dateUtils');
const { normalizePhoneNumber, isValidPhoneNumber } = require('../utils/phone');

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * Whitelist kunci formData:
 * dekor: decorArea
 * catering: servingTime
 * wedding: additionalNeeds
 */
const allowedFormDataKeys = ['decorArea', 'servingTime', 'additionalNeeds'];

const formDataSchema = z
  .record(z.any())
  .optional()
  .default({})
  .superRefine((data, ctx) => {
    if (!data || typeof data !== 'object') return;
    for (const key of Object.keys(data)) {
      if (!allowedFormDataKeys.includes(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Field "${key}" di dalam formData tidak diizinkan`,
          path: [key],
        });
      }
    }
  });

// Skema pemesanan pelanggan publik
const createBookingSchema = z
  .object({
    packageId: z
      .string({ required_error: 'ID Paket wajib diisi' })
      .regex(mongoIdRegex, 'ID Paket tidak valid'),
    eventDate: z
      .string({ required_error: 'Tanggal acara wajib diisi' })
      .refine(isValidDate, 'Format tanggal acara tidak valid kalender (harus YYYY-MM-DD)')
      .refine((val) => !isDateInPast(val), 'Tanggal acara tidak boleh tanggal lampau'),
    eventName: z
      .string({ required_error: 'Nama acara wajib diisi' })
      .trim()
      .min(3, 'Nama acara minimal 3 karakter')
      .max(120, 'Nama acara maksimal 120 karakter'),
    location: z
      .string({ required_error: 'Lokasi acara wajib diisi' })
      .trim()
      .min(3, 'Lokasi acara minimal 3 karakter')
      .max(300, 'Lokasi acara maksimal 300 karakter'),
    contactName: z.string().trim().min(2, 'Nama kontak minimal 2 karakter').max(100).optional(),
    contactPhone: z
      .string()
      .trim()
      .transform(normalizePhoneNumber)
      .refine(isValidPhoneNumber, 'Nomor telepon kontak tidak valid (harus nomor Indonesia)')
      .optional(),
    contactEmail: z.string().trim().email('Format email kontak tidak valid').toLowerCase().optional(),
    guestCount: z
      .number({ invalid_type_error: 'Jumlah tamu harus berupa angka' })
      .int('Jumlah tamu harus bilangan bulat')
      .min(1, 'Jumlah tamu minimal 1')
      .optional(),
    notes: z.string().trim().max(1000, 'Catatan maksimal 1000 karakter').optional(),
    formData: formDataSchema,
  })
  .strict('Field tidak dikenal pada form booking');

// Skema pemesanan manual admin
const createManualBookingSchema = z
  .object({
    packageId: z.string().regex(mongoIdRegex, 'ID Paket tidak valid').optional(),
    category: z.enum(['dekor', 'catering', 'wedding']).optional(), // Dipakai saat tanpa packageId (catering custom)
    packageSnapshot: z
      .object({
        name: z.string().trim().optional(),
        price: z.number().min(0).nullable().optional(),
      })
      .strict()
      .optional(),
    eventDate: z
      .string({ required_error: 'Tanggal acara wajib diisi' })
      .refine(isValidDate, 'Format tanggal acara tidak valid kalender (harus YYYY-MM-DD)')
      .refine((val) => !isDateInPast(val), 'Tanggal acara tidak boleh tanggal lampau'),
    eventName: z
      .string({ required_error: 'Nama acara wajib diisi' })
      .trim()
      .min(3, 'Nama acara minimal 3 karakter')
      .max(120, 'Nama acara maksimal 120 karakter'),
    location: z
      .string({ required_error: 'Lokasi acara wajib diisi' })
      .trim()
      .min(3, 'Lokasi acara minimal 3 karakter')
      .max(300, 'Lokasi acara maksimal 300 karakter'),
    customerId: z.string().regex(mongoIdRegex, 'ID Customer tidak valid').optional(),
    customer: z
      .object({
        name: z.string().trim().min(2, 'Nama pelanggan minimal 2 karakter'),
        phone: z
          .string()
          .trim()
          .transform(normalizePhoneNumber)
          .refine(isValidPhoneNumber, 'Nomor WhatsApp pelanggan tidak valid'),
        email: z.string().trim().email('Format email tidak valid').toLowerCase().optional(),
      })
      .strict()
      .optional(),
    contactName: z.string().trim().min(2).max(100).optional(),
    contactPhone: z
      .string()
      .trim()
      .transform(normalizePhoneNumber)
      .refine(isValidPhoneNumber)
      .optional(),
    contactEmail: z.string().trim().email().toLowerCase().optional(),
    guestCount: z.number().int().min(1).optional(),
    notes: z.string().trim().max(1000).optional(),
    formData: formDataSchema,
    dpPaid: z.boolean().default(false),
    dpMethod: z.enum(['transfer', 'qris', 'tunai', 'lainnya']).optional().default('tunai'),
    dpPaidAt: z.string().or(z.date()).optional(),
    dpNote: z.string().trim().optional(),
  })
  .strict('Field tidak dikenal pada form booking manual');

// Skema query pencarian booking admin
const adminBookingQuerySchema = z.object({
  category: z.enum(['dekor', 'catering', 'wedding']).optional(),
  status: z
    .enum([
      'menunggu_dp',
      'menunggu_verifikasi',
      'terkonfirmasi',
      'berlangsung',
      'selesai',
      'dibatalkan',
    ])
    .optional(),
  paymentStatus: z
    .enum(['belum_dp', 'menunggu_verifikasi', 'dp_dibayar', 'ditolak', 'lunas'])
    .optional(),
  source: z.enum(['website', 'manual']).optional(),
  dateFrom: z.string().refine(isValidDate, 'Format dateFrom tidak valid').optional(),
  dateTo: z.string().refine(isValidDate, 'Format dateTo tidak valid').optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(['terbaru', 'terlama', 'tanggal_acara_asc', 'tanggal_acara_desc']).default('terbaru'),
});

// Skema query pesanan pelanggan (/api/bookings/me)
const customerBookingQuerySchema = z.object({
  status: z
    .enum([
      'menunggu_dp',
      'menunggu_verifikasi',
      'terkonfirmasi',
      'berlangsung',
      'selesai',
      'dibatalkan',
    ])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// Skema pembaruan status admin
const updateBookingStatusSchema = z
  .object({
    status: z.enum([
      'menunggu_dp',
      'menunggu_verifikasi',
      'terkonfirmasi',
      'berlangsung',
      'selesai',
      'dibatalkan',
    ]),
    reason: z.string().trim().optional(),
    refundNote: z.string().trim().optional(),
  })
  .strict();

// Skema pencatatan pelunasan admin
const recordSettlementSchema = z
  .object({
    amount: z
      .number({ invalid_type_error: 'Nominal pelunasan harus angka' })
      .int('Nominal pelunasan harus bilangan bulat')
      .min(1, 'Nominal pelunasan minimal 1'),
    method: z.enum(['transfer', 'qris', 'tunai', 'lainnya'], {
      required_error: 'Metode pembayaran wajib diisi',
    }),
    paidAt: z
      .string()
      .or(z.date())
      .refine((val) => !isNaN(new Date(val).getTime()), 'Tanggal pembayaran tidak valid'),
    note: z.string().trim().optional(),
  })
  .strict();

module.exports = {
  createBookingSchema,
  createManualBookingSchema,
  adminBookingQuerySchema,
  customerBookingQuerySchema,
  updateBookingStatusSchema,
  recordSettlementSchema,
};

