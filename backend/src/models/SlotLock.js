const mongoose = require('mongoose');

const slotLockSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: [true, 'Tanggal wajib diisi'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['dekor', 'catering', 'wedding'],
      required: [true, 'Kategori wajib diisi'],
    },
    version: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

slotLockSchema.index({ date: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('SlotLock', slotLockSchema);

