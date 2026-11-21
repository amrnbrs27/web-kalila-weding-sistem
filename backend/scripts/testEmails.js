const path = require('path');
const dotenv = require('dotenv');
const http = require('http');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Inisialisasi environment khusus pengujian email
process.env.EMAIL_PROVIDER = 'memory';
process.env.EMAIL_DAILY_LIMIT = '90';
process.env.EMAIL_BATCH_PER_TICK = '5';
delete process.env.EMAIL_REDIRECT_TO;

const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Package = require('../src/models/Package');
const Booking = require('../src/models/Booking');
const Payment = require('../src/models/Payment');
const Setting = require('../src/models/Setting');
const EmailOutbox = require('../src/models/EmailOutbox');

const {
  connectTestDb,
  disconnectTestDb,
  createTestAdmin,
  createTestCustomer,
  cleanTrackedData,
  trackUser,
  trackPackage,
  trackBooking,
  trackPayment,
  trackEmail,
  backupSettings,
  restoreSettings,
} = require('./testUtils');

const {
  createMemoryProvider,
} = require('../src/services/email/providers/memoryProvider');
const {
  createResendProvider,
} = require('../src/services/email/providers/resendProvider');
const {
  setMemoryProviderInstance,
  enqueue,
} = require('../src/services/email/emailService');
const {
  getEmailConfigStatus,
  extractDomainFromEmail,
} = require('../src/services/email/emailConfig');
const {
  renderBookingCreatedAdmin,
  renderBookingCreatedOwner,
  renderPaymentProofAdmin,
  renderBookingConfirmedCustomer,
  formatDateId,
  formatDateTimeWIB,
  formatRupiah,
} = require('../src/services/email/templates');
const { processEmailOutbox } = require('../src/jobs/sendEmails');
const emailService = require('../src/services/email/emailService');

let server;
let baseUrl;
const memoryProvider = createMemoryProvider();
setMemoryProviderInstance(memoryProvider);

