const mongoose = require('mongoose');

const emailOutboxSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'booking_created_admin',
        'booking_created_owner',
        'payment_proof_admin',
        'booking_confirmed_customer',
        'password_reset_otp',
      ],
    },
    dedupeKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    to: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    originalTo: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    html: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    replyTo: {
      type: String,
      trim: true,
      default: null,
    },
    priority: {
      type: Number,
      default: 1,
      index: true,
    },
    notAfter: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'sending', 'sent', 'failed', 'skipped'],
      default: 'pending',
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    nextAttemptAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    lastError: {
      type: String,
      maxlength: 300,
      default: null,
    },
    provider: {
      type: String,
      default: null,
    },
    providerMessageId: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    purgeAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indeks komposit untuk job queue polling
emailOutboxSchema.index({ status: 1, nextAttemptAt: 1 });
emailOutboxSchema.index({ status: 1, priority: 1, nextAttemptAt: 1, createdAt: 1 });
// Indeks relasi booking
emailOutboxSchema.index({ booking: 1 });
// Indeks TTL otomatis pada purgeAt saat sudah mencapai tanggal kedaluwarsa
emailOutboxSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('EmailOutbox', emailOutboxSchema);

