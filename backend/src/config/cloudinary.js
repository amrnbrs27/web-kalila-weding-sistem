const cloudinary = require('cloudinary').v2;

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn(
    '[Peringatan] Kredensial Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) belum dikonfigurasi di .env. Fitur upload dan hapus gambar dinonaktifkan.'
  );
}

function isCloudinaryConfigured() {
  return isConfigured;
}

module.exports = cloudinary;
module.exports.isCloudinaryConfigured = isCloudinaryConfigured;
