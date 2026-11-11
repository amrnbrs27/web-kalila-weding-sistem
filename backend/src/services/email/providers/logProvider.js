/**
 * Provider Log: mencetak ringkasan ke konsol tanpa menampilkan isi email penuh
 * Digunakan untuk lingkungan development lokal tanpa kuota Resend.
 */

function maskEmail(email) {
  if (!email || typeof email !== 'string') return '***';
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const [local, domain] = parts;
  if (local.length <= 2) {
    return `${local[0] || '*'}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

function createLogProvider() {
  async function sendEmail({ to, subject, idempotencyKey, type }) {
    const toStr = Array.isArray(to) ? to.join(', ') : to;
    const masked = toStr
      .split(',')
      .map((e) => maskEmail(e.trim()))
      .join(', ');

    console.log(
      `[Email Log] Type: ${type || '-'} | To: ${masked} | Subject: "${subject}" | Key: ${idempotencyKey || '-'}`
    );

    return {
      success: true,
      messageId: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
  }

  return {
    name: 'log',
    sendEmail,
    maskEmail,
  };
}

module.exports = {
  createLogProvider,
  maskEmail,
};

