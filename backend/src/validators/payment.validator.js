const { z } = require('zod');
const { isValidDate } = require('../utils/dateUtils');

const adminPaymentQuerySchema = z
  .object({
    status: z.enum(['pending', 'approved', 'rejected', 'void']).optional(),
    type: z.enum(['dp', 'pelunasan', 'pengembalian']).optional(),
    source: z.enum(['customer', 'manual']).optional(),
    dateFrom: z.string().refine(isValidDate, 'Format dateFrom tidak valid').optional(),
    dateTo: z.string().refine(isValidDate, 'Format dateTo tidak valid').optional(),
    q: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sort: z.enum(['terbaru', 'terlama']).optional(),
  })
  .strict('Query parameter tidak valid');

const rejectPaymentSchema = z
  .object({
    reason: z
      .string({ required_error: 'Alasan penolakan wajib diisi' })
      .trim()
      .min(3, 'Alasan penolakan minimal 3 karakter')
      .max(300, 'Alasan penolakan maksimal 300 karakter'),
  })
  .strict('Field tidak dikenal pada penolakan pembayaran');

const voidPaymentSchema = z
  .object({
    reason: z
      .string({ required_error: 'Alasan void wajib diisi' })
      .trim()
      .min(3, 'Alasan void minimal 3 karakter')
      .max(300, 'Alasan void maksimal 300 karakter'),
  })
  .strict('Field tidak dikenal pada void pembayaran');

const updateBookingTotalPriceSchema = z
  .object({
    totalPrice: z
      .number({ required_error: 'Total harga wajib diisi' })
      .int('Total harga harus berupa bilangan bulat')
      .min(0, 'Total harga tidak boleh negatif'),
    reason: z.string().trim().max(300, 'Alasan maksimal 300 karakter').optional(),
  })
  .strict('Field tidak dikenal pada pembaruan total harga');

const recordRefundSchema = z
  .object({
    amount: z
      .number({ required_error: 'Nominal pengembalian dana wajib diisi' })
      .int('Nominal pengembalian harus berupa bilangan bulat')
      .min(1, 'Nominal pengembalian minimal Rp1'),
    method: z.enum(['transfer', 'qris', 'tunai', 'lainnya']).default('transfer'),
    paidAt: z.string().or(z.date()).optional(),
    note: z.string().trim().max(500, 'Catatan maksimal 500 karakter').optional(),
  })
  .strict('Field tidak dikenal pada pencatatan pengembalian dana');

const recordSettlementSchema = z
  .object({
    amount: z
      .number({ invalid_type_error: 'Nominal pelunasan harus angka' })
      .int('Nominal pelunasan harus berupa bilangan bulat')
      .min(0, 'Nominal pelunasan tidak boleh negatif')
      .optional(),
    method: z.enum(['transfer', 'qris', 'tunai', 'lainnya']).default('transfer'),
    paidAt: z.string().or(z.date()).optional(),
    note: z.string().trim().max(500, 'Catatan maksimal 500 karakter').optional(),
  })
  .strict('Field tidak dikenal pada pencatatan pelunasan');

module.exports = {
  adminPaymentQuerySchema,
  rejectPaymentSchema,
  voidPaymentSchema,
  updateBookingTotalPriceSchema,
  recordRefundSchema,
  recordSettlementSchema,
};

