/**
 * Pustaka template email Kalila (HTML & Plain Text)
 * Fungsi murni tanpa library eksternal.
 * Menegakkan sanitasi input pengguna, tanggal zona waktu WIB, dan subject aman tanpa user-input.
 */

const { adminOrderUrl, adminPaymentsUrl, customerOrderUrl } = require('../../../config/emailLinks');

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const MONTHS_SHORT_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatRupiah(num) {
  if (num === null || num === undefined) return '';
  return 'Rp' + Number(num).toLocaleString('id-ID');
}

function getCategoryLabel(category) {
  const map = {
    dekor: 'Dekor',
    catering: 'Catering',
    wedding: 'Wedding',
  };
  return map[category] || (category ? category.charAt(0).toUpperCase() + category.slice(1) : '-');
}

/**
 * Format string tanggal "YYYY-MM-DD" menjadi "Kamis, 12 November 2026"
 */
function formatDateId(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '-';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  const d = new Date(Date.UTC(year, month - 1, day));
  const dayName = DAYS_ID[d.getUTCDay()];
  const monthName = MONTHS_ID[month - 1] || '';
  return `${dayName}, ${day} ${monthName} ${year}`;
}

/**
 * Format string tanggal "YYYY-MM-DD" menjadi "12 Nov 2026" (dipakai di Subject)
 */
function formatDateShortId(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '-';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  const monthShort = MONTHS_SHORT_ID[month - 1] || '';
  return `${day} ${monthShort} ${year}`;
}

/**
 * Format Date object ke dalam WIB "12 November 2026 pukul 14.30 WIB"
 */
function formatDateTimeWIB(dateObj) {
  if (!dateObj) return '-';
  const dt = dateObj instanceof Date ? dateObj : new Date(dateObj);
  if (isNaN(dt.getTime())) return '-';

  // Offset WIB adalah UTC+7 (7 * 3600 * 1000 ms)
  const wibTime = new Date(dt.getTime() + 7 * 3600 * 1000);
  const day = wibTime.getUTCDate();
  const month = MONTHS_ID[wibTime.getUTCMonth()];
  const year = wibTime.getUTCFullYear();
  const hours = String(wibTime.getUTCHours()).padStart(2, '0');
  const minutes = String(wibTime.getUTCMinutes()).padStart(2, '0');

  return `${day} ${month} ${year} pukul ${hours}.${minutes} WIB`;
}

function wrapBaseHtml(contentHtml, businessName = 'Kalila') {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(businessName)}</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1F2937;line-height:1.5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
    <!-- Header -->
    <tr>
      <td style="background-color:#161210;padding:24px 28px;text-align:left;border-bottom:2px solid #C5A265;">
        <h2 style="margin:0;font-size:20px;font-weight:700;letter-spacing:0.04em;color:#FFFFFF;text-transform:uppercase;">
          ${escapeHtml(businessName)}
        </h2>
      </td>
    </tr>
    <!-- Content Body -->
    <tr>
      <td style="padding:28px;">
        ${contentHtml}
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:20px 28px;background-color:#FAFAFA;border-top:1px solid #E5E7EB;text-align:center;font-size:12px;color:#6B7280;">
        <p style="margin:0;">Email ini dikirim otomatis oleh sistem ${escapeHtml(businessName)}. Mohon jangan membalas langsung ke alamat ini.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Template: booking_created_admin
 */
