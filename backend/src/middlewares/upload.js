const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');

// Memory storage agar file buffer mudah diteruskan ke Cloudinary atau file system
const storage = multer.memoryStorage();

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(ext)) {
    return cb(
      new AppError(
        'Format file tidak didukung. Hanya file JPG, PNG, atau WEBP yang diperbolehkan',
        400
      ),
      false
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Maksimal 5 MB
  },
  fileFilter,
});

// Rate limiting untuk endpoint upload (aturan keamanan AGENTS.md)
const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 30, // Maksimal 30 request upload per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan upload dari alamat IP ini, silakan coba lagi nanti',
  },
});

module.exports = {
  uploadSingle: upload.single('image'),
  uploadMultiple: upload.array('images', 5), // Maksimal 5 gambar per upload
  uploadRateLimiter,
};

