const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'main',
      unique: true,
      immutable: true,
    },
    businessName: {
      type: String,
      default: 'Kalila Wedding, Dekor & Catering',
      trim: true,
    },
    adminWhatsapp: {
      type: String,
      default: '6281234567890',
      trim: true,
    },
    dpAmount: {
      type: Number,
      default: 1000000,
      min: [0, 'Nominal DP tidak boleh kurang dari 0'],
    },
    paymentDeadlineHours: {
      type: Number,
      default: 24,
      min: [1, 'Batas waktu pembayaran minimal 1 jam'],
    },
    maxProofAttempts: {
      type: Number,
      default: 3,
      min: [1, 'Maksimal percobaan unggah bukti minimal 1 kali'],
    },
    rejectionExtensionHours: {
      type: Number,
      default: 6,
      min: [0, 'Perpanjangan waktu penolakan tidak boleh negatif'],
    },
    maxEventsPerDay: {
      dekor: {
        type: Number,
        default: null,
      },
      catering: {
        type: Number,
        default: null,
      },
      wedding: {
        type: Number,
        default: null,
      },
    },
    bankName: {
      type: String,
      default: 'Bank Central Asia (BCA)',
      trim: true,
    },
    accountNumber: {
      type: String,
      default: '1234567890',
      trim: true,
    },
    accountHolder: {
      type: String,
      default: 'Kalila Wedding & Event',
      trim: true,
    },
    qrisImage: {
      url: {
        type: String,
        default: '',
        trim: true,
      },
      publicId: {
        type: String,
        default: '',
        trim: true,
      },
    },
    kontak: {
      email: {
        type: String,
        default: 'kalila.official@gmail.com',
        trim: true,
      },
      phone: {
        type: String,
        default: '081234567890',
        trim: true,
      },
      address: {
        type: String,
        default: 'Indonesia',
        trim: true,
      },
      instagram: {
        type: String,
        default: '@kalila.organizer',
        trim: true,
      },
      facebook: {
        type: String,
        default: '',
        trim: true,
      },
      tiktok: {
        type: String,
        default: '@kalila.organizer',
        trim: true,
      },
    },
    notificationRecipients: {
      adminEmails: {
        type: [String],
        default: [],
      },
      ownerEmails: {
        type: [String],
        default: [],
      },
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Helper static untuk mendapatkan dokumen settings singleton
 */
settingSchema.statics.getSettings = async function (options = {}) {
  let settings = await this.findOne({ key: 'main' }, null, options);
  if (!settings) {
    settings = await this.findOneAndUpdate(
      { key: 'main' },
      { $setOnInsert: { key: 'main' } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, ...options }
    );
  }
  return settings;
};

module.exports = mongoose.model('Setting', settingSchema);
