const mongoose = require('mongoose');
const User = require('../models/User');
const AdminLock = require('../models/AdminLock');
const AppError = require('../utils/AppError');
const {
  checkConfirmPasswordLimit,
  recordConfirmPasswordFailure,
} = require('../utils/confirmPasswordLimiter');

/**
 * Escape regex untuk pencarian yang aman
 */
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Format data user admin untuk respons
 */
function formatAdminUserResponse(user) {
  if (!user) return null;
  const u = user.toObject ? user.toObject() : { ...user };
  return {
    id: u._id,
    _id: u._id,
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

/**
 * Daftar akun admin (role: admin SAJA)
 */
async function getAdminUsers(query) {
  const filter = { role: 'admin' };

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  if (query.q) {
    const escaped = escapeRegex(query.q);
    const regex = new RegExp(escaped, 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const page = query.page || 1;
  const limit = query.limit || 10;
  const skip = (page - 1) * limit;

  let sortCriteria = { createdAt: -1 };
  if (query.sort === 'terlama') {
    sortCriteria = { createdAt: 1 };
  } else if (query.sort === 'nama') {
    sortCriteria = { name: 1 };
  }

  const [itemsRaw, total] = await Promise.all([
    User.find(filter)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  const items = itemsRaw.map(formatAdminUserResponse);

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

/**
 * Detail satu admin berdasarkan ID (role: admin SAJA, customer -> 404)
 */
async function getAdminUserById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Admin tidak ditemukan', 404);
  }

  const user = await User.findOne({ _id: id, role: 'admin' }).lean();
  if (!user) {
    throw new AppError('Admin tidak ditemukan', 404);
  }

  return formatAdminUserResponse(user);
}

/**
 * Menambah admin baru
 */
async function createAdminUser(data, currentAdminId) {
  // Cek batas percobaan gagal konfirmasi password untuk admin ini
  checkConfirmPasswordLimit(currentAdminId);

  // Verifikasi konfirmasi password admin yang sedang login
  const currentAdmin = await User.findById(currentAdminId).select('+password');
  if (!currentAdmin) {
    throw new AppError('Sesi admin tidak valid', 401);
  }

  const isPasswordValid = await currentAdmin.comparePassword(data.confirmPassword);
  if (!isPasswordValid) {
    recordConfirmPasswordFailure(currentAdminId);
    throw new AppError('Password konfirmasi admin salah', 403);
  }

  const normalizedEmail = data.email.toLowerCase().trim();

  // Cek duplikasi email (case-insensitive)
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AppError('Email sudah terdaftar', 409);
  }

  const newAdmin = await User.create({
    name: data.name,
    email: normalizedEmail,
    phone: data.phone || '',
    password: data.password,
    role: 'admin',
    isActive: true,
  });

  return formatAdminUserResponse(newAdmin);
}

/**
 * Mengubah profil admin (name, email, phone)
 */
async function updateAdminUser(id, data) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Admin tidak ditemukan', 404);
  }

  const admin = await User.findOne({ _id: id, role: 'admin' });
  if (!admin) {
    throw new AppError('Admin tidak ditemukan', 404);
  }

  if (data.email) {
    const normalizedEmail = data.email.toLowerCase().trim();
    if (normalizedEmail !== admin.email) {
      const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
      if (existing) {
        throw new AppError('Email sudah terdaftar', 409);
      }
      admin.email = normalizedEmail;
    }
  }

  if (data.name !== undefined) admin.name = data.name;
  if (data.phone !== undefined) admin.phone = data.phone;

  await admin.save();
  return formatAdminUserResponse(admin);
}

/**
 * Mengubah status aktif/nonaktif admin dengan serialisasi transaksi & proteksi admin terakhir
 */
async function updateAdminStatus(id, { isActive }, currentAdminId) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Admin tidak ditemukan', 404);
  }

  if (id.toString() === currentAdminId.toString() && isActive === false) {
    throw new AppError('Admin tidak boleh menonaktifkan akun sendiri', 400);
  }

  // Serialisasi dengan transaksi MongoDB
  return await mongoose.connection.transaction(async (session) => {
    // Sentuh AdminLock untuk serialisasi kondisi balapan konkurensi
    await AdminLock.findOneAndUpdate(
      { key: 'admins' },
      { $inc: { version: 1 } },
      { session, upsert: true, returnDocument: 'after' }
    );

    const targetAdmin = await User.findOne({ _id: id, role: 'admin' }).session(session);
    if (!targetAdmin) {
      throw new AppError('Admin tidak ditemukan', 404);
    }

    if (isActive === false && targetAdmin.isActive === true) {
      const activeCount = await User.countDocuments({
        role: 'admin',
        isActive: true,
      }).session(session);

      if (activeCount <= 1) {
        throw new AppError(
          'Tidak dapat menonaktifkan admin. Sistem harus memiliki minimal satu admin aktif.',
          409
        );
      }
    }

    targetAdmin.isActive = isActive;
    await targetAdmin.save({ session });

    return formatAdminUserResponse(targetAdmin);
  });
}

/**
 * Admin mengganti password miliknya sendiri
 */
async function changeOwnPassword(currentAdminId, { currentPassword, newPassword }) {
  checkConfirmPasswordLimit(currentAdminId);

  const admin = await User.findById(currentAdminId).select('+password');
  if (!admin) {
    throw new AppError('Admin tidak ditemukan', 404);
  }

  const isCurrentMatch = await admin.comparePassword(currentPassword);
  if (!isCurrentMatch) {
    recordConfirmPasswordFailure(currentAdminId);
    throw new AppError('Password saat ini salah', 400);
  }

  if (newPassword.toLowerCase() === admin.email.toLowerCase()) {
    throw new AppError('Password tidak boleh sama dengan email', 400);
  }

  admin.password = newPassword;
  await admin.save(); // pre('save') mengisi passwordChangedAt = new Date()

  return formatAdminUserResponse(admin);
}

/**
 * Admin mereset password admin lain
 */
async function resetOtherPassword(targetAdminId, { newPassword, confirmPassword }, currentAdminId) {
  checkConfirmPasswordLimit(currentAdminId);

  if (!mongoose.Types.ObjectId.isValid(targetAdminId)) {
    throw new AppError('Admin tidak ditemukan', 404);
  }

  if (targetAdminId.toString() === currentAdminId.toString()) {
    throw new AppError('Gunakan endpoint /me/password untuk mengubah password akun sendiri', 400);
  }

  const targetAdmin = await User.findOne({ _id: targetAdminId, role: 'admin' });
  if (!targetAdmin) {
    throw new AppError('Admin tidak ditemukan', 404);
  }

  const currentAdmin = await User.findById(currentAdminId).select('+password');
  if (!currentAdmin) {
    throw new AppError('Sesi admin tidak valid', 401);
  }

  const isConfirmValid = await currentAdmin.comparePassword(confirmPassword);
  if (!isConfirmValid) {
    recordConfirmPasswordFailure(currentAdminId);
    throw new AppError('Password konfirmasi admin salah', 403);
  }

  if (newPassword.toLowerCase() === targetAdmin.email.toLowerCase()) {
    throw new AppError('Password tidak boleh sama dengan email', 400);
  }

  targetAdmin.password = newPassword;
  await targetAdmin.save(); // pre('save') mengisi passwordChangedAt = new Date()

  return formatAdminUserResponse(targetAdmin);
}

module.exports = {
  getAdminUsers,
  getAdminUserById,
  createAdminUser,
  updateAdminUser,
  updateAdminStatus,
  changeOwnPassword,
  resetOtherPassword,
};

