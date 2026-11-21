const slugify = require('slugify');
const Post = require('../models/Post');
const Setting = require('../models/Setting');
const cloudinary = require('../config/cloudinary');
const { isCloudinaryConfigured } = require('../config/cloudinary');
const AppError = require('../utils/AppError');
const {
  sanitizeContentHtml,
  htmlToPlainText,
} = require('./htmlSanitizer');

const RESERVED_SLUGS = ['tags'];

/**
 * Escape karakter regex untuk pencarian yang aman dari Regex Injection / ReDoS.
 */
function escapeRegex(text) {
  return String(text).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Membuat slug unik untuk artikel.
 * Menghindari kata cadangan ("tags") dan menangani bentrok dengan suffix angka (-2, -3, dst).
 */
async function generatePostSlug(title, excludeId = null) {
  let baseSlug =
    slugify(title, { lower: true, strict: true, trim: true }) || 'artikel';
  if (RESERVED_SLUGS.includes(baseSlug)) {
    baseSlug = `${baseSlug}-2`;
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existing = await Post.findOne(query).select('_id').lean();
    if (!existing && !RESERVED_SLUGS.includes(slug)) {
      return slug;
    }
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
}

/**
 * Menyimpan dokumen Post dengan mekanisme coba lagi (retry) jika terjadi bentrok slug (E11000).
 */
async function savePostWithRetry(postDoc, maxRetries = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await postDoc.save();
    } catch (err) {
      if (err.code === 11000 && err.keyPattern && err.keyPattern.slug) {
        retries += 1;
        postDoc.slug = await generatePostSlug(postDoc.title, postDoc._id);
        if (retries >= maxRetries) {
          throw new AppError(
            'Gagal menghasilkan slug unik untuk artikel setelah beberapa percobaan',
            500
          );
        }
      } else {
        throw err;
      }
    }
  }
}

/**
 * Format data artikel untuk daftar publik (ringkas, tanpa publicId, createdBy, status, atau id internal).
 */
function formatPublicPostSummary(doc, defaultAuthorName) {
  if (!doc) return null;
  const p = doc.toObject ? doc.toObject() : { ...doc };
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt || '',
    cover: p.coverImage?.url || null,
    tags: p.tags || [],
    publishedAt: p.publishedAt,
    readingTimeMinutes: p.readingTimeMinutes || 1,
    authorName: p.authorName || defaultAuthorName,
  };
}

/**
 * Format data artikel untuk halaman detail publik (tanpa publicId, createdBy, status, atau id internal).
 */
function formatPublicPostDetail(doc, defaultAuthorName) {
  if (!doc) return null;
  const p = doc.toObject ? doc.toObject() : { ...doc };
  return {
    slug: p.slug,
    title: p.title,
    content: p.content,
    excerpt: p.excerpt || '',
    metaDescription: p.metaDescription || '',
    cover: p.coverImage?.url || null,
    tags: p.tags || [],
    publishedAt: p.publishedAt,
    updatedAt: p.updatedAt,
    readingTimeMinutes: p.readingTimeMinutes || 1,
    authorName: p.authorName || defaultAuthorName,
  };
}

/**
 * Format ringkasan artikel untuk daftar admin (tanpa publicId).
 */
function formatAdminPostSummary(doc) {
  if (!doc) return null;
  const p = doc.toObject ? doc.toObject() : { ...doc };
  return {
    id: p._id,
    title: p.title,
    slug: p.slug,
    status: p.status,
    excerpt: p.excerpt || '',
    cover: p.coverImage?.url || null,
    tags: p.tags || [],
    authorName: p.authorName || '',
    publishedAt: p.publishedAt || null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    readingTimeMinutes: p.readingTimeMinutes || 1,
    imagesCount: Array.isArray(p.contentImages) ? p.contentImages.length : 0,
    createdBy: p.createdBy
      ? {
          id: p.createdBy._id || p.createdBy,
          name: p.createdBy.name || '',
        }
      : null,
  };
}

/**
 * Format detail lengkap artikel untuk admin (memuat URL gambar isi tanpa publicId).
 */
function formatAdminPostDetail(doc) {
  if (!doc) return null;
  const p = doc.toObject ? doc.toObject() : { ...doc };
  return {
    id: p._id,
    title: p.title,
    slug: p.slug,
    status: p.status,
    excerpt: p.excerpt || '',
    content: p.content,
    metaDescription: p.metaDescription || '',
    coverImage: p.coverImage ? { url: p.coverImage.url } : null,
    contentImages: (p.contentImages || []).map((img) => ({
      _id: img._id,
      url: img.url,
    })),
    tags: p.tags || [],
    authorName: p.authorName || '',
    publishedAt: p.publishedAt || null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    readingTimeMinutes: p.readingTimeMinutes || 1,
    createdBy: p.createdBy
      ? {
          id: p.createdBy._id || p.createdBy,
          name: p.createdBy.name || '',
        }
      : null,
  };
}

