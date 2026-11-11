const path = require('path');
const dotenv = require('dotenv');
const http = require('http');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Package = require('../src/models/Package');
const Setting = require('../src/models/Setting');
const CalendarBlock = require('../src/models/CalendarBlock');
const Booking = require('../src/models/Booking');
const Payment = require('../src/models/Payment');
const SlotLock = require('../src/models/SlotLock');
const availabilityService = require('../src/services/availabilityService');
const { cancelExpiredBookings } = require('../src/jobs/cancelExpiredBookings');
const { getTodayWIB } = require('../src/utils/dateUtils');
const cloudinary = require('../src/config/cloudinary');

const {
  connectTestDb,
  disconnectTestDb,
  createTestAdmin,
  createTestCustomer,
  backupSettings,
  restoreSettings,
  cleanTrackedData,
  trackUser,
  trackPackage,
  trackCalendarBlock,
  trackBooking,
  trackPayment,
  trackSlotLock,
  trackCloudinaryPublicId,
} = require('./testUtils');

let server;
let baseUrl;

function getUpcomingDate(offsetDays = 10) {
  const today = getTodayWIB();
  const [y, m, d] = today.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1, d + offsetDays));
  const ty = target.getUTCFullYear();
  const tm = String(target.getUTCMonth() + 1).padStart(2, '0');
  const td = String(target.getUTCDate()).padStart(2, '0');
  return `${ty}-${tm}-${td}`;
}

// Helper untuk membuat Buffer gambar JPEG minimal yang valid
function createDummyJpegBuffer() {
  return Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
    0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
    0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
    0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
    0x00, 0xbf, 0x00, 0xff, 0xd9
  ]);
}

// Helper multipart form-data upload
function buildMultipartBody(boundary, fieldName, filename, fileBuffer, contentType = 'image/jpeg') {
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  return Buffer.concat([head, fileBuffer, tail]);
}