function renderBookingCreatedAdmin(booking, setting = {}) {
  const businessName = setting.businessName || 'Kalila';
  const categoryLabel = getCategoryLabel(booking.category);
  const eventDateStr = formatDateId(booking.eventDate);
  const eventDateShort = formatDateShortId(booking.eventDate);
  const deadlineStr = formatDateTimeWIB(booking.expiresAt);
  const packageName = booking.packageSnapshot?.name || '-';
  const customerName = booking.customerSnapshot?.name || '-';
  const customerPhone = booking.customerSnapshot?.phone || '-';
  const eventName = booking.eventName || '-';
  const location = booking.location || '-';
  const guestCount = booking.guestCount ? `${booking.guestCount} orang` : '-';
  const notes = booking.notes || '-';
  const dashboardUrl = adminOrderUrl(booking._id);

  const subject = `Pesanan baru ${booking.bookingNumber} - ${categoryLabel} - ${eventDateShort}`;

  const html = wrapBaseHtml(`
    <h3 style="margin:0 0 16px 0;font-size:18px;color:#111827;">Pesanan Baru Masuk dari Website</h3>
    <p style="margin:0 0 16px 0;font-size:14px;color:#4B5563;">
      Ada pesanan baru dengan nomor <strong>${escapeHtml(booking.bookingNumber)}</strong>. Pembayaran belum diterima dan tanggal acara <strong>belum terkunci</strong>.
    </p>

    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <tr>
        <td style="padding:8px 0;color:#6B7280;width:38%;">Nomor Pesanan</td>
        <td style="padding:8px 0;font-weight:600;color:#111827;">${escapeHtml(booking.bookingNumber)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Kategori / Paket</td>
        <td style="padding:8px 0;font-weight:600;color:#111827;">${escapeHtml(categoryLabel)} - ${escapeHtml(packageName)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Tanggal Acara</td>
        <td style="padding:8px 0;font-weight:600;color:#111827;">${escapeHtml(eventDateStr)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Nama Acara</td>
        <td style="padding:8px 0;color:#111827;">${escapeHtml(eventName)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Lokasi Acara</td>
        <td style="padding:8px 0;color:#111827;">${escapeHtml(location)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Jumlah Tamu</td>
        <td style="padding:8px 0;color:#111827;">${escapeHtml(guestCount)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Nama Pemesan</td>
        <td style="padding:8px 0;font-weight:600;color:#111827;">${escapeHtml(customerName)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">No. Telepon/WA</td>
        <td style="padding:8px 0;color:#111827;">${escapeHtml(customerPhone)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Batas Waktu DP</td>
        <td style="padding:8px 0;color:#B91C1C;font-weight:600;">${escapeHtml(deadlineStr)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;vertical-align:top;">Catatan</td>
        <td style="padding:8px 0;color:#111827;">${escapeHtml(notes)}</td>
      </tr>
    </table>

    <div style="margin:24px 0 12px 0;text-align:center;">
      <a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background-color:#161210;color:#FFFFFF;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;border:1px solid #C5A265;">
        Buka di Dashboard Admin
      </a>
    </div>
  `, businessName);

  const text = `PESANAN BARU MASUK DARI WEBSITE
-----------------------------------------
Nomor Pesanan  : ${booking.bookingNumber}
Kategori/Paket : ${categoryLabel} - ${packageName}
Tanggal Acara  : ${eventDateStr}
Nama Acara     : ${eventName}
Lokasi         : ${location}
Jumlah Tamu    : ${guestCount}
Pemesan        : ${customerName} (${customerPhone})
Batas Waktu DP : ${deadlineStr}
Catatan        : ${notes}

Perhatian: Pembayaran belum diterima dan tanggal acara belum terkunci.
Buka pesanan di dashboard: ${dashboardUrl}
`;

  return { subject, html, text };
}

/**
 * 2. Template: booking_created_owner
 */
