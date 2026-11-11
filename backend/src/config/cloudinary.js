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

/**
 * Unggah berkas gambar ke Cloudinary dengan tipe authenticated (penyimpanan privat)
 */
function uploadAuthenticatedStream(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'kalila/payment-proofs',
        type: 'authenticated',
        resource_type: 'image',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Hapus berkas authenticated dari Cloudinary
 */
async function destroyAuthenticatedAsset(publicId) {
  if (!publicId) return;
  return await cloudinary.uploader.destroy(publicId, { type: 'authenticated', resource_type: 'image' });
}

/**
 * Hasilkan signed URL berumur pendek (default 5 menit) untuk mengakses aset authenticated
 */
function generateSignedAuthenticatedUrl(publicId, options = {}) {
  const expiresAt = options.expiresAt || Math.floor(Date.now() / 1000) + 300; // 5 menit
  const format = options.format || 'jpg';
  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: 'image',
    type: 'authenticated',
    expires_at: expiresAt,
  });
}

module.exports = cloudinary;
module.exports.isCloudinaryConfigured = isCloudinaryConfigured;
module.exports.uploadAuthenticatedStream = uploadAuthenticatedStream;
module.exports.destroyAuthenticatedAsset = destroyAuthenticatedAsset;
module.exports.generateSignedAuthenticatedUrl = generateSignedAuthenticatedUrl;
