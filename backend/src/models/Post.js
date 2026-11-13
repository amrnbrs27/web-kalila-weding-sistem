const mongoose = require('mongoose');
const {
  sanitizePlainText,
  htmlToPlainText,
  countWords,
  buildExcerpt,
} = require('../services/htmlSanitizer');

const postImageSchema = new mongoose.Schema(
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

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Judul artikel wajib diisi'],
      minlength: [3, 'Judul artikel minimal 3 karakter'],
      maxlength: [150, 'Judul artikel maksimal 150 karakter'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug artikel wajib diisi'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    excerpt: {
      type: String,
      maxlength: [300, 'Ringkasan artikel maksimal 300 karakter'],
      trim: true,
      default: '',
    },
    content: {
      type: String,
      required: [true, 'Isi artikel wajib diisi'],
      trim: true,
    },
    coverImage: {
      type: {
        url: { type: String, required: true, trim: true },
        publicId: { type: String, required: true, trim: true },
      },
      default: null,
    },
    contentImages: {
      type: [postImageSchema],
      default: [],
      validate: {
        validator: function (val) {
          return !val || val.length <= 30;
        },
        message: 'Maksimal 30 gambar isi per artikel',
      },
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (val) {
          if (!val) return true;
          if (val.length > 5) return false;
          const set = new Set(val);
          return set.size === val.length;
        },
        message: 'Maksimal 5 tag per artikel dan tidak boleh duplikat',
      },
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta deskripsi maksimal 160 karakter'],
      trim: true,
      default: '',
    },
    authorName: {
      type: String,
      maxlength: [80, 'Nama penulis maksimal 80 karakter'],
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'published'],
        message: 'Status artikel harus berupa draft atau published',
      },
      default: 'draft',
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    readingTimeMinutes: {
      type: Number,
      default: 1,
      min: 1,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indeks sesuai spesifikasi PRD & query artikel
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ tags: 1 });

// Hook pre-save Mongoose 9 (async tanpa parameter next)
postSchema.pre('save', async function () {
  // Bersihkan field teks biasa dari tag HTML
  if (this.title) {
    this.title = sanitizePlainText(this.title);
  }
  if (this.metaDescription) {
    this.metaDescription = sanitizePlainText(this.metaDescription);
  }
  if (this.authorName) {
    this.authorName = sanitizePlainText(this.authorName);
  }
  if (this.tags && Array.isArray(this.tags)) {
    this.tags = this.tags.map((t) => sanitizePlainText(t).toLowerCase().trim());
  }

  // Hitung readingTimeMinutes dari teks polos isi (200 kata/menit, minimal 1)
  const plainText = htmlToPlainText(this.content || '');
  const words = countWords(plainText);
  this.readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  // Excerpt otomatis jika kosong
  if (!this.excerpt || !this.excerpt.trim()) {
    this.excerpt = buildExcerpt(plainText, 200);
  } else {
    this.excerpt = sanitizePlainText(this.excerpt);
  }
});

module.exports = mongoose.model('Post', postSchema);