/**
 * Unggah satu buffer gambar ke Cloudinary di folder kalila/blog (publik).
 */
function uploadBlogImageBuffer(buffer) {
  if (!isCloudinaryConfigured()) {
    throw new AppError('Layanan penyimpanan gambar belum dikonfigurasi', 503);
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'kalila/blog',
        resource_type: 'image',
        timeout: 60000,
      },
      (error, result) => {
        if (error) {
          return reject(
            new AppError(`Gagal mengunggah ke Cloudinary: ${error.message}`, 500)
          );
        }
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Mengambil nama default bisnis dari Setting singleton.
 */
async function getDefaultBusinessName() {
  const setting = await Setting.getSettings();
  return setting?.businessName || 'Kalila Wedding, Dekor & Catering';
}

// =====================================================================
// ENDPOINT PUBLIK
// =====================================================================

/**
 * GET /api/posts - Daftar artikel terbit untuk publik.
 */
async function getPublicPosts(query = {}) {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 12, 50);
  const sortOption = query.sort || 'terbaru';

  const filter = { status: 'published' };

  if (query.tag && typeof query.tag === 'string') {
    filter.tags = query.tag.trim().toLowerCase();
  }

  if (query.q && typeof query.q === 'string' && query.q.trim()) {
    const safeRegex = new RegExp(escapeRegex(query.q.trim()), 'i');
    filter.$or = [
      { title: safeRegex },
      { excerpt: safeRegex },
      { tags: safeRegex },
    ];
  }

  const sortStage =
    sortOption === 'terlama'
      ? { publishedAt: 1, _id: 1 }
      : { publishedAt: -1, _id: -1 };

  const [total, posts, defaultBusinessName] = await Promise.all([
    Post.countDocuments(filter),
    Post.find(filter)
      .sort(sortStage)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('slug title excerpt coverImage tags publishedAt readingTimeMinutes authorName')
      .lean(),
    getDefaultBusinessName(),
  ]);

  const items = posts.map((p) => formatPublicPostSummary(p, defaultBusinessName));

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
}

/**
 * GET /api/posts/tags - Daftar tag dari artikel published beserta jumlahnya.
 */
async function getPublicTags() {
  const agg = await Post.aggregate([
    { $match: { status: 'published' } },
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        tag: '$_id',
        count: 1,
      },
    },
    {
      $sort: { count: -1, tag: 1 },
    },
  ]);

  return agg;
}

/**
 * GET /api/posts/:slug - Detail artikel terbit untuk publik.
 */
async function getPublicPostBySlug(slug) {
  const post = await Post.findOne({
    slug: String(slug).trim().toLowerCase(),
    status: 'published',
  }).lean();

  if (!post) {
    throw new AppError('Artikel tidak ditemukan atau belum dipublikasikan', 404);
  }

  const defaultBusinessName = await getDefaultBusinessName();
  return formatPublicPostDetail(post, defaultBusinessName);
}

// =====================================================================
// ENDPOINT ADMIN
// =====================================================================

/**
 * GET /api/admin/posts - Daftar artikel untuk admin (semua status).
 */
async function getAdminPosts(query = {}) {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 10, 100);
  const sortOption = query.sort || 'terbaru';

  const filter = {};

  if (query.status && ['draft', 'published'].includes(query.status)) {
    filter.status = query.status;
  }

  if (query.tag && typeof query.tag === 'string') {
    filter.tags = query.tag.trim().toLowerCase();
  }

  if (query.q && typeof query.q === 'string' && query.q.trim()) {
    const safeRegex = new RegExp(escapeRegex(query.q.trim()), 'i');
    filter.$or = [
      { title: safeRegex },
      { slug: safeRegex },
      { tags: safeRegex },
    ];
  }

  let sortStage = { createdAt: -1, _id: -1 };
  if (sortOption === 'terlama') {
    sortStage = { createdAt: 1, _id: 1 };
  } else if (sortOption === 'judul') {
    sortStage = { title: 1, _id: 1 };
  }

  const [total, posts] = await Promise.all([
    Post.countDocuments(filter),
    Post.find(filter)
      .sort(sortStage)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name')
      .lean(),
  ]);

  const items = posts.map(formatAdminPostSummary);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
}

/**
 * GET /api/admin/posts/:id - Detail lengkap artikel untuk admin.
 */
async function getAdminPostById(id) {
  const post = await Post.findById(id).populate('createdBy', 'name');
  if (!post) {
    throw new AppError('Artikel tidak ditemukan', 404);
  }
  return formatAdminPostDetail(post);
}

/**
 * POST /api/admin/posts - Membuat artikel baru (selalu status draft).
 */