function renderBookingCreatedOwner(booking, setting = {}) {
  const businessName = setting.businessName || 'Kalila';
  const categoryLabel = getCategoryLabel(booking.category);
  const eventDateStr = formatDateId(booking.eventDate);
  const eventDateShort = formatDateShortId(booking.eventDate);
  const packageName = booking.packageSnapshot?.name || '-';
  const customerName = booking.customerSnapshot?.name || '-';
  const customerPhone = booking.customerSnapshot?.phone || '-';
  const location = booking.location || '-';

  const subject = `Pesanan baru ${booking.bookingNumber} - ${categoryLabel} - ${eventDateShort}`;

  const html = wrapBaseHtml(`
    <h3 style="margin:0 0 16px 0;font-size:18px;color:#111827;">Ringkasan Pesanan Baru (Owner)</h3>
    <p style="margin:0 0 16px 0;font-size:14px;color:#4B5563;">
      Berikut adalah ringkasan pesanan baru yang baru saja dibuat pelanggan melalui website.
    </p>

    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <tr>
        <td style="padding:8px 0;color:#6B7280;width:38%;">Nomor Pesanan</td>
        <td style="padding:8px 0;font-weight:600;color:#111827;">${escapeHtml(booking.bookingNumber)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Kategori</td>
        <td style="padding:8px 0;color:#111827;">${escapeHtml(categoryLabel)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Paket</td>
        <td style="padding:8px 0;font-weight:600;color:#111827;">${escapeHtml(packageName)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Tanggal Acara</td>
        <td style="padding:8px 0;font-weight:600;color:#111827;">${escapeHtml(eventDateStr)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Lokasi</td>
        <td style="padding:8px 0;color:#111827;">${escapeHtml(location)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Pelanggan</td>
        <td style="padding:8px 0;font-weight:600;color:#111827;">${escapeHtml(customerName)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">No. Telepon</td>
        <td style="padding:8px 0;color:#111827;">${escapeHtml(customerPhone)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Status</td>
        <td style="padding:8px 0;font-weight:600;color:#D97706;">Menunggu pembayaran DP</td>
      </tr>
    </table>
  `, businessName);

  const text = `RINGKASAN PESANAN BARU (OWNER)
-----------------------------------------
Nomor Pesanan : ${booking.bookingNumber}
Kategori      : ${categoryLabel}
Paket         : ${packageName}
Tanggal Acara : ${eventDateStr}
Lokasi        : ${location}
Pelanggan     : ${customerName} (${customerPhone})
Status        : Menunggu pembayaran DP
`;

  return { subject, html, text };
}

/**
 * 3. Template: payment_proof_admin
 */
function renderPaymentProofAdmin(booking, payment = {}, setting = {}) {
  const businessName = setting.businessName || 'Kalila';
  const amountStr = formatRupiah(payment.amount || booking.dpAmount || 1000000);
  const eventDateStr = formatDateId(booking.eventDate);
  const packageName = booking.packageSnapshot?.name || '-';
  const customerName = booking.customerSnapshot?.name || '-';
  const maxAttempts = setting.maxProofAttempts || 3;
  const currentAttempt = payment.attempt || booking.proofAttempts || 1;
  const uploadTimeStr = formatDateTimeWIB(payment.createdAt || new Date());
  const paymentsUrl = adminPaymentsUrl();

  const subject = `Bukti transfer masuk ${booking.bookingNumber} - ${amountStr}`;

  const html = wrapBaseHtml(`
    <h3 style="margin:0 0 16px 0;font-size:18px;color:#111827;">Bukti Transfer Masuk Menunggu Verifikasi</h3>
    <p style="margin:0 0 16px 0;font-size:14px;color:#4B5563;">
      Pelanggan telah mengunggah bukti transfer DP untuk pesanan <strong>${escapeHtml(booking.bookingNumber)}</strong>.
    </p>

    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <tr>
        <td style="padding:8px 0;color:#6B7280;width:38%;">Nomor Pesanan</td>
        <td style="padding:8px 0;font-weight:600;color:#111827;">${escapeHtml(booking.bookingNumber)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Nama Pelanggan</td>
        <td style="padding:8px 0;font-weight:600;color:#111827;">${escapeHtml(customerName)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Paket</td>
        <td style="padding:8px 0;color:#111827;">${escapeHtml(packageName)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Tanggal Acara</td>
        <td style="padding:8px 0;font-weight:600;color:#111827;">${escapeHtml(eventDateStr)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Nominal DP</td>
        <td style="padding:8px 0;font-weight:700;color:#16A34A;">${escapeHtml(amountStr)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Percobaan Unggah</td>
        <td style="padding:8px 0;color:#111827;">Unggahan ke-${currentAttempt} dari maksimal ${maxAttempts}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Waktu Unggah</td>
        <td style="padding:8px 0;color:#111827;">${escapeHtml(uploadTimeStr)}</td>
      </tr>
    </table>

    <div style="background-color:#F3F4F6;padding:12px 16px;border-radius:8px;font-size:13px;color:#4B5563;margin:16px 0;">
      Demi keamanan dan privasi data nasabah, bukti transfer tidak dilampirkan dalam email dan hanya dapat dilihat langsung pada dashboard admin.
    </div>

    <div style="margin:24px 0 12px 0;text-align:center;">
      <a href="${paymentsUrl}" style="display:inline-block;padding:12px 24px;background-color:#161210;color:#FFFFFF;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;border:1px solid #C5A265;">
        Buka Antrean Verifikasi
      </a>
    </div>
  `, businessName);

  const text = `BUKTI TRANSFER MASUK
-----------------------------------------
Nomor Pesanan    : ${booking.bookingNumber}
Pelanggan        : ${customerName}
Paket            : ${packageName}
Tanggal Acara    : ${eventDateStr}
Nominal DP       : ${amountStr}
Percobaan        : Unggahan ke-${currentAttempt} dari maksimal ${maxAttempts}
Waktu Unggah     : ${uploadTimeStr}

Catatan Keamanan: Bukti transfer disimpan privat dan hanya dapat dilihat di dashboard admin.
Buka antrean verifikasi: ${paymentsUrl}
`;

  return { subject, html, text };
}

