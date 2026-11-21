const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    otpAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    otpExpiresAt: {
      type: Date,
      required: true,
    },
    otpVerifiedAt: {
      type: Date,
      default: null,
    },
    resetTokenHash: {
      type: String,
      default: null,
    },
    resetTokenExpiresAt: {
      type: Date,
      default: null,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    invalidatedAt: {
      type: Date,
      default: null,
    },
    purgeAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indeks komposit: pencarian riwayat permintaan terbaru per user
passwordResetSchema.index({ user: 1, createdAt: -1 });

// Indeks pencarian token reset (sparse agar dokumen tanpa token tidak diindeks)
passwordResetSchema.index({ resetTokenHash: 1 }, { sparse: true });

// Indeks TTL otomatis pada purgeAt
passwordResetSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);

