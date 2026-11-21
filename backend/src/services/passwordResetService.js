const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Setting = require('../models/Setting');
const PasswordReset = require('../models/PasswordReset');
const { triggerPasswordResetOtpEmail } = require('./email/emailService');
const { maskEmail } = require('./email/providers/logProvider');
const AppError = require('../utils/AppError');

let hmacWarningLogged = false;
let devLogOtpWarningLogged = false;

/**
 * Pengecekan konfigurasi OTP_HMAC_SECRET
 * Wajib terisi dan minimal 32 karakter.
 */
function isConfigured() {
  const secret = process.env.OTP_HMAC_SECRET;
  if (!secret || typeof secret !== 'string' || secret.trim().length < 32) {
    if (!hmacWarningLogged) {
      console.warn(
        '[PasswordReset] Peringatan: OTP_HMAC_SECRET belum dikonfigurasi atau kurang dari 32 karakter. Fitur reset password dinonaktifkan.'
      );
      hmacWarningLogged = true;
    }
    return false;
  }
  return true;
}

function ensureConfigured() {
  if (!isConfigured()) {
    throw new AppError('Fitur reset password belum dikonfigurasi', 503);
  }
}

function getHmacSecret() {
  ensureConfigured();
  return process.env.OTP_HMAC_SECRET.trim();
}

/**
 * Konfigurasi bawaan
 */
function getConfig() {
  return {
    ttlMinutes: Number(process.env.PASSWORD_RESET_OTP_TTL_MINUTES) || 10,
    maxAttempts: Number(process.env.PASSWORD_RESET_MAX_ATTEMPTS) || 5,
    cooldownSeconds: Number(process.env.PASSWORD_RESET_COOLDOWN_SECONDS) || 60,
    maxPerHour: Number(process.env.PASSWORD_RESET_MAX_PER_HOUR) || 5,
    allowAdmin: process.env.PASSWORD_RESET_ALLOW_ADMIN === 'true',
  };
}

/**
 * Generate OTP 6 angka kriptografis (000000 - 999999)
 */
function generateOtp() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
}

/**
 * Generate token reset 32 byte acak base64url
 */
function generateResetToken() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Hash OTP dengan HMAC-SHA256 (konteks label "otp" dan document ID)
 */
function hashOtp(docId, otp, secret = null) {
  const key = secret || getHmacSecret();
  return crypto
    .createHmac('sha256', key)
    .update(`otp:${docId.toString()}:${otp}`)
    .digest('hex');
}

/**
 * Hash Token Reset dengan HMAC-SHA256 (konteks label "token")
 */
function hashResetToken(resetToken, secret = null) {
  const key = secret || getHmacSecret();
  return crypto
    .createHmac('sha256', key)
    .update(`token:${resetToken}`)
    .digest('hex');
}

/**
 * Perbandingan timing-safe antara dua string hex
 */
function timingSafeMatch(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch (_) {
    return false;
  }
}

/**
 * Operasi HMAC tiruan untuk timing equalization bila akun/dokumen tidak ada
 */
function computeDummyHmac(otp) {
  try {
    const dummyKey = process.env.OTP_HMAC_SECRET || 'dummy_key_padding_exact_32_characters_long';
    crypto
      .createHmac('sha256', dummyKey)
      .update(`otp:dummy_id:${otp}`)
      .digest('hex');
  } catch (_) {}
}

/**
 * Logging OTP saat mode development
 */
function logOtpDev(otp, email) {
  const nodeEnv = (process.env.NODE_ENV || '').trim().toLowerCase();
  const devLogOtp = (process.env.DEV_LOG_OTP || '').trim().toLowerCase();

  if (devLogOtp === 'true') {
    if (nodeEnv === 'development') {
      console.log(`[DEV_LOG_OTP] OTP: ${otp} | To: ${maskEmail(email)}`);
    } else if (!devLogOtpWarningLogged) {
      console.warn(
        '[PasswordReset] Peringatan: DEV_LOG_OTP diabaikan karena lingkungan bukan development.'
      );
      devLogOtpWarningLogged = true;
    }
  }
}

/**
 * Pencarian akun sebelum mengirimkan respons forgot-password
 * Menyamakan timing dan memisahkan pencarian akun dari pembuatan OTP latar belakang.
 */
