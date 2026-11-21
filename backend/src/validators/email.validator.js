/**
 * Validator Zod untuk endpoint admin email
 */

const { z } = require('zod');

const emailQuerySchema = z
  .object({
    status: z
      .enum(['pending', 'sending', 'sent', 'failed', 'skipped'], {
        errorMap: () => ({ message: 'Status email tidak valid' }),
      })
      .optional(),
    type: z
      .enum(
        [
          'booking_created_admin',
          'booking_created_owner',
          'payment_proof_admin',
          'booking_confirmed_customer',
        ],
        {
          errorMap: () => ({ message: 'Tipe email tidak valid' }),
        }
      )
      .optional(),
    q: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sort: z.enum(['terbaru', 'terlama']).default('terbaru'),
  })
  .strict('Query parameter tidak dikenal');

const emailIdParamSchema = z
  .object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID email outbox tidak valid'),
  })
  .strict();

module.exports = {
  emailQuerySchema,
  emailIdParamSchema,
};

