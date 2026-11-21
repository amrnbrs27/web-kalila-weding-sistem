const mongoose = require('mongoose');
const slugify = require('slugify');
const Portfolio = require('../models/Portfolio');
const cloudinary = require('../config/cloudinary');
const { isCloudinaryConfigured } = require('../config/cloudinary');
const AppError = require('../utils/AppError');

/**
 * Escape karakter regex untuk pencarian yang aman dari Regex Injection
 */
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Membuat slug unik untuk portofolio
 * Jika bentrok, tambahkan suffix angka (-2, -3, dst)
 */
async function generatePortfolioSlug(title, excludeId = null) {
  const baseSlug = slugify(title, { lower: true, strict: true }) || 'portfolio';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existing = await Portfolio.findOne(query).select('_id');
    if (!existing) {
      return slug;
    }
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
}

/**
 * Format data portofolio publik (tanpa publicId Cloudinary)
 */
function formatPublicPortfolioDetail(doc) {
  if (!doc) return null;
  const p = doc.toObject ? doc.toObject() : { ...doc };
  return {
    id: p._id,
    _id: p._id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    description: p.description || '',
    eventDate: p.eventDate || null,
    location: p.location || '',
    isFeatured: p.isFeatured,
    images: (p.images || []).map((img) => ({
      _id: img._id,
      url: img.url,
    })),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

/**
 * Format data portofolio admin (tanpa publicId Cloudinary)
 */
function formatAdminPortfolio(doc) {
  if (!doc) return null;
  const p = doc.toObject ? doc.toObject() : { ...doc };
  return {
    id: p._id,
    _id: p._id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    description: p.description || '',
    eventDate: p.eventDate || null,
    location: p.location || '',
    isPublished: p.isPublished,
    isFeatured: p.isFeatured,
    images: (p.images || []).map((img) => ({
      _id: img._id,
      url: img.url,
    })),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

/**
 * Unggah satu buffer gambar ke Cloudinary di folder kalila/portfolios
 */
function uploadPortfolioImageBuffer(buffer) {
  if (!isCloudinaryConfigured()) {
    throw new AppError('Layanan penyimpanan gambar belum dikonfigurasi', 503);
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'kalila/portfolios',
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
 * Hapus aset gambar dari Cloudinary
 */
async function deletePortfolioCloudinaryAsset(publicId) {
  if (!publicId) return;
  if (!isCloudinaryConfigured()) {
    throw new AppError('Layanan penyimpanan gambar belum dikonfigurasi', 503);
  }
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error(`[Cloudinary Error] Gagal menghapus aset portofolio (${publicId}):`, err.message);
    throw err;
  }
}

// =============================================================================
// LAYANAN PUBLIK
// =============================================================================

async function getPublicPortfolios(query) {
  const filter = { isPublished: true };

  if (query.category) {
    filter.category = query.category;
  }

  if (query.featured !== undefined) {
    filter.isFeatured = query.featured;
  }

  if (query.q) {
    const escaped = escapeRegex(query.q);
    const regex = new RegExp(escaped, 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const page = query.page || 1;
  const limit = query.limit || 12;
  const skip = (page - 1) * limit;

  let sortCriteria = { createdAt: -1 };
  if (query.sort === 'terlama') {
    sortCriteria = { createdAt: 1 };
  }

  const [itemsRaw, total] = await Promise.all([
    Portfolio.find(filter)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .lean(),
    Portfolio.countDocuments(filter),
  ]);

  const items = itemsRaw.map((p) => ({
    id: p._id,
    _id: p._id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    description: p.description || '',
    eventDate: p.eventDate || null,
    location: p.location || '',
    cover: p.images && p.images.length > 0 ? p.images[0].url : null,
    imageCount: p.images ? p.images.length : 0,
    isFeatured: p.isFeatured,
    createdAt: p.createdAt,
  }));

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getPublicPortfolioBySlug(slug) {
  const portfolio = await Portfolio.findOne({ slug, isPublished: true }).lean();
  if (!portfolio) {
    throw new AppError('Portofolio tidak ditemukan', 404);
  }

  return formatPublicPortfolioDetail(portfolio);
}

// =============================================================================
// LAYANAN ADMIN
// =============================================================================

async function getAdminPortfolios(query) {
  const filter = {};

  if (query.category) filter.category = query.category;
  if (query.isPublished !== undefined) filter.isPublished = query.isPublished;
  if (query.isFeatured !== undefined) filter.isFeatured = query.isFeatured;

  if (query.q) {
    const escaped = escapeRegex(query.q);
    const regex = new RegExp(escaped, 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const page = query.page || 1;
  const limit = query.limit || 10;
  const skip = (page - 1) * limit;

  let sortCriteria = { createdAt: -1 };
  if (query.sort === 'terlama') sortCriteria = { createdAt: 1 };
  else if (query.sort === 'title_asc') sortCriteria = { title: 1 };
  else if (query.sort === 'title_desc') sortCriteria = { title: -1 };

  const [itemsRaw, total] = await Promise.all([
    Portfolio.find(filter)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .lean(),
    Portfolio.countDocuments(filter),
  ]);

  const items = itemsRaw.map(formatAdminPortfolio);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getAdminPortfolioById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Portofolio tidak ditemukan', 404);
  }

  const portfolio = await Portfolio.findById(id).lean();
  if (!portfolio) {
    throw new AppError('Portofolio tidak ditemukan', 404);
  }

  return formatAdminPortfolio(portfolio);
}

async function createPortfolio(data) {
  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    const slug = await generatePortfolioSlug(data.title);
    try {
      const portfolio = await Portfolio.create({
        ...data,
        slug,
      });
      return formatAdminPortfolio(portfolio);
    } catch (err) {
      if (err.code === 11000 && err.keyPattern && err.keyPattern.slug && attempts < 3) {
        // Coba lagi dengan slug baru bila terjadi bentrok race condition
        continue;
      }
      throw err;
    }
  }
}

async function updatePortfolio(id, data) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Portofolio tidak ditemukan', 404);
  }

  const portfolio = await Portfolio.findById(id);
  if (!portfolio) {
    throw new AppError('Portofolio tidak ditemukan', 404);
  }

  if (data.title && data.title !== portfolio.title) {
    portfolio.title = data.title;
    portfolio.slug = await generatePortfolioSlug(data.title, portfolio._id);
  }

  if (data.category !== undefined) portfolio.category = data.category;
  if (data.description !== undefined) portfolio.description = data.description;
  if (data.eventDate !== undefined) portfolio.eventDate = data.eventDate || null;
  if (data.location !== undefined) portfolio.location = data.location;
  if (data.isPublished !== undefined) portfolio.isPublished = data.isPublished;
  if (data.isFeatured !== undefined) portfolio.isFeatured = data.isFeatured;

  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    try {
      await portfolio.save();
      return formatAdminPortfolio(portfolio);
    } catch (err) {
      if (err.code === 11000 && err.keyPattern && err.keyPattern.slug && attempts < 3) {
        portfolio.slug = await generatePortfolioSlug(portfolio.title, portfolio._id);
        continue;
      }
      throw err;
    }
  }
}

async function updatePortfolioStatus(id, { isPublished, isFeatured }) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Portofolio tidak ditemukan', 404);
  }

  const portfolio = await Portfolio.findById(id);
  if (!portfolio) {
    throw new AppError('Portofolio tidak ditemukan', 404);
  }

  if (isPublished !== undefined) portfolio.isPublished = isPublished;
  if (isFeatured !== undefined) portfolio.isFeatured = isFeatured;

  await portfolio.save();
  return formatAdminPortfolio(portfolio);
}

async function deletePortfolio(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Portofolio tidak ditemukan', 404);
  }

  const portfolio = await Portfolio.findById(id);
  if (!portfolio) {
    throw new AppError('Portofolio tidak ditemukan', 404);
  }

  const publicIds = (portfolio.images || []).map((img) => img.publicId).filter(Boolean);

  // Hapus dokumen database terlebih dahulu
  await Portfolio.findByIdAndDelete(id);

  // Hapus seluruh gambar di Cloudinary
  const failedPublicIds = [];
  for (const pid of publicIds) {
    try {
      await deletePortfolioCloudinaryAsset(pid);
    } catch (err) {
      failedPublicIds.push(pid);
    }
  }

  if (failedPublicIds.length > 0) {
    console.error(
      '[Cloudinary Warning] Gagal menghapus sejumlah aset gambar portofolio:',
      failedPublicIds
    );
  }

  return { message: 'Portofolio dan seluruh gambarnya berhasil dihapus' };
}

async function uploadPortfolioImages(id, files) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Portofolio tidak ditemukan', 404);
  }

  const portfolio = await Portfolio.findById(id);
  if (!portfolio) {
    throw new AppError('Portofolio tidak ditemukan', 404);
  }

  if (!files || files.length === 0) {
    throw new AppError('Minimal 1 gambar harus diunggah', 400);
  }

  if (files.length > 5) {
    throw new AppError('Maksimal 5 gambar per unggahan', 400);
  }

  const currentCount = portfolio.images ? portfolio.images.length : 0;
  if (currentCount + files.length > 12) {
    throw new AppError(
      `Jumlah gambar melebihi batas maksimal 12 (saat ini ${currentCount}, mencoba menambah ${files.length})`,
      400
    );
  }

  if (!isCloudinaryConfigured()) {
    throw new AppError('Layanan penyimpanan gambar belum dikonfigurasi', 503);
  }

  const uploadedAssets = [];
  try {
    for (const file of files) {
      const asset = await uploadPortfolioImageBuffer(file.buffer);
      uploadedAssets.push(asset);
    }

    portfolio.images.push(...uploadedAssets);
    await portfolio.save();

    return formatAdminPortfolio(portfolio);
  } catch (err) {
    // Rollback aset Cloudinary jika penyimpanan database gagal
    for (const asset of uploadedAssets) {
      try {
        await deletePortfolioCloudinaryAsset(asset.publicId);
      } catch (destroyErr) {
        console.error('[Rollback Cloudinary Gagal]:', destroyErr.message);
      }
    }
    throw err;
  }
}

