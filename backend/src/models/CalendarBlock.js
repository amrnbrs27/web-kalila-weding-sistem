const mongoose = require('mongoose');
const { isValidDate } = require('../utils/dateUtils');

const calendarBlockSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: [true, 'Tanggal wajib diisi'],
      validate: {
        validator: isValidDate,
        message: 'Format atau nilai tanggal tidak valid (harus YYYY-MM-DD)',
      },
    },
    category: {
      type: String,
      required: [true, 'Kategori wajib diisi'],
      enum: {
        values: ['dekor', 'catering', 'wedding'],
        message: 'Kategori harus berupa dekor, catering, atau wedding',
      },
    },
    reason: {
      type: String,
      maxlength: [200, 'Alasan maksimal 200 karakter'],
      default: '',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

calendarBlockSchema.index({ date: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('CalendarBlock', calendarBlockSchema);

