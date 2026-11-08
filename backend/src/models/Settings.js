const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    whatsappNumber: {
      type: String,
      default: '081234567890',
      trim: true,
    },
    bankInfo: {
      bankName: { type: String, default: 'Bank Central Asia (BCA)', trim: true },
      accountNumber: { type: String, default: '1234567890', trim: true },
      accountHolder: { type: String, default: 'Kalila Wedding & Event', trim: true },
      qrisImage: { type: String, default: '', trim: true },
    },
    // Aturan Pembayaran DP
    dpAmount: {
      type: Number,
      default: 1000000, // Rp 1.000.000 flat
      min: [0, 'Nominal DP tidak boleh negatif'],
    },
    uploadDeadlineHours: {
      type: Number,
      default: 24, // Batas 24 jam unggah bukti
      min: [1, 'Batas waktu minimal 1 jam'],
    },
    maxRejectionCount: {
      type: Number,
      default: 3, // Maksimal 3 kali penolakan
      min: [1, 'Jumlah maksimal penolakan minimal 1'],
    },
    rejectionExtensionHours: {
      type: Number,
      default: 6, // Perpanjangan 6 jam jika ditolak
      min: [1, 'Waktu perpanjangan minimal 1 jam'],
    },
    // Batas maksimal acara per tanggal per kategori (pengaman kuota)
    maxEventsPerDay: {
      dekor: { type: Number, default: 2, min: 1 },
      catering: { type: Number, default: 2, min: 1 },
      wedding: { type: Number, default: 1, min: 1 },
    },
    // Profil Usaha & Kontak
    companyProfile: {
      name: { type: String, default: 'Kalila Wedding, Dekor & Catering', trim: true },
      tagline: { type: String, default: 'Mewujudkan Momen Bahagia Penuh Makna', trim: true },
      logo: { type: String, default: '', trim: true },
      address: { type: String, default: 'Indonesia', trim: true },
      email: { type: String, default: 'kalila.official@gmail.com', trim: true },
      instagram: { type: String, default: '@kalila.organizer', trim: true },
      tiktok: { type: String, default: '@kalila.organizer', trim: true },
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Helper static untuk mendapatkan dokumen settings tunggal (singleton)
 */
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
