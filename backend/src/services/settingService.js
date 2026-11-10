const Setting = require('../models/Setting');
const cloudinary = require('../config/cloudinary');
const { isCloudinaryConfigured } = require('../config/cloudinary');
const AppError = require('../utils/AppError');

/**
 * Format pengaturan untuk respons publik
 */
function formatPublicSettings(doc) {
  return {
    businessName: doc.businessName,
    adminWhatsapp: doc.adminWhatsapp,
    dpAmount: doc.dpAmount,
    paymentDeadlineHours: doc.paymentDeadlineHours,
    kontak: {
      email: doc.kontak?.email || '',
      phone: doc.kontak?.phone || '',
      address: doc.kontak?.address || '',
      instagram: doc.kontak?.instagram || '',
      facebook: doc.kontak?.facebook || '',
      tiktok: doc.kontak?.tiktok || '',
    },
  };
}

/**
 * Format pengaturan untuk respons admin (menyembunyikan publicId QRIS)
 */
function formatAdminSettings(doc) {
  return {
    businessName: doc.businessName,
    adminWhatsapp: doc.adminWhatsapp,
    dpAmount: doc.dpAmount,
    paymentDeadlineHours: doc.paymentDeadlineHours,
    maxProofAttempts: doc.maxProofAttempts,
    rejectionExtensionHours: doc.rejectionExtensionHours,
    maxEventsPerDay: {
      dekor: doc.maxEventsPerDay?.dekor ?? null,
      catering: doc.maxEventsPerDay?.catering ?? null,
      wedding: doc.maxEventsPerDay?.wedding ?? null,
    },
    bankName: doc.bankName,
    accountNumber: doc.accountNumber,
    accountHolder: doc.accountHolder,
    qrisImage: {
      url: doc.qrisImage?.url || '',
    },
    kontak: {
      email: doc.kontak?.email || '',
      phone: doc.kontak?.phone || '',
      address: doc.kontak?.address || '',
      instagram: doc.kontak?.instagram || '',
      facebook: doc.kontak?.facebook || '',
      tiktok: doc.kontak?.tiktok || '',
    },
    updatedAt: doc.updatedAt,
  };
}

/**
 * Mendapatkan pengaturan publik
 */
async function getPublicSettings() {
  const settings = await Setting.getSettings();
  return formatPublicSettings(settings);
}

/**
 * Mendapatkan pengaturan lengkap untuk admin
 */
async function getAdminSettings() {
  const settings = await Setting.getSettings();
  return formatAdminSettings(settings);
}

/**
 * Memperbarui pengaturan admin dengan notasi titik untuk objek bersarang (kontak, maxEventsPerDay)
 */
async function updateAdminSettings(data) {
  const updateQuery = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === 'kontak' && typeof value === 'object' && value !== null) {
      for (const [kKey, kVal] of Object.entries(value)) {
        updateQuery[`kontak.${kKey}`] = kVal;
      }
    } else if (key === 'maxEventsPerDay' && typeof value === 'object' && value !== null) {
      for (const [mKey, mVal] of Object.entries(value)) {
        updateQuery[`maxEventsPerDay.${mKey}`] = mVal;
      }
    } else {
      updateQuery[key] = value;
    }
  }

  const updated = await Setting.findOneAndUpdate(
    { key: 'main' },
    { $set: updateQuery },
    {
      returnDocument: 'after',
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  return formatAdminSettings(updated);
}

/**
 * Mengunggah gambar QRIS ke Cloudinary
 */
async function uploadQrisImage(fileBuffer) {
  if (!isCloudinaryConfigured()) {
    throw new AppError('Layanan penyimpanan gambar belum dikonfigurasi', 503);
  }

  const settings = await Setting.getSettings();
  const oldPublicId = settings.qrisImage?.publicId;

  // Upload ke Cloudinary
  const uploadResult = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'kalila/settings',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });

  // Hapus gambar lama jika ada
  if (oldPublicId) {
    try {
      await cloudinary.uploader.destroy(oldPublicId);
    } catch (err) {
      console.warn(`[Cloudinary] Gagal menghapus QRIS lama (${oldPublicId}):`, err.message);
    }
  }

  // Simpan ke database
  settings.qrisImage = {
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
  };
  await settings.save();

  return {
    url: uploadResult.secure_url,
  };
}

/**
 * Menghapus gambar QRIS dari Cloudinary dan database
 */
async function deleteQrisImage() {
  if (!isCloudinaryConfigured()) {
    throw new AppError('Layanan penyimpanan gambar belum dikonfigurasi', 503);
  }

  const settings = await Setting.getSettings();
  const publicId = settings.qrisImage?.publicId;

  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.warn(`[Cloudinary] Gagal menghapus QRIS (${publicId}):`, err.message);
    }
  }

  settings.qrisImage = {
    url: '',
    publicId: '',
  };
  await settings.save();

  return {
    message: 'Gambar QRIS berhasil dihapus',
  };
}

module.exports = {
  getPublicSettings,
  getAdminSettings,
  updateAdminSettings,
  uploadQrisImage,
  deleteQrisImage,
  formatPublicSettings,
  formatAdminSettings,
};
