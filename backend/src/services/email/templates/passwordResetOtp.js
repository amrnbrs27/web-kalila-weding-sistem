/**
 * Template Email OTP Reset Password
 * Keamanan:
 * - Subject statis "Kode OTP reset password" (tanpa OTP, tanpa nama, tanpa input pengguna).
 * - Tidak memuat tautan atau tombol apa pun.
 * - Sapaan nama di-escape untuk mencegah HTML injection.
 * - Sedia versi HTML dan versi Plain Text.
 */

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderPasswordResetOtp({ name = 'Pengguna', otp, expiresInMinutes = 10, businessName = 'Kalila' } = {}) {
  const safeName = escapeHtml(name || 'Pengguna');
  const safeBusinessName = escapeHtml(businessName || 'Kalila');
  const safeOtp = escapeHtml(otp || '');
  const safeMinutes = Number(expiresInMinutes) || 10;

  const subject = 'Kode OTP reset password';

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeBusinessName}</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1F2937;line-height:1.5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;margin:0 auto;background-color:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
    <tr>
      <td style="background-color:#161210;padding:20px 24px;text-align:left;border-bottom:2px solid #C5A265;">
        <h2 style="margin:0;font-size:18px;font-weight:700;letter-spacing:0.04em;color:#FFFFFF;text-transform:uppercase;">
          ${safeBusinessName}
        </h2>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 24px;">
        <p style="margin:0 0 16px;font-size:15px;color:#374151;">Halo <strong>${safeName}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#4B5563;">
          Kami menerima permintaan reset password untuk akun Anda. Gunakan kode OTP 6 angka berikut untuk melanjutkan:
        </p>
        <div style="text-align:center;margin:24px 0;">
          <span style="display:inline-block;padding:14px 28px;font-size:32px;font-weight:700;letter-spacing:10px;background-color:#F3F4F6;color:#111827;border-radius:8px;border:1px solid #D1D5DB;font-family:Consolas,Monaco,monospace;">${safeOtp}</span>
        </div>
        <p style="margin:0 0 16px;font-size:14px;color:#4B5563;">
          Kode OTP ini berlaku selama <strong>${safeMinutes} menit</strong>.
        </p>
        <div style="padding:12px 16px;background-color:#FEF2F2;border-left:4px solid #EF4444;border-radius:4px;margin:20px 0;">
          <p style="margin:0;font-size:13px;color:#991B1B;line-height:1.4;">
            <strong>Penting:</strong> Jangan bagikan kode OTP ini kepada siapa pun, termasuk pihak yang mengaku dari ${safeBusinessName}. Petugas kami tidak pernah meminta kode OTP Anda.
          </p>
        </div>
        <p style="margin:20px 0 0;font-size:13px;color:#6B7280;">
          Jika Anda tidak memintanya, abaikan email ini. Password akun Anda tidak akan berubah.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 24px;background-color:#FAFAFA;border-top:1px solid #E5E7EB;text-align:center;font-size:12px;color:#6B7280;">
        <p style="margin:0;">Email ini dikirim otomatis oleh sistem ${safeBusinessName}. Mohon jangan membalas langsung ke alamat ini.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Halo ${name || 'Pengguna'},

Kami menerima permintaan reset password untuk akun Anda. Gunakan kode OTP 6 angka berikut untuk melanjutkan:

${otp || ''}

Kode OTP ini berlaku selama ${safeMinutes} menit.

Penting: Jangan bagikan kode OTP ini kepada siapa pun, termasuk pihak yang mengaku dari ${businessName || 'Kalila'}. Petugas kami tidak pernah meminta kode OTP Anda.

Jika Anda tidak memintanya, abaikan email ini. Password akun Anda tidak akan berubah.

--
${businessName || 'Kalila'}`;

  return { subject, html, text };
}

module.exports = {
  renderPasswordResetOtp,
};

