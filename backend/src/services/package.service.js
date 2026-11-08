const Package = require('../models/Package');
const AppError = require('../utils/AppError');

/**
 * Mendapatkan daftar paket dengan filter, pencarian, dan pagination
 * @param {Object} query - Parameter query
 * @param {boolean} isAdmin - Menandakan apakah pemanggil adalah admin
 */
async function getAllPackages(query = {}, isAdmin = false) {
  const {
    category,
    search,
    isActive,
    page = 1,
    limit = 10,
    sort = 'newest',
  } = query;

  const filter = {};

  // Filter kategori
  if (category) {
    filter.category = category;
  }

  // Filter status aktif
  if (!isAdmin) {
    filter.isActive = true; // Publik hanya melihat paket aktif
  } else if (isActive === 'true') {
    filter.isActive = true;
  } else if (isActive === 'false') {
    filter.isActive = false;
  } // jika 'all', filter.isActive tidak diset

  // Filter pencarian berdasarkan nama atau deskripsi
  if (search && search.trim()) {
    filter.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  // Urutan (Sorting)
  let sortOption = { createdAt: -1 };
  if (sort === 'oldest') sortOption = { createdAt: 1 };
  else if (sort === 'cheapest') sortOption = { price: 1 };
  else if (sort === 'expensive') sortOption = { price: -1 };
  else if (sort === 'name_asc') sortOption = { name: 1 };
  else if (sort === 'name_desc') sortOption = { name: -1 };

  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 10));
  const skip = (parsedPage - 1) * parsedLimit;

  const [packages, total] = await Promise.all([
    Package.find(filter).sort(sortOption).skip(skip).limit(parsedLimit),
    Package.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / parsedLimit) || 1;

  return {
    packages,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages,
    },
  };
}

/**
 * Mendapatkan detail paket berdasarkan ID
 * @param {string} id - Package ObjectId
 * @param {boolean} isAdmin - Menandakan apakah pemanggil adalah admin
 */
async function getPackageById(id, isAdmin = false) {
  const pkg = await Package.findById(id);
  if (!pkg) {
    throw new AppError('Paket tidak ditemukan', 404);
  }

  if (!isAdmin && !pkg.isActive) {
    throw new AppError('Paket tidak ditemukan atau sudah tidak aktif', 404);
  }

  return pkg;
}

/**
 * Membuat paket baru
 * @param {Object} data - Data paket
 */
async function createPackage(data) {
  const pkg = await Package.create(data);
  return pkg;
}

/**
 * Memperbarui data paket
 * @param {string} id - Package ObjectId
 * @param {Object} data - Data paket yang diperbarui
 */
async function updatePackage(id, data) {
  const pkg = await Package.findById(id);
  if (!pkg) {
    throw new AppError('Paket tidak ditemukan', 404);
  }

  // Periksa jika kategori 'dekor' atau diubah ke 'dekor' tapi lebar dekor kosong
  const targetCategory = data.category || pkg.category;
  const targetWidth = data.decorWidth !== undefined ? data.decorWidth : pkg.decorWidth;
  if (targetCategory === 'dekor' && (!targetWidth || targetWidth <= 0)) {
    throw new AppError('Lebar dekor wajib diisi dengan nilai positif untuk kategori dekor', 400);
  }

  Object.assign(pkg, data);
  await pkg.save();
  return pkg;
}

/**
 * Menghapus paket (soft delete secara default atau permanent delete)
 * @param {string} id - Package ObjectId
 * @param {boolean} permanent - Hapus permanen jika true
 */
async function deletePackage(id, permanent = false) {
  const pkg = await Package.findById(id);
  if (!pkg) {
    throw new AppError('Paket tidak ditemukan', 404);
  }

  if (permanent) {
    await Package.findByIdAndDelete(id);
  } else {
    pkg.isActive = false;
    await pkg.save();
  }

  return true;
}

/**
 * Menambahkan URL gambar ke galeri foto paket
 * @param {string} id - Package ObjectId
 * @param {string[]} imageUrls - Daftar URL gambar
 */
async function addImagesToPackage(id, imageUrls) {
  const pkg = await Package.findById(id);
  if (!pkg) {
    throw new AppError('Paket tidak ditemukan', 404);
  }

  pkg.images.push(...imageUrls);
  await pkg.save();
  return pkg;
}

/**
 * Menghapus URL gambar dari galeri foto paket
 * @param {string} id - Package ObjectId
 * @param {string} imageUrl - URL gambar yang ingin dihapus
 */
async function removeImageFromPackage(id, imageUrl) {
  const pkg = await Package.findById(id);
  if (!pkg) {
    throw new AppError('Paket tidak ditemukan', 404);
  }

  pkg.images = pkg.images.filter((img) => img !== imageUrl);
  await pkg.save();
  return pkg;
}

module.exports = {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  addImagesToPackage,
  removeImageFromPackage,
};

