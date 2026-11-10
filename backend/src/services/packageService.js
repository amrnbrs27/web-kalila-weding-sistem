const slugify = require('slugify');
const Package = require('../models/Package');
const cloudinary = require('../config/cloudinary');
const { isCloudinaryConfigured } = require('../config/cloudinary');
const AppError = require('../utils/AppError');

/**
 * Escape karakter khusus regex untuk pencarian yang aman dari Regex Injection
 */
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Membuat slug unik dari nama paket
 * Jika terjadi bentrok, tambahkan akhiran angka (-2, -3, dst)
 */
async function generateUniqueSlug(name, excludeId = null) {
  const baseSlug = slugify(name, { lower: true, strict: true }) || 'paket';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existing = await Package.findOne(query).select('_id');
    if (!existing) {
      return slug;
    }
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
}

/**
 * Format data paket untuk respons publik (menghilangkan publicId Cloudinary)
 */
function formatPublicPackage(pkg) {
  if (!pkg) return null;
  const obj = pkg.toObject ? pkg.toObject() : { ...pkg };
  if (obj.images && Array.isArray(obj.images)) {
    obj.images = obj.images.map((img) => ({
      _id: img._id,
      url: img.url,
    }));
  }
  return obj;
}

/**
 * Upload single image buffer to Cloudinary
 */
function uploadToCloudinary(buffer, category) {
  if (!isCloudinaryConfigured()) {
    throw new AppError('Layanan penyimpanan gambar belum dikonfigurasi', 503);
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `kalila/packages/${category}`,
        quality: 'auto',
        fetch_format: 'auto',
        width: 1600,
        crop: 'limit',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(new AppError(`Gagal mengunggah ke Cloudinary: ${error.message}`, 500));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Menghapus file gambar dari Cloudinary
 */
async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  if (!isCloudinaryConfigured()) {
    throw new AppError('Layanan penyimpanan gambar belum dikonfigurasi', 503);
  }
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error(`[Cloudinary Error] Gagal menghapus aset (${publicId}):`, err.message);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// METODE PUBLIK
// -----------------------------------------------------------------------------

/**
 * Mengambil daftar paket aktif untuk publik
 */
async function getPublicPackages(query = {}) {
  const { category, q, page = 1, limit = 12, sort = 'terbaru' } = query;

  const filter = { isActive: true };

  if (category) {
    filter.category = category;
  }

  if (q && q.trim()) {
    const escapedQ = escapeRegex(q.trim());
    filter.name = { $regex: escapedQ, $options: 'i' };
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'harga_asc') sortOption = { price: 1 };
  else if (sort === 'harga_desc') sortOption = { price: -1 };

  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedLimit = Math.max(1, Math.min(50, Number(limit) || 12));
  const skip = (parsedPage - 1) * parsedLimit;

  const [packages, total] = await Promise.all([
    Package.find(filter).sort(sortOption).skip(skip).limit(parsedLimit),
    Package.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / parsedLimit) || 1;

  return {
    items: packages.map(formatPublicPackage),
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages,
    },
  };
}

/**
 * Mengambil detail paket aktif berdasarkan slug
 */
async function getPublicPackageBySlug(slug) {
  const pkg = await Package.findOne({ slug, isActive: true });
  if (!pkg) {
    throw new AppError('Paket tidak ditemukan atau sudah tidak aktif', 404);
  }
  return formatPublicPackage(pkg);
}

// -----------------------------------------------------------------------------
// METODE ADMIN
// -----------------------------------------------------------------------------

/**
 * Mengambil semua paket untuk admin (termasuk nonaktif)
 */
async function getAdminPackages(query = {}) {
  const { category, isActive, q, page = 1, limit = 12, sort = 'terbaru' } = query;

  const filter = {};

  if (category) {
    filter.category = category;
  }

  if (isActive === 'true') {
    filter.isActive = true;
  } else if (isActive === 'false') {
    filter.isActive = false;
  }

  if (q && q.trim()) {
    const escapedQ = escapeRegex(q.trim());
    filter.name = { $regex: escapedQ, $options: 'i' };
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'terlama') sortOption = { createdAt: 1 };
  else if (sort === 'harga_asc') sortOption = { price: 1 };
  else if (sort === 'harga_desc') sortOption = { price: -1 };

  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 12));
  const skip = (parsedPage - 1) * parsedLimit;

  const [packages, total] = await Promise.all([
    Package.find(filter).sort(sortOption).skip(skip).limit(parsedLimit),
    Package.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / parsedLimit) || 1;

  return {
    items: packages,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages,
    },
  };
}