async function deletePortfolioImage(portfolioId, imageId) {
  if (!mongoose.Types.ObjectId.isValid(portfolioId)) {
    throw new AppError('Portofolio tidak ditemukan', 404);
  }

  const portfolio = await Portfolio.findById(portfolioId);
  if (!portfolio) {
    throw new AppError('Portofolio tidak ditemukan', 404);
  }

  const targetIndex = (portfolio.images || []).findIndex(
    (img) => img._id.toString() === imageId.toString()
  );

  if (targetIndex === -1) {
    throw new AppError('Gambar tidak ditemukan pada portofolio ini', 404);
  }

  const [removedImage] = portfolio.images.splice(targetIndex, 1);
  await portfolio.save();

  if (removedImage && removedImage.publicId) {
    try {
      await deletePortfolioCloudinaryAsset(removedImage.publicId);
    } catch (err) {
      console.error(
        `[Cloudinary Warning] Gagal menghapus gambar (${removedImage.publicId}):`,
        err.message
      );
    }
  }

  return formatAdminPortfolio(portfolio);
}

async function setPortfolioCoverImage(portfolioId, imageId) {
  if (!mongoose.Types.ObjectId.isValid(portfolioId)) {
    throw new AppError('Portofolio tidak ditemukan', 404);
  }

  const portfolio = await Portfolio.findById(portfolioId);
  if (!portfolio) {
    throw new AppError('Portofolio tidak ditemukan', 404);
  }

  const targetIndex = (portfolio.images || []).findIndex(
    (img) => img._id.toString() === imageId.toString()
  );

  if (targetIndex === -1) {
    throw new AppError('Gambar tidak ditemukan pada portofolio ini', 404);
  }

  const [selectedImg] = portfolio.images.splice(targetIndex, 1);
  portfolio.images.unshift(selectedImg);
  await portfolio.save();

  return formatAdminPortfolio(portfolio);
}

module.exports = {
  getPublicPortfolios,
  getPublicPortfolioBySlug,
  getAdminPortfolios,
  getAdminPortfolioById,
  createPortfolio,
  updatePortfolio,
  updatePortfolioStatus,
  deletePortfolio,
  uploadPortfolioImages,
  deletePortfolioImage,
  setPortfolioCoverImage,
  generatePortfolioSlug,
};

