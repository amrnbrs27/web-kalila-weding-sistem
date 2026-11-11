/**
 * Konfigurasi URL terpusat untuk tautan di dalam email.
 * CATATAN PENTING: Pola URL di bawah ini adalah asumsi awal dan harus
 * diselaraskan dengan rute halaman yang diterapkan pada aplikasi Frontend.
 */

function getPublicBaseUrl() {
  const url = process.env.APP_PUBLIC_URL || 'http://localhost:3000';
  return url.replace(/\/+$/, '');
}

function getAdminBaseUrl() {
  const url = process.env.APP_ADMIN_URL || 'http://localhost:3000/admin';
  return url.replace(/\/+$/, '');
}

function adminOrderUrl(id) {
  return `${getAdminBaseUrl()}/orders/${id}`;
}

function adminPaymentsUrl() {
  return `${getAdminBaseUrl()}/payments`;
}

function customerOrderUrl(id) {
  return `${getPublicBaseUrl()}/orders/${id}`;
}

module.exports = {
  getPublicBaseUrl,
  getAdminBaseUrl,
  adminOrderUrl,
  adminPaymentsUrl,
  customerOrderUrl,
};