/**
 * Mengambil detail paket admin berdasarkan ID
 */
async function getAdminPackageById(id) {
  const pkg = await Package.findById(id);
  if (!pkg) {
    throw new AppError('Paket tidak ditemukan', 404);
  }
  return pkg;
}

/**
 * Membuat paket baru dengan penanganan collision slug E11000 retry
 */
async function createPackage(data) {
  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    attempt++;
    const slug = await generateUniqueSlug(data.name);

    try {
      const pkg = await Package.create({
        ...data,
        slug,
        images: [],
      });
      return pkg;
    } catch (err) {
      // Jika terjadi error indeks duplikat E11000 pada slug, lakukan retry
      if (err.code === 11000 && err.keyPattern && err.keyPattern.slug && attempt < maxAttempts) {
        continue;
      }
      throw err;
    }
  }
}

/**
 * Memperbarui data paket
 */
async function updatePackage(id, data) {
  const pkg = await Package.findById(id);
  if (!pkg) {
    throw new AppError('Paket tidak ditemukan', 404);
  }

  // Jika kategori diubah, cek apakah paket sudah memiliki gambar
  if (data.category && data.category !== pkg.category) {
    if (pkg.images && pkg.images.length > 0) {
      throw new AppError(
        'Kategori paket tidak dapat diubah karena paket sudah memiliki gambar yang tersimpan di folder Cloudinary kategori terkait',
        400
      );
    }
  }

  // Tentukan kategori akhir setelah pembaruan
  const finalCategory = data.category || pkg.category;

  // Validasi decorWidthCm terhadap kategori akhir
  if (finalCategory === 'dekor') {
    const finalWidth = data.decorWidthCm !== undefined ? data.decorWidthCm : pkg.decorWidthCm;
    if (!finalWidth || finalWidth <= 0) {
      throw new AppError('Lebar dekor (decorWidthCm) wajib diisi untuk kategori dekor', 400);
    }
    pkg.decorWidthCm = finalWidth;
  } else {
    // Kategori selain dekor tidak boleh memiliki decorWidthCm
    if (data.decorWidthCm !== undefined && data.decorWidthCm !== null) {
      throw new AppError('Lebar dekor (decorWidthCm) tidak boleh diisi untuk kategori selain dekor', 400);
    }
    pkg.decorWidthCm = undefined;
  }

  // Jika nama berubah, buat ulang slug
  if (data.name && data.name.trim() !== pkg.name) {
    pkg.name = data.name.trim();
    pkg.slug = await generateUniqueSlug(pkg.name, pkg._id);
  }

  if (data.category) pkg.category = data.category;
  if (data.price !== undefined) pkg.price = data.price;
  if (data.description !== undefined) pkg.description = data.description;
  if (data.inclusions !== undefined) pkg.inclusions = data.inclusions;
  if (data.isActive !== undefined) pkg.isActive = data.isActive;

  // Simpan dengan penanganan bentrok slug
  let attempt = 0;
  const maxAttempts = 3;
  while (attempt < maxAttempts) {
    attempt++;
    try {
      await pkg.save();
      return pkg;
    } catch (err) {
      if (err.code === 11000 && err.keyPattern && err.keyPattern.slug && attempt < maxAttempts) {
        pkg.slug = await generateUniqueSlug(pkg.name, pkg._id);
        continue;
      }
      throw err;
    }
  }
}

/**
 * Mengubah status aktif paket
 */
async function updatePackageStatus(id, isActive) {
  const pkg = await Package.findById(id);
  if (!pkg) {
    throw new AppError('Paket tidak ditemukan', 404);
  }

  pkg.isActive = isActive;
  await pkg.save();
  return pkg;
}

/**
 * Menghapus paket beserta seluruh gambarnya di Cloudinary
 * Menghindari gambar yatim di Cloudinary
 */
