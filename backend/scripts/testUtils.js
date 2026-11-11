const path = require('path');
const dotenv = require('dotenv');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Muat environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Package = require('../src/models/Package');
const CalendarBlock = require('../src/models/CalendarBlock');
const Booking = require('../src/models/Booking');
const Payment = require('../src/models/Payment');
const SlotLock = require('../src/models/SlotLock');
const Setting = require('../src/models/Setting');
const Portfolio = require('../src/models/Portfolio');
const AdminLock = require('../src/models/AdminLock');
const cloudinary = require('../src/config/cloudinary');

// Koleksi pelacak data uji
const tracked = {
  users: new Set(),
  packages: new Set(),
  calendarBlocks: new Set(),
  bookings: new Set(),
  payments: new Set(),
  slotLocks: new Set(),
  portfolios: new Set(),
  adminLocks: new Set(),
  cloudinaryPublicIds: new Set(),
};

let originalSettingState = null;
let settingExistedInitially = false;

/**
 * Ekstrak nama database dari MongoDB connection string tanpa mencetak credentials
 */
function extractDatabaseName(uri) {
  if (!uri || typeof uri !== 'string') return null;
  const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?/\s]+)/i);
  return match && match[1] ? match[1].trim() : null;
}

/**
 * Validasi ketat variabel MONGO_URI_TEST
 */
function validateAndGetTestDbUri() {
  const testUri = process.env.MONGO_URI_TEST;
  const mainUri = process.env.MONGO_URI;

  if (!testUri || !testUri.trim()) {
    throw new Error(
      'PENGUJIAN DITOLAK: Environment variable MONGO_URI_TEST tidak ditemukan atau bernilai kosong di .env!'
    );
  }

  const testDbName = extractDatabaseName(testUri);
  if (!testDbName) {
    throw new Error(
      'PENGUJIAN DITOLAK: MONGO_URI_TEST tidak menyertakan nama database! Format: mongodb://.../nama_db_test'
    );
  }

  if (!testDbName.endsWith('_test')) {
    throw new Error(
      `PENGUJIAN DITOLAK: Nama database di MONGO_URI_TEST ("${testDbName}") wajib berakhiran "_test" demi keamanan data!`
    );
  }

  const mainDbName = extractDatabaseName(mainUri);
  if (mainDbName && testDbName === mainDbName) {
    throw new Error(
      `PENGUJIAN DITOLAK: Database pengujian ("${testDbName}") tidak boleh sama dengan database utama ("${mainDbName}") di MONGO_URI!`
    );
  }

  if (mainUri && testUri.trim() === mainUri.trim()) {
    throw new Error(
      'PENGUJIAN DITOLAK: Nilai MONGO_URI_TEST tidak boleh sama dengan MONGO_URI!'
    );
  }

  return { testUri, testDbName };
}

/**
 * Hubungkan ke database pengujian MongoDB
 */
async function connectTestDb() {
  const { testUri, testDbName } = validateAndGetTestDbUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testUri);
  }
  return { testDbName };
}

/**
 * Tutup koneksi database
 */
async function disconnectTestDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

// Pelacak data
function trackUser(id) {
  if (id) tracked.users.add(id.toString());
}
function trackPackage(id) {
  if (id) tracked.packages.add(id.toString());
}
function trackCalendarBlock(id) {
  if (id) tracked.calendarBlocks.add(id.toString());
}
function trackBooking(id) {
  if (id) tracked.bookings.add(id.toString());
}
function trackPayment(id) {
  if (id) tracked.payments.add(id.toString());
}
function trackSlotLock(id) {
  if (id) tracked.slotLocks.add(id.toString());
}
function trackPortfolio(id) {
  if (id) tracked.portfolios.add(id.toString());
}
function trackAdminLock(key) {
  if (key) tracked.adminLocks.add(key.toString());
}
function trackCloudinaryPublicId(publicId) {
  if (publicId) tracked.cloudinaryPublicIds.add(publicId);
}

/**
 * Buat akun admin uji sementara
 */
async function createTestAdmin() {
  const rand = crypto.randomBytes(4).toString('hex');
  const rawPassword = `TestAdminPass123!${rand}`;
  const user = await User.create({
    name: `Test Admin ${rand}`,
    email: `admin.${rand}@kalila-test.com`,
    phone: `0812${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: rawPassword,
    role: 'admin',
  });
  trackUser(user._id);

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'test_jwt_secret_key',
    { expiresIn: '1h' }
  );

  return { user, token, rawPassword };
}

/**
 * Buat akun customer uji sementara
 */
async function createTestCustomer() {
  const rand = crypto.randomBytes(4).toString('hex');
  const rawPassword = `TestCustPass123!${rand}`;
  const user = await User.create({
    name: `Test Customer ${rand}`,
    email: `customer.${rand}@kalila-test.com`,
    phone: `0812${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: rawPassword,
    role: 'customer',
  });
  trackUser(user._id);

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'test_jwt_secret_key',
    { expiresIn: '1h' }
  );

  return { user, token, rawPassword };
}