async function runPaymentTests() {
  console.log('================================================================');
  console.log('Memulai Pengujian Otomatis Modul Pembayaran, Verifikasi & Refund');
  console.log('================================================================\n');

  await connectTestDb();
  await backupSettings();

  const testPort = 5018;
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(testPort, resolve));
  baseUrl = `http://localhost:${testPort}`;
  console.log(`✓ Server pengujian berjalan di ${baseUrl}\n`);

  try {
    const { user: adminUser, token: adminToken } = await createTestAdmin();
    const { user: customer1, token: customerToken1 } = await createTestCustomer();
    const { user: customer2, token: customerToken2 } = await createTestCustomer();
    console.log('✓ Akun admin dan pelanggan uji berhasil disiapkan\n');

    // Buat paket dekor untuk bahan uji
    const pkgDekor = await Package.create({
      name: 'Paket Dekor Elegan',
      category: 'dekor',
      price: 5000000,
      description: 'Paket dekorasi lengkap',
      decorWidthCm: 600,
      isActive: true,
      slug: `paket-dekor-elegan-${Date.now()}`,
    });
    trackPackage(pkgDekor._id);

    // Pastikan Setting memuat info rekening dan QRIS
    await Setting.findOneAndUpdate(
      { key: 'main' },
      {
        $set: {
          dpAmount: 1000000,
          paymentDeadlineHours: 24,
          maxProofAttempts: 3,
          rejectionExtensionHours: 6,
          bankName: 'BCA',
          accountNumber: '1234567890',
          accountHolder: 'Kalila Wedding',
          qrisImage: { url: 'https://res.cloudinary.com/dummy/qris.jpg', publicId: 'dummy/qris' },
          adminWhatsapp: '6281234567890',
        },
      }
    );

    // -------------------------------------------------------------
    // a) payment-info
    // -------------------------------------------------------------
    const dateA = getUpcomingDate(15);
    const bookingA = await Booking.create({
      customer: customer1._id,
      customerSnapshot: { name: customer1.name, phone: customer1.phone, email: customer1.email },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: dateA,
      eventName: 'Acara A',
      location: 'Lokasi A',
      status: 'menunggu_dp',
      paymentStatus: 'belum_dp',
      dpAmount: 1000000,
      totalPrice: pkgDekor.price,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      proofAttempts: 0,
    });
    trackBooking(bookingA._id);

    // 1. Pemilik berhasil
    const infoRes = await fetch(`${baseUrl}/api/bookings/${bookingA._id}/payment-info`, {
      headers: { Authorization: `Bearer ${customerToken1}` },
    });
    const infoData = await infoRes.json();
    if (infoRes.status !== 200 || infoData.data.dpAmount !== 1000000 || infoData.data.bankName !== 'BCA') {
      throw new Error(`Skenario a: payment-info pemilik gagal, got status ${infoRes.status}`);
    }

    // 2. Pesanan orang lain -> 404
    const infoOtherRes = await fetch(`${baseUrl}/api/bookings/${bookingA._id}/payment-info`, {
      headers: { Authorization: `Bearer ${customerToken2}` },
    });
    if (infoOtherRes.status !== 404) {
      throw new Error(`Skenario a: payment-info orang lain harus 404, got ${infoOtherRes.status}`);
    }

    // 3. Status bukan menunggu_dp -> 409
    await Booking.findByIdAndUpdate(bookingA._id, { status: 'terkonfirmasi' });
    const infoNonWaitRes = await fetch(`${baseUrl}/api/bookings/${bookingA._id}/payment-info`, {
      headers: { Authorization: `Bearer ${customerToken1}` },
    });
    if (infoNonWaitRes.status !== 409) {
      throw new Error('Skenario a: status bukan menunggu_dp harus 409');
    }
    await Booking.findByIdAndUpdate(bookingA._id, { status: 'menunggu_dp' });

    // 4. Sudah kedaluwarsa -> 409
    await Booking.findByIdAndUpdate(bookingA._id, { expiresAt: new Date(Date.now() - 3600 * 1000) });
    const infoExpRes = await fetch(`${baseUrl}/api/bookings/${bookingA._id}/payment-info`, {
      headers: { Authorization: `Bearer ${customerToken1}` },
    });
    if (infoExpRes.status !== 409) {
      throw new Error('Skenario a: pesanan kedaluwarsa harus 409');
    }
    await Booking.findByIdAndUpdate(bookingA._id, { expiresAt: new Date(Date.now() + 24 * 3600 * 1000) });

    // 5. Info bank dan QRIS kosong -> 409
    await Setting.findOneAndUpdate(
      { key: 'main' },
      { $set: { bankName: '', accountNumber: '', accountHolder: '', qrisImage: null } }
    );
    const infoEmptyRes = await fetch(`${baseUrl}/api/bookings/${bookingA._id}/payment-info`, {
      headers: { Authorization: `Bearer ${customerToken1}` },
    });
    if (infoEmptyRes.status !== 409) {
      throw new Error('Skenario a: info bank & QRIS kosong harus 409');
    }
    // Pulihkan setting
    await Setting.findOneAndUpdate(
      { key: 'main' },
      {
        $set: {
          bankName: 'BCA',
          accountNumber: '1234567890',
          accountHolder: 'Kalila Wedding',
          qrisImage: { url: 'https://res.cloudinary.com/dummy/qris.jpg', publicId: 'dummy/qris' },
        },
      }
    );
    console.log('✓ a) payment-info: validasi pemilik, status, batas waktu, dan kelengkapan setting terverifikasi');

    // -------------------------------------------------------------
    // b) Unggah bukti valid (Cloudinary asli/authenticated) & streaming
    // -------------------------------------------------------------
    const dateB = getUpcomingDate(20);
    const bookingB = await Booking.create({
      customer: customer1._id,
      customerSnapshot: { name: customer1.name, phone: customer1.phone, email: customer1.email },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: dateB,
      eventName: 'Acara B',
      location: 'Lokasi B',
      status: 'menunggu_dp',
      paymentStatus: 'belum_dp',
      dpAmount: 1000000,
      totalPrice: pkgDekor.price,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      proofAttempts: 0,
    });
    trackBooking(bookingB._id);

    const boundaryB = '----WebKitFormBoundaryTestB123';
    const validJpeg = createDummyJpegBuffer();
    const multipartBodyB = buildMultipartBody(boundaryB, 'proof', 'transfer.jpg', validJpeg, 'image/jpeg');

    const uploadResB = await fetch(`${baseUrl}/api/bookings/${bookingB._id}/payment-proof`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundaryB}`,
        Authorization: `Bearer ${customerToken1}`,
      },
      body: multipartBodyB,
    });
    const uploadDataB = await uploadResB.json();

    if (uploadResB.status !== 201) {
      throw new Error(`Skenario b: unggah bukti valid gagal, got ${uploadResB.status}: ${JSON.stringify(uploadDataB)}`);
    }

    const paymentBId = uploadDataB.data.payment._id;
    trackPayment(paymentBId);

    // Verifikasi database
    const checkBookingB = await Booking.findById(bookingB._id);
    if (
      checkBookingB.status !== 'menunggu_verifikasi' ||
      checkBookingB.paymentStatus !== 'menunggu_verifikasi' ||
      checkBookingB.proofAttempts !== 1
    ) {
      throw new Error('Skenario b: status booking setelah upload tidak sesuai');
    }

    const checkPayB = await Payment.findById(paymentBId);
    if (!checkPayB || checkPayB.status !== 'pending' || checkPayB.attempt !== 1 || !checkPayB.proof?.publicId) {
      throw new Error('Skenario b: record Payment tidak sesuai');
    }
    trackCloudinaryPublicId(checkPayB.proof.publicId);

    // Respons tidak boleh memuat publicId atau URL Cloudinary
    const jsonStrB = JSON.stringify(uploadDataB);
    if (jsonStrB.includes(checkPayB.proof.publicId) || jsonStrB.includes('cloudinary.com')) {
      throw new Error('Skenario b: respons unggah membocorkan publicId atau URL Cloudinary');
    }

    // Periksa bahwa respons lain TIDAK memuat publicId atau URL Cloudinary milik bukti transfer:
    // 1. Detail pesanan admin (termasuk daftar Payment)
    const adminBookingResB = await fetch(`${baseUrl}/api/admin/bookings/${bookingB._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminBookingJsonB = await adminBookingResB.text();
    if (adminBookingJsonB.includes(checkPayB.proof.publicId) || adminBookingJsonB.includes('cloudinary.com')) {
      throw new Error('Skenario b: detail pesanan admin membocorkan publicId atau URL Cloudinary');
    }

    // 2. Daftar pembayaran admin
    const adminPaymentsResB = await fetch(`${baseUrl}/api/admin/payments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminPaymentsJsonB = await adminPaymentsResB.text();
    if (adminPaymentsJsonB.includes(checkPayB.proof.publicId) || adminPaymentsJsonB.includes('cloudinary.com')) {
      throw new Error('Skenario b: daftar pembayaran admin membocorkan publicId atau URL Cloudinary');
    }

    // 3. Detail pembayaran admin
    const adminPaymentDetailResB = await fetch(`${baseUrl}/api/admin/payments/${paymentBId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminPaymentDetailJsonB = await adminPaymentDetailResB.text();
    if (adminPaymentDetailJsonB.includes(checkPayB.proof.publicId) || adminPaymentDetailJsonB.includes('cloudinary.com')) {
      throw new Error('Skenario b: detail pembayaran admin membocorkan publicId atau URL Cloudinary');
    }

    // 4. Detail pesanan pelanggan
    const custBookingResB = await fetch(`${baseUrl}/api/bookings/${bookingB._id}`, {
      headers: { Authorization: `Bearer ${customerToken1}` },
    });
    const custBookingJsonB = await custBookingResB.text();
    if (custBookingJsonB.includes(checkPayB.proof.publicId) || custBookingJsonB.includes('cloudinary.com')) {
      throw new Error('Skenario b: detail pesanan pelanggan membocorkan publicId atau URL Cloudinary');
    }

    // Akses URL aset tanpa signature harus gagal
    const rawAssetUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/authenticated/${checkPayB.proof.publicId}.jpg`;
    try {
      const rawRes = await fetch(rawAssetUrl);
      if (rawRes.status === 200) {
        throw new Error('Skenario b: URL Cloudinary tanpa tanda tangan berhasil dibuka (seharusnya gagal)!');
      }
    } catch (err) {
      // Gagal akses langsung = tepat
    }

    // Streaming bukti oleh pemilik (200 OK)
    const streamOwnerRes = await fetch(`${baseUrl}/api/payments/${paymentBId}/proof`, {
      headers: { Authorization: `Bearer ${customerToken1}` },
    });
    if (streamOwnerRes.status !== 200) {
      throw new Error(`Skenario b: streaming oleh pemilik gagal, got status ${streamOwnerRes.status}`);
    }
    const contentTypeOwner = streamOwnerRes.headers.get('content-type');
    const cacheCtrlOwner = streamOwnerRes.headers.get('cache-control');
    const nosniffOwner = streamOwnerRes.headers.get('x-content-type-options');
    if (
      !contentTypeOwner ||
      !contentTypeOwner.includes('image') ||
      cacheCtrlOwner !== 'private, no-store' ||
      nosniffOwner !== 'nosniff'
    ) {
      throw new Error('Skenario b: header streaming tidak sesuai standar privat (Content-Type, Cache-Control, X-Content-Type-Options)');
    }

    // Streaming bukti oleh admin (200 OK)
    const streamAdminRes = await fetch(`${baseUrl}/api/payments/${paymentBId}/proof`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (streamAdminRes.status !== 200) {
      throw new Error(`Skenario b: streaming oleh admin gagal, got status ${streamAdminRes.status}`);
    }

    // Streaming bukti oleh pelanggan lain (404)
    const streamOtherRes = await fetch(`${baseUrl}/api/payments/${paymentBId}/proof`, {
      headers: { Authorization: `Bearer ${customerToken2}` },
    });
    if (streamOtherRes.status !== 404) {
      throw new Error(`Skenario b: streaming pelanggan lain harus 404, got ${streamOtherRes.status}`);
    }
    console.log('✓ b) Unggah bukti valid berhasil: tersimpan privat authenticated, streaming aman & respons disanitasi');

    // -------------------------------------------------------------
    // c) Unggah ditolak (file palsu, >5MB, tanpa file, status salah, kedaluwarsa, max attempts, admin 403, konkurensi)
    // -------------------------------------------------------------
    const dateC = getUpcomingDate(22);
    const bookingC = await Booking.create({
      customer: customer1._id,
      customerSnapshot: { name: customer1.name, phone: customer1.phone, email: customer1.email },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: dateC,
      eventName: 'Acara C',
      location: 'Lokasi C',
      status: 'menunggu_dp',
      paymentStatus: 'belum_dp',
      dpAmount: 1000000,
      totalPrice: pkgDekor.price,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      proofAttempts: 0,
    });
    trackBooking(bookingC._id);

    // 1. File palsu .jpg (isi teks) -> 400
    const fakeBuffer = Buffer.from('Ini bukan file gambar asli tapi teks palsu');
    const fakeBody = buildMultipartBody('boundaryFake', 'proof', 'fake.jpg', fakeBuffer, 'image/jpeg');
    const fakeRes = await fetch(`${baseUrl}/api/bookings/${bookingC._id}/payment-proof`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=boundaryFake',
        Authorization: `Bearer ${customerToken1}`,
      },
      body: fakeBody,
    });
    if (fakeRes.status !== 400) throw new Error('Skenario c: file palsu harus 400');

    // 2. File di atas 5 MB -> 400
    const bigBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024);
    bigBuffer[0] = 0xff;
    bigBuffer[1] = 0xd8;
    bigBuffer[2] = 0xff;
    const bigBody = buildMultipartBody('boundaryBig', 'proof', 'big.jpg', bigBuffer, 'image/jpeg');
    const bigRes = await fetch(`${baseUrl}/api/bookings/${bookingC._id}/payment-proof`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=boundaryBig',
        Authorization: `Bearer ${customerToken1}`,
      },
      body: bigBody,
    });
    if (bigRes.status !== 400) throw new Error('Skenario c: file > 5 MB harus 400');

    // 3. Tanpa file -> 400
    const noFileBody = Buffer.from('--boundaryNoFile\r\nContent-Disposition: form-data; name="other"\r\n\r\nval\r\n--boundaryNoFile--\r\n');
    const noFileRes = await fetch(`${baseUrl}/api/bookings/${bookingC._id}/payment-proof`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=boundaryNoFile',
        Authorization: `Bearer ${customerToken1}`,
      },
      body: noFileBody,
    });
    if (noFileRes.status !== 400) throw new Error('Skenario c: tanpa file harus 400');

    // 4. Role admin -> 403
    const adminUploadRes = await fetch(`${baseUrl}/api/bookings/${bookingC._id}/payment-proof`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundaryB}`,
        Authorization: `Bearer ${adminToken}`,
      },
      body: multipartBodyB,
    });
    if (adminUploadRes.status !== 403) throw new Error('Skenario c: role admin harus 403');

    // 5. Pesanan orang lain -> 404
    const otherUploadRes = await fetch(`${baseUrl}/api/bookings/${bookingC._id}/payment-proof`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundaryB}`,
        Authorization: `Bearer ${customerToken2}`,
      },
      body: multipartBodyB,
    });
    if (otherUploadRes.status !== 404) throw new Error('Skenario c: pesanan orang lain harus 404');

    // 6. Konkurensi dua unggahan bersamaan pada pesanan yang sama -> tepat satu berhasil, satu 409
    const concBody1 = buildMultipartBody('boundaryC1', 'proof', 'c1.jpg', validJpeg);
    const concBody2 = buildMultipartBody('boundaryC2', 'proof', 'c2.jpg', validJpeg);
    const [concRes1, concRes2] = await Promise.all([
      fetch(`${baseUrl}/api/bookings/${bookingC._id}/payment-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data; boundary=boundaryC1', Authorization: `Bearer ${customerToken1}` },
        body: concBody1,
      }),
      fetch(`${baseUrl}/api/bookings/${bookingC._id}/payment-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data; boundary=boundaryC2', Authorization: `Bearer ${customerToken1}` },
        body: concBody2,
      }),
    ]);
    const concStatuses = [concRes1.status, concRes2.status].sort();
    if (concStatuses[0] !== 201 || concStatuses[1] !== 409) {
      throw new Error(`Skenario c: konkurensi upload gagal! Statuses: ${JSON.stringify(concStatuses)}`);
    }
    const cDataSuccess = concRes1.status === 201 ? await concRes1.json() : await concRes2.json();
    trackPayment(cDataSuccess.data.payment._id);
    const cPayDoc = await Payment.findById(cDataSuccess.data.payment._id);
    if (cPayDoc?.proof?.publicId) trackCloudinaryPublicId(cPayDoc.proof.publicId);
    console.log('✓ c) Validasi penolakan unggah & konkurensi (tepat 1 sukses, 1 409 tanpa aset yatim) terverifikasi');

    // -------------------------------------------------------------
    // d) Daftar pembayaran admin
    // -------------------------------------------------------------
    const listRes = await fetch(`${baseUrl}/api/admin/payments?status=pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    if (listRes.status !== 200 || !Array.isArray(listData.data)) {
      throw new Error('Skenario d: daftar pembayaran admin gagal');
    }
    // Periksa bahwa item pending memuat slotAvailable dan slotStatus
    const itemPending = listData.data[0];
    if (itemPending && (itemPending.slotAvailable === undefined || !itemPending.slotStatus)) {
      throw new Error('Skenario d: item pending tidak memuat slotAvailable atau slotStatus');
    }

    // Pencarian dengan regex
    const listRegexRes = await fetch(`${baseUrl}/api/admin/payments?q=${encodeURIComponent('.*+?^$|()[]{}')}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (listRegexRes.status !== 200) throw new Error('Skenario d: pencarian dengan regex harus aman');

    // Sort di luar whitelist -> 400
    const listBadSortRes = await fetch(`${baseUrl}/api/admin/payments?sort=acak`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (listBadSortRes.status !== 400) throw new Error('Skenario d: sort di luar whitelist harus 400');

    // Proteksi admin: 401 tanpa token, 403 customer
    const listNoToken = await fetch(`${baseUrl}/api/admin/payments`);
    if (listNoToken.status !== 401) throw new Error('Skenario d: tanpa token harus 401');
    const listCustToken = await fetch(`${baseUrl}/api/admin/payments`, {
      headers: { Authorization: `Bearer ${customerToken1}` },
    });
    if (listCustToken.status !== 403) throw new Error('Skenario d: token customer harus 403');
    console.log('✓ d) Daftar pembayaran admin: filter, sorting whitelist, regex aman & status slot terverifikasi');

    // -------------------------------------------------------------
    // e) Approve pembayaran DP
    // -------------------------------------------------------------
    // Setujui paymentBId dari skenario b
    const approveRes = await fetch(`${baseUrl}/api/admin/payments/${paymentBId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const approveData = await approveRes.json();
    if (approveRes.status !== 200 || approveData.data.booking.status !== 'terkonfirmasi') {
      throw new Error(`Skenario e: approve payment gagal, got ${approveRes.status}`);
    }

    // Verifikasi database: booking terkonfirmasi, payment approved, slot terisi
    const bBConfirmed = await Booking.findById(bookingB._id);
    if (bBConfirmed.status !== 'terkonfirmasi' || bBConfirmed.paymentStatus !== 'dp_dibayar' || bBConfirmed.expiresAt !== null) {
      throw new Error('Skenario e: status booking setelah approve tidak sesuai');
    }
    const availBAfter = await availabilityService.isDateAvailable('dekor', dateB);
    if (availBAfter.effectiveCounts.dekor < 1) {
      throw new Error('Skenario e: slot tanggal di availabilityService tidak bertambah');
    }

    // Persetujuan kedua kali harus 409 (idempoten)
    const approveDupRes = await fetch(`${baseUrl}/api/admin/payments/${paymentBId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (approveDupRes.status !== 409) {
      throw new Error(`Skenario e: approve kedua harus 409, got ${approveDupRes.status}`);
    }

    // Coba approve pada tanggal yang diblokir -> 409 dan status payment tetap pending
    const dateEBlocked = getUpcomingDate(25);
    const bookingE = await Booking.create({
      customer: customer1._id,
      customerSnapshot: { name: 'E Blocked', phone: '081', email: 'e@t.com' },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: dateEBlocked,
      eventName: 'E Event',
      location: 'Loc',
      status: 'menunggu_verifikasi',
      paymentStatus: 'menunggu_verifikasi',
      dpAmount: 1000000,
      totalPrice: pkgDekor.price,
    });
    trackBooking(bookingE._id);
    const payE = await Payment.create({
      booking: bookingE._id,
      type: 'dp',
      amount: 1000000,
      method: 'transfer',
      status: 'pending',
      source: 'customer',
      attempt: 1,
    });
    trackPayment(payE._id);

    const blockE = await CalendarBlock.create({
      date: dateEBlocked,
      category: 'dekor',
      createdBy: adminUser._id,
      reason: 'Renovasi',
    });
    trackCalendarBlock(blockE._id);

    const approveOnBlocked = await fetch(`${baseUrl}/api/admin/payments/${payE._id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (approveOnBlocked.status !== 409) {
      throw new Error('Skenario e: approve pada tanggal diblokir harus 409');
    }
    const checkPayEStillPending = await Payment.findById(payE._id);
    if (checkPayEStillPending.status !== 'pending') {
      throw new Error('Skenario e: status payment harus tetap pending saat approve gagal');
    }

    // Uji persetujuan pembayaran pada pesanan yang tanggal acaranya sudah lewat -> 409 & Payment tetap pending
    const bookingPast = await Booking.create({
      customer: customer1._id,
      customerSnapshot: { name: 'Past Customer', phone: '08123456789', email: 'past@test.com' },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: '2020-01-01',
      eventName: 'Acara Masa Lalu',
      location: 'Gedung Kuno',
      status: 'menunggu_verifikasi',
      paymentStatus: 'menunggu_verifikasi',
      dpAmount: 1000000,
      totalPrice: pkgDekor.price,
    });
    trackBooking(bookingPast._id);

    const payPast = await Payment.create({
      booking: bookingPast._id,
      type: 'dp',
      amount: 1000000,
      method: 'transfer',
      status: 'pending',
      attempt: 1,
      source: 'customer',
    });
    trackPayment(payPast._id);

    const approvePastRes = await fetch(`${baseUrl}/api/admin/payments/${payPast._id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (approvePastRes.status !== 409) {
      throw new Error(`Skenario e: approve pada tanggal lewat harus 409, got ${approvePastRes.status}`);
    }
    const checkPayPast = await Payment.findById(payPast._id);
    if (checkPayPast.status !== 'pending') {
      throw new Error('Skenario e: payment pada tanggal lewat harus tetap pending');
    }
    console.log('✓ e) Approve pembayaran DP berhasil: pesanan terkonfirmasi, slot terkunci, tolak blokir (409) & tolak tanggal lewat (409)');

    // -------------------------------------------------------------
    // f) KONKURENSI APPROVE
    // -------------------------------------------------------------
    console.log('--- Menguji Konkurensi Approve Pembayaran (5 kali perulangan pada kuota 1) ---');
    await Setting.findOneAndUpdate({ key: 'main' }, { $set: { 'maxEventsPerDay.dekor': 1 } });

    for (let round = 1; round <= 5; round++) {
      const concDateF = getUpcomingDate(30 + round);
      trackSlotLock(concDateF);

      // Buat 2 pesanan menunggu_verifikasi pada tanggal yang sama
      const [bF1, bF2] = await Promise.all([
        Booking.create({
          customer: customer1._id,
          customerSnapshot: { name: `F1 R${round}`, phone: '081', email: 'f1@t.com' },
          package: pkgDekor._id,
          packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
          category: 'dekor',
          eventDate: concDateF,
          eventName: `Event F1 R${round}`,
          location: 'Loc',
          status: 'menunggu_verifikasi',
          paymentStatus: 'menunggu_verifikasi',
          dpAmount: 1000000,
          totalPrice: pkgDekor.price,
        }),
        Booking.create({
          customer: customer2._id,
          customerSnapshot: { name: `F2 R${round}`, phone: '082', email: 'f2@t.com' },
          package: pkgDekor._id,
          packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
          category: 'dekor',
          eventDate: concDateF,
          eventName: `Event F2 R${round}`,
          location: 'Loc',
          status: 'menunggu_verifikasi',
          paymentStatus: 'menunggu_verifikasi',
          dpAmount: 1000000,
          totalPrice: pkgDekor.price,
        }),
      ]);
      trackBooking(bF1._id);
      trackBooking(bF2._id);

      const [pF1, pF2] = await Promise.all([
        Payment.create({
          booking: bF1._id,
          type: 'dp',
          amount: 1000000,
          method: 'transfer',
          status: 'pending',
          source: 'customer',
          attempt: 1,
        }),
        Payment.create({
          booking: bF2._id,
          type: 'dp',
          amount: 1000000,
          method: 'transfer',
          status: 'pending',
          source: 'customer',
          attempt: 1,
        }),
      ]);
      trackPayment(pF1._id);
      trackPayment(pF2._id);

      // Approve keduanya bersamaan
      const [resAF1, resAF2] = await Promise.all([
        fetch(`${baseUrl}/api/admin/payments/${pF1._id}/approve`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        fetch(`${baseUrl}/api/admin/payments/${pF2._id}/approve`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
      ]);
      const roundStatuses = [resAF1.status, resAF2.status].sort();
      if (roundStatuses[0] !== 201 && roundStatuses[0] !== 200 && roundStatuses[1] !== 409) {
        throw new Error(`Skenario f round ${round} gagal! Statuses: ${JSON.stringify(roundStatuses)}`);
      }
    }
    console.log('✓ f) Konkurensi approve 5 putaran berhasil: tepat 1 disetujui (200) dan 1 ditolak (409) tanpa kebocoran slot');

    // Uji dua permintaan approve bersamaan pada pembayaran yang SAMA
    const dateFSame = getUpcomingDate(38);
    const bFSame = await Booking.create({
      customer: customer1._id,
      customerSnapshot: { name: 'FSame', phone: '081', email: 'fsame@t.com' },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: dateFSame,
      eventName: 'Event F Same',
      location: 'Loc',
      status: 'menunggu_verifikasi',
      paymentStatus: 'menunggu_verifikasi',
      dpAmount: 1000000,
      totalPrice: pkgDekor.price,
    });
    trackBooking(bFSame._id);
    const pFSame = await Payment.create({
      booking: bFSame._id,
      type: 'dp',
      amount: 1000000,
      method: 'transfer',
      status: 'pending',
      source: 'customer',
      attempt: 1,
    });
    trackPayment(pFSame._id);

    const [same1, same2] = await Promise.all([
      fetch(`${baseUrl}/api/admin/payments/${pFSame._id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
      }),
      fetch(`${baseUrl}/api/admin/payments/${pFSame._id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
      }),
    ]);
    const sameStatuses = [same1.status, same2.status].sort();
    if (sameStatuses[0] !== 200 || sameStatuses[1] !== 409) {
      throw new Error(`Skenario f approve ganda pembayaran sama gagal! Statuses: ${JSON.stringify(sameStatuses)}`);
    }
    console.log('✓ f) Dua approve bersamaan pada pembayaran yang SAMA berhasil ditangani (tepat 1 berhasil, 1 409)');

    // -------------------------------------------------------------
    // g) Reject pembayaran DP
    // -------------------------------------------------------------
    const dateG = getUpcomingDate(40);
    const bookingG = await Booking.create({
      customer: customer1._id,
      customerSnapshot: { name: customer1.name, phone: customer1.phone, email: customer1.email },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: dateG,
      eventName: 'Acara G',
      location: 'Lokasi G',
      status: 'menunggu_verifikasi',
      paymentStatus: 'menunggu_verifikasi',
      dpAmount: 1000000,
      totalPrice: pkgDekor.price,
      expiresAt: new Date(Date.now() + 2 * 3600 * 1000),
      proofAttempts: 1,
    });
    trackBooking(bookingG._id);

    const payG = await Payment.create({
      booking: bookingG._id,
      type: 'dp',
      amount: 1000000,
      method: 'transfer',
      status: 'pending',
      source: 'customer',
      attempt: 1,
    });
    trackPayment(payG._id);

    // 1. Tolak tanpa alasan -> 400
    const rejectNoReason = await fetch(`${baseUrl}/api/admin/payments/${payG._id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ reason: '' }),
    });
    if (rejectNoReason.status !== 400) throw new Error('Skenario g: reject tanpa alasan harus 400');

    // 2. Tolak dengan alasan valid (attempt 1 < 3) -> kembali menunggu_dp, batas waktu diperpanjang
    const rejectValidRes = await fetch(`${baseUrl}/api/admin/payments/${payG._id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ reason: 'Foto bukti buram dan nominal tidak terbaca' }),
    });
    if (rejectValidRes.status !== 200) throw new Error('Skenario g: reject valid gagal');

    const checkBGAfter = await Booking.findById(bookingG._id);
    if (checkBGAfter.status !== 'menunggu_dp' || checkBGAfter.paymentStatus !== 'ditolak') {
      throw new Error('Skenario g: status booking setelah penolakan pertama salah');
    }

    // 3. Pelanggan unggah ulang (attempt 2)
    const bodyG2 = buildMultipartBody('boundaryG2', 'proof', 'g2.jpg', validJpeg);
    const uploadG2Res = await fetch(`${baseUrl}/api/bookings/${bookingG._id}/payment-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data; boundary=boundaryG2', Authorization: `Bearer ${customerToken1}` },
      body: bodyG2,
    });
    const uploadG2Data = await uploadG2Res.json();
    if (uploadG2Res.status !== 201) throw new Error('Skenario g: unggah ulang attempt 2 gagal');
    const payG2Id = uploadG2Data.data.payment._id;
    trackPayment(payG2Id);

    // Tolak attempt 2
    await fetch(`${baseUrl}/api/admin/payments/${payG2Id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ reason: 'Nominal transfer masih kurang' }),
    });

    // Unggah attempt 3 (mencapai batas Setting.maxProofAttempts = 3)
    const bodyG3 = buildMultipartBody('boundaryG3', 'proof', 'g3.jpg', validJpeg);
    const uploadG3Res = await fetch(`${baseUrl}/api/bookings/${bookingG._id}/payment-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data; boundary=boundaryG3', Authorization: `Bearer ${customerToken1}` },
      body: bodyG3,
    });
    const uploadG3Data = await uploadG3Res.json();
    const payG3Id = uploadG3Data.data.payment._id;
    trackPayment(payG3Id);

    // Tolak attempt 3 -> Pesanan harus dibatalkan
    const rejectG3Res = await fetch(`${baseUrl}/api/admin/payments/${payG3Id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ reason: 'Bukti palsu' }),
    });
    const checkBGCancelled = await Booking.findById(bookingG._id);
    if (checkBGCancelled.status !== 'dibatalkan' || checkBGCancelled.paymentStatus !== 'ditolak') {
      throw new Error('Skenario g: penolakan mencapai batas maksimal harus membatalkan pesanan');
    }
    console.log('✓ g) Reject pembayaran DP: perpanjangan waktu, unggah ulang & penolakan ke-3 membatalkan pesanan');

    // -------------------------------------------------------------
    // h) Job pembatalan otomatis
    // -------------------------------------------------------------
    const nowH = new Date();
    // 1. Pesanan ditolak lalu kedaluwarsa (harus dibatalkan)
    const bHDitolakExp = await Booking.create({
      customerSnapshot: { name: 'H1', phone: '081', email: 'h1@t.com' },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: getUpcomingDate(42),
      eventName: 'H1 Ditolak Exp',
      location: 'Loc',
      status: 'menunggu_dp',
      paymentStatus: 'ditolak',
      dpAmount: 1000000,
      totalPrice: pkgDekor.price,
      expiresAt: new Date(nowH.getTime() - 3600 * 1000), // 1 jam lalu
    });
    trackBooking(bHDitolakExp._id);

    // 2. Pesanan menunggu_verifikasi yang expiresAt-nya lewat (TIDAK BOLEH DIBATALKAN)
    const bHWaitVerifExp = await Booking.create({
      customerSnapshot: { name: 'H2', phone: '082', email: 'h2@t.com' },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: getUpcomingDate(43),
      eventName: 'H2 Wait Verif Exp',
      location: 'Loc',
      status: 'menunggu_verifikasi',
      paymentStatus: 'menunggu_verifikasi',
      dpAmount: 1000000,
      totalPrice: pkgDekor.price,
      expiresAt: new Date(nowH.getTime() - 3600 * 1000), // 1 jam lalu
    });
    trackBooking(bHWaitVerifExp._id);

    await cancelExpiredBookings(nowH);

    const checkH1 = await Booking.findById(bHDitolakExp._id);
    const checkH2 = await Booking.findById(bHWaitVerifExp._id);
    if (checkH1.status !== 'dibatalkan') {
      throw new Error('Skenario h: pesanan menunggu_dp ditolak kedaluwarsa harus dibatalkan oleh job');
    }
    if (checkH2.status !== 'menunggu_verifikasi') {
      throw new Error('Skenario h: pesanan menunggu_verifikasi TIDAK boleh dibatalkan oleh job!');
    }
    console.log('✓ h) Job pembatalan otomatis: tepat membatalkan menunggu_dp kedaluwarsa & menjaga menunggu_verifikasi');

    // -------------------------------------------------------------
    // i) Pembatalan pesanan admin saat ada Payment pending
    // -------------------------------------------------------------
    const dateI = getUpcomingDate(45);
    const bookingI = await Booking.create({
      customer: customer1._id,
      customerSnapshot: { name: 'I', phone: '081', email: 'i@t.com' },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: dateI,
      eventName: 'Acara I',
      location: 'Loc',
      status: 'menunggu_verifikasi',
      paymentStatus: 'menunggu_verifikasi',
      dpAmount: 1000000,
      totalPrice: pkgDekor.price,
    });
    trackBooking(bookingI._id);

    const payI = await Payment.create({
      booking: bookingI._id,
      type: 'dp',
      amount: 1000000,
      method: 'transfer',
      status: 'pending',
      source: 'customer',
      attempt: 1,
    });
    trackPayment(payI._id);

    const cancelIRes = await fetch(`${baseUrl}/api/admin/bookings/${bookingI._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'dibatalkan', reason: 'Dibatalkan oleh admin atas permintaan customer' }),
    });
    if (cancelIRes.status !== 200) throw new Error('Skenario i: pembatalan pesanan admin gagal');

    const checkPayIAfter = await Payment.findById(payI._id);
    if (checkPayIAfter.status !== 'rejected' || checkPayIAfter.rejectionReason !== 'Pesanan dibatalkan') {
      throw new Error('Skenario i: Payment pending harus otomatis menjadi rejected saat pesanan dibatalkan');
    }
    console.log('✓ i) Pembatalan pesanan admin: Payment pending otomatis menjadi rejected tanpa menggantung');

    // -------------------------------------------------------------
    // j) Total dan Pelunasan satu kali tepat sebesar sisa tagihan
    // -------------------------------------------------------------
    const dateJ = getUpcomingDate(48);
    const bookingJ = await Booking.create({
      customer: customer1._id,
      customerSnapshot: { name: customer1.name, phone: customer1.phone, email: customer1.email },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: dateJ,
      eventName: 'Acara J Total',
      location: 'Loc',
      status: 'terkonfirmasi',
      paymentStatus: 'dp_dibayar',
      dpAmount: 1000000,
      totalPrice: pkgDekor.price, // 5.000.000
    });
    trackBooking(bookingJ._id);

    const payJDP = await Payment.create({
      booking: bookingJ._id,
      type: 'dp',
      amount: 1000000,
      method: 'transfer',
      status: 'approved',
      source: 'customer',
      attempt: 1,
      paidAt: new Date(),
    });
    trackPayment(payJDP._id);

    // 1. PATCH total harga di bawah DP -> 400
    const patchTotalUnderDp = await fetch(`${baseUrl}/api/admin/bookings/${bookingJ._id}/total`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ totalPrice: 500000 }),
    });
    if (patchTotalUnderDp.status !== 400) throw new Error('Skenario j: total di bawah DP harus 400');

    // Uji pelunasan saat totalPrice belum ditetapkan (null) -> 409
    const bookingNullTotal = await Booking.create({
      customer: customer1._id,
      customerSnapshot: { name: 'Null Total Customer', phone: '08123456789', email: 'null@test.com' },
      packageSnapshot: { name: 'Catering Custom', category: 'catering', price: null },
      category: 'catering',
      eventDate: getUpcomingDate(58),
      eventName: 'Acara Catering Custom',
      location: 'Rumah Klien',
      status: 'terkonfirmasi',
      paymentStatus: 'dp_dibayar',
      dpAmount: 1000000,
      totalPrice: null,
    });
    trackBooking(bookingNullTotal._id);

    const payNullTotalDP = await Payment.create({
      booking: bookingNullTotal._id,
      type: 'dp',
      amount: 1000000,
      method: 'transfer',
      status: 'approved',
      source: 'customer',
      attempt: 1,
      paidAt: new Date(),
    });
    trackPayment(payNullTotalDP._id);

    const settleNullTotalRes = await fetch(`${baseUrl}/api/admin/bookings/${bookingNullTotal._id}/settlement`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ amount: 1000000, method: 'transfer' }),
    });
    if (settleNullTotalRes.status !== 409) {
      throw new Error(`Skenario j: pelunasan saat totalPrice kosong harus 409, got ${settleNullTotalRes.status}`);
    }

    // Ubah total harga menjadi 6.000.000 (sisa menjadi 5.000.000)
    const patchTotalValid = await fetch(`${baseUrl}/api/admin/bookings/${bookingJ._id}/total`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ totalPrice: 6000000, reason: 'Penambahan dekor lorong' }),
    });
    if (patchTotalValid.status !== 200) throw new Error('Skenario j: patch total valid gagal');

    // 2. Pelunasan dengan nominal selain sisa tagihan (mis. kirim 4.000.000 padahal sisa 5.000.000) -> 400
    const settleWrongRes = await fetch(`${baseUrl}/api/admin/bookings/${bookingJ._id}/settlement`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ amount: 4000000, method: 'transfer' }),
    });
    if (settleWrongRes.status !== 400) throw new Error('Skenario j: pelunasan bukan sisa harus 400');

    // 3. Pelunasan tepat sisa tagihan (5.000.000) -> 200 OK & paymentStatus lunas
    const settleExactRes = await fetch(`${baseUrl}/api/admin/bookings/${bookingJ._id}/settlement`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ amount: 5000000, method: 'transfer', note: 'Pelunasan transfer Mandiri' }),
    });
    const settleExactData = await settleExactRes.json();
    if (settleExactRes.status !== 200 || settleExactData.data.booking.paymentStatus !== 'lunas') {
      throw new Error('Skenario j: pelunasan tepat sisa gagal');
    }
    const payJSettleId = settleExactData.data.payment._id;
    trackPayment(payJSettleId);

    // 4. Pelunasan ulang setelah lunas -> 409
    const settleDupJ = await fetch(`${baseUrl}/api/admin/bookings/${bookingJ._id}/settlement`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ amount: 5000000, method: 'transfer' }),
    });
    if (settleDupJ.status !== 409) throw new Error('Skenario j: pelunasan ulang harus 409');

    // 5. Cek detail admin & billing pelanggan
    const adminDetailJ = await fetch(`${baseUrl}/api/admin/bookings/${bookingJ._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminDetailJData = await adminDetailJ.json();
    if (
      adminDetailJData.data.billing.total !== 6000000 ||
      adminDetailJData.data.billing.dpPaid !== 1000000 ||
      adminDetailJData.data.billing.pelunasanPaid !== 5000000 ||
      adminDetailJData.data.billing.remaining !== 0
    ) {
      throw new Error('Skenario j: billing admin tidak sesuai');
    }

    const custDetailJ = await fetch(`${baseUrl}/api/bookings/${bookingJ._id}`, {
      headers: { Authorization: `Bearer ${customerToken1}` },
    });
    const custDetailJData = await custDetailJ.json();
    if (
      custDetailJData.data.billing.total !== 6000000 ||
      custDetailJData.data.billing.remaining !== 0 ||
      custDetailJData.data.billing.refunded !== undefined ||
      custDetailJData.data.billing.netReceived !== undefined
    ) {
      throw new Error('Skenario j: billing pelanggan membocorkan field privat atau tidak sesuai');
    }
    console.log('✓ j) Total harga, pelunasan tepat sisa, penolakan cicilan & sanitasi billing terverifikasi');

    // -------------------------------------------------------------
    // k) Pengembalian dana (Refund)
    // -------------------------------------------------------------
    const dateK = getUpcomingDate(50);
    const bookingK = await Booking.create({
      customer: customer1._id,
      customerSnapshot: { name: 'K Cust', phone: '081', email: 'k@t.com' },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: dateK,
      eventName: 'Acara K Batal',
      location: 'Loc',
      status: 'terkonfirmasi',
      paymentStatus: 'dp_dibayar',
      dpAmount: 1000000,
      totalPrice: pkgDekor.price,
    });
    trackBooking(bookingK._id);

    const payKDP = await Payment.create({
      booking: bookingK._id,
      type: 'dp',
      amount: 1000000,
      method: 'transfer',
      status: 'approved',
      source: 'customer',
      attempt: 1,
    });
    trackPayment(payKDP._id);

    // 1. Refund pada pesanan yang belum dibatalkan -> 409
    const refundNonCancel = await fetch(`${baseUrl}/api/admin/bookings/${bookingK._id}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ amount: 500000, method: 'transfer' }),
    });
    if (refundNonCancel.status !== 409) throw new Error('Skenario k: refund pada pesanan belum dibatalkan harus 409');

    // Batalkan pesanan K
    await fetch(`${baseUrl}/api/admin/bookings/${bookingK._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'dibatalkan', reason: 'Acara dibatalkan keluarga' }),
    });

    // 2. Refund melebihi batas dana (mis. DP 1 jt, minta refund 1,5 jt) -> 409
    const refundExcess = await fetch(`${baseUrl}/api/admin/bookings/${bookingK._id}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ amount: 1500000, method: 'transfer' }),
    });
    if (refundExcess.status !== 409) throw new Error('Skenario k: refund melebihi dana harus 409');

    // 3. Refund sebagian (400.000) lalu sisanya (600.000) -> Berhasil
    const refundPart1 = await fetch(`${baseUrl}/api/admin/bookings/${bookingK._id}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ amount: 400000, method: 'transfer', note: 'Pengembalian tahap 1' }),
    });
    const refundData1 = await refundPart1.json();
    if (refundPart1.status !== 201) throw new Error('Skenario k: refund part 1 gagal');
    trackPayment(refundData1.data.payment._id);

    const refundPart2 = await fetch(`${baseUrl}/api/admin/bookings/${bookingK._id}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ amount: 600000, method: 'transfer', note: 'Pengembalian tahap 2 pelunasan refund' }),
    });
    const refundData2 = await refundPart2.json();
    if (refundPart2.status !== 201) throw new Error('Skenario k: refund part 2 gagal');
    trackPayment(refundData2.data.payment._id);

    // Cek billing detail admin: netReceived harus 0 (1 jt - 1 jt)
    const adminDetailK = await fetch(`${baseUrl}/api/admin/bookings/${bookingK._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminDetailKData = await adminDetailK.json();
    if (adminDetailKData.data.billing.refunded !== 1000000 || adminDetailKData.data.billing.netReceived !== 0) {
      throw new Error('Skenario k: netReceived atau refunded salah');
    }
    console.log('✓ k) Pengembalian dana (refund): batas maksimal, bertahap & kalkulasi netReceived terverifikasi');

    // -------------------------------------------------------------
    // l) Void pembayaran manual
    // -------------------------------------------------------------
    // 1. Coba void DP (payJDP) -> 409 (DP tidak boleh di-void)
    const voidDpRes = await fetch(`${baseUrl}/api/admin/payments/${payJDP._id}/void`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ reason: 'Salah input' }),
    });
    if (voidDpRes.status !== 409) throw new Error('Skenario l: void DP harus 409');

    // 2. Void pelunasan (payJSettleId) -> Berhasil & booking kembali ke dp_dibayar
    const voidSettleRes = await fetch(`${baseUrl}/api/admin/payments/${payJSettleId}/void`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ reason: 'Koreksi bukti transfer cek kliring batal' }),
    });
    if (voidSettleRes.status !== 200) throw new Error('Skenario l: void pelunasan valid gagal');

    const checkBookingJAfterVoid = await Booking.findById(bookingJ._id);
    if (checkBookingJAfterVoid.paymentStatus !== 'dp_dibayar') {
      throw new Error('Skenario l: paymentStatus setelah void pelunasan harus kembali ke dp_dibayar');
    }

    // 3. Pelunasan dapat dicatat kembali setelah di-void
    const reSettleRes = await fetch(`${baseUrl}/api/admin/bookings/${bookingJ._id}/settlement`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ amount: 5000000, method: 'tunai', note: 'Pelunasan tunai setelah void' }),
    });
    const reSettleData = await reSettleRes.json();
    if (reSettleRes.status !== 200 || reSettleData.data.booking.paymentStatus !== 'lunas') {
      throw new Error('Skenario l: pencatatan ulang pelunasan setelah void gagal');
    }
    trackPayment(reSettleData.data.payment._id);
    console.log('✓ l) Void pembayaran: tolak void DP (409), void pelunasan mengembalikan status & pelunasan ulang sukses');

    console.log('\n================================================================');
    console.log('SEMUA SKENARIO PENGUJIAN PEMBAYARAN (a - l) BERHASIL (ALL PASSED)!');
    console.log('================================================================\n');
  } finally {
    console.log('--- Memulai Pembersihan Data Uji (Finally Block) ---');
    try {
      await cleanTrackedData();
      console.log('✓ Data uji dan aset Cloudinary berhasil dibersihkan.');
    } catch (cleanErr) {
      console.error('Pembersihan error:', cleanErr);
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectTestDb();
    console.log('✓ Koneksi test database ditutup.');
  }
}

if (require.main === module) {
  runPaymentTests().catch((err) => {
    console.error('\n❌ PENGUJIAN GAGAL DENGAN ERROR:');
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runPaymentTests };