async function deletePackage(id) {
  const pkg = await Package.findById(id);
  if (!pkg) {
    throw new AppError('Paket tidak ditemukan', 404);
  }

  // TODO: Nanti harus ditolak bila paket sudah dipakai booking.

  const imagesToDelete = [...(pkg.images || [])];

  // 1. Hapus dokumen dari MongoDB terlebih dahulu
  await Package.findByIdAndDelete(id);

  // 2. Jika dokumen berhasil dihapus, bersihkan semua gambar dari Cloudinary
  if (imagesToDelete.length > 0 && isCloudinaryConfigured()) {
    const failedPublicIds = [];
    await Promise.all(
      imagesToDelete.map(async (img) => {
        try {
          await cloudinary.uploader.destroy(img.publicId);
        } catch (err) {
          failedPublicIds.push(img.publicId);
        }
      })
    );

    if (failedPublicIds.length > 0) {
      console.error(
        `[Peringatan Cloudinary] Gagal menghapus aset Cloudinary berikut (perlu pembersihan manual): ${failedPublicIds.join(
          ', '
        )}`
      );
    }
  }

  return true;
}

/**
 * Mengunggah 1 sampai 5 gambar ke paket
 * Maksimal total 10 gambar per paket
 * Jika penyimpanan DB gagal, lakukan rollback dengan menghapus gambar yang terunggah di Cloudinary
 */
async function addImagesToPackage(id, files) {
  if (!isCloudinaryConfigured()) {
    throw new AppError('Layanan penyimpanan gambar belum dikonfigurasi', 503);
  }

  const pkg = await Package.findById(id);
  if (!pkg) {
    throw new AppError('Paket tidak ditemukan', 404);
  }

  const currentCount = pkg.images.length;
  if (currentCount + files.length > 10) {
    throw new AppError(
      `Paket saat ini memiliki ${currentCount} gambar. Penambahan ${files.length} gambar melebihi batas maksimal 10 gambar per paket`,
      400
    );
  }

  // Upload ke Cloudinary
  const uploadPromises = files.map((file) => uploadToCloudinary(file.buffer, pkg.category));
  const uploadedResults = await Promise.all(uploadPromises);

  try {
    pkg.images.push(...uploadedResults);
    await pkg.save();
    return pkg;
  } catch (err) {
    // Rollback: hapus semua gambar yang sempat terunggah jika DB gagal simpan
    const failedRollback = [];
    await Promise.all(
      uploadedResults.map(async (img) => {
        try {
          await cloudinary.uploader.destroy(img.publicId);
        } catch (delErr) {
          failedRollback.push(img.publicId);
        }
      })
    );
    if (failedRollback.length > 0) {
      console.error(
        `[Peringatan Cloudinary Rollback] Gagal menghapus aset saat rollback: ${failedRollback.join(', ')}`
      );
    }
    throw err;
  }
}

/**
 * Menghapus satu gambar dari paket dan dari Cloudinary
 */
async function removeImageFromPackage(id, imageId) {
  if (!isCloudinaryConfigured()) {
    throw new AppError('Layanan penyimpanan gambar belum dikonfigurasi', 503);
  }

  const pkg = await Package.findById(id);
  if (!pkg) {
    throw new AppError('Paket tidak ditemukan', 404);
  }

  const imageIndex = pkg.images.findIndex((img) => img._id.toString() === imageId);
  if (imageIndex === -1) {
    throw new AppError('Gambar tidak ditemukan pada paket ini', 404);
  }

  const imageToDelete = pkg.images[imageIndex];

  // Hapus dari Cloudinary
  try {
    await deleteFromCloudinary(imageToDelete.publicId);
  } catch (err) {
    console.error(
      `[Peringatan Cloudinary] Gagal menghapus aset tunggal (${imageToDelete.publicId}):`,
      err.message
    );
    throw new AppError('Gagal menghapus gambar dari Cloudinary', 500);
  }

  // Hapus dari array images paket
  pkg.images.splice(imageIndex, 1);
  await pkg.save();

  return pkg;
}

module.exports = {
  escapeRegex,
  generateUniqueSlug,
  getPublicPackages,
  getPublicPackageBySlug,
  getAdminPackages,
  getAdminPackageById,
  createPackage,
  updatePackage,
  updatePackageStatus,
  deletePackage,
  addImagesToPackage,
  removeImageFromPackage,
};
