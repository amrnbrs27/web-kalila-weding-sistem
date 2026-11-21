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
const cloudinary = require('../src/config/cloudinary');
const { isCloudinaryConfigured } = require('../src/config/cloudinary');
const { getTodayWIB, getCurrentMonthWIB, isValidDate } = require('../src/utils/dateUtils');
const availabilityService = require('../src/services/availabilityService');

const {
  connectTestDb,
  disconnectTestDb,
  createTestAdmin,
  createTestCustomer,
  backupSettings,
  restoreSettings,
  cleanTrackedData,
  trackCalendarBlock,
  trackBooking,
  trackPackage,
  trackCloudinaryPublicId,
  verifyAssetExistsInCloudinary,
  verifyAssetDeletedFromCloudinary,
} = require('./testUtils');

let server;
let baseUrl;

function getUpcomingMonth(offsetMonths = 2) {
  const today = getTodayWIB();
  const [y, m] = today.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + offsetMonths, 15));
  const ty = target.getUTCFullYear();
  const tm = String(target.getUTCMonth() + 1).padStart(2, '0');
  return `${ty}-${tm}`;
}

// 1x1 pixel PNG valid
const VALID_1X1_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

async function runSettingsAndCalendarTests() {
  console.log('================================================================');
  console.log('Memulai Pengujian Otomatis Settings, Calendar & Availability');
  console.log('================================================================\n');

  try {
    const { testDbName } = await connectTestDb();
    console.log(`[Database Pengujian] Terhubung ke: "${testDbName}"`);

    // Cadangkan state Setting sebelum tes
    await backupSettings();

    // Jalankan server HTTP
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(5016, () => {
        baseUrl = 'http://localhost:5016';
        console.log(`✓ Server pengujian berjalan di ${baseUrl}\n`);
        resolve();
      });
    });

    // 1. Buat user admin uji & customer uji
    const { user: adminUser, token: adminToken } = await createTestAdmin();
    const { user: custUser, token: custToken } = await createTestCustomer();
    console.log('✓ Akun admin dan customer uji sementara berhasil dibuat');

    // ================================================================
    // SKENARIO A: SETTING
    // ================================================================
    console.log('\n--- Skenario A: Pengaturan (Setting Singleton) ---');

    // A.1 Proteksi Endpoint Admin Settings (401 tanpa token, 403 token customer)
    const noTokenRes = await fetch(`${baseUrl}/api/admin/settings`);
    if (noTokenRes.status !== 401) {
      throw new Error(`GET /api/admin/settings tanpa token harus 401, got ${noTokenRes.status}`);
    }
    const custTokenRes = await fetch(`${baseUrl}/api/admin/settings`, {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    if (custTokenRes.status !== 403) {
      throw new Error(`GET /api/admin/settings dengan token customer harus 403, got ${custTokenRes.status}`);
    }
    const noTokenPutRes = await fetch(`${baseUrl}/api/admin/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName: 'Test' }),
    });
    if (noTokenPutRes.status !== 401) {
      throw new Error(`PUT /api/admin/settings tanpa token harus 401, got ${noTokenPutRes.status}`);
    }
    const custTokenPutRes = await fetch(`${baseUrl}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({ businessName: 'Test' }),
    });
    if (custTokenPutRes.status !== 403) {
      throw new Error(`PUT /api/admin/settings dengan token customer harus 403, got ${custTokenPutRes.status}`);
    }
    console.log('✓ Proteksi endpoint admin Settings terverifikasi (401 tanpa token, 403 customer)');

    // A.2 Pastikan Setting belum ada atau baru dibuat otomatis dengan default
    await Setting.deleteOne({ key: 'main' });
    const autoCreated = await Setting.getSettings();
    if (autoCreated.businessName !== 'Kalila Wedding, Dekor & Catering' || autoCreated.dpAmount !== 1000000) {
      throw new Error('Dokumen Setting default tidak terbentuk dengan benar');
    }
    console.log('✓ Dokumen Setting otomatis terbentuk dengan nilai default');

    // A.3 Admin memperbarui sebagian field (partial update dengan nested dot notation)
    const updateRes = await fetch(`${baseUrl}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        businessName: 'Kalila Organizer Modern',
        adminWhatsapp: '081234567899', // Normalisasi ke 6281234567899
        maxEventsPerDay: {
          dekor: 2,
        },
        kontak: {
          email: 'halo@kalila-test.com',
        },
      }),
    });
    const updateJson = await updateRes.json();
    if (updateRes.status !== 200 || !updateJson.success) {
      throw new Error(`Gagal update setting: ${JSON.stringify(updateJson)}`);
    }

    if (
      updateJson.data.businessName !== 'Kalila Organizer Modern' ||
      updateJson.data.adminWhatsapp !== '6281234567899' ||
      updateJson.data.maxEventsPerDay.dekor !== 2 ||
      updateJson.data.maxEventsPerDay.catering !== null || // catering tidak tertimpa
      updateJson.data.kontak.email !== 'halo@kalila-test.com' ||
      !updateJson.data.kontak.instagram // instagram tidak tertimpa
    ) {
      throw new Error('Partial update / nested dot notation Setting gagal mempertahankan field lain');
    }
    console.log('✓ Admin berhasil partial update Setting (field bersarang lainnya tidak tertimpa)');

    // A.4 Penolakan input Setting tidak valid (dpAmount negatif, maxEventsPerDay 0, adminWhatsapp salah)
    const negDpRes = await fetch(`${baseUrl}/api/admin/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ dpAmount: -500000 }),
    });
    if (negDpRes.status !== 400) {
      throw new Error(`PUT dpAmount negatif harus ditolak 400, got ${negDpRes.status}`);
    }

    const zeroMaxRes = await fetch(`${baseUrl}/api/admin/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ maxEventsPerDay: { dekor: 0 } }),
    });
    if (zeroMaxRes.status !== 400) {
      throw new Error(`PUT maxEventsPerDay 0 harus ditolak 400, got ${zeroMaxRes.status}`);
    }

    const badWaRes = await fetch(`${baseUrl}/api/admin/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ adminWhatsapp: '123' }),
    });
    if (badWaRes.status !== 400) {
      throw new Error(`PUT adminWhatsapp tidak valid harus ditolak 400, got ${badWaRes.status}`);
    }
    console.log('✓ Validasi nilai Setting: dpAmount negatif, maxEventsPerDay 0, dan adminWhatsapp salah ditolak (400)');

    // A.5 Penolakan field yang tidak dikenal (.strict)
    const unknownFieldRes = await fetch(`${baseUrl}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        unknownField123: 'hacker_data',
      }),
    });
    if (unknownFieldRes.status !== 400) {
      throw new Error('PUT /api/admin/settings harus menolak field yang tidak dikenal dengan 400');
    }
    console.log('✓ Field yang tidak dikenal ditolak dengan 400 Bad Request');

    // A.6 Verifikasi Dokumen Singleton
    // Beberapa kali GET dan PUT tidak boleh menggandakan dokumen Setting
    await fetch(`${baseUrl}/api/settings`);
    await fetch(`${baseUrl}/api/admin/settings`, { headers: { Authorization: `Bearer ${adminToken}` } });
    await fetch(`${baseUrl}/api/admin/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ businessName: 'Kalila Singleton Check' }),
    });
    const settingCount = await Setting.countDocuments();
    if (settingCount !== 1) {
      throw new Error(`Dokumen Setting harus singleton (tepat 1), ditemukan ${settingCount}`);
    }
    console.log(`✓ Verifikasi Singleton: Jumlah dokumen Setting tepat 1 setelah berbagai operasi GET dan PUT`);

    // A.7 Endpoint publik GET /api/settings tidak membocorkan rekening, QRIS, key, _id, atau internal
    const publicSettingsRes = await fetch(`${baseUrl}/api/settings`);
    const publicSettingsJson = await publicSettingsRes.json();
    if (publicSettingsRes.status !== 200 || !publicSettingsJson.success) {
      throw new Error('Gagal mengambil pengaturan publik');
    }
    const pubData = publicSettingsJson.data;
    if (
      pubData.key !== undefined ||
      pubData._id !== undefined ||
      pubData.__v !== undefined ||
      pubData.bankName !== undefined ||
      pubData.accountNumber !== undefined ||
      pubData.accountHolder !== undefined ||
      pubData.qrisImage !== undefined ||
      pubData.maxEventsPerDay !== undefined ||
      pubData.maxProofAttempts !== undefined ||
      pubData.rejectionExtensionHours !== undefined
    ) {
      throw new Error('Endpoint publik membocorkan info internal/rekening/QRIS!');
    }
    if (!pubData.businessName || !pubData.adminWhatsapp || !pubData.kontak) {
      throw new Error('Endpoint publik tidak memuat field yang seharusnya ada');
    }
    console.log('✓ Endpoint publik HANYA mengembalikan field aman (tidak memuat key, _id, rekening, QRIS, atau field internal)');

    // A.8 Upload QRIS: File palsu .jpg dan File > 5 MB ditolak
    const boundaryTest = '----TestBoundary' + Date.now();
    const fakeFileBody = Buffer.concat([
      Buffer.from(`--${boundaryTest}\r\nContent-Disposition: form-data; name="image"; filename="fake.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
      Buffer.from('BUKAN_GAMBAR_JPEG_HANYA_TEKS_BIASA'),
      Buffer.from(`\r\n--${boundaryTest}--\r\n`),
    ]);
    const fakeUploadRes = await fetch(`${baseUrl}/api/admin/settings/qris`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundaryTest}`,
        Authorization: `Bearer ${adminToken}`,
      },
      body: fakeFileBody,
    });
    if (fakeUploadRes.status !== 400) {
      throw new Error(`Upload file palsu .jpg harus ditolak 400, got ${fakeUploadRes.status}`);
    }
    console.log('✓ Upload QRIS file palsu berekstensi .jpg ditolak (400 Bad Request via magic bytes)');

    const largeFileBoundary = '----TestBoundaryLarge' + Date.now();
    const largeBuffer = Buffer.alloc(5.2 * 1024 * 1024, 0xff); // 5.2 MB
    const largeFileBody = Buffer.concat([
      Buffer.from(`--${largeFileBoundary}\r\nContent-Disposition: form-data; name="image"; filename="large.png"\r\nContent-Type: image/png\r\n\r\n`),
      largeBuffer,
      Buffer.from(`\r\n--${largeFileBoundary}--\r\n`),
    ]);
    const largeUploadRes = await fetch(`${baseUrl}/api/admin/settings/qris`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${largeFileBoundary}`,
        Authorization: `Bearer ${adminToken}`,
      },
      body: largeFileBody,
    });
    if (largeUploadRes.status !== 400) {
      throw new Error(`Upload file QRIS > 5 MB harus ditolak 400, got ${largeUploadRes.status}`);
    }
    console.log('✓ Upload QRIS file di atas 5 MB ditolak (400 Bad Request)');

    // Unggah dan hapus QRIS di Cloudinary (jika aktif)
    if (isCloudinaryConfigured()) {
      const boundary = '----TestBoundary' + Date.now();
      const bodyHeader = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="qris-test.png"\r\nContent-Type: image/png\r\n\r\n`
      );
      const bodyFooter = Buffer.from(`\r\n--${boundary}--\r\n`);
      const multipartBody = Buffer.concat([bodyHeader, VALID_1X1_PNG_BUFFER, bodyFooter]);

      const uploadQrisRes = await fetch(`${baseUrl}/api/admin/settings/qris`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          Authorization: `Bearer ${adminToken}`,
        },
        body: multipartBody,
      });
      const uploadQrisJson = await uploadQrisRes.json();
      if (uploadQrisRes.status !== 200 || !uploadQrisJson.success) {
        throw new Error(`Upload QRIS gagal: ${JSON.stringify(uploadQrisJson)}`);
      }
      if (uploadQrisJson.data.publicId) {
        throw new Error('Respons unggah QRIS tidak boleh menampilkan publicId!');
      }

      // Periksa di DB untuk verifikasi Cloudinary
      const currentSetting = await Setting.findOne({ key: 'main' });
      const qrisPublicId = currentSetting.qrisImage?.publicId;
      if (!qrisPublicId) throw new Error('QRIS publicId tidak tersimpan di database');
      trackCloudinaryPublicId(qrisPublicId);

      const existsInCloudinary = await verifyAssetExistsInCloudinary(qrisPublicId);
      if (!existsInCloudinary) throw new Error('Aset QRIS tidak ditemukan di Cloudinary');
      console.log(`✓ Verifikasi Cloudinary API: QRIS berhasil terunggah (${qrisPublicId})`);

      // Hapus QRIS
      const deleteQrisRes = await fetch(`${baseUrl}/api/admin/settings/qris`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const deleteQrisJson = await deleteQrisRes.json();
      if (deleteQrisRes.status !== 200 || !deleteQrisJson.success) {
        throw new Error(`Hapus QRIS gagal: ${JSON.stringify(deleteQrisJson)}`);
      }

      const deletedFromCloudinary = await verifyAssetDeletedFromCloudinary(qrisPublicId);
      if (!deletedFromCloudinary) throw new Error('Aset QRIS masih ditemukan di Cloudinary setelah dihapus!');
      console.log(`✓ Verifikasi Cloudinary API: QRIS terkonfirmasi terhapus (404)`);
    } else {
      console.log('ℹ Cloudinary tidak aktif, melewati tes aset upload QRIS fisik');
    }

    // ================================================================
    // SKENARIO B: CALENDAR BLOCK
    // ================================================================
    console.log('\n--- Skenario B: Kalender Blokir (CalendarBlock) ---');

    // B.1 Proteksi Endpoint Admin Kalender (401 & 403)
    const calNoTokenRes = await fetch(`${baseUrl}/api/admin/calendar?month=${getUpcomingMonth(1)}`);
    if (calNoTokenRes.status !== 401) {
      throw new Error(`GET /api/admin/calendar tanpa token harus 401, got ${calNoTokenRes.status}`);
    }
    const calCustTokenRes = await fetch(`${baseUrl}/api/admin/calendar?month=${getUpcomingMonth(1)}`, {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    if (calCustTokenRes.status !== 403) {
      throw new Error(`GET /api/admin/calendar dengan customer token harus 403, got ${calCustTokenRes.status}`);
    }
    const blockNoTokenRes = await fetch(`${baseUrl}/api/admin/calendar/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'dekor', date: '2027-01-01' }),
    });
    if (blockNoTokenRes.status !== 401) {
      throw new Error(`POST /api/admin/calendar/blocks tanpa token harus 401, got ${blockNoTokenRes.status}`);
    }
    const blockCustTokenRes = await fetch(`${baseUrl}/api/admin/calendar/blocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({ category: 'dekor', date: '2027-01-01' }),
    });
    if (blockCustTokenRes.status !== 403) {
      throw new Error(`POST /api/admin/calendar/blocks dengan customer token harus 403, got ${blockCustTokenRes.status}`);
    }
    console.log('✓ Proteksi endpoint admin Kalender terverifikasi (401 tanpa token, 403 customer)');

    const testMonth = getUpcomingMonth(3);
    const dateSingle = `${testMonth}-05`;
    const dateRangeStart = `${testMonth}-10`;
    const dateRangeEnd = `${testMonth}-12`;

    // B.2 Blokir satu tanggal
    const blockSingleRes = await fetch(`${baseUrl}/api/admin/calendar/blocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        category: 'dekor',
        date: dateSingle,
        reason: 'Maintenance gudang properti',
      }),
    });
    const blockSingleJson = await blockSingleRes.json();
    if (blockSingleRes.status !== 201 || blockSingleJson.data.created.length !== 1) {
      throw new Error(`Gagal blokir satu tanggal: ${JSON.stringify(blockSingleJson)}`);
    }
    trackCalendarBlock(blockSingleJson.data.created[0].id);
    console.log(`✓ Blokir satu tanggal berhasil (${dateSingle})`);

    // B.3 Blokir tanggal yang sama (idempotensi)
    const blockDupRes = await fetch(`${baseUrl}/api/admin/calendar/blocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        category: 'dekor',
        date: dateSingle,
      }),
    });
    const blockDupJson = await blockDupRes.json();
    if (
      blockDupRes.status !== 201 ||
      blockDupJson.data.created.length !== 0 ||
      blockDupJson.data.skipped.length !== 1
    ) {
      throw new Error('Idempotensi blokir kalender gagal!');
    }
    console.log('✓ Idempotensi blokir: tanggal duplikat dilaporkan sebagai skipped tanpa membuat entri baru');

    // B.4 Blokir rentang tanggal (3 hari)
    const blockRangeRes = await fetch(`${baseUrl}/api/admin/calendar/blocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        category: 'catering',
        dateFrom: dateRangeStart,
        dateTo: dateRangeEnd,
        reason: 'Renovasi dapur sentral',
      }),
    });
    const blockRangeJson = await blockRangeRes.json();
    if (blockRangeRes.status !== 201 || blockRangeJson.data.created.length !== 3) {
      throw new Error(`Gagal blokir rentang tanggal: ${JSON.stringify(blockRangeJson)}`);
    }
    blockRangeJson.data.created.forEach((b) => trackCalendarBlock(b.id));
    console.log(`✓ Blokir rentang tanggal berhasil (${dateRangeStart} s/d ${dateRangeEnd}, 3 hari)`);

    // B.5 Tolak rentang tanggal lebih dari 31 hari
    const blockRangeOver31Res = await fetch(`${baseUrl}/api/admin/calendar/blocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        category: 'catering',
        dateFrom: `${testMonth}-01`,
        dateTo: `${getUpcomingMonth(5)}-15`, // > 31 hari
      }),
    });
    if (blockRangeOver31Res.status !== 400) {
      throw new Error(`Rentang tanggal > 31 hari harus ditolak 400, got ${blockRangeOver31Res.status}`);
    }
    console.log('✓ Blokir rentang lebih dari 31 hari ditolak (400 Bad Request)');

    // B.6 Tolak tanggal lampau dan tanggal tidak valid kalender (2026-02-30)
    const blockPastRes = await fetch(`${baseUrl}/api/admin/calendar/blocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        category: 'wedding',
        date: '2020-01-01',
      }),
    });
    if (blockPastRes.status !== 400) {
      throw new Error('Blokir tanggal lampau harus ditolak (400)!');
    }

    const blockInvalidRes = await fetch(`${baseUrl}/api/admin/calendar/blocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        category: 'wedding',
        date: '2026-02-30',
      }),
    });
    if (blockInvalidRes.status !== 400) {
      throw new Error('Blokir tanggal 2026-02-30 harus ditolak (400)!');
    }
    console.log('✓ Tolak blokir tanggal lampau dan tanggal tidak valid kalender (2026-02-30)');

    // B.7 Buka blokir (hapus)
    const blockToDelete = blockSingleJson.data.created[0].id;
    const delBlockRes = await fetch(`${baseUrl}/api/admin/calendar/blocks/${blockToDelete}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    if (delBlockRes.status !== 200) {
      throw new Error('Gagal menghapus blokir kalender');
    }
    const checkDeleted = await CalendarBlock.findById(blockToDelete);
    if (checkDeleted) throw new Error('Dokumen blokir kalender masih ada setelah dihapus');
    console.log('✓ Buka blokir (DELETE /api/admin/calendar/blocks/:id) berhasil');

    // ================================================================
    // SKENARIO C: AVAILABILITY SERVICE & ENDPOINT
    // ================================================================
    console.log('\n--- Skenario C: Logika Ketersediaan Tanggal & Endpoint ---');

    // C.1 Validasi parameter query month (2026-13 dan > 24 bulan ke depan ditolak 400)
    const invalidMonthRes = await fetch(`${baseUrl}/api/availability?category=dekor&month=2026-13`);
    if (invalidMonthRes.status !== 400) {
      throw new Error(`Pemeriksaan bulan tidak valid 2026-13 harus ditolak 400, got ${invalidMonthRes.status}`);
    }

    const farFutureMonth = getUpcomingMonth(28); // > 24 bulan
    const farFutureRes = await fetch(`${baseUrl}/api/availability?category=dekor&month=${farFutureMonth}`);
    if (farFutureRes.status !== 400) {
      throw new Error(`Pemeriksaan bulan > 24 bulan ke depan harus ditolak 400, got ${farFutureRes.status}`);
    }
    console.log('✓ Validasi month pada availability: 2026-13 dan >24 bulan ke depan ditolak (400 Bad Request)');

    // Buat paket dekor, catering, dan wedding untuk relasi booking
    const randPkg = Date.now();
    const pkgDekor = await Package.create({
      category: 'dekor',
      name: `Paket Dekor Test ${randPkg}`,
      slug: `paket-dekor-test-${randPkg}`,
      price: 5000000,
      decorWidthCm: 400,
      images: [],
    });
    trackPackage(pkgDekor._id);

    const pkgCatering = await Package.create({
      category: 'catering',
      name: `Paket Catering Test ${randPkg}`,
      slug: `paket-catering-test-${randPkg}`,
      price: 15000000,
      images: [],
    });
    trackPackage(pkgCatering._id);

    const pkgWedding = await Package.create({
      category: 'wedding',
      name: `Paket Wedding Test ${randPkg}`,
      slug: `paket-wedding-test-${randPkg}`,
      price: 25000000,
      images: [],
    });
    trackPackage(pkgWedding._id);

    // Siapkan batas kuota di setting
    await Setting.findOneAndUpdate(
      { key: 'main' },
      {
        $set: {
          'maxEventsPerDay.dekor': 2,
          'maxEventsPerDay.catering': 1,
          'maxEventsPerDay.wedding': 1,
        },
      }
    );

    const targetDateQuota = `${testMonth}-20`;
    const targetDateWeddingCross = `${testMonth}-21`;
    const targetDateBlockEffectDekor = `${testMonth}-22`;
    const targetDateBlockEffectCatering = `${testMonth}-23`;
    const targetDateCateringFull = `${testMonth}-24`;

    // C.2 Tanggal sebelum hari ini berstatus "lewat" (available: false)
    const currentMonth = getCurrentMonthWIB();
    const curMonthRes = await fetch(`${baseUrl}/api/availability?category=dekor&month=${currentMonth}`);
    const curMonthJson = await curMonthRes.json();
    const todayStr = getTodayWIB();
    const pastDaysInCurrentMonth = curMonthJson.data.filter((d) => d.date < todayStr);
    for (const d of pastDaysInCurrentMonth) {
      if (d.status !== 'lewat' || d.available !== false) {
        throw new Error(`Tanggal lampau ${d.date} tidak berstatus "lewat"!`);
      }
    }
    console.log('✓ Tanggal sebelum hari ini terverifikasi berstatus "lewat" (available: false)');

    // C.3 Tanggal yang diblokir berstatus "diblokir"
    const blockResDekor = await CalendarBlock.create({
      date: targetDateBlockEffectDekor,
      category: 'dekor',
      reason: 'Khusus pesanan dekor offline',
      createdBy: adminUser._id,
    });
    trackCalendarBlock(blockResDekor._id);

    const availDekorRes = await fetch(`${baseUrl}/api/availability?category=dekor&month=${testMonth}`);
    const availDekorJson = await availDekorRes.json();
    const blockedItem = availDekorJson.data.find((d) => d.date === targetDateBlockEffectDekor);
    if (!blockedItem || blockedItem.status !== 'diblokir' || blockedItem.available !== false) {
      throw new Error(`Tanggal ${targetDateBlockEffectDekor} harusnya diblokir`);
    }
    console.log(`✓ Tanggal yang diblokir berstatus "diblokir" (${targetDateBlockEffectDekor})`);

    // C.4 Efek wedding terhadap blokir dekor: blokir dekor membuat wedding juga "diblokir"
    const availWedRes1 = await fetch(`${baseUrl}/api/availability?category=wedding&month=${testMonth}`);
    const availWedJson1 = await availWedRes1.json();
    const wedBlockedItemDekor = availWedJson1.data.find((d) => d.date === targetDateBlockEffectDekor);
    if (!wedBlockedItemDekor || wedBlockedItemDekor.status !== 'diblokir' || wedBlockedItemDekor.available !== false) {
      throw new Error(`Blokir dekor harusnya membuat wedding juga tidak tersedia (diblokir)!`);
    }
    console.log('✓ Efek wedding: memblokir dekor membuat tanggal tersebut juga tidak tersedia untuk wedding');

    // C.5 Efek wedding terhadap blokir catering: blokir catering membuat wedding juga "diblokir"
    const blockResCatering = await CalendarBlock.create({
      date: targetDateBlockEffectCatering,
      category: 'catering',
      reason: 'Dapur catering libur',
      createdBy: adminUser._id,
    });
    trackCalendarBlock(blockResCatering._id);

    const availWedRes2 = await fetch(`${baseUrl}/api/availability?category=wedding&month=${testMonth}`);
    const availWedJson2 = await availWedRes2.json();
    const wedBlockedItemCatering = availWedJson2.data.find((d) => d.date === targetDateBlockEffectCatering);
    if (!wedBlockedItemCatering || wedBlockedItemCatering.status !== 'diblokir' || wedBlockedItemCatering.available !== false) {
      throw new Error(`Blokir catering harusnya membuat wedding juga tidak tersedia (diblokir)!`);
    }
    console.log('✓ Efek wedding: memblokir catering membuat tanggal tersebut juga tidak tersedia untuk wedding');

    // C.6 Kuota penuh: Buat 2 booking dekor berstatus "terkonfirmasi" pada targetDateQuota
    const b1 = await Booking.create({
      customerSnapshot: { name: 'Sarah', phone: '08123', email: 'sarah@test.com' },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: targetDateQuota,
      eventName: 'Pernikahan Sarah',
      location: 'Gedung Serbaguna',
      status: 'terkonfirmasi',
      paymentStatus: 'dp_dibayar',
    });
    trackBooking(b1._id);

    const b2 = await Booking.create({
      customerSnapshot: { name: 'Dimas', phone: '08124', email: 'dimas@test.com' },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: targetDateQuota,
      eventName: 'Pernikahan Dimas',
      location: 'Gedung Kesenian',
      status: 'terkonfirmasi',
      paymentStatus: 'dp_dibayar',
    });
    trackBooking(b2._id);

    const availFullRes = await fetch(`${baseUrl}/api/availability?category=dekor&month=${testMonth}`);
    const availFullJson = await availFullRes.json();
    const fullItem = availFullJson.data.find((d) => d.date === targetDateQuota);
    if (!fullItem || fullItem.status !== 'penuh' || fullItem.available !== false) {
      throw new Error(`Tanggal ${targetDateQuota} seharusnya berstatus "penuh"`);
    }
    console.log(`✓ Tanggal dengan kuota tercapai terbukti berstatus "penuh" (available: false)`);

    // C.7 Efek wedding bila catering penuh: buat 1 booking catering pada targetDateCateringFull (kuota catering = 1)
    const bCatFull = await Booking.create({
      customerSnapshot: { name: 'Budi Catering', phone: '08128', email: 'budi@test.com' },
      package: pkgCatering._id,
      packageSnapshot: { name: pkgCatering.name, price: pkgCatering.price, category: 'catering' },
      category: 'catering',
      eventDate: targetDateCateringFull,
      eventName: 'Syukuran Budi',
      location: 'Resto Kalila',
      status: 'terkonfirmasi',
      paymentStatus: 'dp_dibayar',
    });
    trackBooking(bCatFull._id);

    const availWedFullCatRes = await fetch(`${baseUrl}/api/availability?category=wedding&month=${testMonth}`);
    const availWedFullCatJson = await availWedFullCatRes.json();
    const wedFullItem = availWedFullCatJson.data.find((d) => d.date === targetDateCateringFull);
    if (!wedFullItem || wedFullItem.status !== 'penuh' || wedFullItem.available !== false) {
      throw new Error(`Jika catering penuh, wedding harusnya berstatus "penuh"`);
    }
    console.log('✓ Efek wedding: wedding tidak tersedia (penuh) bila kuota catering telah penuh');

    // C.8 Pesanan "menunggu_dp" dan "menunggu_verifikasi" TIDAK mengurangi ketersediaan
    const bPending1 = await Booking.create({
      customerSnapshot: { name: 'Rina', phone: '08125', email: 'rina@test.com' },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: `${testMonth}-28`,
      eventName: 'Acara Rina',
      location: 'Rumah',
      status: 'menunggu_dp',
      paymentStatus: 'belum_dp',
    });
    trackBooking(bPending1._id);

    const bPending2 = await Booking.create({
      customerSnapshot: { name: 'Joko', phone: '08126', email: 'joko@test.com' },
      package: pkgDekor._id,
      packageSnapshot: { name: pkgDekor.name, price: pkgDekor.price, category: 'dekor' },
      category: 'dekor',
      eventDate: `${testMonth}-28`,
      eventName: 'Acara Joko',
      location: 'Rumah',
      status: 'menunggu_verifikasi',
      paymentStatus: 'menunggu_verifikasi',
    });
    trackBooking(bPending2._id);

    const checkPendingRes = await fetch(`${baseUrl}/api/availability?category=dekor&month=${testMonth}`);
    const checkPendingJson = await checkPendingRes.json();
    const pendingDateItem = checkPendingJson.data.find((d) => d.date === `${testMonth}-28`);
    if (!pendingDateItem || pendingDateItem.status !== 'tersedia' || pendingDateItem.available !== true) {
      throw new Error('Pesanan menunggu_dp / menunggu_verifikasi tidak boleh menahan slot!');
    }
    console.log('✓ Pesanan "menunggu_dp" dan "menunggu_verifikasi" terbukti TIDAK menahan slot');

    // C.9 Booking terkonfirmasi menambah hitungan & Efek Wedding terhadap kuota Dekor + Catering
    const bWedding = await Booking.create({
      customerSnapshot: { name: 'Lia & Doni', phone: '08127', email: 'lia@test.com' },
      package: pkgWedding._id,
      packageSnapshot: { name: pkgWedding.name, price: pkgWedding.price, category: 'wedding' },
      category: 'wedding',
      eventDate: targetDateWeddingCross,
      eventName: 'Pernikahan Lia & Doni',
      location: 'Ballroom Hotel',
      status: 'terkonfirmasi',
      paymentStatus: 'dp_dibayar',
    });
    trackBooking(bWedding._id);

    // Ambil GET /api/admin/calendar untuk melihat detail hitungan acara efektif
    const adminCalRes = await fetch(`${baseUrl}/api/admin/calendar?month=${testMonth}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const adminCalJson = await adminCalRes.json();
    if (adminCalRes.status !== 200 || !adminCalJson.success) {
      throw new Error(`Gagal GET /api/admin/calendar: ${JSON.stringify(adminCalJson)}`);
    }

    const calItemWeddingCross = adminCalJson.data.find((d) => d.date === targetDateWeddingCross);
    if (!calItemWeddingCross) {
      throw new Error('Item kalender admin tidak ditemukan');
    }

    // Bandingkan dengan hasil langsung dari availabilityService
    const directAvailAdmin = await availabilityService.getMonthCalendarForAdmin(testMonth);
    const directDateItem = directAvailAdmin.find((d) => d.date === targetDateWeddingCross);

    // Verifikasi kesamaan hitungan
    if (
      JSON.stringify(calItemWeddingCross.effectiveEventCounts) !==
      JSON.stringify(directDateItem.effectiveEventCounts)
    ) {
      throw new Error('Hitungan effectiveEventCounts pada GET /api/admin/calendar tidak sama dengan availabilityService!');
    }

    // 1 booking wedding harus dihitung sebagai 1 dekor, 1 catering, dan 1 wedding pada effectiveEventCounts
    if (
      calItemWeddingCross.effectiveEventCounts.wedding !== 1 ||
      calItemWeddingCross.effectiveEventCounts.dekor !== 1 ||
      calItemWeddingCross.effectiveEventCounts.catering !== 1
    ) {
      throw new Error(
        `Efek wedding salah! Hasil: ${JSON.stringify(calItemWeddingCross.effectiveEventCounts)}`
      );
    }
    console.log('✓ Booking terkonfirmasi terbukti menambah hitungan kuota');
    console.log('✓ GET /api/admin/calendar mengembalikan jumlah acara efektif per kategori yang sama dengan availabilityService');
    console.log('✓ Efek wedding: booking wedding otomatis dihitung pada kuota dekor DAN catering');

    console.log('\n================================================================');
    console.log('SEMUA SKENARIO PENGUJIAN SETTINGS, CALENDAR & AVAILABILITY LOLOS!');
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

runSettingsAndCalendarTests();