async function runEmailTests() {
  console.log('================================================================');
  console.log('Memulai Pengujian Otomatis Modul Notifikasi Email & Antrean Outbox');
  console.log('================================================================\n');

  await connectTestDb();

  const testPort = 5023;
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(testPort, resolve));
  baseUrl = `http://localhost:${testPort}`;
  console.log(`✓ Server pengujian berjalan di ${baseUrl}\n`);

  await backupSettings();

  try {
    const { user: admin1, token: adminToken1 } = await createTestAdmin();
    const { user: customer1, token: customerToken } = await createTestCustomer();
    console.log('✓ Akun admin dan pelanggan uji berhasil disiapkan\n');

    // Buat satu paket uji
    const testPackage = await Package.create({
      name: 'Paket Tes Email Lavender',
      slug: `paket-tes-email-${Date.now()}`,
      category: 'dekor',
      price: 5000000,
      description: 'Paket dekor untuk tes email',
      items: ['Dekor Pelaminan', 'Lighting'],
      isActive: true,
    });
    trackPackage(testPackage._id);

    // =========================================================================
    // a) Setting.notificationRecipients
    // =========================================================================
    console.log('--- a) Pengujian Setting.notificationRecipients ---');

    // 1. Publik GET /api/settings tidak boleh memuat notificationRecipients
    const pubRes = await fetch(`${baseUrl}/api/settings`);
    const pubJson = await pubRes.json();
    if (pubJson.data?.notificationRecipients !== undefined) {
      throw new Error('a.1 Gagal: notificationRecipients bocor di GET /api/settings publik');
    }

    // 2. Email tidak valid ditolak (400)
    const invRes = await fetch(`${baseUrl}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken1}`,
      },
      body: JSON.stringify({
        notificationRecipients: {
          adminEmails: ['email-tidak-valid'],
        },
      }),
    });
    if (invRes.status !== 400) {
      throw new Error(`a.2 Gagal: email tidak valid harus 400, got ${invRes.status}`);
    }

    // 3. Lebih dari 5 email ditolak (400)
    const tooManyRes = await fetch(`${baseUrl}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken1}`,
      },
      body: JSON.stringify({
        notificationRecipients: {
          adminEmails: ['e1@k.com', 'e2@k.com', 'e3@k.com', 'e4@k.com', 'e5@k.com', 'e6@k.com'],
        },
      }),
    });
    if (tooManyRes.status !== 400) {
      throw new Error(`a.3 Gagal: lebih dari 5 email harus 400, got ${tooManyRes.status}`);
    }

    // 4. Huruf kecil dan deduping otomatis
    const validSetRes = await fetch(`${baseUrl}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken1}`,
      },
      body: JSON.stringify({
        notificationRecipients: {
          adminEmails: ['AdminOne@Kalila.COM', 'adminone@kalila.com', 'AdminTwo@kalila.com'],
          ownerEmails: ['Owner@Kalila.COM'],
        },
      }),
    });
    const validSetJson = await validSetRes.json();
    if (validSetRes.status !== 200) {
      throw new Error(`a.4 Gagal: update settings valid harus 200, got ${validSetRes.status}`);
    }
    const savedRecipients = validSetJson.data.notificationRecipients;
    if (
      savedRecipients.adminEmails.length !== 2 ||
      savedRecipients.adminEmails[0] !== 'adminone@kalila.com' ||
      savedRecipients.adminEmails[1] !== 'admintwo@kalila.com' ||
      savedRecipients.ownerEmails[0] !== 'owner@kalila.com'
    ) {
      throw new Error(`a.4 Gagal: deduplikasi dan lowercase tidak sesuai: ${JSON.stringify(savedRecipients)}`);
    }

    // 5. Update sebagian satu daftar tidak menghapus daftar lainnya
    const partialSetRes = await fetch(`${baseUrl}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken1}`,
      },
      body: JSON.stringify({
        notificationRecipients: {
          adminEmails: ['adminbaru@kalila.com'],
        },
      }),
    });
    const partialSetJson = await partialSetRes.json();
    if (
      partialSetJson.data.notificationRecipients.adminEmails[0] !== 'adminbaru@kalila.com' ||
      partialSetJson.data.notificationRecipients.ownerEmails[0] !== 'owner@kalila.com'
    ) {
      throw new Error('a.5 Gagal: partial update menimpa ownerEmails!');
    }
    console.log('✓ a) Setting.notificationRecipients terverifikasi aman & tepat\n');

    // =========================================================================
    // b) Pesanan Baru Pelanggan (Admin & Owner Outbox)
    // =========================================================================
    console.log('--- b) Pengujian Pesanan Baru Pelanggan (booking_created_admin & owner) ---');

    // Atur adminEmails & ownerEmails spesifik
    await Setting.updateOne(
      { key: 'main' },
      {
        'notificationRecipients.adminEmails': ['admin.utama@kalila.com'],
        'notificationRecipients.ownerEmails': ['owner.utama@kalila.com'],
      }
    );

    const bRes1 = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        packageId: testPackage._id.toString(),
        eventDate: '2026-12-01',
        eventName: 'Pernikahan B & C',
        location: 'Grand Ballroom',
        formData: { decorArea: 'Gedung Serbaguna' },
        contactName: 'Pelanggan Budi',
        contactPhone: '081299990001',
        contactEmail: 'budi@gmail.com',
      }),
    });
    const bJson1 = await bRes1.json();
    if (bRes1.status !== 201) {
      throw new Error(`b.1 Gagal membuat pesanan: ${JSON.stringify(bJson1)}`);
    }
    const bookingId1 = bJson1.data._id;
    trackBooking(bookingId1);

    const outboxB1 = await EmailOutbox.find({ booking: bookingId1 });
    outboxB1.forEach((o) => trackEmail(o._id));

    if (outboxB1.length !== 2) {
      throw new Error(`b.1 Gagal: seharusnya 2 outbox item, dapat ${outboxB1.length}`);
    }
    const adminMail = outboxB1.find((o) => o.type === 'booking_created_admin');
    const ownerMail = outboxB1.find((o) => o.type === 'booking_created_owner');
    if (!adminMail || adminMail.to !== 'admin.utama@kalila.com') {
      throw new Error('b.1 Gagal: item booking_created_admin tidak cocok');
    }
    if (!ownerMail || ownerMail.to !== 'owner.utama@kalila.com') {
      throw new Error('b.1 Gagal: item booking_created_owner tidak cocok');
    }

    // Kasus Overlap: alamat ada di admin dan owner -> hanya terima admin
    await Setting.updateOne(
      { key: 'main' },
      {
        'notificationRecipients.adminEmails': ['duplikat@kalila.com'],
        'notificationRecipients.ownerEmails': ['duplikat@kalila.com', 'owner.murni@kalila.com'],
      }
    );
    const bResOverlap = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        packageId: testPackage._id.toString(),
        eventDate: '2026-12-02',
        eventName: 'Pernikahan Overlap',
        location: 'Hotel Bintang',
        formData: { decorArea: 'Outdoor' },
      }),
    });
    const bJsonOverlap = await bResOverlap.json();
    if (bResOverlap.status !== 201) {
      throw new Error(`b.2 Gagal membuat pesanan overlap: ${JSON.stringify(bJsonOverlap)}`);
    }
    trackBooking(bJsonOverlap.data._id);
    const outboxOverlap = await EmailOutbox.find({ booking: bJsonOverlap.data._id });
    outboxOverlap.forEach((o) => trackEmail(o._id));

    const duplikatEmails = outboxOverlap.filter((o) => o.to === 'duplikat@kalila.com');
    if (duplikatEmails.length !== 1 || duplikatEmails[0].type !== 'booking_created_admin') {
      throw new Error(`b.2 Gagal: overlap email harus menerima tepat 1 versi admin, dapat: ${duplikatEmails.length}`);
    }

    // Kasus adminEmails kosong -> fallback ke admin aktif, nonaktif tidak ikut
    const { user: inactiveAdmin } = await createTestAdmin();
    await User.updateOne({ _id: inactiveAdmin._id }, { isActive: false });
    await Setting.updateOne(
      { key: 'main' },
      {
        'notificationRecipients.adminEmails': [],
        'notificationRecipients.ownerEmails': [],
      }
    );

    const bResFallback = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        packageId: testPackage._id.toString(),
        eventDate: '2026-12-03',
        eventName: 'Pernikahan Fallback',
        location: 'Hotel Fallback',
        formData: { decorArea: 'Indoor' },
      }),
    });
    const bJsonFallback = await bResFallback.json();
    if (bResFallback.status !== 201) {
      throw new Error(`b.3 Gagal membuat pesanan fallback: ${JSON.stringify(bJsonFallback)}`);
    }
    trackBooking(bJsonFallback.data._id);
    const outboxFallback = await EmailOutbox.find({ booking: bJsonFallback.data._id });
    outboxFallback.forEach((o) => trackEmail(o._id));

    const inactiveHit = outboxFallback.some((o) => o.to === inactiveAdmin.email.toLowerCase());
    if (inactiveHit) {
      throw new Error('b.3 Gagal: admin nonaktif terkirim email notifikasi fallback');
    }
    const activeAdminHit = outboxFallback.some((o) => o.to === admin1.email.toLowerCase());
    if (!activeAdminHit) {
      throw new Error('b.3 Gagal: admin aktif tidak ditemukan pada fallback');
    }

    console.log('✓ b) Logika penerima efektif pesanan baru terverifikasi\n');

    // =========================================================================
    // c) Pesanan Manual (dpPaid false) & Ketahanan Enqueue
    // =========================================================================
    console.log('--- c) Pengujian Pesanan Manual & Kegagalan Enqueue Tidak Membatalkan Booking ---');

    // Pesanan manual dpPaid=false tidak memicu email
    const manRes = await fetch(`${baseUrl}/api/admin/bookings/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken1}`,
      },
      body: JSON.stringify({
        customerId: customer1._id.toString(),
        category: 'dekor',
        packageId: testPackage._id.toString(),
        eventDate: '2026-12-04',
        eventName: 'Manual Wedding No DP',
        location: 'Outdoor',
        dpPaid: false,
      }),
    });
    const manJson = await manRes.json();
    if (manRes.status !== 201) {
      throw new Error(`c.1 Gagal membuat pesanan manual: ${JSON.stringify(manJson)}`);
    }
    trackBooking(manJson.data._id);
    const outboxManual = await EmailOutbox.find({ booking: manJson.data._id });
    if (outboxManual.length !== 0) {
      throw new Error(`c.1 Gagal: manual booking dpPaid=false memicu ${outboxManual.length} email!`);
    }

    // Simulasi kegagalan enqueue: booking pelanggan tetap sukses 201
    const originalEnqueue = emailService.triggerBookingCreatedEmails;
    emailService.triggerBookingCreatedEmails = async () => {
      throw new Error('Simulasi database outbox mati mendadak');
    };

    const failBookingRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        packageId: testPackage._id.toString(),
        eventDate: '2026-12-05',
        eventName: 'Resilience Test Booking',
        location: 'Hotel Ketahanan',
        formData: { decorArea: 'Indoor' },
      }),
    });
    emailService.triggerBookingCreatedEmails = originalEnqueue; // restore
    if (failBookingRes.status !== 201) {
      throw new Error(`c.2 Gagal: booking pelanggan gagal saat outbox melempar error (${failBookingRes.status})`);
    }
    const failBookingJson = await failBookingRes.json();
    trackBooking(failBookingJson.data._id);
    console.log('✓ c) Pesanan manual aman & kegagalan enqueue tidak menggagalkan booking pelanggan\n');

    // =========================================================================
    // d) Unggah Bukti Transfer (payment_proof_admin) & Atomisitas Transaksi
    // =========================================================================
    console.log('--- d) Pengujian Unggah Bukti Transfer & Atomisitas Transaksi ---');

    await Setting.updateOne(
      { key: 'main' },
      {
        'notificationRecipients.adminEmails': ['admin.verifikasi@kalila.com'],
        'notificationRecipients.ownerEmails': ['owner.verifikasi@kalila.com'],
      }
    );

    // Unggah bukti transfer valid
    const samplePng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const boundary = '----WebKitFormBoundaryEmailTest' + Math.random().toString(36).slice(2);
    const bodyBuffer = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="proof"; filename="proof.png"\r\nContent-Type: image/png\r\n\r\n`),
      samplePng,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const uploadRes = await fetch(`${baseUrl}/api/bookings/${bookingId1}/payment-proof`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${customerToken}`,
      },
      body: bodyBuffer,
    });
    const uploadJson = await uploadRes.json();
    if (uploadRes.status !== 201) {
      throw new Error(`d.1 Gagal unggah bukti: ${JSON.stringify(uploadJson)}`);
    }
    const paymentId1 = uploadJson.data.payment._id;
    trackPayment(paymentId1);

    const outboxProof = await EmailOutbox.find({ payment: paymentId1 });
    outboxProof.forEach((o) => trackEmail(o._id));

    if (outboxProof.length !== 1) {
      throw new Error(`d.1 Gagal: diharapkan 1 email bukti transfer, dapat ${outboxProof.length}`);
    }
    if (outboxProof[0].to !== 'admin.verifikasi@kalila.com' || outboxProof[0].type !== 'payment_proof_admin') {
      throw new Error('d.1 Gagal: data email bukti transfer tidak cocok');
    }

    // Owner tidak boleh menerima email bukti transfer
    const ownerProofHit = await EmailOutbox.findOne({
      booking: bookingId1,
      to: 'owner.verifikasi@kalila.com',
      type: 'payment_proof_admin',
    });
    if (ownerProofHit) {
      throw new Error('d.1 Gagal: owner menerima email bukti transfer!');
    }

    // Konkurensi: unggah ganda pada pesanan yang sudah menunggu verifikasi ditolak 409 & tidak buat item
    const doubleUploadRes = await fetch(`${baseUrl}/api/bookings/${bookingId1}/payment-proof`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${customerToken}`,
      },
      body: bodyBuffer,
    });
    if (doubleUploadRes.status !== 409) {
      throw new Error(`d.2 Gagal: unggah ganda harus 409, got ${doubleUploadRes.status}`);
    }
    const totalProofEmails = await EmailOutbox.countDocuments({ booking: bookingId1, type: 'payment_proof_admin' });
    if (totalProofEmails !== 1) {
      throw new Error(`d.2 Gagal: outbox bukti transfer bertambah saat upload 409 (${totalProofEmails})`);
    }

    // d.3 Konkurensi 2 unggahan bersamaan pada pesanan baru: tepat 1 berhasil (201) dan 1 ditolak (409)
    const freshBookingRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        packageId: testPackage._id.toString(),
        eventDate: '2026-12-10',
        eventName: 'Concurrent Upload Booking',
        location: 'Hotel Concurrency',
        formData: { decorArea: 'Indoor' },
      }),
    });
    const freshBookingJson = await freshBookingRes.json();
    const concurrentBookingId = freshBookingJson.data._id;
    trackBooking(concurrentBookingId);

    const [upResA, upResB] = await Promise.all([
      fetch(`${baseUrl}/api/bookings/${concurrentBookingId}/payment-proof`, {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, Authorization: `Bearer ${customerToken}` },
        body: bodyBuffer,
      }),
      fetch(`${baseUrl}/api/bookings/${concurrentBookingId}/payment-proof`, {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, Authorization: `Bearer ${customerToken}` },
        body: bodyBuffer,
      }),
    ]);
    const upStatuses = [upResA.status, upResB.status];
    if (upStatuses.filter((s) => s === 201).length !== 1 || upStatuses.filter((s) => s === 409).length !== 1) {
      throw new Error(`d.3 Gagal: 2 upload bersamaan harus [201, 409], got ${JSON.stringify(upStatuses)}`);
    }
    const concurrentProofCount = await EmailOutbox.countDocuments({
      booking: concurrentBookingId,
      type: 'payment_proof_admin',
    });
    if (concurrentProofCount !== 1) {
      throw new Error(`d.3 Gagal: outbox bukti dari 2 upload bersamaan harus tepat 1, got ${concurrentProofCount}`);
    }

    // d.4 Penolakan bukti (reject) tidak membuat item email, dan unggah ulang membuat item outbox baru
    const successUpRes = upResA.status === 201 ? upResA : upResB;
    const successUpJson = await successUpRes.json();
    const proofToRejectId = successUpJson.data.payment._id;
    trackPayment(proofToRejectId);
    const countBeforeReject = await EmailOutbox.countDocuments();
    const rejectRes = await fetch(`${baseUrl}/api/admin/payments/${proofToRejectId}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
      body: JSON.stringify({ reason: 'Foto bukti buram dan tidak terbaca' }),
    });
    if (rejectRes.status !== 200) {
      throw new Error(`d.4 Gagal menolak bukti transfer: ${rejectRes.status}`);
    }
    const countAfterReject = await EmailOutbox.countDocuments();
    if (countAfterReject !== countBeforeReject) {
      throw new Error(`d.4 Gagal: penolakan bukti pembayaran seharusnya tidak membuat item outbox baru!`);
    }

    // Pelanggan mengunggah ulang bukti pembayaran -> status menjadi menunggu_verifikasi lagi & buat item outbox baru
    const reuploadRes = await fetch(`${baseUrl}/api/bookings/${concurrentBookingId}/payment-proof`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, Authorization: `Bearer ${customerToken}` },
      body: bodyBuffer,
    });
    if (reuploadRes.status !== 201) {
      throw new Error(`d.4 Gagal unggah ulang bukti: ${reuploadRes.status}`);
    }
    const reuploadJson = await reuploadRes.json();
    trackPayment(reuploadJson.data.payment._id);
    const proofEmailsAfterReupload = await EmailOutbox.find({
      booking: concurrentBookingId,
      type: 'payment_proof_admin',
    });
    proofEmailsAfterReupload.forEach((o) => trackEmail(o._id));
    if (proofEmailsAfterReupload.length !== 2) {
      throw new Error(`d.4 Gagal: unggah ulang harus menghasilkan item payment_proof_admin kedua, got ${proofEmailsAfterReupload.length}`);
    }

    console.log('✓ d) Unggah bukti transfer, unggah ulang, konkurensi & atomisitas outbox terverifikasi\n');

    // =========================================================================
    // e & f) Persetujuan Pembayaran, Konkurensi & Booking Confirmed Customer
    // =========================================================================
    console.log('--- e & f) Persetujuan Pembayaran & Konkurensi booking_confirmed_customer ---');

    // Approve payment
    const approveRes = await fetch(`${baseUrl}/api/admin/payments/${paymentId1}/approve`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken1}`,
      },
    });
    const approveJson = await approveRes.json();
    if (approveRes.status !== 200) {
      throw new Error(`e.1 Gagal approve payment: ${JSON.stringify(approveJson)}`);
    }

    const outboxConfirmed = await EmailOutbox.find({
      booking: bookingId1,
      type: 'booking_confirmed_customer',
    });
    outboxConfirmed.forEach((o) => trackEmail(o._id));

    if (outboxConfirmed.length !== 1) {
      throw new Error(`e.1 Gagal: diharapkan 1 item konfirmasi pelanggan, dapat ${outboxConfirmed.length}`);
    }
    if (outboxConfirmed[0].to !== 'budi@gmail.com') {
      throw new Error(`e.1 Gagal: penerima konfirmasi salah (${outboxConfirmed[0].to})`);
    }

    // Double approve -> 409 & tidak menggandakan email
    const doubleApproveRes = await fetch(`${baseUrl}/api/admin/payments/${paymentId1}/approve`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken1}`,
      },
    });
    if (doubleApproveRes.status !== 409) {
      throw new Error(`e.2 Gagal: double approve harus 409, got ${doubleApproveRes.status}`);
    }
    const countAfterDouble = await EmailOutbox.countDocuments({
      booking: bookingId1,
      type: 'booking_confirmed_customer',
    });
    if (countAfterDouble !== 1) {
      throw new Error(`e.2 Gagal: double approve menggandakan email outbox (${countAfterDouble})`);
    }

    // Kasus pesanan manual dengan dpPaid=true membuat tepat 1 item konfirmasi pelanggan
    const manPaidRes = await fetch(`${baseUrl}/api/admin/bookings/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken1}`,
      },
      body: JSON.stringify({
        customerId: customer1._id.toString(),
        contactEmail: 'pelanggan.manual@test.com',
        category: 'dekor',
        packageId: testPackage._id.toString(),
        eventDate: '2026-12-06',
        eventName: 'Manual Wedding DP Paid',
        location: 'Hotel DP Paid',
        dpPaid: true,
        dpMethod: 'transfer',
      }),
    });
    const manPaidJson = await manPaidRes.json();
    if (manPaidRes.status !== 201) {
      throw new Error(`e.3 Gagal manual booking dpPaid=true: ${JSON.stringify(manPaidJson)}`);
    }
    trackBooking(manPaidJson.data._id);
    const outboxManPaid = await EmailOutbox.find({
      booking: manPaidJson.data._id,
      type: 'booking_confirmed_customer',
    });
    outboxManPaid.forEach((o) => trackEmail(o._id));
    if (outboxManPaid.length !== 1 || outboxManPaid[0].to !== 'pelanggan.manual@test.com') {
      throw new Error('e.3 Gagal: manual booking dpPaid=true tidak menghasilkan 1 outbox konfirmasi');
    }

    // Kasus pelanggan tanpa email -> status 'skipped' dan lastError 'Pelanggan tidak memiliki email'
    const noEmailRes = await fetch(`${baseUrl}/api/admin/bookings/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken1}`,
      },
      body: JSON.stringify({
        customerId: customer1._id.toString(),
        contactEmail: '', // kosong
        category: 'dekor',
        packageId: testPackage._id.toString(),
        eventDate: '2026-12-07',
        eventName: 'Manual No Email Wedding',
        location: 'Hotel No Email',
        dpPaid: true,
      }),
    });
    const noEmailJson = await noEmailRes.json();
    if (noEmailRes.status !== 201) {
      throw new Error(`e.4 Gagal membuat manual booking no email: ${JSON.stringify(noEmailJson)}`);
    }
    trackBooking(noEmailJson.data._id);
    const outboxNoEmail = await EmailOutbox.findOne({
      booking: noEmailJson.data._id,
      type: 'booking_confirmed_customer',
    });
    if (outboxNoEmail) trackEmail(outboxNoEmail._id);
    if (!outboxNoEmail || outboxNoEmail.status !== 'skipped' || outboxNoEmail.lastError !== 'Pelanggan tidak memiliki email') {
      throw new Error(`e.4 Gagal: tanpa email harus berstatus skipped: ${JSON.stringify(outboxNoEmail)}`);
    }

    // e.5 Pembatalan pesanan admin tidak membuat item email
    const countBeforeCancel = await EmailOutbox.countDocuments();
    const cancelRes = await fetch(`${baseUrl}/api/admin/bookings/${concurrentBookingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
      body: JSON.stringify({ status: 'dibatalkan', reason: 'Dibatalkan untuk pengujian' }),
    });
    if (cancelRes.status !== 200) {
      throw new Error(`e.5 Gagal membatalkan pesanan: ${cancelRes.status}`);
    }
    const countAfterCancel = await EmailOutbox.countDocuments();
    if (countAfterCancel !== countBeforeCancel) {
      throw new Error('e.5 Gagal: pembatalan pesanan seharusnya tidak membuat item outbox baru!');
    }

    // f.1 Konkurensi 2 persetujuan bersamaan pada pembayaran yang sama menghasilkan tepat satu item outbox
    const bookingForApprove = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        packageId: testPackage._id.toString(),
        eventDate: '2026-12-15',
        eventName: 'Concurrent Approve Booking',
        location: 'Hotel Persetujuan',
        formData: { decorArea: 'Indoor' },
      }),
    });
    const bApproveJson = await bookingForApprove.json();
    const bApproveId = bApproveJson.data._id;
    trackBooking(bApproveId);

    const upProofRes = await fetch(`${baseUrl}/api/bookings/${bApproveId}/payment-proof`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, Authorization: `Bearer ${customerToken}` },
      body: bodyBuffer,
    });
    const upProofJson = await upProofRes.json();
    const payIdToApprove = upProofJson.data.payment._id;
    trackPayment(payIdToApprove);

    const [appResA, appResB] = await Promise.all([
      fetch(`${baseUrl}/api/admin/payments/${payIdToApprove}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken1}` },
      }),
      fetch(`${baseUrl}/api/admin/payments/${payIdToApprove}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken1}` },
      }),
    ]);
    const appStatuses = [appResA.status, appResB.status];
    if (appStatuses.filter((s) => s === 200).length !== 1 || appStatuses.filter((s) => s === 409).length !== 1) {
      throw new Error(`f.1 Gagal: 2 approve bersamaan harus [200, 409], got ${JSON.stringify(appStatuses)}`);
    }
    const confirmedCount = await EmailOutbox.countDocuments({
      booking: bApproveId,
      type: 'booking_confirmed_customer',
    });
    if (confirmedCount !== 1) {
      throw new Error(`f.1 Gagal: 2 approve bersamaan menghasilkan outbox konfirmasi: ${confirmedCount}`);
    }

    console.log('✓ e & f) Persetujuan pembayaran, konkurensi approve ganda, dan penanganan tanpa email terverifikasi\n');

    // =========================================================================
    // g) Validasi Keempat Template Email & Sanitasi
    // =========================================================================
    console.log('--- g) Pengujian Template Email & Sanitasi XSS ---');

    const mockBooking = {
      _id: new mongoose.Types.ObjectId(),
      bookingNumber: 'KLA-20261112-999',
      category: 'dekor',
      eventDate: '2026-11-12',
      eventName: '<script>alert("xss")</script> Acara "Mewah"',
      location: 'Gedung <b onmouseover="evil()">Megah</b>',
      guestCount: 500,
      notes: 'Catatan <img src=x onerror=alert(1)> & "kutip"',
      dpAmount: 1000000,
      totalPrice: 15000000,
      expiresAt: new Date('2026-11-12T07:30:00.000Z'), // 14:30 WIB
      packageSnapshot: { name: 'Paket <Special> & Glamour' },
      customerSnapshot: { name: 'Siti <script>', phone: '08123456789' },
    };

    const mockSetting = {
      businessName: 'Kalila & Co',
      adminWhatsapp: '628123456789',
      maxProofAttempts: 3,
      kontak: { email: 'cs@kalila.com' },
    };

    const t1 = renderBookingCreatedAdmin(mockBooking, mockSetting);
    const t2 = renderBookingCreatedOwner(mockBooking, mockSetting);
    const t3 = renderPaymentProofAdmin(mockBooking, { amount: 1000000, attempt: 2, createdAt: new Date() }, mockSetting);
    const t4 = renderBookingConfirmedCustomer(mockBooking, mockSetting);

    // 1. Subject tidak boleh mengandung input pengguna
    [t1, t2, t3, t4].forEach((t, i) => {
      if (t.subject.includes('<script>') || t.subject.includes('alert')) {
        throw new Error(`g.1 Gagal: Subject template ${i + 1} memuat input pengguna`);
      }
      if (!t.text || typeof t.text !== 'string' || t.text.length < 10) {
        throw new Error(`g.1 Gagal: Template ${i + 1} tidak memiliki teks polos yang valid`);
      }
    });

    // 2. HTML escaping
    if (t1.html.includes('<script>') || !t1.html.includes('&lt;script&gt;')) {
      throw new Error('g.2 Gagal: input <script> tidak ter-escape di HTML template 1');
    }
    if (t4.html.includes('<script>') || !t4.html.includes('&lt;script&gt;')) {
      throw new Error('g.2 Gagal: nama customer tidak ter-escape di template 4');
    }

    // 3. Format tanggal WIB
    if (!t1.html.includes('12 November 2026 pukul 14.30 WIB')) {
      throw new Error(`g.3 Gagal: format waktu WIB tidak presisi: ${t1.html}`);
    }

    // 4. Format Rupiah
    if (!t1.html.includes('Rp1.000.000') && !t4.html.includes('Rp1.000.000')) {
      throw new Error('g.4 Gagal: format Rupiah tidak ditemukan');
    }

    // 5. Versi owner tidak memiliki tautan dashboard
    if (t2.html.includes('/orders/') || t2.text.includes('/orders/')) {
      throw new Error('g.5 Gagal: template owner memuat tautan dashboard!');
    }

    // 6. Template tanpa adminWhatsapp -> tombol WA diganti teks biasa
    const t4NoWa = renderBookingConfirmedCustomer(mockBooking, { ...mockSetting, adminWhatsapp: '' });
    if (t4NoWa.html.includes('https://wa.me')) {
      throw new Error('g.6 Gagal: nomor WhatsApp kosong tetap menghasilkan tombol wa.me');
    }

    // 7. Total harga null -> kalimat alternatif
    const t4NoTotal = renderBookingConfirmedCustomer({ ...mockBooking, totalPrice: null }, mockSetting);
    if (!t4NoTotal.html.includes('Total harga dan sisa pelunasan akan diinformasikan')) {
      throw new Error('g.7 Gagal: kalimat alternatif sisa tagihan kosong tidak tampil');
    }

    // 8. Teks "Unggahan ke-N" pada template payment_proof_admin
    if (!t3.html.includes('Unggahan ke-2 dari maksimal 3') || !t3.text.includes('Unggahan ke-2 dari maksimal 3')) {
      throw new Error('g.8 Gagal: teks "Unggahan ke-N" tidak ditemukan di template payment_proof_admin');
    }

    // 9. Format batas tengah malam WIB
    const midnightBefore = new Date('2026-11-12T16:59:00.000Z'); // 23:59 WIB tanggal 12
    const midnightAfter = new Date('2026-11-12T17:01:00.000Z'); // 00:01 WIB tanggal 13
    const strBefore = formatDateTimeWIB(midnightBefore);
    const strAfter = formatDateTimeWIB(midnightAfter);
    if (!strBefore.includes('23.59 WIB') || !strAfter.includes('00.01 WIB')) {
      throw new Error(`g.9 Gagal: format batas tengah malam salah: ${strBefore} vs ${strAfter}`);
    }

    console.log('✓ g) Validasi keempat template email, sanitasi XSS, format WIB & teks unggahan ke-N berhasil\n');

    // =========================================================================
    // h) Pengujian Job sendEmails & memoryProvider
    // =========================================================================
    console.log('--- h) Pengujian Background Job sendEmails & Logika Retry / Backoff ---');

    memoryProvider.clear();

    // 1. Eksekusi pengiriman item pending sukses
    const resJob1 = await processEmailOutbox(new Date());
    if (resJob1.sent < 1) {
      throw new Error(`h.1 Gagal: job tidak mengirimkan item pending: ${JSON.stringify(resJob1)}`);
    }

    // Periksa status item yang terkirim
    const sentItem = await EmailOutbox.findOne({ status: 'sent' });
    if (!sentItem || !sentItem.sentAt || !sentItem.purgeAt || !sentItem.provider) {
      throw new Error(`h.1 Gagal: metadata item sent tidak lengkap: ${JSON.stringify(sentItem)}`);
    }

    // 2. Pengujian Batas Harian (EMAIL_DAILY_LIMIT)
    process.env.EMAIL_DAILY_LIMIT = '1';
    const resLimit = await processEmailOutbox(new Date());
    if (resLimit.reason !== 'daily_limit_reached') {
      throw new Error(`h.2 Gagal: batas harian 1 tidak memblokir antrean: ${JSON.stringify(resLimit)}`);
    }
    process.env.EMAIL_DAILY_LIMIT = '90'; // restore

    // Kosongkan sisa antrean pending sebelum uji spesifik
    while ((await EmailOutbox.countDocuments({ status: 'pending' })) > 0) {
      await processEmailOutbox(new Date());
    }

    // 3. Pengujian Galat Retryable & Exponential Backoff
    const failItem = await EmailOutbox.create({
      type: 'booking_created_admin',
      dedupeKey: `retry-test-${Date.now()}`,
      booking: bookingId1,
      to: 'retry@kalila.com',
      subject: 'Retry Test',
      html: '<p>Retry</p>',
      text: 'Retry',
      status: 'pending',
    });
    trackEmail(failItem._id);

    // Suntikkan galat retryable (HTTP 429)
    memoryProvider.queueResult({
      success: false,
      retryable: true,
      error: 'HTTP 429 Too Many Requests',
    });

    await processEmailOutbox(new Date());
    const retryAfter1 = await EmailOutbox.findById(failItem._id);
    if (retryAfter1.status !== 'pending' || retryAfter1.attempts !== 1 || !retryAfter1.nextAttemptAt) {
      throw new Error(`h.3 Gagal: percobaan gagal retryable pertama tidak di-backoff: ${JSON.stringify(retryAfter1)}`);
    }

    // Ulangi sampai 5 kali percobaan -> harus jadi 'failed'
    await EmailOutbox.updateOne({ _id: failItem._id }, { attempts: 4, nextAttemptAt: new Date(Date.now() - 1000) });
    memoryProvider.queueResult({
      success: false,
      retryable: true,
      error: 'HTTP 500 Internal Error',
    });
    await processEmailOutbox(new Date());
    const retryAfter5 = await EmailOutbox.findById(failItem._id);
    if (retryAfter5.status !== 'failed' || retryAfter5.attempts !== 5 || !retryAfter5.purgeAt) {
      throw new Error(`h.3 Gagal: percobaan ke-5 tidak berstatus failed: ${JSON.stringify(retryAfter5)}`);
    }

    // 4. Pengujian Galat Permanen (4xx) -> langsung failed tanpa retry
    const permItem = await EmailOutbox.create({
      type: 'booking_created_admin',
      dedupeKey: `perm-test-${Date.now()}`,
      booking: bookingId1,
      to: 'invalid-domain@kalila.com',
      subject: 'Perm Test',
      html: '<p>Perm</p>',
      text: 'Perm',
      status: 'pending',
    });
    trackEmail(permItem._id);

    memoryProvider.queueResult({
      success: false,
      retryable: false,
      error: 'Invalid recipient domain (422 Unprocessable)',
    });
    await processEmailOutbox(new Date());
    const permAfter = await EmailOutbox.findById(permItem._id);
    if (permAfter.status !== 'failed' || permAfter.attempts !== 1) {
      throw new Error(`h.4 Gagal: error permanen harus langsung failed: ${JSON.stringify(permAfter)}`);
    }

    // 5. Pemulihan item yang terkunci / stale lock
    await EmailOutbox.updateOne(
      { _id: permItem._id },
      {
        status: 'sending',
        lockedUntil: new Date(Date.now() - 600000),
        nextAttemptAt: new Date(Date.now() + 60000), // jadwal masa depan agar tidak langsung terkirim di tick pemulihan
      }
    );
    await processEmailOutbox(new Date());
    const recovered = await EmailOutbox.findById(permItem._id);
    if (recovered.status !== 'pending' || recovered.lockedUntil !== null) {
      throw new Error(`h.5 Gagal: stale lock tidak dipulihkan ke pending (${recovered.status})`);
    }

    console.log('✓ h) Background job, batching, retry backoff, dan pemulihan stale lock berhasil\n');

    // =========================================================================
    // i) Pengujian EMAIL_REDIRECT_TO
    // =========================================================================
    console.log('--- i) Pengujian EMAIL_REDIRECT_TO ---');

    process.env.EMAIL_REDIRECT_TO = 'sandbox.inbox@kalila.com';
    const redirDoc = await enqueue({
      type: 'booking_created_admin',
      dedupeKey: `redir-test-${Date.now()}`,
      booking: bookingId1,
      to: 'asli.pelanggan@gmail.com',
      subject: 'Pesanan Diterima',
      html: '<p>Tes</p>',
      text: 'Tes',
    });
    trackEmail(redirDoc._id);

    if (redirDoc.to !== 'sandbox.inbox@kalila.com') {
      throw new Error(`i Gagal: target to tidak dialihkan (${redirDoc.to})`);
    }
    if (redirDoc.originalTo !== 'asli.pelanggan@gmail.com') {
      throw new Error(`i Gagal: originalTo tidak tercatat (${redirDoc.originalTo})`);
    }
    if (!redirDoc.subject.startsWith('[UJI] ')) {
      throw new Error(`i Gagal: subject tidak diawali [UJI] (${redirDoc.subject})`);
    }
    delete process.env.EMAIL_REDIRECT_TO; // bersihkan
    console.log('✓ i) EMAIL_REDIRECT_TO mengalihkan penerima dan mencatat originalTo dengan benar\n');

    // =========================================================================
    // j) Pengujian Keamanan Konfigurasi (getEmailConfigStatus)
    // =========================================================================
    console.log('--- j) Pengujian Keamanan Konfigurasi Provider ---');

    // 1. NODE_ENV = production menolak log & memory
    process.env.NODE_ENV = 'production';
    process.env.EMAIL_PROVIDER = 'log';
    const cfgProdLog = getEmailConfigStatus();
    if (cfgProdLog.ready !== false) {
      throw new Error('j.1 Gagal: production mengizinkan provider log');
    }
    process.env.EMAIL_PROVIDER = 'memory';
    const cfgProdMemory = getEmailConfigStatus();
    if (cfgProdMemory.ready !== false) {
      throw new Error('j.1 Gagal: production mengizinkan provider memory');
    }

    // 2. NODE_ENV = production menolak resend.dev
    process.env.EMAIL_PROVIDER = 'resend';
    process.env.RESEND_API_KEY = 're_test_key_123';
    process.env.EMAIL_FROM = 'Kalila <noreply@resend.dev>';
    const cfgProdSandbox = getEmailConfigStatus();
    if (cfgProdSandbox.ready !== false) {
      throw new Error('j.2 Gagal: production mengizinkan domain resend.dev');
    }

    // 3. Non-production sandbox tanpa redirect -> ditolak; dengan redirect -> siap
    process.env.NODE_ENV = 'development';
    delete process.env.EMAIL_REDIRECT_TO;
    const cfgDevNoRedir = getEmailConfigStatus();
    if (cfgDevNoRedir.ready !== false) {
      throw new Error('j.3 Gagal: sandbox tanpa EMAIL_REDIRECT_TO seharusnya tidak ready');
    }
    const resNoRedirJob = await processEmailOutbox(new Date());
    if (resNoRedirJob.processed !== 0 || !resNoRedirJob.reason) {
      throw new Error('j.3 Gagal: sandbox tanpa EMAIL_REDIRECT_TO tidak boleh memproses email outbox');
    }

    process.env.EMAIL_REDIRECT_TO = 'tester@kalila.com';
    const cfgDevWithRedir = getEmailConfigStatus();
    if (cfgDevWithRedir.ready !== true || cfgDevWithRedir.mode !== 'sandbox') {
      throw new Error('j.3 Gagal: sandbox dengan EMAIL_REDIRECT_TO harus ready');
    }

    // 4. Provider resend tanpa API key -> not ready, job tidak melempar uncaught error
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_REDIRECT_TO;
    const cfgNoKey = getEmailConfigStatus();
    if (cfgNoKey.ready !== false) {
      throw new Error('j.4 Gagal: resend tanpa api key tidak boleh ready');
    }
    const resNoKeyJob = await processEmailOutbox(new Date());
    if (resNoKeyJob.processed !== 0) {
      throw new Error('j.4 Gagal: resend tanpa api key tidak boleh memproses email outbox');
    }

    // Restore env
    process.env.NODE_ENV = 'test';
    process.env.EMAIL_PROVIDER = 'memory';
    delete process.env.EMAIL_REDIRECT_TO;
    console.log('✓ j) Aturan keamanan konfigurasi dan pembatasan sandbox terverifikasi\n');

    // =========================================================================
    // k) Adapter Resend (Unit Test Mock Client)
    // =========================================================================
    console.log('--- k) Pengujian Unit Adapter Resend (Mock SDK Client) ---');

    let capturedPayload = null;
    let capturedOptions = null;

    const mockResendClient = {
      emails: {
        send: async (payload, options) => {
          capturedPayload = payload;
          capturedOptions = options;
          return { data: { id: 'msg_resend_mock_123' }, error: null };
        },
      },
    };

    const resendAdapter = createResendProvider({ client: mockResendClient });
    const adapterRes = await resendAdapter.sendEmail({
      from: 'Kalila <noreply@kalila.com>',
      to: 'customer@gmail.com',
      subject: 'Subject Test',
      html: '<p>HTML</p>',
      text: 'Text',
      replyTo: 'reply@kalila.com',
      idempotencyKey: 'outbox-12345',
    });

    if (!adapterRes.success || adapterRes.messageId !== 'msg_resend_mock_123') {
      throw new Error('k.1 Gagal: adapter sendEmail tidak mengembalikan ID pesan');
    }
    if (
      capturedPayload.from !== 'Kalila <noreply@kalila.com>' ||
      capturedPayload.to[0] !== 'customer@gmail.com' ||
      capturedPayload.reply_to !== 'reply@kalila.com' ||
      capturedOptions.idempotencyKey !== 'outbox-12345'
    ) {
      throw new Error(`k.1 Gagal: pemetaan field adapter Resend tidak cocok: ${JSON.stringify(capturedPayload)}`);
    }

    // Uji klasifikasi error 429 (retryable)
    mockResendClient.emails.send = async () => ({
      data: null,
      error: { statusCode: 429, message: 'Too many requests' },
    });
    const res429 = await resendAdapter.sendEmail({ from: 'a', to: 'b', subject: 'c', html: 'd', text: 'e' });
    if (!res429.retryable) {
      throw new Error('k.2 Gagal: error 429 harus diklasifikasikan sebagai retryable');
    }

    // Uji klasifikasi error 403 (permanent)
    mockResendClient.emails.send = async () => ({
      data: null,
      error: { statusCode: 403, message: 'Forbidden' },
    });
    const res403 = await resendAdapter.sendEmail({ from: 'a', to: 'b', subject: 'c', html: 'd', text: 'e' });
    if (res403.retryable) {
      throw new Error('k.3 Gagal: error 403 tidak boleh retryable');
    }

    // Uji timeout
    const timeoutAdapter = createResendProvider({
      client: {
        emails: {
          send: () => new Promise((resolve) => setTimeout(resolve, 500)),
        },
      },
      timeoutMs: 50,
    });
    const timeoutRes = await timeoutAdapter.sendEmail({ from: 'a', to: 'b', subject: 'c', html: 'd', text: 'e' });
    if (!timeoutRes.isTimeout || !timeoutRes.retryable) {
      throw new Error('k.4 Gagal: timeout adapter tidak terdeteksi');
    }

    console.log('✓ k) Adapter Resend berhasil memetakan field, menangani timeout & klasifikasi error\n');

    // =========================================================================
    // l) Endpoint Admin (/api/admin/emails)
    // =========================================================================
    console.log('--- l) Pengujian Endpoint Admin (/api/admin/emails) ---');

    // 1. Proteksi 401 & 403
    const unauthRes = await fetch(`${baseUrl}/api/admin/emails`);
    if (unauthRes.status !== 401) {
      throw new Error(`l.1 Gagal: tanpa token harus 401, got ${unauthRes.status}`);
    }
    const custRes = await fetch(`${baseUrl}/api/admin/emails`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    if (custRes.status !== 403) {
      throw new Error(`l.1 Gagal: token customer harus 403, got ${custRes.status}`);
    }

    // 2. Daftar email & sanitasi respons (tanpa HTML, email disamarkan)
    const listRes = await fetch(`${baseUrl}/api/admin/emails?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken1}` },
    });
    const listJson = await listRes.json();
    if (listRes.status !== 200 || !listJson.data.items) {
      throw new Error('l.2 Gagal mengambil daftar email');
    }
    const firstItem = listJson.data.items[0];
    if (firstItem.html !== undefined) {
      throw new Error('l.2 Gagal: field html bocor di daftar email admin!');
    }
    if (!firstItem.to.includes('***')) {
      throw new Error(`l.2 Gagal: penerima email tidak disamarkan: ${firstItem.to}`);
    }

    // 3. Pencarian teks dengan karakter regex bermasalah ("(", ".*")
    const regexSearchRes = await fetch(`${baseUrl}/api/admin/emails?q=(.*+?`, {
      headers: { Authorization: `Bearer ${adminToken1}` },
    });
    if (regexSearchRes.status !== 200) {
      throw new Error(`l.3 Gagal: pencarian regex menyebabkan error: ${regexSearchRes.status}`);
    }

    // 4. Detail email outbox (GET /:id) tanpa HTML
    const detailRes = await fetch(`${baseUrl}/api/admin/emails/${firstItem._id}`, {
      headers: { Authorization: `Bearer ${adminToken1}` },
    });
    const detailJson = await detailRes.json();
    if (detailRes.status !== 200 || detailJson.data.html !== undefined || !detailJson.data.text) {
      throw new Error('l.4 Gagal: detail email harus memuat text tanpa html');
    }

    // 5. Retry endpoint (POST /:id/retry)
    // Bukan failed -> 409
    const retryNonFailedRes = await fetch(`${baseUrl}/api/admin/emails/${sentItem._id}/retry`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken1}` },
    });
    if (retryNonFailedRes.status !== 409) {
      throw new Error(`l.5 Gagal: retry email berstatus sent harus 409, got ${retryNonFailedRes.status}`);
    }

    // Failed -> 200 & jadi pending
    const retryFailedRes = await fetch(`${baseUrl}/api/admin/emails/${retryAfter5._id}/retry`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken1}` },
    });
    const retryFailedJson = await retryFailedRes.json();
    if (retryFailedRes.status !== 200 || retryFailedJson.data.status !== 'pending') {
      throw new Error(`l.5 Gagal: retry email failed harus 200 dan jadi pending: ${JSON.stringify(retryFailedJson)}`);
    }

    // 6. Status endpoint (GET /status)
    const statusRes = await fetch(`${baseUrl}/api/admin/emails/status`, {
      headers: { Authorization: `Bearer ${adminToken1}` },
    });
    const statusJson = await statusRes.json();
    if (statusRes.status !== 200 || statusJson.data.provider !== 'memory') {
      throw new Error(`l.6 Gagal: status endpoint tidak akurat: ${JSON.stringify(statusJson)}`);
    }
    // Verifikasi bahwa endpoint /status tidak membocorkan kredensial atau API key rahasia
    if (statusJson.data.resendApiKey !== undefined || JSON.stringify(statusJson).includes('re_')) {
      throw new Error('l.6 Gagal: /status membocorkan data rahasia!');
    }

    // 7. Test email endpoint (POST /test)
    const testSendRes = await fetch(`${baseUrl}/api/admin/emails/test`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken1}` },
    });
    const testSendJson = await testSendRes.json();
    if (testSendRes.status !== 200 || !testSendJson.data.messageId) {
      throw new Error(`l.7 Gagal mengirim email pengujian: ${JSON.stringify(testSendJson)}`);
    }
    // Verifikasi bahwa email pengujian HANYA dikirim ke email admin yang sedang login
    const allSentMem = memoryProvider.getSentEmails();
    const lastSentItem = allSentMem[allSentMem.length - 1];
    if (!lastSentItem || lastSentItem.to !== admin1.email) {
      throw new Error(`l.7 Gagal: email tes harus dikirim ke admin login (${admin1.email}), got: ${lastSentItem?.to}`);
    }

    console.log('✓ l) Seluruh endpoint admin outbox, filter, retry & proteksi terverifikasi\n');

    // =========================================================================
    // m) Pengujian TTL PurgeAt
    // =========================================================================
    console.log('--- m) Pengujian TTL PurgeAt ---');
    const sentChecked = await EmailOutbox.findOne({ status: 'sent' });
    const purgeSentDays = Math.round((sentChecked.purgeAt - sentChecked.sentAt) / (24 * 3600 * 1000));
    if (purgeSentDays < 29 || purgeSentDays > 31) {
      throw new Error(`m Gagal: purgeAt status sent harus sekitar 30 hari, got ${purgeSentDays} hari`);
    }

    const failedChecked = await EmailOutbox.findOne({ status: 'failed' });
    if (failedChecked && failedChecked.purgeAt) {
      const purgeFailedDays = Math.round((failedChecked.purgeAt - failedChecked.updatedAt) / (24 * 3600 * 1000));
      if (purgeFailedDays < 89 || purgeFailedDays > 91) {
        throw new Error(`m Gagal: purgeAt status failed harus sekitar 90 hari, got ${purgeFailedDays} hari`);
      }
    }
    console.log('✓ m) Pengisian TTL purgeAt (30 hari sent, 90 hari failed) terverifikasi\n');

    console.log('================================================================');
    console.log('SEMUA SKENARIO PENGUJIAN EMAIL OUTBOX (a - m) BERHASIL (ALL PASSED)!');
    console.log('================================================================\n');
  } finally {
    console.log('--- Memulai Pembersihan Data Uji (Finally Block) ---');
    await EmailOutbox.deleteMany({});
    await cleanTrackedData();
    await restoreSettings();
    await disconnectTestDb();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    console.log('✓ Data uji berhasil dibersihkan.');
    console.log('✓ Koneksi test database ditutup.\n');
  }
}

if (require.main === module) {
  runEmailTests().catch((err) => {
    console.error('\n❌ PENGUJIAN EMAIL GAGAL:\n', err);
    process.exit(1);
  });
}

module.exports = { runEmailTests };
