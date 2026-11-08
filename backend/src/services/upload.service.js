const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const AppError = require('../utils/AppError');

// Inisialisasi Cloudinary jika credentials tersedia di env
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload single image buffer to Cloudinary or local disk fallback
 * @param {Buffer} buffer - File buffer dari Multer
 * @param {string} originalName - Nama asli file
 * @param {string} folder - Folder tujuan (misal 'packages')
 * @returns {Promise<string>} URL gambar hasil upload
 */
async function uploadImage(buffer, originalName, folder = 'packages') {
  if (!buffer || buffer.length === 0) {
    throw new AppError('File gambar kosong atau tidak ditemukan', 400);
  }

  // Jika Cloudinary terkonfigurasi, gunakan Cloudinary
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `kalila/${folder}`,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        },
        (error, result) => {
          if (error) {
            return reject(new AppError(`Gagal mengunggah gambar ke Cloudinary: ${error.message}`, 500));
          }
          resolve(result.secure_url);
        }
      );

      uploadStream.end(buffer);
    });
  }

  // Fallback: simpan di local uploads directory
  const uploadDir = path.join(__dirname, `../../uploads/${folder}`);
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const ext = path.extname(originalName).toLowerCase() || '.jpg';
  const cleanExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${cleanExt}`;
  const filePath = path.join(uploadDir, filename);

  await fs.promises.writeFile(filePath, buffer);

  return `/uploads/${folder}/${filename}`;
}

module.exports = {
  uploadImage,
  isCloudinaryConfigured,
};

