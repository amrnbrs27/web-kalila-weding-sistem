/**
 * Service utama untuk pengelolaan antrean email (Outbox) dan penyedia provider
 */

const EmailOutbox = require('../../models/EmailOutbox');
const Setting = require('../../models/Setting');
const { getEmailConfigStatus } = require('./emailConfig');
const { createResendProvider } = require('./providers/resendProvider');
const { createLogProvider } = require('./providers/logProvider');
const { createMemoryProvider } = require('./providers/memoryProvider');
const { getEffectiveRecipients } = require('./recipientService');
const {
  renderBookingCreatedAdmin,
  renderBookingCreatedOwner,
  renderPaymentProofAdmin,
  renderBookingConfirmedCustomer,
  renderPasswordResetOtp,
} = require('./templates');

let activeMemoryProvider = null;

function setMemoryProviderInstance(instance) {
  activeMemoryProvider = instance;
}

function getMemoryProviderInstance() {
  if (!activeMemoryProvider) {
    activeMemoryProvider = createMemoryProvider();
  }
  return activeMemoryProvider;
}

/**
 * Mendapatkan instance provider email yang aktif berdasarkan environment
 */
function getProvider() {
  const providerType = (process.env.EMAIL_PROVIDER || 'log').toLowerCase().trim();

  if (providerType === 'memory') {
    return getMemoryProviderInstance();
  }

  if (providerType === 'resend') {
    return createResendProvider();
  }

  return createLogProvider();
}

/**
 * Menambahkan item email ke antrean (Outbox) dengan penanganan deduplikasi atomik
 */
