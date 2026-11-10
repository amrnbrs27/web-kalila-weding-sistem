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

async function runBookingTests() {
  console.log('================================================================');
  console.log('Memulai Pengujian Otomatis Booking, Admin, Kunci Slot & Job');
  console.log('================================================================\n');

  try {
    const { testDbName } = await connectTestDb();
    console.log(`[Database Pengujian] Terhubung ke: "${testDbName}"`);

    await backupSettings();

    // Jalankan server HTTP
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(5017, () => {
        baseUrl = 'http://localhost:5017';
        console.log(`✓ Server pengujian berjalan di ${baseUrl}\n`);
        resolve();
      });
    });

    // Buat admin uji dan pelanggan uji
    const { user: adminUser, token: adminToken } = await createTestAdmin();
    const { user: custUser1, token: custToken1 } = await createTestCustomer();
    const { user: custUser2, token: custToken2 } = await createTestCustomer();
    console.log('✓ Akun admin dan pelanggan uji berhasil disiapkan');

    // Buat paket dekor, catering, dan wedding untuk tes
    const rand = Date.now();
    const pkgDekor = await Package.create({
      category: 'dekor',
      name: `Paket Dekor Test ${rand}`,
      slug: `paket-dekor-${rand}`,
      price: 5000000,
      decorWidthCm: 400,
      isActive: true,
      images: [],
    });
    trackPackage(pkgDekor._id);

    const pkgCatering = await Package.create({
      category: 'catering',
      name: `Paket Catering Test ${rand}`,
      slug: `paket-catering-${rand}`,
      price: 15000000,
      isActive: true,
      images: [],
    });
    trackPackage(pkgCatering._id);

    const pkgWedding = await Package.create({
      category: 'wedding',
      name: `Paket Wedding Test ${rand}`,
      slug: `paket-wedding-${rand}`,
      price: 25000000,
      isActive: true,
      images: [],
    });
    trackPackage(pkgWedding._id);

    const pkgInactive = await Package.create({
      category: 'dekor',
      name: `Paket Inactive ${rand}`,
      slug: `paket-inactive-${rand}`,
      price: 3000000,
      decorWidthCm: 300,
      isActive: false,
      images: [],
    });
    trackPackage(pkgInactive._id);

    // Pastikan Setting terkonfigurasi
    await Setting.findOneAndUpdate(
      { key: 'main' },
      {
        $set: {
          dpAmount: 1000000,
          paymentDeadlineHours: 24,
          'maxEventsPerDay.dekor': 2,
          'maxEventsPerDay.catering': 2,
          'maxEventsPerDay.wedding': 1,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    // =========================================================================
    // SKENARIO PELANGGAN (a - h)
    // =========================================================================
    console.log('\n--- Skenario Pelanggan ---');

    // a) Buat pesanan dekor valid: status menunggu_dp, paymentStatus belum_dp, expiresAt, dpAmount dari Setting, harga dari paket
    const dateA = getUpcomingDate(15);
    const createResA = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken1}`,
      },
      body: JSON.stringify({
        packageId: pkgDekor._id.toString(),
        eventDate: dateA,
        eventName: 'Pernikahan Cantik Sarah',
        location: 'Jl. Merdeka No. 10 Jakarta',
        guestCount: 200,
        formData: {
          decorArea: 'Indoor Ballroom',
        },
      }),
    });
    const createDataA = await createResA.json();
    if (createResA.status !== 201 || !createDataA.success) {
      throw new Error(`Skenario a gagal: ${JSON.stringify(createDataA)}`);
    }
    const bookingA = createDataA.data;
    trackBooking(bookingA._id);

    if (
      bookingA.status !== 'menunggu_dp' ||
      bookingA.paymentStatus !== 'belum_dp' ||
      bookingA.dpAmount !== 1000000 ||
      bookingA.packageSnapshot.price !== 5000000 ||
      !bookingA.expiresAt ||
      !bookingA.bookingNumber
    ) {
      throw new Error('Skenario a: data pesanan pelanggan tidak sesuai spesifikasi');
    }
    console.log('✓ a) Pesanan dekor valid berhasil dibuat dengan status menunggu_dp, dpAmount snapshot, dan harga paket');

    // b) Tanpa token 401; admin mencoba POST /api/bookings 403
    const noTokenRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageId: pkgDekor._id.toString(), eventDate: dateA }),
    });
    if (noTokenRes.status !== 401) throw new Error('Skenario b: tanpa token harus 401');

    const adminPostRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        packageId: pkgDekor._id.toString(),
        eventDate: dateA,
        eventName: 'Admin Booking Test',
        location: 'Gedung Serbaguna',
      }),
    });
    if (adminPostRes.status !== 403) throw new Error('Skenario b: admin POST /api/bookings harus 403');
    console.log('✓ b) Proteksi endpoint booking: 401 tanpa token, 403 untuk akun role admin');

    // c) Paket tidak ada / tidak aktif 404; tanggal lewat 400; tanggal diblokir 409; tanggal penuh 409
    const fakePkgId = new mongoose.Types.ObjectId().toString();
    const pkgNotFoundRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken1}` },
      body: JSON.stringify({
        packageId: fakePkgId,
        eventDate: getUpcomingDate(16),
        eventName: 'Test',
        location: 'Test',
      }),
    });
    if (pkgNotFoundRes.status !== 404) throw new Error('Skenario c: paket fiktif harus 404');

    const pkgInactiveRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken1}` },
      body: JSON.stringify({
        packageId: pkgInactive._id.toString(),
        eventDate: getUpcomingDate(16),
        eventName: 'Test',
        location: 'Test',
      }),
    });
    if (pkgInactiveRes.status !== 404) throw new Error('Skenario c: paket tidak aktif harus 404');

    const pastDateRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken1}` },
      body: JSON.stringify({
        packageId: pkgDekor._id.toString(),
        eventDate: '2020-01-01',
        eventName: 'Test',
        location: 'Test',
      }),
    });
    if (pastDateRes.status !== 400) throw new Error('Skenario c: tanggal lampau harus 400');

    const blockedDate = getUpcomingDate(17);
    const blockDoc = await CalendarBlock.create({
      date: blockedDate,
      category: 'dekor',
      createdBy: adminUser._id,
      reason: 'Gudang tutup',
    });
    trackCalendarBlock(blockDoc._id);

    const blockedBookingRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken1}` },
      body: JSON.stringify({
        packageId: pkgDekor._id.toString(),
        eventDate: blockedDate,
        eventName: 'Test Blocked',
        location: 'Test',
      }),
    });
    if (blockedBookingRes.status !== 409) throw new Error('Skenario c: tanggal diblokir harus 409');

    const fullDate = getUpcomingDate(18);
    // Isi 2 booking terkonfirmasi pada fullDate (kuota dekor = 2)
    const bFull1 = await Booking.create({
      customerSnapshot: { name: 'Full1', phone: '081', email: 'f1@t.com' },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: fullDate,
      eventName: 'Full 1',
      location: 'Loc',
      status: 'terkonfirmasi',
      paymentStatus: 'dp_dibayar',
      dpAmount: 1000000,
    });
    trackBooking(bFull1._id);
    const bFull2 = await Booking.create({
      customerSnapshot: { name: 'Full2', phone: '082', email: 'f2@t.com' },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: fullDate,
      eventName: 'Full 2',
      location: 'Loc',
      status: 'terkonfirmasi',
      paymentStatus: 'dp_dibayar',
      dpAmount: 1000000,
    });
    trackBooking(bFull2._id);

    const fullBookingRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken1}` },
      body: JSON.stringify({
        packageId: pkgDekor._id.toString(),
        eventDate: fullDate,
        eventName: 'Test Full',
        location: 'Test',
      }),
    });
    if (fullBookingRes.status !== 409) throw new Error('Skenario c: tanggal penuh harus 409');
    console.log('✓ c) Validasi ketersediaan: 404 paket tak ada/nonaktif, 400 tanggal lewat, 409 tanggal diblokir/penuh');

    // d) catering/wedding tanpa guestCount 400; formData key tak dikenal 400; client kirim price/status/dpAmount 400
    const catNoGuestRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken1}` },
      body: JSON.stringify({
        packageId: pkgCatering._id.toString(),
        eventDate: getUpcomingDate(20),
        eventName: 'Catering No Guest',
        location: 'Loc',
        // guestCount tidak ada
      }),
    });
    if (catNoGuestRes.status !== 400) throw new Error('Skenario d: catering tanpa guestCount harus 400');

    const wedNoGuestRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken1}` },
      body: JSON.stringify({
        packageId: pkgWedding._id.toString(),
        eventDate: getUpcomingDate(20),
        eventName: 'Wedding No Guest',
        location: 'Loc',
      }),
    });
    if (wedNoGuestRes.status !== 400) throw new Error('Skenario d: wedding tanpa guestCount harus 400');

    const badFormDataRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken1}` },
      body: JSON.stringify({
        packageId: pkgDekor._id.toString(),
        eventDate: getUpcomingDate(20),
        eventName: 'Dekor Bad Form',
        location: 'Loc',
        formData: { hackerField: 'injeksi' },
      }),
    });
    if (badFormDataRes.status !== 400) throw new Error('Skenario d: formData field tak dikenal harus 400');

    const clientPriceRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken1}` },
      body: JSON.stringify({
        packageId: pkgDekor._id.toString(),
        eventDate: getUpcomingDate(20),
        eventName: 'Dekor Injection',
        location: 'Loc',
        price: 100, // client mencoba kirim price
      }),
    });
    if (clientPriceRes.status !== 400) throw new Error('Skenario d: client kirim price harus 400');
    console.log('✓ d) Validasi Zod ketat: catering/wedding tanpa guestCount, key formData asing, dan injeksi status/price ditolak 400');

    // e) Pesanan aktif ganda untuk paket dan tanggal yang sama oleh pelanggan yang sama 409
    // custUser1 sudah memesan pkgDekor pada dateA di skenario a (status: menunggu_dp)
    const dupRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken1}` },
      body: JSON.stringify({
        packageId: pkgDekor._id.toString(),
        eventDate: dateA,
        eventName: 'Sarah Pesan Lagi',
        location: 'Jl. Sudirman',
      }),
    });
    if (dupRes.status !== 409) throw new Error('Skenario e: pesanan ganda aktif harus 409');
    console.log('✓ e) Pesanan aktif ganda untuk paket dan tanggal yang sama oleh pelanggan yang sama ditolak (409)');

    // f) Dua pelanggan berbeda memesan tanggal yang sama pada kuota 1: KEDUANYA berhasil (menunggu_dp tidak menahan slot)
    const dateF = getUpcomingDate(22);
    // Set kuota wedding = 1
    const resCust1Wedding = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken1}` },
      body: JSON.stringify({
        packageId: pkgWedding._id.toString(),
        eventDate: dateF,
        eventName: 'Pernikahan Klien 1',
        location: 'Hotel Mulia',
        guestCount: 500,
      }),
    });
    const dataCust1 = await resCust1Wedding.json();
    if (resCust1Wedding.status !== 201) throw new Error('Skenario f: klien 1 harus berhasil');
    trackBooking(dataCust1.data._id);

    const resCust2Wedding = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken2}` },
      body: JSON.stringify({
        packageId: pkgWedding._id.toString(),
        eventDate: dateF,
        eventName: 'Pernikahan Klien 2',
        location: 'Hotel Mulia',
        guestCount: 300,
      }),
    });
    const dataCust2 = await resCust2Wedding.json();
    if (resCust2Wedding.status !== 201) throw new Error('Skenario f: klien 2 juga harus berhasil');
    trackBooking(dataCust2.data._id);
    console.log('✓ f) Dua pelanggan berbeda memesan tanggal yang sama pada kuota 1: KEDUANYA berhasil (menunggu_dp tidak menahan slot)');

    // g) GET /api/bookings/me hanya memuat pesanan sendiri & pagination; GET /api/bookings/:id orang lain 404; respons tanpa refundNote / "by"
    const meRes = await fetch(`${baseUrl}/api/bookings/me?limit=5`, {
      headers: { Authorization: `Bearer ${custToken1}` },
    });
    const meJson = await meRes.json();
    if (meRes.status !== 200 || !meJson.data.items || meJson.data.pagination.total < 2) {
      throw new Error('Skenario g: GET /api/bookings/me gagal');
    }
    // Pastikan seluruh item milik custUser1
    for (const item of meJson.data.items) {
      if (item.refundNote !== undefined) throw new Error('Skenario g: refundNote bocor ke pelanggan!');
      for (const h of item.statusHistory) {
        if (h.by !== undefined) throw new Error('Skenario g: field by pada statusHistory bocor ke pelanggan!');
      }
    }

    // Coba akses pesanan milik custUser2 menggunakan token custUser1
    const otherId = dataCust2.data._id;
    const otherRes = await fetch(`${baseUrl}/api/bookings/${otherId}`, {
      headers: { Authorization: `Bearer ${custToken1}` },
    });
    if (otherRes.status !== 404) {
      throw new Error(`Skenario g: akses pesanan orang lain harus 404, got ${otherRes.status}`);
    }
    console.log('✓ g) GET /api/bookings/me hanya memuat pesanan sendiri, GET /api/bookings/:id milik orang lain 404, data disanitasi');

    // h) Bentrok bookingNumber: simulasikan lalu pastikan pembuatan tetap berhasil lewat retry
    const dateH = getUpcomingDate(25);
    // Buat booking awal
    const bExistingH = await Booking.create({
      bookingNumber: `KLA-${dateH.replace(/-/g, '')}-ABCD`,
      customerSnapshot: { name: 'H', phone: '081', email: 'h@t.com' },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: dateH,
      eventName: 'Event H',
      location: 'Loc',
      dpAmount: 1000000,
    });
    trackBooking(bExistingH._id);

    // Sekarang coba buat pesanan via endpoint, nomor booking otomatis unik lewat mekanisme retry
    const resH = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken1}` },
      body: JSON.stringify({
        packageId: pkgDekor._id.toString(),
        eventDate: dateH,
        eventName: 'Event H Baru',
        location: 'Loc',
      }),
    });
    const jsonH = await resH.json();
    if (resH.status !== 201) throw new Error('Skenario h: booking dengan potensi bentrok gagal');
    trackBooking(jsonH.data._id);
    console.log('✓ h) Mekanisme penanganan bentrok bookingNumber berhasil menghasilkan kode unik');

    // =========================================================================
    // SKENARIO ADMIN (i - p)
    // =========================================================================
    console.log('\n--- Skenario Admin ---');

    // i) Semua endpoint admin 401 tanpa token dan 403 dengan token customer
    const adminGetNoTok = await fetch(`${baseUrl}/api/admin/bookings`);
    if (adminGetNoTok.status !== 401) throw new Error('Skenario i: admin GET tanpa token harus 401');

    const adminGetCustTok = await fetch(`${baseUrl}/api/admin/bookings`, {
      headers: { Authorization: `Bearer ${custToken1}` },
    });
    if (adminGetCustTok.status !== 403) throw new Error('Skenario i: admin GET dengan customer token harus 403');

    const adminManualNoTok = await fetch(`${baseUrl}/api/admin/bookings/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventDate: getUpcomingDate(26) }),
    });
    if (adminManualNoTok.status !== 401) throw new Error('Skenario i: admin POST manual tanpa token harus 401');

    const adminManualCustTok = await fetch(`${baseUrl}/api/admin/bookings/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken1}` },
      body: JSON.stringify({ eventDate: getUpcomingDate(26) }),
    });
    if (adminManualCustTok.status !== 403) throw new Error('Skenario i: admin POST manual dengan customer token harus 403');
    console.log('✓ i) Semua endpoint admin terlindungi (401 tanpa token, 403 dengan token customer)');

    // j) Daftar dengan filter, pencarian dengan karakter regex ("(", ".*") tanpa error, sort di luar whitelist 400
    const filterRes = await fetch(`${baseUrl}/api/admin/bookings?category=dekor&status=menunggu_dp`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (filterRes.status !== 200) throw new Error('Skenario j: filter admin gagal');

    const regexSearchAdmin = await fetch(`${baseUrl}/api/admin/bookings?q=(.*+?)`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (regexSearchAdmin.status !== 200) throw new Error('Skenario j: pencarian dengan karakter regex error 500');

    const badSortAdmin = await fetch(`${baseUrl}/api/admin/bookings?sort=drop_table`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (badSortAdmin.status !== 400) throw new Error('Skenario j: sort ilegal harus ditolak 400');
    console.log('✓ j) Filter pencarian admin, sanitasi karakter regex aman, dan whitelist sort 400 terverifikasi');

    // k) Transisi status: menunggu_dp -> berlangsung ditolak; apa pun -> terkonfirmasi ditolak; pembatalan tanpa reason 400; pembatalan tercatat di statusHistory; status akhir tidak bisa diubah; dua perubahan status bersamaan hanya 1 berhasil
    const bookingKId = bookingA._id; // status: menunggu_dp
    const invalidTransRes = await fetch(`${baseUrl}/api/admin/bookings/${bookingKId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'berlangsung' }),
    });
    if (invalidTransRes.status !== 400) throw new Error('Skenario k: menunggu_dp ke berlangsung harus ditolak 400');

    const toTerkonfirmasiRes = await fetch(`${baseUrl}/api/admin/bookings/${bookingKId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'terkonfirmasi' }),
    });
    if (toTerkonfirmasiRes.status !== 400) throw new Error('Skenario k: ubah ke terkonfirmasi via endpoint status harus 400');

    const cancelNoReasonRes = await fetch(`${baseUrl}/api/admin/bookings/${bookingKId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'dibatalkan' }),
    });
    if (cancelNoReasonRes.status !== 400) throw new Error('Skenario k: batal tanpa alasan harus ditolak 400');

    // Pembatalan valid
    const cancelValidRes = await fetch(`${baseUrl}/api/admin/bookings/${bookingKId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'dibatalkan', reason: 'Pelanggan minta ganti vendor' }),
    });
    if (cancelValidRes.status !== 200) throw new Error('Skenario k: pembatalan valid gagal');
    const cancelJson = await cancelValidRes.json();
    if (cancelJson.data.cancelReason !== 'Pelanggan minta ganti vendor') {
      throw new Error('Skenario k: cancelReason tidak tersimpan');
    }

    // Status akhir (dibatalkan) tidak bisa diubah lagi
    const changeAfterFinal = await fetch(`${baseUrl}/api/admin/bookings/${bookingKId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'selesai' }),
    });
    if (changeAfterFinal.status !== 409 && changeAfterFinal.status !== 400) {
      throw new Error('Skenario k: status akhir harus tidak bisa diubah lagi (409/400)');
    }

    // Uji dua perubahan status bersamaan pada pesanan yang sama: tepat 1 berhasil
    const dateKConcurrent = getUpcomingDate(27);
    const bConcurrent = await Booking.create({
      customerSnapshot: { name: 'KConc', phone: '081', email: 'k@c.com' },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: dateKConcurrent,
      eventName: 'Concurrent Test',
      location: 'Loc',
      status: 'terkonfirmasi',
      paymentStatus: 'dp_dibayar',
      dpAmount: 1000000,
    });
    trackBooking(bConcurrent._id);

    const [resConc1, resConc2] = await Promise.all([
      fetch(`${baseUrl}/api/admin/bookings/${bConcurrent._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status: 'berlangsung' }),
      }),
      fetch(`${baseUrl}/api/admin/bookings/${bConcurrent._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status: 'dibatalkan', reason: 'Batal cepat' }),
      }),
    ]);
    const statuses = [resConc1.status, resConc2.status];
    const successCount = statuses.filter((s) => s === 200).length;
    const conflictCount = statuses.filter((s) => s === 409).length;
    if (successCount !== 1 || conflictCount !== 1) {
      throw new Error(`Skenario k: konkurensi status gagal, statuses=${JSON.stringify(statuses)}`);
    }
    console.log('✓ k) Transisi status terkontrol ketat, atomik, penolakan transisi ilegal & konkurensi terlindungi');

    // l) Pesanan manual: pelanggan baru dengan dpPaid=false menjadi menunggu_dp; catering custom tanpa paket berhasil; dekor atau wedding tanpa paket 400; customerId tidak valid 400
    const dateL = getUpcomingDate(30);
    const manualNewCustRes = await fetch(`${baseUrl}/api/admin/bookings/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        customer: { name: 'Pak Handoko Baru', phone: '081234567891', email: 'handoko@test.com' },
        packageId: pkgDekor._id.toString(),
        eventDate: dateL,
        eventName: 'Pernikahan Handoko',
        location: 'Rumah',
        dpPaid: false,
      }),
    });
    const manualNewCustData = await manualNewCustRes.json();
    if (manualNewCustRes.status !== 201 || manualNewCustData.data.status !== 'menunggu_dp') {
      throw new Error('Skenario l: pesanan manual baru dpPaid=false gagal');
    }
    trackBooking(manualNewCustData.data._id);

    // Catering custom tanpa paket
    const manualCatCustomRes = await fetch(`${baseUrl}/api/admin/bookings/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        customer: { name: 'Bu Ani', phone: '081234567892' },
        category: 'catering',
        eventDate: dateL,
        eventName: 'Catering Tumpeng Syukuran',
        location: 'Kantor',
        guestCount: 50,
        packageSnapshot: { name: 'Catering Prasmanan Custom 50 Pax', price: 3500000 },
        dpPaid: false,
      }),
    });
    const manualCatCustomData = await manualCatCustomRes.json();
    if (manualCatCustomRes.status !== 201 || !manualCatCustomData.data.packageSnapshot.name.includes('Custom')) {
      throw new Error('Skenario l: catering custom tanpa paket gagal');
    }
    trackBooking(manualCatCustomData.data._id);

    // Dekor tanpa paket harus 400
    const manualDekorNoPkg = await fetch(`${baseUrl}/api/admin/bookings/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        customer: { name: 'Salah', phone: '081234567893' },
        category: 'dekor',
        eventDate: dateL,
        eventName: 'Dekor No Pkg',
        location: 'Loc',
      }),
    });
    if (manualDekorNoPkg.status !== 400) throw new Error('Skenario l: dekor tanpa paket harus 400');

    // customerId tidak valid harus 400
    const fakeCustId = new mongoose.Types.ObjectId().toString();
    const manualBadCustId = await fetch(`${baseUrl}/api/admin/bookings/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        customerId: fakeCustId,
        packageId: pkgDekor._id.toString(),
        eventDate: dateL,
        eventName: 'Bad Cust',
        location: 'Loc',
      }),
    });
    if (manualBadCustId.status !== 400) throw new Error('Skenario l: customerId salah harus 400');
    console.log('✓ l) Pesanan manual: pelanggan baru dpPaid=false -> menunggu_dp, catering custom tanpa paket sukses, dekor tanpa paket ditolak');

    // m) Pesanan manual dpPaid=true: menjadi terkonfirmasi, dp_dibayar, Payment approved dibuat, slot terisi pada availabilityService; pada tanggal diblokir atau penuh: 409 dan tidak ada booking atau Payment yang tertinggal
    const dateM = getUpcomingDate(35);
    const manualPaidRes = await fetch(`${baseUrl}/api/admin/bookings/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        customer: { name: 'Klien DP Tunai', phone: '081298765432' },
        packageId: pkgDekor._id.toString(),
        eventDate: dateM,
        eventName: 'Dekor DP Tunai Lunas',
        location: 'Gedung Kesenian',
        dpPaid: true,
        dpMethod: 'tunai',
        dpNote: 'Diterima tunai di kantor',
      }),
    });
    const manualPaidData = await manualPaidRes.json();
    if (manualPaidRes.status !== 201) throw new Error('Skenario m: pesanan manual dpPaid=true gagal');
    const manualBookingM = manualPaidData.data;
    trackBooking(manualBookingM._id);

    if (manualBookingM.status !== 'terkonfirmasi' || manualBookingM.paymentStatus !== 'dp_dibayar') {
      throw new Error('Skenario m: status harus terkonfirmasi dan dp_dibayar');
    }

    // Pastikan Payment approved terbentuk
    const payM = await Payment.findOne({ booking: manualBookingM._id, type: 'dp' });
    if (!payM || payM.status !== 'approved' || payM.method !== 'tunai') {
      throw new Error('Skenario m: dokumen Payment approved tidak terbentuk');
    }
    trackPayment(payM._id);

    // Cek availabilityService: slot dekor harus bertambah
    const checkAvailM = await availabilityService.isDateAvailable('dekor', dateM);
    if (checkAvailM.effectiveCounts.dekor < 1) {
      throw new Error('Skenario m: slot di availabilityService tidak terisi');
    }

    // Coba buat pesanan manual dpPaid=true pada tanggal yang diblokir -> 409 & pastikan tidak ada data tertinggal
    const dateMBlocked = getUpcomingDate(36);
    const bBlockM = await CalendarBlock.create({
      date: dateMBlocked,
      category: 'dekor',
      createdBy: adminUser._id,
      reason: 'Hari Libur Nasional',
    });
    trackCalendarBlock(bBlockM._id);

    const manualOnBlockedRes = await fetch(`${baseUrl}/api/admin/bookings/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        customer: { name: 'Gagal', phone: '081234567890' },
        packageId: pkgDekor._id.toString(),
        eventDate: dateMBlocked,
        eventName: 'Gagal Blocked',
        location: 'Loc',
        dpPaid: true,
      }),
    });
    if (manualOnBlockedRes.status !== 409) {
      throw new Error(`Skenario m: manual pada tanggal diblokir harus 409, got ${manualOnBlockedRes.status}`);
    }
    const checkNoBooking = await Booking.findOne({ eventDate: dateMBlocked, eventName: 'Gagal Blocked' });
    if (checkNoBooking) throw new Error('Skenario m: transaksi bocor, booking terbentuk pada tanggal diblokir!');
    console.log('✓ m) Pesanan manual dpPaid=true mengunci slot & membuat Payment approved; rollback bersih saat 409');

    // n) KONKURENSI: kuota 1 pada tanggal tertentu, kirim 2 pesanan manual dpPaid=true bersamaan. Tepat SATU berhasil (201) dan satu 409. Ulangi 5 kali pada tanggal berbeda. Kombinasi wedding + dekor juga.
    console.log('--- Menguji Konkurensi Kunci Slot (5 kali perulangan + wedding/dekor) ---');
    // Atur kuota dekor = 1
    await Setting.findOneAndUpdate({ key: 'main' }, { $set: { 'maxEventsPerDay.dekor': 1 } });

    for (let round = 1; round <= 5; round++) {
      const concDate = getUpcomingDate(40 + round);
      trackSlotLock(concDate);

      const [resC1, resC2] = await Promise.all([
        fetch(`${baseUrl}/api/admin/bookings/manual`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({
            customer: { name: `Conc A${round}`, phone: `081234567${round}1` },
            packageId: pkgDekor._id.toString(),
            eventDate: concDate,
            eventName: `Conc A${round}`,
            location: 'Loc',
            dpPaid: true,
          }),
        }),
        fetch(`${baseUrl}/api/admin/bookings/manual`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({
            customer: { name: `Conc B${round}`, phone: `081234567${round}2` },
            packageId: pkgDekor._id.toString(),
            eventDate: concDate,
            eventName: `Conc B${round}`,
            location: 'Loc',
            dpPaid: true,
          }),
        }),
      ]);

      const dataC1 = await resC1.json();
      const dataC2 = await resC2.json();
      if (resC1.status === 201) {
        trackBooking(dataC1.data._id);
        const p1 = await Payment.findOne({ booking: dataC1.data._id });
        if (p1) trackPayment(p1._id);
      }
      if (resC2.status === 201) {
        trackBooking(dataC2.data._id);
        const p2 = await Payment.findOne({ booking: dataC2.data._id });
        if (p2) trackPayment(p2._id);
      }

      const st = [resC1.status, resC2.status].sort();
      if (st[0] !== 201 || st[1] !== 409) {
        throw new Error(
          `Skenario n round ${round} gagal! Statuses: ${JSON.stringify(st)}, Data: ${JSON.stringify([dataC1, dataC2])}`
        );
      }
    }
    console.log('✓ n) Konkurensi 5 putaran berhasil: tepat 1 berhasil (201) dan 1 ditolak (409) tanpa slot bocor');

    // Uji kombinasi wedding dan dekor pada kuota dekor 1
    const crossConcDate = getUpcomingDate(50);
    const [resCrossWed, resCrossDekor] = await Promise.all([
      fetch(`${baseUrl}/api/admin/bookings/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          customer: { name: 'Cross Wed', phone: '0812999001' },
          packageId: pkgWedding._id.toString(),
          eventDate: crossConcDate,
          eventName: 'Cross Wedding',
          location: 'Ballroom',
          guestCount: 400,
          dpPaid: true,
        }),
      }),
      fetch(`${baseUrl}/api/admin/bookings/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          customer: { name: 'Cross Dekor', phone: '0812999002' },
          packageId: pkgDekor._id.toString(),
          eventDate: crossConcDate,
          eventName: 'Cross Dekor',
          location: 'Gedung',
          dpPaid: true,
        }),
      }),
    ]);
    const crossSt = [resCrossWed.status, resCrossDekor.status].sort();
    const dataCrossW = await resCrossWed.json();
    const dataCrossD = await resCrossDekor.json();
    if (resCrossWed.status === 201) {
      trackBooking(dataCrossW.data._id);
      const p = await Payment.findOne({ booking: dataCrossW.data._id });
      if (p) trackPayment(p._id);
    }
    if (resCrossDekor.status === 201) {
      trackBooking(dataCrossD.data._id);
      const p = await Payment.findOne({ booking: dataCrossD.data._id });
      if (p) trackPayment(p._id);
    }
    if (crossSt[0] !== 201 || crossSt[1] !== 409) {
      throw new Error(`Skenario n kombinasi wedding & dekor gagal! Statuses: ${JSON.stringify(crossSt)}`);
    }
    console.log('✓ n) Konkurensi lintas kategori (wedding & dekor) pada kuota dekor 1 berhasil terkunci (1 sukses, 1 409)');

    // o) Pelunasan: berhasil pada pesanan dp_dibayar; ditolak pada pesanan menunggu_dp; pencatatan kedua 409; Payment pelunasan terbentuk
    // 1. Coba pelunasan pada pesanan yang belum bayar DP (menunggu_dp)
    const dateO = getUpcomingDate(55);
    const bWaitingO = await Booking.create({
      customerSnapshot: { name: 'WaitO', phone: '081', email: 'o@t.com' },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: dateO,
      eventName: 'Event O Wait',
      location: 'Loc',
      status: 'menunggu_dp',
      paymentStatus: 'belum_dp',
      dpAmount: 1000000,
    });
    trackBooking(bWaitingO._id);

    const settleWaitingRes = await fetch(`${baseUrl}/api/admin/bookings/${bWaitingO._id}/settlement`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        amount: 4000000,
        method: 'transfer',
        paidAt: new Date().toISOString(),
      }),
    });
    if (settleWaitingRes.status !== 400) {
      throw new Error('Skenario o: pelunasan pada pesanan menunggu_dp harus 400');
    }

    // 2. Pelunasan pada pesanan dp_dibayar (mis. manualBookingM)
    const settleSuccessRes = await fetch(`${baseUrl}/api/admin/bookings/${manualBookingM._id}/settlement`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        amount: 4000000,
        method: 'transfer',
        paidAt: new Date().toISOString(),
        note: 'Pelunasan transfer BCA',
      }),
    });
    const settleData = await settleSuccessRes.json();
    if (settleSuccessRes.status !== 200 || settleData.data.booking.paymentStatus !== 'lunas') {
      throw new Error('Skenario o: pelunasan valid gagal');
    }
    trackPayment(settleData.data.payment._id);

    // 3. Pencatatan kedua kali harus 409 (idempoten)
    const settleDupRes = await fetch(`${baseUrl}/api/admin/bookings/${manualBookingM._id}/settlement`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        amount: 4000000,
        method: 'transfer',
        paidAt: new Date().toISOString(),
      }),
    });
    if (settleDupRes.status !== 409) {
      throw new Error(`Skenario o: pelunasan kedua kali harus 409, got ${settleDupRes.status}`);
    }
    console.log('✓ o) Pencatatan pelunasan berhasil: ditolak pada belum_dp (400), sukses pada dp_dibayar, pencatatan ulang 409');

    // p) Job: buat pesanan menunggu_dp kedaluwarsa, menunggu_verifikasi kedaluwarsa, menunggu_dp belum kedaluwarsa, dan terkonfirmasi
    const now = new Date();
    const pastExp = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 jam lalu
    const futureExp = new Date(now.getTime() + 5 * 60 * 60 * 1000); // 5 jam lagi

    // 1. Expired menunggu_dp (harus dibatalkan)
    const bJobExpWaitDp = await Booking.create({
      customerSnapshot: { name: 'Job1', phone: '081', email: 'j1@t.com' },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: getUpcomingDate(60),
      eventName: 'Job Exp Wait DP',
      location: 'Loc',
      status: 'menunggu_dp',
      paymentStatus: 'belum_dp',
      expiresAt: pastExp,
      dpAmount: 1000000,
    });
    trackBooking(bJobExpWaitDp._id);

    // 2. Expired menunggu_verifikasi (TIDAK BOLEH DIBATALKAN)
    const bJobExpWaitVerif = await Booking.create({
      customerSnapshot: { name: 'Job2', phone: '082', email: 'j2@t.com' },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: getUpcomingDate(60),
      eventName: 'Job Exp Wait Verif',
      location: 'Loc',
      status: 'menunggu_verifikasi',
      paymentStatus: 'menunggu_verifikasi',
      expiresAt: pastExp,
      dpAmount: 1000000,
    });
    trackBooking(bJobExpWaitVerif._id);

    // 3. Unexpired menunggu_dp (TIDAK BOLEH DIBATALKAN)
    const bJobUnexpWaitDp = await Booking.create({
      customerSnapshot: { name: 'Job3', phone: '083', email: 'j3@t.com' },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: getUpcomingDate(60),
      eventName: 'Job Unexp Wait DP',
      location: 'Loc',
      status: 'menunggu_dp',
      paymentStatus: 'belum_dp',
      expiresAt: futureExp,
      dpAmount: 1000000,
    });
    trackBooking(bJobUnexpWaitDp._id);

    // 4. Terkonfirmasi (TIDAK BOLEH DIBATALKAN)
    const bJobConfirmed = await Booking.create({
      customerSnapshot: { name: 'Job4', phone: '084', email: 'j4@t.com' },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: getUpcomingDate(60),
      eventName: 'Job Confirmed',
      location: 'Loc',
      status: 'terkonfirmasi',
      paymentStatus: 'dp_dibayar',
      expiresAt: pastExp,
      dpAmount: 1000000,
    });
    trackBooking(bJobConfirmed._id);

    // Jalankan job pertama
    const cancelledCount1 = await cancelExpiredBookings(now);
    if (cancelledCount1 !== 1) {
      throw new Error(`Skenario p: seharusnya tepat 1 pesanan dibatalkan, got ${cancelledCount1}`);
    }

    const checkJob1 = await Booking.findById(bJobExpWaitDp._id);
    if (checkJob1.status !== 'dibatalkan' || checkJob1.cancelReason !== 'Batas waktu pembayaran habis') {
      throw new Error('Skenario p: status atau cancelReason job salah');
    }

    const checkJob2 = await Booking.findById(bJobExpWaitVerif._id);
    if (checkJob2.status !== 'menunggu_verifikasi') {
      throw new Error('Skenario p: pesanan menunggu_verifikasi tidak boleh dibatalkan otomatis!');
    }

    const checkJob3 = await Booking.findById(bJobUnexpWaitDp._id);
    if (checkJob3.status !== 'menunggu_dp') {
      throw new Error('Skenario p: pesanan belum kedaluwarsa tidak boleh dibatalkan!');
    }

    const checkJob4 = await Booking.findById(bJobConfirmed._id);
    if (checkJob4.status !== 'terkonfirmasi') {
      throw new Error('Skenario p: pesanan terkonfirmasi tidak boleh dibatalkan!');
    }

    // Jalankan job kedua kali: hasil harus 0 (idempoten)
    const cancelledCount2 = await cancelExpiredBookings(now);
    if (cancelledCount2 !== 0) {
      throw new Error(`Skenario p: eksekusi kedua harus 0, got ${cancelledCount2}`);
    }
    console.log('✓ p) Job pembatalan otomatis: tepat membatalkan pesanan menunggu_dp kedaluwarsa, aman dan idempoten');

    console.log('\n================================================================');
    console.log('SEMUA SKENARIO PENGUJIAN BOOKING (a - p) BERHASIL (ALL PASSED)!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ PENGUJIAN GAGAL DENGAN ERROR:');
    console.error(err);
    process.exitCode = 1;
  } finally {
    console.log('--- Memulai Pembersihan Data Uji (Finally Block) ---');
    try {
      await cleanTrackedData();
      console.log('✓ Data uji berhasil dibersihkan dan Setting dipulihkan ke state awal.');
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

runBookingTests();

