const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Referensi booking wajib diisi'],
    },
    type: {
      type: String,
      enum: {
        values: ['dp', 'pelunasan', 'pengembalian'],
        message: 'Tipe pembayaran harus berupa dp, pelunasan, atau pengembalian',
      },
      required: [true, 'Tipe pembayaran wajib diisi'],
    },
    amount: {
      type: Number,
      required: [true, 'Nominal pembayaran wajib diisi'],
      min: [0, 'Nominal pembayaran tidak boleh negatif'],
    },
    method: {
      type: String,
      enum: {
        values: ['transfer', 'qris', 'tunai', 'lainnya'],
        message: 'Metode pembayaran harus transfer, qris, tunai, atau lainnya',
      },
      required: [true, 'Metode pembayaran wajib diisi'],
    },
    proof: {
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
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'void'],
        message: 'Status pembayaran harus pending, approved, rejected, atau void',
      },
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
    voidReason: {
      type: String,
      default: '',
      trim: true,
    },
    voidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    voidedAt: {
      type: Date,
      default: null,
    },
    attempt: {
      type: Number,
      default: 1,
      min: 1,
    },
    source: {
      type: String,
      enum: {
        values: ['customer', 'manual'],
        message: 'Sumber pembayaran harus customer atau manual',
      },
      required: [true, 'Sumber pembayaran wajib diisi'],
    },
    paidAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ booking: 1, type: 1 });
paymentSchema.index({ status: 1, createdAt: 1 });
paymentSchema.index({ type: 1, status: 1, createdAt: -1 });
paymentSchema.index({ type: 1, status: 1, createdAt: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