/**
 * 4. Template: booking_confirmed_customer
 */
function renderBookingConfirmedCustomer(booking, setting = {}) {
  const businessName = setting.businessName || 'Kalila';
  const customerName = booking.customerSnapshot?.name || 'Pelanggan';
  const packageName = booking.packageSnapshot?.name || '-';
  const eventDateStr = formatDateId(booking.eventDate);
  const location = booking.location || '-';
  const dpAmount = booking.dpAmount || 1000000;
  const dpStr = formatRupiah(dpAmount);

  // Perhitungan total harga dan sisa pelunasan
  const hasTotalPrice = typeof booking.totalPrice === 'number' && booking.totalPrice > 0;
  const totalPriceStr = hasTotalPrice ? formatRupiah(booking.totalPrice) : null;
  const remainingStr = hasTotalPrice ? formatRupiah(Math.max(0, booking.totalPrice - dpAmount)) : null;

  const orderUrl = customerOrderUrl(booking._id);
  const adminWa = setting.adminWhatsapp ? setting.adminWhatsapp.trim() : '';

  let waButtonHtml = '';
  let waTextSection = '';

  if (adminWa) {
    const waText = encodeURIComponent(`Halo admin, saya ingin konfirmasi pesanan ${booking.bookingNumber} (${packageName}).`);
    const waUrl = `https://wa.me/${adminWa}?text=${waText}`;

    waButtonHtml = `
      <div style="margin:16px 0;">
        <a href="${waUrl}" style="display:inline-block;padding:12px 24px;background-color:#25D366;color:#FFFFFF;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
          Hubungi Admin via WhatsApp
        </a>
      </div>
    `;
    waTextSection = `Hubungi Admin WhatsApp: https://wa.me/${adminWa}?text=${waText}`;
  } else {
    waButtonHtml = `
      <p style="margin:16px 0;font-size:14px;color:#4B5563;">
        Untuk koordinasi lebih lanjut, silakan hubungi admin kami melalui kontak resmi yang tersedia.
      </p>
    `;
    waTextSection = 'Untuk koordinasi lebih lanjut, hubungi kontak resmi admin Kalila.';
  }

  const subject = `Pesanan ${booking.bookingNumber} dikonfirmasi`;

  const billingRowHtml = hasTotalPrice
    ? `
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Total Harga</td>
        <td style="padding:8px 0;color:#111827;">${escapeHtml(totalPriceStr)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Sisa Pelunasan</td>
        <td style="padding:8px 0;font-weight:700;color:#B91C1C;">${escapeHtml(remainingStr)}</td>
      </tr>
    `
    : `
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Total &amp; Sisa Pelunasan</td>
        <td style="padding:8px 0;color:#4B5563;font-style:italic;">Total harga dan sisa pelunasan akan diinformasikan lebih lanjut oleh admin kami.</td>
      </tr>
    `;

  const billingText = hasTotalPrice
    ? `Total Harga   : ${totalPriceStr}\nSisa Pelunasan: ${remainingStr}`
    : 'Total & Sisa  : Total harga dan sisa pelunasan akan diinformasikan oleh admin.';

  const html = wrapBaseHtml(`
    <h3 style="margin:0 0 16px 0;font-size:18px;color:#111827;">Halo ${escapeHtml(customerName)}, Pesanan Anda Telah Dikonfirmasi!</h3>
    <p style="margin:0 0 16px 0;font-size:14px;color:#4B5563;">
      Terima kasih telah mempercayakan acara spesial Anda kepada ${escapeHtml(businessName)}. Pembayaran DP Anda telah kami terima dan diverifikasi. Tanggal acara Anda kini telah terkonfirmasi.
    </p>

    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <tr>
        <td style="padding:8px 0;color:#6B7280;width:38%;">Nomor Pesanan</td>
        <td style="padding:8px 0;font-weight:600;color:#111827;">${escapeHtml(booking.bookingNumber)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Paket</td>
        <td style="padding:8px 0;font-weight:600;color:#111827;">${escapeHtml(packageName)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Tanggal Acara</td>
        <td style="padding:8px 0;font-weight:600;color:#111827;">${escapeHtml(eventDateStr)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">Lokasi</td>
        <td style="padding:8px 0;color:#111827;">${escapeHtml(location)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;">DP Diterima</td>
        <td style="padding:8px 0;font-weight:700;color:#16A34A;">${escapeHtml(dpStr)}</td>
      </tr>
      ${billingRowHtml}
    </table>

    <p style="margin:16px 0 8px 0;font-size:14px;color:#4B5563;">
      Pelunasan sisa pembayaran akan diatur dan dihubungi langsung oleh admin kami melalui WhatsApp sebelum tanggal pelaksanaan acara.
    </p>

    <div style="margin:24px 0 16px 0;text-align:center;">
      <a href="${orderUrl}" style="display:inline-block;padding:12px 24px;background-color:#161210;color:#FFFFFF;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;border:1px solid #C5A265;margin-bottom:8px;">
        Lihat Detail Pesanan
      </a>
      ${waButtonHtml}
    </div>
  `, businessName);

  const text = `PESANAN DIKONFIRMASI - ${businessName.toUpperCase()}
-----------------------------------------
Halo ${customerName},
Pembayaran DP pesanan Anda (${booking.bookingNumber}) telah diverifikasi.
Paket         : ${packageName}
Tanggal Acara : ${eventDateStr}
Lokasi        : ${location}
DP Diterima   : ${dpStr}
${billingText}

Pelunasan sisa pembayaran akan dihubungi langsung oleh admin lewat WhatsApp.
Lihat Pesanan : ${orderUrl}
${waTextSection}
`;

  return { subject, html, text };
}

module.exports = {
  renderBookingCreatedAdmin,
  renderBookingCreatedOwner,
  renderPaymentProofAdmin,
  renderBookingConfirmedCustomer,
  formatDateId,
  formatDateShortId,
  formatDateTimeWIB,
  formatRupiah,
  getCategoryLabel,
  escapeHtml,
};