async function findEligibleUser(email) {
  ensureConfigured();
  const config = getConfig();
  const normalizedEmail = (email || '').toLowerCase().trim();
  if (!normalizedEmail) {
    return { eligible: false, user: null, normalizedEmail: '' };
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  const isEligible =
    user &&
    user.isActive &&
    (user.role === 'customer' || (user.role === 'admin' && config.allowAdmin));

  return {
    eligible: Boolean(isEligible),
    user: isEligible ? user : null,
    normalizedEmail,
  };
}

/**
 * Langkah 1: Permintaan OTP Reset Password
 * Mengembalikan data konfigurasi { expiresInMinutes, resendAfterSeconds }
 */
async function requestPasswordReset(input) {
  ensureConfigured();

  const config = getConfig();
  let user = null;
  let normalizedEmail = '';
  let isEligible = false;

  if (input && typeof input === 'object' && input._id) {
    user = input;
    normalizedEmail = (user.email || '').toLowerCase().trim();
    isEligible =
      user.isActive &&
      (user.role === 'customer' || (user.role === 'admin' && config.allowAdmin));
  } else if (input && typeof input === 'object' && input.user) {
    user = input.user;
    normalizedEmail = input.normalizedEmail || (user.email || '').toLowerCase().trim();
    isEligible = Boolean(input.eligible);
  } else {
    normalizedEmail = (input || '').toLowerCase().trim();
    const lookup = await findEligibleUser(normalizedEmail);
    user = lookup.user;
    isEligible = lookup.eligible;
  }

  if (!isEligible || !user) {
    return {
      eligible: false,
      enqueued: false,
      expiresInMinutes: config.ttlMinutes,
      resendAfterSeconds: config.cooldownSeconds,
    };
  }

  const now = new Date();
  const cooldownThreshold = new Date(now.getTime() - config.cooldownSeconds * 1000);

  // Kunci kuota cooldown secara atomik di tingkat dokumen User
  const claimedUser = await User.findOneAndUpdate(
    {
      _id: user._id,
      $or: [
        { lastPasswordResetRequestAt: null },
        { lastPasswordResetRequestAt: { $exists: false } },
        { lastPasswordResetRequestAt: { $lte: cooldownThreshold } },
      ],
    },
    { $set: { lastPasswordResetRequestAt: now } },
    { returnDocument: 'after' }
  );

  if (!claimedUser) {
    return {
      eligible: true,
      enqueued: false,
      reason: 'cooldown',
      expiresInMinutes: config.ttlMinutes,
      resendAfterSeconds: config.cooldownSeconds,
    };
  }

  // Periksa juga waktu PasswordReset terakhir bila dimodifikasi pada pengujian
  const latest = await PasswordReset.findOne({ user: user._id }).sort({ createdAt: -1 });
  if (latest) {
    const elapsedSeconds = (now.getTime() - latest.createdAt.getTime()) / 1000;
    if (elapsedSeconds < config.cooldownSeconds) {
      return {
        eligible: true,
        enqueued: false,
        reason: 'cooldown',
        expiresInMinutes: config.ttlMinutes,
        resendAfterSeconds: config.cooldownSeconds,
      };
    }
  }

  // Periksa batas per jam
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const requestsInLastHour = await PasswordReset.countDocuments({
    user: user._id,
    createdAt: { $gte: oneHourAgo },
  });

  if (requestsInLastHour >= config.maxPerHour) {
    return {
      eligible: true,
      enqueued: false,
      reason: 'hourly_limit',
      expiresInMinutes: config.ttlMinutes,
      resendAfterSeconds: config.cooldownSeconds,
    };
  }

  // Tandai seluruh PasswordReset lama milik user sebagai invalidatedAt
  await PasswordReset.updateMany(
    { user: user._id, invalidatedAt: null },
    { $set: { invalidatedAt: now } }
  );

  // Buat OTP baru
  const otp = generateOtp();
  logOtpDev(otp, user.email);

  const docId = new mongoose.Types.ObjectId();
  const otpHash = hashOtp(docId, otp);
  const otpExpiresAt = new Date(now.getTime() + config.ttlMinutes * 60 * 1000);
  const purgeAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const passwordReset = await PasswordReset.create({
    _id: docId,
    user: user._id,
    email: user.email,
    otpHash,
    otpAttempts: 0,
    otpExpiresAt,
    purgeAt,
  });

  // Enqueue email OTP
  let setting = null;
  try {
    setting = await Setting.getSettings();
  } catch (_) {}

  const emailOutbox = await triggerPasswordResetOtpEmail({
    user,
    passwordReset,
    otp,
    expiresInMinutes: config.ttlMinutes,
    setting,
  });

  return {
    eligible: true,
    enqueued: true,
    passwordResetId: passwordReset._id,
    emailOutboxId: emailOutbox?._id || null,
    expiresInMinutes: config.ttlMinutes,
    resendAfterSeconds: config.cooldownSeconds,
  };
}

/**
 * Langkah 2: Verifikasi OTP menjadi Token Reset
 * Mengembalikan { resetToken, expiresInMinutes }
 */
async function verifyResetOtp(email, otp) {
  ensureConfigured();

  const config = getConfig();
  const normalizedEmail = (email || '').toLowerCase().trim();
  const now = new Date();

  // Ambil user dan cek kelayakan
  const user = await User.findOne({ email: normalizedEmail });
  const isEligible =
    user &&
    user.isActive &&
    (user.role === 'customer' || (user.role === 'admin' && config.allowAdmin));

  // 1. Pesan jatah percobaan secara atomik SEBELUM evaluasi OTP
  const reservedDoc = await PasswordReset.findOneAndUpdate(
    {
      email: normalizedEmail,
      usedAt: null,
      invalidatedAt: null,
      otpVerifiedAt: null,
      otpExpiresAt: { $gt: now },
      otpAttempts: { $lt: config.maxAttempts },
    },
    {
      $inc: { otpAttempts: 1 },
    },
    {
      sort: { createdAt: -1 },
      returnDocument: 'after',
    }
  );

  if (!isEligible || !reservedDoc) {
    computeDummyHmac(otp);
    throw new AppError('Kode OTP salah atau sudah kedaluwarsa.', 400);
  }

  // 2. Evaluasi hash OTP HANYA untuk permintaan yang berhasil memesan jatah
  const expectedHash = hashOtp(reservedDoc._id, otp);
  const isMatch = timingSafeMatch(reservedDoc.otpHash, expectedHash);

  if (!isMatch) {
    if (reservedDoc.otpAttempts >= config.maxAttempts) {
      await PasswordReset.updateOne(
        { _id: reservedDoc._id, invalidatedAt: null },
        { $set: { invalidatedAt: now } }
      );
    }
    throw new AppError('Kode OTP salah atau sudah kedaluwarsa.', 400);
  }

  // 3. OTP Benar -> Buat resetToken dan tandai otpVerifiedAt secara atomik
  const resetToken = generateResetToken();
  const resetTokenHash = hashResetToken(resetToken);
  const resetTokenExpiresAt = new Date(now.getTime() + config.ttlMinutes * 60 * 1000);

  const updatedDoc = await PasswordReset.findOneAndUpdate(
    {
      _id: reservedDoc._id,
      otpVerifiedAt: null,
      invalidatedAt: null,
    },
    {
      $set: {
        otpVerifiedAt: now,
        resetTokenHash,
        resetTokenExpiresAt,
      },
    },
    { returnDocument: 'after' }
  );

  if (!updatedDoc) {
    // Terjadi race condition bila ada verifikasi lain yang bersamaan
    throw new AppError('Kode OTP salah atau sudah kedaluwarsa.', 400);
  }

  return {
    resetToken,
    expiresInMinutes: config.ttlMinutes,
  };
}

/**
 * Langkah 3: Atur Password Baru dengan Token Reset
 */
async function resetPassword(resetToken, newPassword) {
  ensureConfigured();

  const config = getConfig();
  const tokenHash = hashResetToken(resetToken);
  const now = new Date();

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const resetDoc = await PasswordReset.findOne({
        resetTokenHash: tokenHash,
        usedAt: null,
        invalidatedAt: null,
        resetTokenExpiresAt: { $gt: now },
      }).session(session);

      if (!resetDoc) {
        throw new AppError('Token reset tidak valid atau sudah kedaluwarsa.', 400);
      }

      const user = await User.findById(resetDoc.user).select('+password').session(session);
      const isEligible =
        user &&
        user.isActive &&
        (user.role === 'customer' || (user.role === 'admin' && config.allowAdmin));

      if (!isEligible) {
        throw new AppError('Token reset tidak valid atau sudah kedaluwarsa.', 400);
      }

      // Validasi: password tidak boleh sama dengan email
      if (newPassword.toLowerCase() === user.email.toLowerCase()) {
        throw new AppError('Password tidak boleh sama dengan email', 400);
      }

      // Validasi: password baru tidak boleh sama dengan password lama
      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword) {
        throw new AppError('Password baru tidak boleh sama dengan password lama', 400);
      }

      // Konsumsi token reset secara atomik
      const consumed = await PasswordReset.findOneAndUpdate(
        {
          _id: resetDoc._id,
          usedAt: null,
          invalidatedAt: null,
        },
        {
          $set: { usedAt: now },
        },
        { session, returnDocument: 'after' }
      );

      if (!consumed) {
        // Race condition: token sudah dipakai transaksi lain
        throw new AppError('Token reset tidak valid atau sudah kedaluwarsa.', 400);
      }

      // Update password lewat save() agar hook pre-save mengisi passwordChangedAt
      user.password = newPassword;
      await user.save({ session });

      // Invalidate seluruh PasswordReset lain milik user ini
      await PasswordReset.updateMany(
        {
          user: user._id,
          _id: { $ne: resetDoc._id },
          invalidatedAt: null,
        },
        {
          $set: { invalidatedAt: now },
        },
        { session }
      );

      await session.commitTransaction();
      return { success: true };
    } catch (err) {
      await session.abortTransaction();

      const isTransient =
        err.code === 112 ||
        err.codeName === 'WriteConflict' ||
        (err.errorLabels && err.errorLabels.includes && err.errorLabels.includes('TransientTransactionError')) ||
        (err.errorLabelSet && err.errorLabelSet.has && err.errorLabelSet.has('TransientTransactionError')) ||
        (typeof err.hasErrorLabel === 'function' && err.hasErrorLabel('TransientTransactionError'));

      if (isTransient && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 60 * attempt));
        continue;
      }

      throw err;
    } finally {
      session.endSession();
    }
  }
}

module.exports = {
  isConfigured,
  ensureConfigured,
  getConfig,
  generateOtp,
  generateResetToken,
  hashOtp,
  hashResetToken,
  timingSafeMatch,
  findEligibleUser,
  requestPasswordReset,
  verifyResetOtp,
  resetPassword,
};