async function createPost(data, adminUser) {
  const sanitizedContent = sanitizeContentHtml(data.content);
  const slug = await generatePostSlug(data.title);

  const post = new Post({
    title: data.title,
    slug,
    content: sanitizedContent,
    excerpt: data.excerpt || '',
    metaDescription: data.metaDescription || '',
    authorName: data.authorName || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    status: 'draft',
    publishedAt: null,
    createdBy: adminUser?._id || null,
  });

  const saved = await savePostWithRetry(post);
  return formatAdminPostDetail(saved);
}

/**
 * PUT /api/admin/posts/:id - Memperbarui artikel.
 * Slug dibuat ulang HANYA selama publishedAt masih null.
 */
async function updatePost(id, data) {
  const post = await Post.findById(id);
  if (!post) {
    throw new AppError('Artikel tidak ditemukan', 404);
  }

  if (data.title !== undefined) {
    const trimmedTitle = data.title.trim();
    if (trimmedTitle !== post.title) {
      post.title = trimmedTitle;
      // Perbarui slug HANYA jika artikel belum pernah terbit (publishedAt masih null)
      if (!post.publishedAt) {
        post.slug = await generatePostSlug(trimmedTitle, post._id);
      }
    }
  }

  if (data.content !== undefined) {
    post.content = sanitizeContentHtml(data.content);
  }

  if (data.excerpt !== undefined) {
    post.excerpt = data.excerpt;
  }

  if (data.metaDescription !== undefined) {
    post.metaDescription = data.metaDescription;
  }

  if (data.authorName !== undefined) {
    post.authorName = data.authorName;
  }

  if (data.tags !== undefined) {
    post.tags = Array.isArray(data.tags) ? data.tags : [];
  }

  const saved = await savePostWithRetry(post);
  return formatAdminPostDetail(saved);
}

/**
 * PATCH /api/admin/posts/:id/status - Mengubah status artikel (draft/published).
 * Aman dari race condition & idempoten.
 */
async function updatePostStatus(id, newStatus) {
  const post = await Post.findById(id);
  if (!post) {
    throw new AppError('Artikel tidak ditemukan', 404);
  }

  if (post.status === newStatus) {
    return formatAdminPostDetail(post);
  }

  if (newStatus === 'published') {
    const plain = htmlToPlainText(post.content || '');
    if (!post.title || plain.length < 20) {
      throw new AppError(
        'Isi artikel minimal 20 karakter teks polos untuk dapat dipublikasikan',
        400
      );
    }

    if (post.publishedAt) {
      // Artikel pernah terbit sebelumnya: pertahankan publishedAt lama
      post.status = 'published';
      const saved = await post.save();
      return formatAdminPostDetail(saved);
    }

    // Publikasi pertama kali: conditional update aman dari balapan bersamaan
    const now = new Date();
    const updated = await Post.findOneAndUpdate(
      { _id: post._id, publishedAt: null },
      { $set: { status: 'published', publishedAt: now } },
      { returnDocument: 'after' }
    );

    if (updated) {
      return formatAdminPostDetail(updated);
    }

    // Jika balapan didahului permintaan lain yang mengisi publishedAt
    const current = await Post.findByIdAndUpdate(
      post._id,
      { $set: { status: 'published' } },
      { returnDocument: 'after' }
    );
    return formatAdminPostDetail(current);
  }

  // newStatus === 'draft'
  post.status = 'draft';
  const saved = await post.save();
  return formatAdminPostDetail(saved);
}

/**
 * DELETE /api/admin/posts/:id - Hapus artikel (dokumen dihapus dulu, lalu aset Cloudinary via Promise.allSettled).
 */
async function deletePost(id) {
  const post = await Post.findById(id);
  if (!post) {
    throw new AppError('Artikel tidak ditemukan', 404);
  }

  // 1. Hapus dokumen terlebih dahulu
  await Post.findByIdAndDelete(id);

  // 2. Kumpulkan seluruh publicId aset (cover dan isi)
  const publicIds = [];
  if (post.coverImage?.publicId) {
    publicIds.push(post.coverImage.publicId);
  }
  if (Array.isArray(post.contentImages)) {
    for (const img of post.contentImages) {
      if (img?.publicId) {
        publicIds.push(img.publicId);
      }
    }
  }

  // 3. Bersihkan aset di Cloudinary dengan Promise.allSettled
  if (publicIds.length > 0 && isCloudinaryConfigured()) {
    const results = await Promise.allSettled(
      publicIds.map((pid) => cloudinary.uploader.destroy(pid))
    );
    const failed = [];
    results.forEach((res, i) => {
      if (res.status === 'rejected' || res.value?.result === 'error') {
        failed.push(publicIds[i]);
      }
    });
    if (failed.length > 0) {
      console.warn(`[Cleanup Blog Assets Gagal]: publicIds=[${failed.join(', ')}]`);
    }
  }

  return { id: post._id, title: post.title };
}

