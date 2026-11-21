/**
 * Background Job: Pemrosesan Antrean Email Outbox
 * Dijalankan terjadwal setiap menit melalui node-cron.
 */

const EmailOutbox = require('../models/EmailOutbox');
const { getEmailConfigStatus } = require('../services/email/emailConfig');
const { getProvider } = require('../services/email/emailService');

const BACKOFF_MINUTES = [1, 5, 15, 60, 240];
const MAX_ATTEMPTS = 5;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Memproses antrean email outbox
 * @param {Date} [now=new Date()]
 */
async function processEmailOutbox(now = new Date()) {
  try {
    const configStatus = getEmailConfigStatus();
    if (!configStatus.ready) {
      console.warn(
        `[Email Outbox Job] Pengiriman email ditangguhkan: ${configStatus.reason}`
      );
      return { processed: 0, sent: 0, failed: 0, reason: configStatus.reason };
    }

    const dailyLimit = Number(process.env.EMAIL_DAILY_LIMIT) || 90;
    const batchSize = Number(process.env.EMAIL_BATCH_PER_TICK) || 5;

    // 1. Pemulihan item yang terkunci / menggantung (stale locks > 5 menit)
    await EmailOutbox.updateMany(
      {
        status: 'sending',
        lockedUntil: { $lt: now },
      },
      {
        status: 'pending',
        lockedUntil: null,
      }
    );

    // 2. Pemeriksaan batas harian (24 jam terakhir)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sentCount24h = await EmailOutbox.countDocuments({
      status: 'sent',
      sentAt: { $gte: twentyFourHoursAgo },
    });

    if (sentCount24h >= dailyLimit) {
      console.warn(
        `[Email Outbox Job] Batas harian email tercapai (${sentCount24h}/${dailyLimit}). Pengiriman ditunda.`
      );
      return {
        processed: 0,
        sent: 0,
        failed: 0,
        reason: 'daily_limit_reached',
        sentCount24h,
      };
    }

    // 3. Ambil item berstatus pending dengan nextAttemptAt <= now
    const pendingItems = await EmailOutbox.find({
      status: 'pending',
      nextAttemptAt: { $lte: now },
    })
      .sort({ priority: 1, createdAt: 1 })
      .limit(batchSize)
      .lean();

    if (pendingItems.length === 0) {
      return { processed: 0, sent: 0, failed: 0 };
    }

    const provider = getProvider();
    let sentSuccessCount = 0;
    let failedCount = 0;

    for (const item of pendingItems) {
      // 4. Klaim atomik: pending -> sending dengan lockedUntil 5 menit
      const claimed = await EmailOutbox.findOneAndUpdate(
        { _id: item._id, status: 'pending' },
        {
          status: 'sending',
          lockedUntil: new Date(now.getTime() + 5 * 60 * 1000),
        },
        { returnDocument: 'after' }
      );

      if (!claimed) {
        // Sudah diklaim proses lain
        continue;
      }

      // Periksa notAfter: bila sudah lewat, tandai skipped dan jangan dikirim
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
        continue;
      }

      // 5. Kirim via provider aktif
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
        sentSuccessCount++;
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

        await EmailOutbox.updateOne(
          { _id: claimed._id },
          updateData
        );
      } else if (sendResult.retryable) {
        const nextAttempts = (claimed.attempts || 0) + 1;
        const cleanError = (sendResult.error || 'Retryable delivery error').slice(0, 300);

        if (nextAttempts >= MAX_ATTEMPTS) {
          failedCount++;
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
          await EmailOutbox.updateOne(
            { _id: claimed._id },
            updateData
          );
        } else {
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
        }
      } else {
        // Kesalahan permanen (non-retryable, mis. 4xx)
        failedCount++;
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

        await EmailOutbox.updateOne(
          { _id: claimed._id },
          updateData
        );
      }

      // Jeda 600 ms antar pengiriman agar menghormati rate limit provider Resend
      await sleep(600);
    }

    if (sentSuccessCount > 0 || failedCount > 0) {
      console.log(
        `[Email Outbox Job] Putaran selesai: ${sentSuccessCount} terkirim, ${failedCount} gagal/permanen.`
      );
    }

    return {
      processed: pendingItems.length,
      sent: sentSuccessCount,
      failed: failedCount,
    };
  } catch (err) {
    console.error('[Email Outbox Job Error] Putaran job gagal:', err.message);
    return { processed: 0, sent: 0, failed: 0, error: err.message };
  }
}

module.exports = {
  processEmailOutbox,
  BACKOFF_MINUTES,
  MAX_ATTEMPTS,
};

