/**
 * Controller untuk administrasi antrean Email Outbox dan status layanan email
 */

const EmailOutbox = require('../models/EmailOutbox');
const Booking = require('../models/Booking');
const { getEmailConfigStatus, extractDomainFromEmail } = require('../services/email/emailConfig');
const { getProvider } = require('../services/email/emailService');
const { maskEmail } = require('../services/email/providers/logProvider');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

function escapeRegex(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * 1. GET /api/admin/emails
 * Daftar antrean email dengan filter, pagination, dan proteksi regex
 */
const getEmails = asyncHandler(async (req, res) => {
  const { status, type, q, page = 1, limit = 10, sort = 'terbaru' } = req.query;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (type) {
    filter.type = type;
  }

  if (q && q.trim()) {
    const safeRegex = new RegExp(escapeRegex(q.trim()), 'i');

    // Cari ID booking yang cocok dengan nomor pesanan
    const matchedBookings = await Booking.find({ bookingNumber: safeRegex })
      .select('_id')
      .limit(50)
      .lean();

    const bookingIds = matchedBookings.map((b) => b._id);

    filter.$or = [
      { to: safeRegex },
      { originalTo: safeRegex },
      { subject: safeRegex },
      { dedupeKey: safeRegex },
    ];

    if (bookingIds.length > 0) {
      filter.$or.push({ booking: { $in: bookingIds } });
    }
  }

  const sortOption = sort === 'terlama' ? { createdAt: 1 } : { createdAt: -1 };
  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    EmailOutbox.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .populate('booking', 'bookingNumber category eventDate')
      .select('-html -text')
      .lean(),
    EmailOutbox.countDocuments(filter),
  ]);

  const formattedItems = items.map((item) => ({
    _id: item._id,
    type: item.type,
    to: maskEmail(item.to),
    originalTo: item.originalTo ? maskEmail(item.originalTo) : null,
    subject: item.subject,
    status: item.status,
    attempts: item.attempts,
    lastError: item.lastError || null,
    provider: item.provider || null,
    sentAt: item.sentAt || null,
    purgeAt: item.purgeAt || null,
    createdAt: item.createdAt,
    booking: item.booking
      ? {
          _id: item.booking._id,
          bookingNumber: item.booking.bookingNumber,
        }
      : null,
  }));

  res.status(200).json({
    success: true,
    message: 'Daftar antrean email berhasil diambil',
    data: {
      items: formattedItems,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    },
  });
});

/**
 * 2. GET /api/admin/emails/:id
 * Detail email tanpa konten HTML (hanya teks polos demi keamanan)
 */
const getEmailById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const email = await EmailOutbox.findById(id)
    .populate('booking', 'bookingNumber category eventDate eventName location customerSnapshot')
    .select('-html')
    .lean();

  if (!email) {
    throw new AppError('Email outbox tidak ditemukan', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Detail email outbox berhasil diambil',
    data: {
      _id: email._id,
      type: email.type,
      dedupeKey: email.dedupeKey,
      to: maskEmail(email.to),
      originalTo: email.originalTo ? maskEmail(email.originalTo) : null,
      subject: email.subject,
      text: email.type === 'password_reset_otp' ? null : email.text,
      replyTo: email.replyTo || null,
      status: email.status,
      attempts: email.attempts,
      nextAttemptAt: email.nextAttemptAt,
      lockedUntil: email.lockedUntil,
      lastError: email.lastError || null,
      provider: email.provider || null,
      providerMessageId: email.providerMessageId || null,
      sentAt: email.sentAt || null,
      purgeAt: email.purgeAt || null,
      createdAt: email.createdAt,
      updatedAt: email.updatedAt,
      booking: email.booking || null,
    },
  });
});

/**
 * 3. POST /api/admin/emails/:id/retry
 * Mencoba ulang pengiriman email gagal
 */
const retryEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const email = await EmailOutbox.findById(id);
  if (!email) {
    throw new AppError('Email outbox tidak ditemukan', 404);
  }

  if (email.status !== 'failed') {
    throw new AppError(
      `Hanya email dengan status "failed" yang dapat dicoba ulang (status saat ini: "${email.status}")`,
      409
    );
  }

  email.status = 'pending';
  email.attempts = 0;
  email.nextAttemptAt = new Date();
  email.lastError = null;
  email.lockedUntil = null;
  await email.save();

  res.status(200).json({
    success: true,
    message: 'Email berhasil dijadwalkan ulang untuk dikirim',
    data: {
      _id: email._id,
      status: email.status,
      attempts: email.attempts,
      nextAttemptAt: email.nextAttemptAt,
    },
  });
});