/**
 * POST /api/admin/posts/:id/cover - Unggah gambar sampul (cover).
 */
async function uploadCover(id, fileBuffer) {
  const post = await Post.findById(id);
  if (!post) {
    throw new AppError('Artikel tidak ditemukan', 404);
  }

  const uploadRes = await uploadBlogImageBuffer(fileBuffer);
  const oldPublicId = post.coverImage?.publicId || null;

  try {
    post.coverImage = {
      url: uploadRes.secure_url,
      publicId: uploadRes.public_id,
    };
    await post.save();
  } catch (err) {
    // Rollback aset baru jika penyimpanan database gagal
    if (isCloudinaryConfigured()) {
      await cloudinary.uploader.destroy(uploadRes.public_id).catch(() => {});
    }
    throw err;
  }

  // Hapus aset lama di Cloudinary jika ada
  if (oldPublicId && isCloudinaryConfigured()) {
    await cloudinary.uploader.destroy(oldPublicId).catch(() => {});
  }

  return { url: post.coverImage.url };
}

/**
 * DELETE /api/admin/posts/:id/cover - Hapus gambar sampul artikel.
 */
async function deleteCover(id) {
  const post = await Post.findById(id);
  if (!post) {
    throw new AppError('Artikel tidak ditemukan', 404);
  }

  if (post.coverImage?.publicId && isCloudinaryConfigured()) {
    await cloudinary.uploader.destroy(post.coverImage.publicId).catch(() => {});
  }

  post.coverImage = null;
  await post.save();

  return { message: 'Gambar sampul artikel berhasil dihapus' };
}

/**
 * POST /api/admin/posts/:id/images - Unggah 1 sampai 5 gambar isi (maksimal total 30).
 */
async function uploadContentImages(id, files) {
  const post = await Post.findById(id);
  if (!post) {
    throw new AppError('Artikel tidak ditemukan', 404);
  }

  const currentCount = Array.isArray(post.contentImages)
    ? post.contentImages.length
    : 0;
  if (currentCount + files.length > 30) {
    throw new AppError(
      `Total gambar isi melebihi batas maksimal 30 per artikel (saat ini: ${currentCount}, ditambah: ${files.length})`,
      400
    );
  }

  // Unggah gambar secara berurutan untuk menjaga kestabilan koneksi Cloudinary
  const uploadedAssets = [];
  try {
    for (const file of files) {
      const asset = await uploadBlogImageBuffer(file.buffer);
      uploadedAssets.push(asset);
    }
  } catch (uploadErr) {
    // Bersihkan gambar yang sempat terunggah jika ada yang gagal di tengah proses
    if (uploadedAssets.length > 0 && isCloudinaryConfigured()) {
      await Promise.allSettled(
        uploadedAssets.map((asset) => cloudinary.uploader.destroy(asset.public_id))
      );
    }
    throw uploadErr;
  }

  try {
    for (const asset of uploadedAssets) {
      post.contentImages.push({
        url: asset.secure_url,
        publicId: asset.public_id,
      });
    }
    await post.save();
  } catch (dbErr) {
    // Rollback aset Cloudinary jika penyimpanan DB gagal
    if (isCloudinaryConfigured()) {
      await Promise.allSettled(
        uploadedAssets.map((asset) => cloudinary.uploader.destroy(asset.public_id))
      );
    }
    throw dbErr;
  }

  // Kembalikan daftar gambar yang baru saja diunggah (tanpa publicId)
  const newlyAdded = post.contentImages.slice(-uploadedAssets.length).map((img) => ({
    _id: img._id,
    url: img.url,
  }));

  return newlyAdded;
}

/**
 * DELETE /api/admin/posts/:id/images/:imageId - Hapus 1 gambar isi artikel.
 */
async function deleteContentImage(id, imageId) {
  const post = await Post.findById(id);
  if (!post) {
    throw new AppError('Artikel tidak ditemukan', 404);
  }

  const targetImage = post.contentImages.id(imageId);
  if (!targetImage) {
    throw new AppError('Gambar isi artikel tidak ditemukan', 404);
  }

  const publicId = targetImage.publicId;

  post.contentImages.pull({ _id: imageId });
  await post.save();

  if (publicId && isCloudinaryConfigured()) {
    await cloudinary.uploader.destroy(publicId).catch(() => {});
  }

  return { message: 'Gambar isi artikel berhasil dihapus' };
}

module.exports = {
  getPublicPosts,
  getPublicTags,
  getPublicPostBySlug,
  getAdminPosts,
  getAdminPostById,
  createPost,
  updatePost,
  updatePostStatus,
  deletePost,
  uploadCover,
  deleteCover,
  uploadContentImages,
  deleteContentImage,
  // Helper diekspor untuk pengujian langsung
  generatePostSlug,
  escapeRegex,
};
