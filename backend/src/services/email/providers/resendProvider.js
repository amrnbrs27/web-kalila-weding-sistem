/**
 * Adapter provider email menggunakan Resend API
 */

const { Resend } = require('resend');

function createResendProvider(options = {}) {
  const apiKey = options.apiKey || process.env.RESEND_API_KEY;
  const client = options.client || (apiKey ? new Resend(apiKey) : null);
  const timeoutMs = options.timeoutMs || 15000;

  async function sendEmail({ from, to, subject, html, text, replyTo, idempotencyKey }) {
    if (!client) {
      return {
        success: false,
        retryable: false,
        error: 'Klien Resend belum diinisialisasi atau RESEND_API_KEY kosong',
      };
    }

    const toArray = Array.isArray(to) ? to : [to];
    const payload = {
      from,
      to: toArray,
      subject,
      html,
      text,
    };

    if (replyTo) {
      payload.reply_to = replyTo;
    }

    const controller = new AbortController();
    let timer = null;

    try {
      const requestOptions = {
        signal: controller.signal,
        idempotencyKey,
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      };

      const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
          const timeoutErr = new Error(
            `Request timeout ke Resend API (melebihi ${timeoutMs / 1000} detik)`
          );
          timeoutErr.name = 'TimeoutError';
          controller.abort(timeoutErr);
          reject(timeoutErr);
        }, timeoutMs);
      });

      const sendPromise = client.emails.send(payload, requestOptions);
      const result = await Promise.race([sendPromise, timeoutPromise]);
      clearTimeout(timer);

      if (result && result.error) {
        const statusCode = result.error.statusCode;
        const msg = result.error.message || 'Resend error';

        // Klasifikasi error: 429 atau 5xx atau status null (network) -> retryable
        const isRetryable =
          statusCode === 429 ||
          (typeof statusCode === 'number' && statusCode >= 500) ||
          statusCode === null ||
          statusCode === undefined;

        return {
          success: false,
          retryable: isRetryable,
          error: (typeof msg === 'string' ? msg : JSON.stringify(msg)).slice(0, 300),
          statusCode,
        };
      }

      if (result && result.data && result.data.id) {
        return {
          success: true,
          messageId: result.data.id,
        };
      }

      return {
        success: false,
        retryable: false,
        error: 'Resend API tidak mengembalikan ID pesan yang valid',
      };
    } catch (err) {
      clearTimeout(timer);
      const isTimeout = controller.signal.aborted || /timeout/i.test(err.message);
      return {
        success: false,
        retryable: true, // timeout atau exception jaringan dapat diulang
        error: (err.message || 'Network exception saat memanggil Resend').slice(0, 300),
        isTimeout,
      };
    }
  }

  return {
    name: 'resend',
    sendEmail,
    getClient: () => client,
  };
}

module.exports = {
  createResendProvider,
};
