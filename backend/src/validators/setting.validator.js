const { z } = require('zod');

/**
 * Normalisasi nomor WhatsApp:
 * Mengubah format "08...", "+628...", atau "628..." menjadi "628..." (tanpa tanda plus atau awalan 0)
 */
function normalizeWhatsapp(val) {
  if (typeof val !== 'string') return val;
  const digitsOnly = val.replace(/\D/g, '');
  if (digitsOnly.startsWith('0')) {
    return '62' + digitsOnly.slice(1);
  }
  return digitsOnly;
}

const updateSettingSchema = z
  .object({
    businessName: z.string().trim().min(1, 'Nama usaha tidak boleh kosong').optional(),
    adminWhatsapp: z
      .string()
      .trim()
      .transform(normalizeWhatsapp)
      .refine(
        (val) => /^628[1-9][0-9]{7,11}$/.test(val),
        'Nomor WhatsApp admin tidak valid (harus nomor Indonesia yang valid, contoh: 08123456789 atau 628123456789)'
      )
      .optional(),
    dpAmount: z
      .number({ invalid_type_error: 'Nominal DP harus berupa angka' })
      .int('Nominal DP harus berupa bilangan bulat')
      .min(0, 'Nominal DP tidak boleh kurang dari 0')
      .optional(),
    paymentDeadlineHours: z
      .number({ invalid_type_error: 'Batas waktu pembayaran harus berupa angka' })
      .int('Batas waktu pembayaran harus berupa bilangan bulat')
      .min(1, 'Batas waktu pembayaran minimal 1 jam')
      .optional(),
    maxProofAttempts: z
      .number({ invalid_type_error: 'Maksimal percobaan unggah harus berupa angka' })
      .int('Maksimal percobaan unggah harus berupa bilangan bulat')
      .min(1, 'Maksimal percobaan unggah bukti minimal 1 kali')
      .optional(),
    rejectionExtensionHours: z
      .number({ invalid_type_error: 'Perpanjangan waktu penolakan harus berupa angka' })
      .int('Perpanjangan waktu penolakan harus berupa bilangan bulat')
      .min(0, 'Perpanjangan waktu penolakan tidak boleh kurang dari 0')
      .optional(),
    maxEventsPerDay: z
      .object({
        dekor: z
          .number({ invalid_type_error: 'Batas acara dekor harus berupa angka atau null' })
          .int('Batas acara dekor harus berupa bilangan bulat')
          .min(1, 'Batas acara dekor minimal 1')
          .nullable()
          .optional(),
        catering: z
          .number({ invalid_type_error: 'Batas acara catering harus berupa angka atau null' })
          .int('Batas acara catering harus berupa bilangan bulat')
          .min(1, 'Batas acara catering minimal 1')
          .nullable()
          .optional(),
        wedding: z
          .number({ invalid_type_error: 'Batas acara wedding harus berupa angka atau null' })
          .int('Batas acara wedding harus berupa bilangan bulat')
          .min(1, 'Batas acara wedding minimal 1')
          .nullable()
          .optional(),
      })
      .strict('Field di dalam maxEventsPerDay tidak dikenal')
      .optional(),
    bankName: z.string().trim().optional(),
    accountNumber: z.string().trim().optional(),
    accountHolder: z.string().trim().optional(),
    kontak: z
      .object({
        email: z.string().trim().email('Format email kontak tidak valid').or(z.literal('')).optional(),
        phone: z.string().trim().optional(),
        address: z.string().trim().optional(),
        instagram: z.string().trim().optional(),
        facebook: z.string().trim().optional(),
        tiktok: z.string().trim().optional(),
      })
      .strict('Field di dalam kontak tidak dikenal')
      .optional(),
  })
  .strict('Field pengaturan tidak dikenal');

module.exports = {
  updateSettingSchema,
  normalizeWhatsapp,
};

