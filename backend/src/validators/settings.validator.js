const { z } = require('zod');

exports.updateSettingsSchema = z.object({
  whatsappNumber: z.string().min(9, 'Nomor WhatsApp minimal 9 digit').optional(),
  bankInfo: z
    .object({
      bankName: z.string().min(2, 'Nama bank minimal 2 karakter').optional(),
      accountNumber: z.string().min(4, 'Nomor rekening minimal 4 karakter').optional(),
      accountHolder: z.string().min(2, 'Atas nama rekening minimal 2 karakter').optional(),
      qrisImage: z.string().optional(),
    })
    .optional(),
  dpAmount: z.coerce.number().min(0, 'Nominal DP tidak boleh negatif').optional(),
  uploadDeadlineHours: z.coerce.number().min(1, 'Batas waktu minimal 1 jam').optional(),
  maxRejectionCount: z.coerce.number().min(1, 'Jumlah maksimal penolakan minimal 1').optional(),
  rejectionExtensionHours: z.coerce.number().min(1, 'Waktu perpanjangan minimal 1 jam').optional(),
  maxEventsPerDay: z
    .object({
      dekor: z.coerce.number().min(1, 'Maksimal acara dekor minimal 1').optional(),
      catering: z.coerce.number().min(1, 'Maksimal acara catering minimal 1').optional(),
      wedding: z.coerce.number().min(1, 'Maksimal acara wedding minimal 1').optional(),
    })
    .optional(),
  companyProfile: z
    .object({
      name: z.string().min(2, 'Nama usaha minimal 2 karakter').optional(),
      tagline: z.string().optional(),
      logo: z.string().optional(),
      address: z.string().optional(),
      email: z.string().email('Email tidak valid').optional(),
      instagram: z.string().optional(),
      tiktok: z.string().optional(),
    })
    .optional(),
});