/**
 * Cadangkan state Setting sebelum tes dimulai
 */
async function backupSettings() {
  const current = await Setting.findOne({ key: 'main' }).lean();
  if (current) {
    settingExistedInitially = true;
    originalSettingState = JSON.parse(JSON.stringify(current));
  } else {
    settingExistedInitially = false;
    originalSettingState = null;
  }
}

/**
 * Pulihkan dokumen Setting ke kondisi semula
 */
async function restoreSettings() {
  if (settingExistedInitially && originalSettingState) {
    const { _id, createdAt, updatedAt, __v, ...dataToRestore } = originalSettingState;
    await Setting.findOneAndUpdate(
      { key: 'main' },
      { $set: dataToRestore },
      { upsert: true, returnDocument: 'after' }
    );
  } else {
    await Setting.deleteOne({ key: 'main' });
  }
}

/**
 * Verifikasi keberadaan aset di Cloudinary
 */
async function verifyAssetExistsInCloudinary(publicId) {
  try {
    const res = await cloudinary.api.resource(publicId);
    return res && res.public_id === publicId;
  } catch (err) {
    return false;
  }
}

/**
 * Verifikasi penghapusan aset di Cloudinary (404)
 */
async function verifyAssetDeletedFromCloudinary(publicId) {
  try {
    await cloudinary.api.resource(publicId);
    return false;
  } catch (err) {
    if (err && err.error && err.error.http_code === 404) {
      return true;
    }
    return false;
  }
}

/**
 * Bersihkan HANYA data yang dilacak oleh skrip uji
 */
async function cleanTrackedData() {
  if (tracked.users.size > 0) {
    await User.deleteMany({ _id: { $in: Array.from(tracked.users) } });
  }
  if (tracked.packages.size > 0) {
    await Package.deleteMany({ _id: { $in: Array.from(tracked.packages) } });
  }
  if (tracked.calendarBlocks.size > 0) {
    await CalendarBlock.deleteMany({ _id: { $in: Array.from(tracked.calendarBlocks) } });
  }
  if (tracked.bookings.size > 0) {
    await Booking.deleteMany({ _id: { $in: Array.from(tracked.bookings) } });
  }
  if (tracked.payments.size > 0) {
    await Payment.deleteMany({ _id: { $in: Array.from(tracked.payments) } });
  }
  if (tracked.slotLocks.size > 0) {
    const list = Array.from(tracked.slotLocks);
    const validObjectIds = list.filter((id) => mongoose.Types.ObjectId.isValid(id));
    await SlotLock.deleteMany({
      $or: [
        { date: { $in: list } },
        ...(validObjectIds.length > 0 ? [{ _id: { $in: validObjectIds } }] : []),
      ],
    });
  }

  if (tracked.portfolios.size > 0) {
    await Portfolio.deleteMany({ _id: { $in: Array.from(tracked.portfolios) } });
  }
  if (tracked.adminLocks.size > 0) {
    await AdminLock.deleteMany({ key: { $in: Array.from(tracked.adminLocks) } });
  }

  // Bersihkan aset Cloudinary yang terlacak (mendukung tipe upload biasa dan authenticated)
  if (tracked.cloudinaryPublicIds.size > 0) {
    for (const pid of tracked.cloudinaryPublicIds) {
      try {
        const res = await cloudinary.uploader.destroy(pid);
        if (res.result === 'not found') {
          await cloudinary.uploader.destroy(pid, { type: 'authenticated' });
        }
      } catch (err) {
        try {
          await cloudinary.uploader.destroy(pid, { type: 'authenticated' });
        } catch (authErr) {
          console.warn(`[Cleanup Cloudinary Gagal]: publicId=${pid}`);
        }
      }
    }
  }

  // Pulihkan setting
  await restoreSettings();
}

module.exports = {
  validateAndGetTestDbUri,
  extractDatabaseName,
  connectTestDb,
  disconnectTestDb,
  trackUser,
  trackPackage,
  trackCalendarBlock,
  trackBooking,
  trackPayment,
  trackSlotLock,
  trackPortfolio,
  trackAdminLock,
  trackCloudinaryPublicId,
  createTestAdmin,
  createTestCustomer,
  backupSettings,
  restoreSettings,
  cleanTrackedData,
  verifyAssetExistsInCloudinary,
  verifyAssetDeletedFromCloudinary,
  tracked,
};
