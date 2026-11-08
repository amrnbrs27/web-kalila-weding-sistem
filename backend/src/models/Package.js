const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nama paket wajib diisi'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Kategori paket wajib diisi'],
      enum: {
        values: ['dekor', 'catering', 'wedding'],
        message: 'Kategori harus salah satu dari: dekor, catering, wedding',
      },
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Harga paket wajib diisi'],
      min: [0, 'Harga paket tidak boleh negatif'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    packageItems: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    // Khusus dekor: lebar dekor (dalam meter) sebagai batas kanvas Self Design
    decorWidth: {
      type: Number,
      min: [0, 'Lebar dekor harus berupa angka positif'],
    },
    cateringDetails: {
      minOrder: { type: Number, default: 0 },
      menuType: { type: String, default: '' },
      notes: { type: String, default: '' },
    },
    weddingDetails: {
      guestCapacity: { type: Number, default: 0 },
      includedServices: { type: [String], default: [] },
      notes: { type: String, default: '' },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

packageSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Package', packageSchema);

