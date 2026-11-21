const mongoose = require('mongoose');
const crypto = require('crypto');
const { isValidDate, getTodayWIB } = require('../utils/dateUtils');

// Alfabet aman tanpa karakter ambigu (tanpa 0, O, 1, I)
const SAFE_BOOKING_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateRandomSuffix(length = 4) {
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += SAFE_BOOKING_ALPHABET[bytes[i] % SAFE_BOOKING_ALPHABET.length];
  }
  return result;
}

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    customerSnapshot: {
      name: {
        type: String,
        required: [true, 'Nama pelanggan wajib diisi'],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, 'Nomor telepon pelanggan wajib diisi'],
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        default: '',
      },
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      default: null, // Opsional untuk pesanan manual catering custom
    },
    packageSnapshot: {
      name: {
        type: String,
        required: [true, 'Nama paket wajib diisi'],
        trim: true,
      },
      price: {
        type: Number,
        min: 0,
        default: null, // Boleh null/kosong untuk pesanan catering custom
      },
      category: {
        type: String,
        required: true,
        enum: ['dekor', 'catering', 'wedding'],
      },
    },
    category: {
      type: String,
      required: [true, 'Kategori pesanan wajib diisi'],
      enum: {
        values: ['dekor', 'catering', 'wedding'],
        message: 'Kategori pesanan harus berupa dekor, catering, atau wedding',
      },
    },
    eventDate: {
      type: String,
      required: [true, 'Tanggal acara wajib diisi'],
      validate: {
        validator: isValidDate,
        message: 'Format tanggal acara tidak valid (harus YYYY-MM-DD)',
      },
    },
    eventName: {
      type: String,
      required: [true, 'Nama acara wajib diisi'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Lokasi acara wajib diisi'],
      trim: true,
    },
    guestCount: {
      type: Number,
      min: [1, 'Jumlah tamu minimal 1'],
      default: null,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    formData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    source: {
      type: String,
      enum: ['website', 'manual'],
      default: 'website',
    },
    status: {
      type: String,
      enum: [
        'menunggu_dp',
        'menunggu_verifikasi',
        'terkonfirmasi',
        'berlangsung',
        'selesai',
        'dibatalkan',
      ],
      default: 'menunggu_dp',
    },
    paymentStatus: {
      type: String,
      enum: ['belum_dp', 'menunggu_verifikasi', 'dp_dibayar', 'ditolak', 'lunas'],
      default: 'belum_dp',
    },
    dpAmount: {
      type: Number,
      required: [true, 'Nominal DP wajib dicatat'],
      min: [0, 'Nominal DP tidak boleh negatif'],
      default: 1000000,
    },
    totalPrice: {
      type: Number,
      min: [0, 'Total harga tidak boleh negatif'],
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    proofAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        note: { type: String, default: '' },
      },
    ],
    cancelReason: {
      type: String,
      default: '',
      trim: true,
    },
    refundNote: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indeks untuk pencarian dan ketersediaan slot yang optimal
bookingSchema.index({ eventDate: 1, category: 1, status: 1 });
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ status: 1, expiresAt: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ category: 1, createdAt: -1 });

/**
 * Generator nomor booking otomatis sebelum disimpan (Mongoose 9: async function tanpa parameter next)
 */
bookingSchema.pre('save', async function () {
  if (!this.bookingNumber) {
    const dateFormatted = (this.eventDate || getTodayWIB()).replace(/-/g, '');
    let unique = false;
    let attempts = 0;

    while (!unique && attempts < 10) {
      attempts++;
      const randomSuffix = generateRandomSuffix(4);
      const candidate = `KLA-${dateFormatted}-${randomSuffix}`;
      const existing = await this.constructor.findOne({ bookingNumber: candidate });
      if (!existing) {
        this.bookingNumber = candidate;
        unique = true;
      }
    }

    if (!this.bookingNumber) {
      this.bookingNumber = `KLA-${dateFormatted}-${Date.now().toString().slice(-4)}`;
    }
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.SAFE_BOOKING_ALPHABET = SAFE_BOOKING_ALPHABET;
module.exports.generateRandomSuffix = generateRandomSuffix;
