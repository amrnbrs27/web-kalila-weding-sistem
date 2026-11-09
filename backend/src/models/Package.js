const mongoose = require('mongoose');

const imageSubSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'URL gambar wajib diisi'],
      trim: true,
    },
    publicId: {
      type: String,
      required: [true, 'publicId gambar wajib diisi'],
      trim: true,
    },
  },
  { _id: true }
);

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nama paket wajib diisi'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug paket wajib diisi'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Kategori paket wajib diisi'],
      enum: {
        values: ['dekor', 'catering', 'wedding'],
        message: 'Kategori harus salah satu dari: dekor, catering, wedding',
      },
    },
    price: {
      type: Number,
      required: [true, 'Harga paket wajib diisi'],
      min: [0, 'Harga paket tidak boleh negatif'],
      validate: {
        validator: Number.isInteger,
        message: 'Harga paket harus berupa bilangan bulat',
      },
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    inclusions: {
      type: [String],
      default: [],
    },
    images: {
      type: [imageSubSchema],
      default: [],
      validate: [
        (val) => val.length <= 10,
        'Maksimal 10 gambar per paket',
      ],
    },
    decorWidthCm: {
      type: Number,
      min: [1, 'Lebar dekor minimal 1 cm'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index untuk performa pencarian katalog
packageSchema.index({ category: 1, isActive: 1 });
packageSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Package', packageSchema);
