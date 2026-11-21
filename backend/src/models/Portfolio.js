const mongoose = require('mongoose');

const portfolioImageSchema = new mongoose.Schema(
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

const portfolioSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Kategori portofolio wajib diisi'],
      enum: {
        values: ['dekor', 'catering', 'wedding'],
        message: 'Kategori harus salah satu dari: dekor, catering, wedding',
      },
    },
    title: {
      type: String,
      required: [true, 'Judul portofolio wajib diisi'],
      minlength: [3, 'Judul portofolio minimal 3 karakter'],
      maxlength: [120, 'Judul portofolio maksimal 120 karakter'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug portofolio wajib diisi'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: [2000, 'Deskripsi portofolio maksimal 2000 karakter'],
      trim: true,
      default: '',
    },
    eventDate: {
      type: String,
      trim: true,
      default: null,
    },
    location: {
      type: String,
      maxlength: [200, 'Lokasi portofolio maksimal 200 karakter'],
      trim: true,
      default: '',
    },
    images: {
      type: [portfolioImageSchema],
      default: [],
      validate: {
        validator: function (val) {
          return !val || val.length <= 12;
        },
        message: 'Maksimal 12 gambar per portofolio',
      },
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indeks sesuai kebutuhan PRD & performa pencarian
portfolioSchema.index({ category: 1, isPublished: 1, createdAt: -1 });
portfolioSchema.index({ isFeatured: 1, isPublished: 1 });

module.exports = mongoose.model('Portfolio', portfolioSchema);