async function enqueue(item, { session } = {}) {
  const emailRedirectTo = process.env.EMAIL_REDIRECT_TO
    ? process.env.EMAIL_REDIRECT_TO.trim().toLowerCase()
    : null;

  let targetTo = (item.to || '').trim().toLowerCase();
  let originalTo = null;
  let targetSubject = item.subject || '';

  if (emailRedirectTo) {
    originalTo = targetTo;
    targetTo = emailRedirectTo;
    targetSubject = `[UJI] ${targetSubject}`;
  }

  const status = item.status || 'pending';
  const now = new Date();
  let purgeAt = item.purgeAt || null;

  if (status === 'skipped' && !purgeAt) {
    purgeAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  const docToInsert = {
    type: item.type,
    dedupeKey: item.dedupeKey,
    booking: item.booking || null,
    payment: item.payment || null,
    to: targetTo,
    originalTo,
    subject: targetSubject,
    html: item.html,
    text: item.text,
    replyTo: item.replyTo || null,
    priority: item.priority !== undefined ? item.priority : 1,
    notAfter: item.notAfter || null,
    status,
    attempts: item.attempts || 0,
    nextAttemptAt: item.nextAttemptAt || now,
    lockedUntil: null,
    lastError: item.lastError ? item.lastError.slice(0, 300) : null,
    purgeAt,
  };

  const options = {
    upsert: true,
    returnDocument: 'after',
    setDefaultsOnInsert: true,
  };
  if (session) {
    options.session = session;
  }

  // Menggunakan findOneAndUpdate dengan $setOnInsert agar aman dari bentrok unique key di transaction
  const outboxDoc = await EmailOutbox.findOneAndUpdate(
    { dedupeKey: item.dedupeKey },
    { $setOnInsert: docToInsert },
    options
  );

  return outboxDoc;
}

/**
 * Pemicu 1 & 2: Email Pesanan Baru untuk Admin dan Owner
 * Dibungkus try/catch agar tidak pernah menggagalkan pembuatan booking.
 */
async function triggerBookingCreatedEmails(booking, customSetting = null) {
  try {
    const setting = customSetting || (await Setting.getSettings());
    const { adminEmails, ownerEmails } = await getEffectiveRecipients(setting);

    if (adminEmails.length === 0 && ownerEmails.length === 0) {
      console.warn(
        `[Email Outbox] Peringatan: Tidak ada penerima email admin atau owner untuk pesanan ${booking.bookingNumber}`
      );
      return [];
    }

    const replyTo = setting.kontak?.email || process.env.EMAIL_REPLY_TO || null;
    const adminTemplate = renderBookingCreatedAdmin(booking, setting);
    const ownerTemplate = renderBookingCreatedOwner(booking, setting);

    const promises = [];

    // 1. Email untuk admin
    for (const email of adminEmails) {
      const dedupeKey = `booking-created:${booking._id}:${email}`;
      promises.push(
        enqueue({
          type: 'booking_created_admin',
          dedupeKey,
          booking: booking._id,
          to: email,
          subject: adminTemplate.subject,
          html: adminTemplate.html,
          text: adminTemplate.text,
          replyTo,
        })
      );
    }

    // 2. Email untuk owner
    for (const email of ownerEmails) {
      const dedupeKey = `booking-created:${booking._id}:${email}`;
      promises.push(
        enqueue({
          type: 'booking_created_owner',
          dedupeKey,
          booking: booking._id,
          to: email,
          subject: ownerTemplate.subject,
          html: ownerTemplate.html,
          text: ownerTemplate.text,
          replyTo,
        })
      );
    }

    return await Promise.all(promises);
  } catch (err) {
    console.error(
      `[Email Outbox Error] Gagal enqueue notifikasi booking baru ${booking?.bookingNumber}:`,
      err.message
    );
    return [];
  }
}

/**
 * Pemicu 3: Email Bukti Transfer Masuk untuk Admin
 * Dijalankan di dalam transaksi pembuatan Payment.
 */
async function triggerPaymentProofEmail(
  booking,
  payment,
  adminEmails,
  setting,
  { session } = {}
) {
  if (!Array.isArray(adminEmails) || adminEmails.length === 0) {
    console.warn(
      `[Email Outbox] Peringatan: Tidak ada penerima admin untuk bukti transfer ${booking.bookingNumber}`
    );
    return [];
  }

  const replyTo = setting?.kontak?.email || process.env.EMAIL_REPLY_TO || null;
  const template = renderPaymentProofAdmin(booking, payment, setting);

  const results = [];
  for (const email of adminEmails) {
    const dedupeKey = `payment-proof:${payment._id}:${email}`;
    const enqueued = await enqueue(
      {
        type: 'payment_proof_admin',
        dedupeKey,
        booking: booking._id,
        payment: payment._id,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo,
      },
      { session }
    );
    results.push(enqueued);
  }

  return results;
}

/**
 * Pemicu 4: Email Konfirmasi Pesanan untuk Pelanggan saat DP Disetujui
 * Dijalankan di dalam transaksi perubahan status pesanan menjadi terkonfirmasi.
 */
async function triggerBookingConfirmedEmail(booking, setting, { session } = {}) {
  const customerEmail = booking.customerSnapshot?.email
    ? booking.customerSnapshot.email.trim().toLowerCase()
    : '';

  const isValidEmail =
    customerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail);

  const dedupeKey = `booking-confirmed:${booking._id}`;
  const template = renderBookingConfirmedCustomer(booking, setting);
  const replyTo = setting?.kontak?.email || process.env.EMAIL_REPLY_TO || null;

  if (!isValidEmail) {
    return await enqueue(
      {
        type: 'booking_confirmed_customer',
        dedupeKey,
        booking: booking._id,
        to: 'pelanggan@unknown.local',
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo,
        status: 'skipped',
        lastError: 'Pelanggan tidak memiliki email',
        purgeAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      { session }
    );
  }

  return await enqueue(
    {
      type: 'booking_confirmed_customer',
      dedupeKey,
      booking: booking._id,
      to: customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo,
    },
    { session }
  );
}

/**
 * Mencoba mengirim email secara langsung di latar belakang sesaat setelah di-enqueue
 * Memakai klaim atomik, batas harian, dan provider aktif yang sama dengan background job.
 * Bila gagal/ditunda, item tetap 'pending' agar diambil oleh cron job.
 */
async function sendImmediateEmail(outboxDoc) {
  if (!outboxDoc || !outboxDoc._id) return null;
  const now = new Date();

  try {
    const configStatus = getEmailConfigStatus();
    if (!configStatus.ready) {
      return null;
    }

    const dailyLimit = Number(process.env.EMAIL_DAILY_LIMIT) || 90;
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sentCount24h = await EmailOutbox.countDocuments({
      status: 'sent',
      sentAt: { $gte: twentyFourHoursAgo },
    });

    if (sentCount24h >= dailyLimit) {
      return null;
    }

    // Klaim atomik: pastikan masih pending
    const claimed = await EmailOutbox.findOneAndUpdate(
      { _id: outboxDoc._id, status: 'pending' },
      {
        status: 'sending',
        lockedUntil: new Date(now.getTime() + 5 * 60 * 1000),
      },
      { returnDocument: 'after' }
    );

    if (!claimed) {
      return null;
    }

    // Cek notAfter
    if (claimed.notAfter && new Date(claimed.notAfter) < now) {
      const finishTime = new Date();
      const updateData = {
        status: 'skipped',
        lastError: 'Kedaluwarsa sebelum terkirim',
        lockedUntil: null,
        purgeAt: new Date(finishTime.getTime() + 24 * 60 * 60 * 1000),
      };
      if (claimed.type === 'password_reset_otp') {
        updateData.html = '';
        updateData.text = '';
      }
      await EmailOutbox.updateOne({ _id: claimed._id }, updateData);
      return claimed;
    }

    const provider = getProvider();
    const idempotencyKey = `outbox-${claimed._id.toString()}`;
    const sendResult = await provider.sendEmail({
      from: process.env.EMAIL_FROM || 'Kalila <noreply@resend.dev>',
      to: claimed.to,
      subject: claimed.subject,
      html: claimed.html,
      text: claimed.text,
      replyTo: claimed.replyTo,
      idempotencyKey,
      type: claimed.type,
    });

    const finishTime = new Date();
    const isOtp = claimed.type === 'password_reset_otp';

    if (sendResult.success) {
      const purgeDays = isOtp ? 1 : 30;
      const purgeAt = new Date(finishTime.getTime() + purgeDays * 24 * 60 * 60 * 1000);
      const updateData = {
        status: 'sent',
        sentAt: finishTime,
        provider: provider.name,
        providerMessageId: sendResult.messageId || null,
        lockedUntil: null,
        lastError: null,
        purgeAt,
      };
      if (isOtp) {
        updateData.html = '';
        updateData.text = '';
      }
      await EmailOutbox.updateOne({ _id: claimed._id }, updateData);
    } else if (sendResult.retryable) {
      const nextAttempts = (claimed.attempts || 0) + 1;
      const cleanError = (sendResult.error || 'Retryable delivery error').slice(0, 300);
      const BACKOFF_MINUTES = [1, 5, 15, 60, 240];
      const backoffMin = BACKOFF_MINUTES[nextAttempts - 1] || 240;
      const nextAttemptAt = new Date(finishTime.getTime() + backoffMin * 60 * 1000);

      await EmailOutbox.updateOne(
        { _id: claimed._id },
        {
          status: 'pending',
          attempts: nextAttempts,
          nextAttemptAt,
          lockedUntil: null,
          lastError: cleanError,
        }
      );
    } else {
      // Kesalahan permanen
      const nextAttempts = (claimed.attempts || 0) + 1;
      const cleanError = (sendResult.error || 'Permanent delivery error').slice(0, 300);
      const purgeDays = isOtp ? 1 : 90;
      const purgeAt = new Date(finishTime.getTime() + purgeDays * 24 * 60 * 60 * 1000);
      const updateData = {
        status: 'failed',
        attempts: nextAttempts,
        lockedUntil: null,
        lastError: cleanError,
        purgeAt,
      };
      if (isOtp) {
        updateData.html = '';
        updateData.text = '';
      }
      await EmailOutbox.updateOne({ _id: claimed._id }, updateData);
    }

    return claimed;
  } catch (err) {
    console.error('[Email Immediate Send Error] Gagal mengirim segera:', err.message);
    try {
      await EmailOutbox.updateOne(
        { _id: outboxDoc._id, status: 'sending' },
        { status: 'pending', lockedUntil: null }
      );
    } catch (_) {}
    return null;
  }
}

/**
 * Pemicu: Email OTP Reset Password untuk Pengguna
 */
async function triggerPasswordResetOtpEmail({
  user,
  passwordReset,
  otp,
  expiresInMinutes = 10,
  setting = null,
  immediate = true,
}) {
  try {
    const businessName = setting?.businessName || 'Kalila';
    const template = renderPasswordResetOtp({
      name: user.name,
      otp,
      expiresInMinutes,
      businessName,
    });

    const replyTo = setting?.kontak?.email || process.env.EMAIL_REPLY_TO || null;
    const dedupeKey = `password-reset:${passwordReset._id.toString()}`;

    const enqueued = await enqueue({
      type: 'password_reset_otp',
      dedupeKey,
      booking: null,
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo,
      priority: 0,
      notAfter: passwordReset.otpExpiresAt,
    });

    if (immediate && enqueued && enqueued.status === 'pending') {
      try {
        await sendImmediateEmail(enqueued);
      } catch (err) {
        console.error('[Email Outbox] Kesalahan immediate send OTP:', err.message);
      }
    }

    return enqueued;
  } catch (err) {
    console.error('[Email Outbox Error] Gagal enqueue OTP reset password:', err.message);
    return null;
  }
}

module.exports = {
  getProvider,
  enqueue,
  triggerBookingCreatedEmails,
  triggerPaymentProofEmail,
  triggerBookingConfirmedEmail,
  triggerPasswordResetOtpEmail,
  sendImmediateEmail,
  setMemoryProviderInstance,
  getMemoryProviderInstance,
};

