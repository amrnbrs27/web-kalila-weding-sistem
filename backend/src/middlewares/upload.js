const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');

// Memory storage: buffer disimpan di memori, tidak pernah disimpan ke disk
const storage = multer.memoryStorage();

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 5, // Maksimal 5 file per upload
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(
        new AppError(
          'Format file tidak didukung. Hanya file JPG, PNG, atau WEBP yang diperbolehkan',
          400
        ),
        false
      );
    }
    cb(null, true);
  },
});

/**
 * Memeriksa magic bytes pada Buffer untuk memastikan file benar-benar gambar asli
 * JPEG: FF D8 FF
 * PNG: 89 50 4E 47 0D 0A 1A 0A
 * WEBP: byte 0-3 'RIFF' dan byte 8-11 'WEBP'
 */
function detectImageMimeType(buffer) {
  if (!buffer || buffer.length < 12) return null;

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WEBP
  const isRiff =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46; // 'RIFF'
  const isWebp =
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50; // 'WEBP'
  if (isRiff && isWebp) {
    return 'image/webp';
  }

  return null;
}

/**
 * Middleware untuk upload gambar paket (1 - 5 file form-data dengan nama field 'images')
 * Memeriksa ukuran file dan magic bytes isi file
 */
const uploadPackageImagesMiddleware = (req, res, next) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('Ukuran file maksimal 5 MB per gambar', 400));
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
        return next(new AppError('Maksimal 5 gambar dalam sekali unggah (field: images)', 400));
      }
      return next(err);
    }

    if (!req.files || req.files.length === 0) {
      return next(new AppError('Silakan pilih 1 sampai 5 file gambar untuk diunggah (field: images)', 400));
    }

    // Validasi magic bytes untuk setiap file
    for (const file of req.files) {
      const detected = detectImageMimeType(file.buffer);
      if (!detected) {
        return next(
          new AppError(
            `File "${file.originalname}" bukan gambar yang valid (isi file tidak sesuai format JPG, PNG, atau WEBP)`,
            400
          )
        );
      }
    }

    next();
  });
};

// Rate limiting untuk endpoint upload (aturan keamanan)
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

/**
 * Middleware untuk upload satu gambar (field: fieldName, default 'image')
 * Memeriksa ukuran file (maks 5 MB) dan magic bytes isi file
 */
const uploadSingleImageMiddleware = (fieldName = 'image') => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('Ukuran file maksimal 5 MB', 400));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new AppError(`Field unggah tidak sesuai (gunakan field: ${fieldName})`, 400));
        }
        return next(err);
      }

      if (!req.file) {
        return next(new AppError(`Silakan pilih file gambar untuk diunggah (field: ${fieldName})`, 400));
      }

      // Validasi magic bytes
      const detected = detectImageMimeType(req.file.buffer);
      if (!detected) {
        return next(
          new AppError(
            `File "${req.file.originalname}" bukan gambar yang valid (isi file tidak sesuai format JPG, PNG, atau WEBP)`,
            400
          )
        );
      }

      next();
    });
  };
};

// Middleware khusus untuk upload bukti transfer (field 'proof')
const uploadProofMiddleware = uploadSingleImageMiddleware('proof');

module.exports = {
  uploadPackageImagesMiddleware,
  uploadImagesMiddleware: uploadPackageImagesMiddleware, // alias serbaguna
  uploadSingleImageMiddleware,
  uploadProofMiddleware,
  uploadRateLimiter,
  detectImageMimeType,
};