/**
 * 4. GET /api/admin/emails/status
 * Ringkasan status konfigurasi email tanpa membocorkan rahasia
 */
const getEmailStatus = asyncHandler(async (req, res) => {
  const config = getEmailConfigStatus();
  const emailFrom = process.env.EMAIL_FROM || '';
  const domain = extractDomainFromEmail(emailFrom);
  const isRedirectActive = Boolean(process.env.EMAIL_REDIRECT_TO && process.env.EMAIL_REDIRECT_TO.trim());
  const dailyLimit = Number(process.env.EMAIL_DAILY_LIMIT) || 90;

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [sentLast24Hours, pendingCount, failedCount] = await Promise.all([
    EmailOutbox.countDocuments({
      status: 'sent',
      sentAt: { $gte: twentyFourHoursAgo },
    }),
    EmailOutbox.countDocuments({ status: 'pending' }),
    EmailOutbox.countDocuments({ status: 'failed' }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Status konfigurasi email berhasil diambil',
    data: {
      provider: config.provider,
      mode: config.mode,
      ready: config.ready,
      reason: config.reason,
      emailFromDomain: domain || null,
      isRedirectActive,
      sentLast24Hours,
      dailyLimit,
      pendingCount,
      failedCount,
    },
  });
});

/**
 * 5. POST /api/admin/emails/test
 * Mengirim email uji ke alamat admin yang sedang login
 */
const sendTestEmail = asyncHandler(async (req, res) => {
  const config = getEmailConfigStatus();
  if (!config.ready) {
    throw new AppError(
      `Layanan email belum siap: ${config.reason || 'Konfigurasi tidak lengkap'}`,
      400
    );
  }

  const adminEmail = req.user?.email;
  if (!adminEmail) {
    throw new AppError('Email admin tidak teridentifikasi pada sesi login', 400);
  }

  const provider = getProvider();
  const isRedirectActive = Boolean(process.env.EMAIL_REDIRECT_TO && process.env.EMAIL_REDIRECT_TO.trim());
  let targetTo = adminEmail;
  let subject = 'Uji Coba Pengiriman Email - Kalila Organizer';

  if (isRedirectActive) {
    targetTo = process.env.EMAIL_REDIRECT_TO.trim();
    subject = `[UJI] ${subject}`;
  }

  const from = process.env.EMAIL_FROM || 'Kalila <noreply@resend.dev>';
  const html = `
    <div style="font-family:sans-serif;padding:20px;border:1px solid #E5E7EB;border-radius:8px;">
      <h2 style="color:#161210;">Uji Coba Konfigurasi Email Kalila</h2>
      <p>Halo <strong>${req.user.name || 'Admin'}</strong>,</p>
      <p>Ini adalah email pengujian untuk memverifikasi bahwa konfigurasi provider <strong>${provider.name}</strong> berfungsi dengan baik.</p>
      <p style="font-size:12px;color:#6B7280;">Waktu Pengiriman: ${new Date().toISOString()}</p>
    </div>
  `;
  const text = `Halo ${req.user.name || 'Admin'},\nIni adalah email pengujian untuk memverifikasi konfigurasi provider ${provider.name}.\nWaktu: ${new Date().toISOString()}`;

  const sendResult = await provider.sendEmail({
    from,
    to: targetTo,
    subject,
    html,
    text,
    idempotencyKey: `test-${req.user._id}-${Date.now()}`,
    type: 'test_email',
  });

  if (!sendResult.success) {
    throw new AppError(
      `Pengiriman email uji gagal: ${sendResult.error || 'Kesalahan pada provider email'}`,
      502
    );
  }

  let note = 'Email pengujian berhasil dikirim.';
  if (config.mode === 'sandbox') {
    note += ' Perhatian: Pada mode sandbox (resend.dev), email hanya berhasil terkirim ke alamat email yang terdaftar pada akun Resend Anda.';
  }

  res.status(200).json({
    success: true,
    message: note,
    data: {
      provider: provider.name,
      to: maskEmail(targetTo),
      messageId: sendResult.messageId || null,
      mode: config.mode,
    },
  });
});

module.exports = {
  getEmails,
  getEmailById,
  retryEmail,
  getEmailStatus,
  sendTestEmail,
  escapeRegex,
};

