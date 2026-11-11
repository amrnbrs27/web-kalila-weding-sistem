const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const { spawnSync } = require('child_process');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Set nilai env khusus pengujian batas keamanan
process.env.AUTH_LOGIN_MAX = '3';
process.env.AUTH_LOGIN_IP_MAX = '12';
process.env.AUTH_CONFIRM_MAX = '3';

const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const AdminLock = require('../src/models/AdminLock');
const { resetConfirmPasswordLimit } = require('../src/utils/confirmPasswordLimiter');
const {
  connectTestDb,
  disconnectTestDb,
  createTestAdmin,
  createTestCustomer,
  cleanTrackedData,
  trackUser,
  trackAdminLock,
} = require('./testUtils');

let server;
let baseUrl;

async function runAdminUserTests() {
  console.log('================================================================');
  console.log('Memulai Pengujian Otomatis Kelola Admin & Keamanan Auth (PRD 5.9)');
  console.log('================================================================\n');

  await connectTestDb();

  const testPort = 5022;
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(testPort, resolve));
  baseUrl = `http://localhost:${testPort}`;
  console.log(`✓ Server pengujian admin user berjalan di ${baseUrl}\n`);

  try {
    const { user: admin1, token: adminToken1, rawPassword: adminPass1 } = await createTestAdmin();
    const { user: customer1, token: customerToken } = await createTestCustomer();
    console.log('✓ Akun admin utama dan pelanggan uji berhasil disiapkan\n');

    // -------------------------------------------------------------
    // e) Proteksi Hak Akses Endpoint /api/admin/users
    // -------------------------------------------------------------
    console.log('--- Menguji Proteksi Endpoint Admin User (401 & 403) ---');
    const endpoints = [
      { method: 'GET', url: `${baseUrl}/api/admin/users` },
      { method: 'GET', url: `${baseUrl}/api/admin/users/${admin1._id}` },
      { method: 'POST', url: `${baseUrl}/api/admin/users`, body: JSON.stringify({ name: 'A', email: 'a@a.com', password: 'P1', confirmPassword: 'P2' }) },
      { method: 'PUT', url: `${baseUrl}/api/admin/users/${admin1._id}`, body: JSON.stringify({ name: 'A2' }) },
      { method: 'PATCH', url: `${baseUrl}/api/admin/users/${admin1._id}/status`, body: JSON.stringify({ isActive: false }) },
      { method: 'PATCH', url: `${baseUrl}/api/admin/users/me/password`, body: JSON.stringify({ currentPassword: 'P1', newPassword: 'P2' }) },
      { method: 'POST', url: `${baseUrl}/api/admin/users/${admin1._id}/reset-password`, body: JSON.stringify({ newPassword: 'P1', confirmPassword: 'P2' }) },
    ];

    for (const ep of endpoints) {
      const headersNoToken = ep.body ? { 'Content-Type': 'application/json' } : {};
      const resNoToken = await fetch(ep.url, { method: ep.method, headers: headersNoToken, body: ep.body });
      if (resNoToken.status !== 401) {
        throw new Error(`Skenario e: ${ep.method} ${ep.url} tanpa token harus 401, got ${resNoToken.status}`);
      }

      const headersCustomer = {
        Authorization: `Bearer ${customerToken}`,
        ...(ep.body ? { 'Content-Type': 'application/json' } : {}),
      };
      const resCustomer = await fetch(ep.url, { method: ep.method, headers: headersCustomer, body: ep.body });
      if (resCustomer.status !== 403) {
        throw new Error(`Skenario e: ${ep.method} ${ep.url} dengan token customer harus 403, got ${resCustomer.status}`);
      }
    }
    console.log('✓ e) Proteksi hak akses endpoint /api/admin/users terverifikasi (401 tanpa token, 403 role customer)');

    // -------------------------------------------------------------
    // f) Tambah Admin Baru & Validasi Kebijakan
    // -------------------------------------------------------------
    console.log('--- Menguji Penambahan Admin Baru & Validasi Kebijakan ---');
    // 1. Validasi: email salah, password lemah (<8 char, tanpa angka, tanpa huruf), >72 byte, password = email
    const multibytePassword = 'A1' + 'é'.repeat(40); // 42 karakter, tapi 82 byte (tiap 'é' adalah 2 byte di UTF-8)
    const badCreations = [
      { body: { name: 'Admin Bad', email: 'bukanemail', password: 'Pass123Valid!', confirmPassword: adminPass1 }, expectedMsg: 'email tidak valid' },
      { body: { name: 'Admin Bad', email: 'ab1@test.com', password: 'pendek1', confirmPassword: adminPass1 }, expectedMsg: 'minimal 8' },
      { body: { name: 'Admin Bad', email: 'ab2@test.com', password: 'hanyahurufsaja', confirmPassword: adminPass1 }, expectedMsg: 'minimal satu angka' },
      { body: { name: 'Admin Bad', email: 'ab3@test.com', password: '123456789012', confirmPassword: adminPass1 }, expectedMsg: 'minimal satu huruf' },
      { body: { name: 'Admin Bad', email: 'ab4@test.com', password: multibytePassword, confirmPassword: adminPass1 }, expectedMsg: '72 byte', checkByteMsg: true },
      { body: { name: 'Admin Bad', email: 'admin.sama@test.com', password: 'admin.sama@test.com', confirmPassword: adminPass1 }, expectedMsg: 'tidak boleh sama dengan email' },
      { body: { name: 'Admin Bad', email: 'ab5@test.com', password: 'Pass123Valid!', confirmPassword: adminPass1, role: 'superadmin' }, expectedMsg: 'role dari klien ditolak' },
    ];

    for (const item of badCreations) {
      const res = await fetch(`${baseUrl}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
        body: JSON.stringify(item.body),
      });
      if (res.status !== 400) {
        throw new Error(`Skenario f: penambahan admin tidak valid (${item.expectedMsg}) harus 400, got ${res.status}`);
      }
      if (item.checkByteMsg) {
        const errJson = await res.json();
        const errStr = JSON.stringify(errJson).toLowerCase();
        if (!errStr.includes('72 byte')) {
          throw new Error('Skenario f: pesan error password multibyte harus menyebut batas 72 byte');
        }
      }
    }

    // Uji: password tepat 72 karakter ASCII (72 byte) harus DITERIMA
    const pass72Ascii = 'A1' + 'b'.repeat(70); // 72 karakter & 72 byte
    const res72Ascii = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
      body: JSON.stringify({
        name: 'Admin 72 Byte',
        email: 'admin.72byte@kalila-test.com',
        password: pass72Ascii,
        confirmPassword: adminPass1,
      }),
    });
    const data72Ascii = await res72Ascii.json();
    if (res72Ascii.status !== 201) {
      throw new Error(`Skenario f: password 72 karakter ASCII harus diterima (201), got ${res72Ascii.status}`);
    }
    trackUser(data72Ascii.data._id);

    // 2. confirmPassword salah -> 403
    const wrongConfirmRes = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
      body: JSON.stringify({
        name: 'Admin Baru Uji',
        email: 'admin.baru.uji@kalila-test.com',
        phone: '081234567890',
        password: 'PasswordBaru123!',
        confirmPassword: 'PasswordSalah999!',
      }),
    });
    if (wrongConfirmRes.status !== 403) {
      throw new Error(`Skenario f: confirmPassword salah harus 403, got ${wrongConfirmRes.status}`);
    }

    // 3. Tambah admin valid berhasil
    const validCreateRes = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
      body: JSON.stringify({
        name: 'Admin Kedua Kalila',
        email: 'admin.kedua@kalila-test.com',
        phone: '+6281298765432',
        password: 'PasswordBaru123!',
        confirmPassword: adminPass1,
      }),
    });
    const validCreateData = await validCreateRes.json();
    if (validCreateRes.status !== 201 || validCreateData.data.email !== 'admin.kedua@kalila-test.com') {
      throw new Error(`Skenario f: tambah admin valid gagal, got status ${validCreateRes.status}`);
    }
    const admin2Id = validCreateData.data._id || validCreateData.data.id;
    trackUser(admin2Id);

    // Pastikan tidak ada password di respons
    const createStr = JSON.stringify(validCreateData);
    if (createStr.includes('password') || createStr.includes('$2a$') || createStr.includes('$2b$')) {
      throw new Error('Skenario f: respons tambah admin membocorkan password/hash!');
    }
    // Pastikan nomor telepon dinormalisasi menjadi 628...
    if (validCreateData.data.phone !== '6281298765432') {
      throw new Error(`Skenario f: normalisasi nomor telepon gagal, got ${validCreateData.data.phone}`);
    }

    // 4. Email duplikat (beda huruf besar kecil) -> 409
    const dupEmailRes = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
      body: JSON.stringify({
        name: 'Admin Duplikat',
        email: 'ADMIN.KEDUA@KALILA-TEST.COM', // uppercase
        password: 'PasswordBaru123!',
        confirmPassword: adminPass1,
      }),
    });
    if (dupEmailRes.status !== 409) {
      throw new Error(`Skenario f: email duplikat harus 409, got ${dupEmailRes.status}`);
    }

    // 5. Admin baru bisa login dan akses endpoint admin
    const loginNewAdminRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin.kedua@kalila-test.com', password: 'PasswordBaru123!' }),
    });
    const loginNewAdminData = await loginNewAdminRes.json();
    if (loginNewAdminRes.status !== 200 || !loginNewAdminData.data.token) {
      throw new Error('Skenario f: login admin baru gagal');
    }
    const adminToken2 = loginNewAdminData.data.token;

    // Akses endpoint admin dengan token admin baru
    const testAccessRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken2}` },
    });
    if (testAccessRes.status !== 200) {
      throw new Error('Skenario f: admin baru gagal mengakses endpoint admin');
    }
    console.log('✓ f) Tambah admin: validasi password ketat, konfirmasi password 403, duplikat email 409, respons bersih & admin baru sukses login');

    // -------------------------------------------------------------
    // g) Daftar & Detail Admin (Customer tidak pernah tampil)
    // -------------------------------------------------------------
    console.log('--- Menguji Daftar & Detail Admin ---');
    // 1. GET /api/admin/users hanya memuat admin
    const listAdminRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken1}` },
    });
    const listAdminData = await listAdminRes.json();
    if (listAdminRes.status !== 200 || !Array.isArray(listAdminData.data)) {
      throw new Error('Skenario g: list admin gagal');
    }
    const foundCustInAdminList = listAdminData.data.some((u) => u.email === customer1.email);
    if (foundCustInAdminList) {
      throw new Error('Skenario g: akun customer bocor di daftar admin!');
    }

    // 2. GET detail dengan ID customer -> 404
    const detailCustAsAdminRes = await fetch(`${baseUrl}/api/admin/users/${customer1._id}`, {
      headers: { Authorization: `Bearer ${adminToken1}` },
    });
    if (detailCustAsAdminRes.status !== 404) {
      throw new Error(`Skenario g: ID customer pada endpoint admin harus 404, got ${detailCustAsAdminRes.status}`);
    }

    // 3. Pencarian regex aman
    const qAdminRes = await fetch(`${baseUrl}/api/admin/users?q=${encodeURIComponent('.*+?^$|()[]{}')}`, {
      headers: { Authorization: `Bearer ${adminToken1}` },
    });
    if (qAdminRes.status !== 200) throw new Error('Skenario g: pencarian dengan karakter regex khusus gagal');

    // 4. Sort di luar whitelist -> 400
    const badSortAdminRes = await fetch(`${baseUrl}/api/admin/users?sort=asal`, {
      headers: { Authorization: `Bearer ${adminToken1}` },
    });
    if (badSortAdminRes.status !== 400) throw new Error('Skenario g: sort admin di luar whitelist harus 400');
    console.log('✓ g) Daftar & detail admin: customer tidak pernah tampil (404), pencarian regex aman & sort whitelist terverifikasi');

    // -------------------------------------------------------------
    // h) Ubah Profil Admin (PUT /api/admin/users/:id)
    // -------------------------------------------------------------
    console.log('--- Menguji Pembaruan Profil Admin ---');
    // 1. Larangan mengubah role, password, atau isActive via PUT -> 400
    const illegalPutFields = [
      { body: { role: 'superadmin' } },
      { body: { password: 'NewPassword123!' } },
      { body: { isActive: false } },
    ];
    for (const item of illegalPutFields) {
      const putRes = await fetch(`${baseUrl}/api/admin/users/${admin2Id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
        body: JSON.stringify(item.body),
      });
      if (putRes.status !== 400) {
        throw new Error(`Skenario h: ubah field terlarang via PUT harus 400, got ${putRes.status}`);
      }
    }

    // 2. Ubah email menjadi email admin1 -> 409
    const dupPutEmail = await fetch(`${baseUrl}/api/admin/users/${admin2Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
      body: JSON.stringify({ email: admin1.email }),
    });
    if (dupPutEmail.status !== 409) {
      throw new Error(`Skenario h: duplikat email pada PUT harus 409, got ${dupPutEmail.status}`);
    }

    // 3. Update nama & telepon valid
    const validPut = await fetch(`${baseUrl}/api/admin/users/${admin2Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
      body: JSON.stringify({ name: 'Admin Kedua Diperbarui', phone: '085712345678' }),
    });
    const validPutData = await validPut.json();
    if (validPut.status !== 200) {
      throw new Error('Skenario h: update profil admin valid gagal');
    }
    if (validPutData.data.name !== 'Admin Kedua Diperbarui' || validPutData.data.phone !== '6285712345678') {
      throw new Error('Skenario h: data hasil PUT tidak sesuai');
    }
    console.log('✓ h) Ubah profil admin: penolakan field terlarang (400), tolak duplikat email (409) & update profil sukses');

    // -------------------------------------------------------------
    // i) Nonaktifkan Admin, Proteksi Admin Terakhir & Konkurensi
    // -------------------------------------------------------------
    console.log('--- Menguji Nonaktifkan Admin, Proteksi Admin Terakhir & Konkurensi ---');
    // 1. Admin tidak boleh menonaktifkan dirinya sendiri -> 400
    const selfDeactivateRes = await fetch(`${baseUrl}/api/admin/users/${admin1._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
      body: JSON.stringify({ isActive: false }),
    });
    if (selfDeactivateRes.status !== 400) {
      throw new Error(`Skenario i: nonaktifkan diri sendiri harus 400, got ${selfDeactivateRes.status}`);
    }

    // 2. Nonaktifkan admin2 oleh admin1 berhasil
    const deactivate2Res = await fetch(`${baseUrl}/api/admin/users/${admin2Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
      body: JSON.stringify({ isActive: false }),
    });
    const deactivate2Data = await deactivate2Res.json();
    if (deactivate2Res.status !== 200 || deactivate2Data.data.isActive !== false) {
      throw new Error('Skenario i: nonaktifkan admin2 gagal');
    }

    // 3. Admin yang dinonaktifkan:
    // a) Token yang sudah ada langsung ditolak pada request berikutnya (401)
    const tokenAfterDeactRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken2}` },
    });
    if (tokenAfterDeactRes.status !== 401) {
      throw new Error(`Skenario i: token admin nonaktif harus langsung 401, got ${tokenAfterDeactRes.status}`);
    }
    // b) Login ditolak dengan 403
    const loginDeactRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin.kedua@kalila-test.com', password: 'PasswordBaru123!' }),
    });
    if (loginDeactRes.status !== 403) {
      throw new Error(`Skenario i: login admin nonaktif harus 403, got ${loginDeactRes.status}`);
    }

    // 4. Saat hanya tersisa 1 admin aktif (admin1), coba nonaktifkan admin1 (oleh siapa pun / dari sistem) -> 409
    // Aktifkan kembali admin2 terlebih dahulu
    const reactivate2Res = await fetch(`${baseUrl}/api/admin/users/${admin2Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
      body: JSON.stringify({ isActive: true }),
    });
    if (reactivate2Res.status !== 200) throw new Error('Skenario i: aktifkan kembali admin2 gagal');

    // Sekarang ada 2 admin aktif: admin1 dan admin2. Nonaktifkan admin1 oleh admin2
    // Buat token baru untuk admin2
    const loginToken2Res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin.kedua@kalila-test.com', password: 'PasswordBaru123!' }),
    });
    const freshAdminToken2 = (await loginToken2Res.json()).data.token;

    // Nonaktifkan admin1 oleh admin2 -> sukses (tersisa admin2)
    const deact1Res = await fetch(`${baseUrl}/api/admin/users/${admin1._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${freshAdminToken2}` },
      body: JSON.stringify({ isActive: false }),
    });
    if (deact1Res.status !== 200) throw new Error('Skenario i: nonaktifkan admin1 oleh admin2 gagal');

    // Sekarang hanya tersisa 1 admin aktif (admin2).
    // Aktifkan admin1 kembali untuk menguji penolakan menonaktifkan admin aktif terakhir
    await User.findByIdAndUpdate(admin1._id, { isActive: true });

    // Nonaktifkan admin2 oleh admin1 -> tersisa 1 admin aktif (admin1)
    await fetch(`${baseUrl}/api/admin/users/${admin2Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
      body: JSON.stringify({ isActive: false }),
    });

    // Coba nonaktifkan admin aktif terakhir oleh admin lain (secara langsung di database buat admin3)
    const { user: admin3, token: adminToken3 } = await createTestAdmin();
    // Nonaktifkan admin3 agar hanya admin1 yang aktif
    await User.findByIdAndUpdate(admin3._id, { isActive: false });

    // Sekarang hanya admin1 yang aktif. admin3 coba nonaktifkan admin1 -> ditolak 409
    // (Jalankan service langsung dengan session/lock atau via endpoint jika admin3 punya token sementara)
    // Ubah admin3 jadi aktif sejenak untuk memanggil endpoint
    await User.findByIdAndUpdate(admin3._id, { isActive: true });
    // Nonaktifkan admin3 oleh admin1 -> tersisa admin1 aktif
    await fetch(`${baseUrl}/api/admin/users/${admin3._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
      body: JSON.stringify({ isActive: false }),
    });

    // 5. UJI KONKURENSI: 2 admin aktif saling menonaktifkan secara bersamaan (Promise.all)
    console.log('--- Menguji Konkurensi Penonaktifan Saling Silang (5 Putaran) ---');
    trackAdminLock('admins');

    for (let round = 1; round <= 5; round++) {
      // Siapkan tepat 2 admin aktif
      const { user: cAdminA, token: cTokenA } = await createTestAdmin();
      const { user: cAdminB, token: cTokenB } = await createTestAdmin();

      // Pastikan semua admin uji lain nonaktif sementara untuk putaran ini
      await User.updateMany({ _id: { $nin: [cAdminA._id, cAdminB._id] } }, { isActive: false });

      const countBefore = await User.countDocuments({ role: 'admin', isActive: true });
      if (countBefore !== 2) throw new Error(`Putaran ${round}: harus tepat 2 admin aktif sebelum konkurensi`);

      // A mencoba menonaktifkan B, dan B mencoba menonaktifkan A secara BERSAMAAN
      const [resA, resB] = await Promise.all([
        fetch(`${baseUrl}/api/admin/users/${cAdminB._id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cTokenA}` },
          body: JSON.stringify({ isActive: false }),
        }),
        fetch(`${baseUrl}/api/admin/users/${cAdminA._id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cTokenB}` },
          body: JSON.stringify({ isActive: false }),
        }),
      ]);

      const statuses = [resA.status, resB.status];
      const successCount = statuses.filter((s) => s === 200).length;
      const conflictCount = statuses.filter((s) => s === 409).length;

      const activeAfter = await User.countDocuments({ role: 'admin', isActive: true });

      // Verifikasi: tepat satu berhasil (200), satu gagal (409), dan minimal 1 admin tetap aktif
      if (successCount !== 1 || conflictCount !== 1 || activeAfter < 1) {
        throw new Error(
          `Putaran ${round} GAGAL: status=${JSON.stringify(statuses)}, activeAfter=${activeAfter}`
        );
      }
    }
    // Pulihkan admin1 agar aktif kembali
    await User.findByIdAndUpdate(admin1._id, { isActive: true });
    console.log('✓ i) Nonaktifkan: tolak diri sendiri (400), tolak admin terakhir (409), tolak token lama (401) & 5 putaran konkurensi serial terbukti aman');

    // -------------------------------------------------------------
    // j) Ganti Password Sendiri & Reset Password Admin Lain
    // -------------------------------------------------------------
    console.log('--- Menguji Ganti Password Sendiri & Reset Password ---');
    // Buat admin uji khusus password
    const { user: adminP, token: tokenP, rawPassword: passP } = await createTestAdmin();

    // 1. Ganti password sendiri (/me/password)
    // Password saat ini salah -> 400
    const badCurrPassRes = await fetch(`${baseUrl}/api/admin/users/me/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenP}` },
      body: JSON.stringify({ currentPassword: 'PasswordSalah999!', newPassword: 'NewPassword999!' }),
    });
    if (badCurrPassRes.status !== 400) throw new Error('Skenario j: currentPassword salah harus 400');

    // Password baru lemah -> 400
    const weakNewPassRes = await fetch(`${baseUrl}/api/admin/users/me/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenP}` },
      body: JSON.stringify({ currentPassword: passP, newPassword: 'lemah' }),
    });
    if (weakNewPassRes.status !== 400) throw new Error('Skenario j: password baru lemah harus 400');

    // Ganti password berhasil
    const validChangeRes = await fetch(`${baseUrl}/api/admin/users/me/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenP}` },
      body: JSON.stringify({ currentPassword: passP, newPassword: 'NewPasswordValid123!' }),
    });
    if (validChangeRes.status !== 200) throw new Error('Skenario j: ganti password sendiri gagal');

    // Setelah ganti password:
    // a) Token LAMA harus ditolak (401)
    const oldTokenAfterChangeRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${tokenP}` },
    });
    if (oldTokenAfterChangeRes.status !== 401) {
      throw new Error(`Skenario j: token lama setelah ganti password harus 401, got ${oldTokenAfterChangeRes.status}`);
    }

    // b) Login dengan password baru berhasil
    const loginWithNewPassRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminP.email, password: 'NewPasswordValid123!' }),
    });
    const loginWithNewPassData = await loginWithNewPassRes.json();
    if (loginWithNewPassRes.status !== 200 || !loginWithNewPassData.data.token) {
      throw new Error('Skenario j: login dengan password baru gagal');
    }
    const brandNewTokenP = loginWithNewPassData.data.token;

    // c) Token baru diterima
    const newTokenCheckRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${brandNewTokenP}` },
    });
    if (newTokenCheckRes.status !== 200) throw new Error('Skenario j: token baru harus diterima');

    // 2. Reset password admin lain (/api/admin/users/:id/reset-password)
    const { user: adminTarget, token: tokenTarget } = await createTestAdmin();
    // Beri jeda 1.1 detik agar detik JWT (iat) berada sebelum detik reset password
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Reset akun sendiri via endpoint ini dilarang -> 400
    const resetSelfRes = await fetch(`${baseUrl}/api/admin/users/${admin1._id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
      body: JSON.stringify({ newPassword: 'TargetNewPassword123!', confirmPassword: adminPass1 }),
    });
    if (resetSelfRes.status !== 400) throw new Error('Skenario j: reset password akun sendiri harus 400');

    // Reset akun customer -> 404
    const resetCustRes = await fetch(`${baseUrl}/api/admin/users/${customer1._id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
      body: JSON.stringify({ newPassword: 'TargetNewPassword123!', confirmPassword: adminPass1 }),
    });
    if (resetCustRes.status !== 404) throw new Error('Skenario j: reset akun customer harus 404');

    // confirmPassword admin login salah -> 403
    const resetWrongConfirmRes = await fetch(`${baseUrl}/api/admin/users/${adminTarget._id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
      body: JSON.stringify({ newPassword: 'TargetNewPassword123!', confirmPassword: 'PasswordAdmin1Salah!' }),
    });
    if (resetWrongConfirmRes.status !== 403) throw new Error('Skenario j: confirmPassword reset salah harus 403');

    // Reset valid berhasil
    const validResetRes = await fetch(`${baseUrl}/api/admin/users/${adminTarget._id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
      body: JSON.stringify({ newPassword: 'TargetNewPassword123!', confirmPassword: adminPass1 }),
    });
    if (validResetRes.status !== 200) throw new Error('Skenario j: reset password valid gagal');

    // Token lama target harus INVALID (401)
    const tokenTargetAfterReset = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${tokenTarget}` },
    });
    if (tokenTargetAfterReset.status !== 401) {
      throw new Error(`Skenario j: token admin target setelah direset harus 401, got ${tokenTargetAfterReset.status}`);
    }

    // 3. Uji pembatas gagal konfirmasi password (AUTH_CONFIRM_MAX = 3)
    resetConfirmPasswordLimit();
    const { user: adminConfTest, token: tokenConfTest } = await createTestAdmin();

    // 3 kali percobaan konfirmasi password yang salah
    for (let c = 1; c <= 3; c++) {
      const failConfRes = await fetch(`${baseUrl}/api/admin/users/me/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenConfTest}` },
        body: JSON.stringify({ currentPassword: `SalahTotal${c}!`, newPassword: 'ValidNewPass123!' }),
      });
      if (failConfRes.status !== 400) {
        throw new Error(`Skenario j: percobaan gagal konfirmasi ke-${c} harus 400, got ${failConfRes.status}`);
      }
    }

    // Percobaan ke-4 harus ditolak 429
    const blockedConfRes = await fetch(`${baseUrl}/api/admin/users/me/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenConfTest}` },
      body: JSON.stringify({ currentPassword: 'SalahTotal4!', newPassword: 'ValidNewPass123!' }),
    });
    if (blockedConfRes.status !== 429) {
      throw new Error(`Skenario j: percobaan konfirmasi ke-4 harus 429, got ${blockedConfRes.status}`);
    }
    const blockedConfData = await blockedConfRes.json();
    if (!blockedConfData.message || !blockedConfData.message.includes('Terlalu banyak percobaan konfirmasi password')) {
      throw new Error('Skenario j: pesan 429 konfirmasi password harus berbahasa Indonesia');
    }

    // Admin lain TIDAK terpengaruh oleh pembatas adminConfTest
    const otherAdminConfRes = await fetch(`${baseUrl}/api/admin/users/me/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
      body: JSON.stringify({ currentPassword: 'SalahAdmin1Sekali!', newPassword: 'ValidNewPass123!' }),
    });
    if (otherAdminConfRes.status !== 400) {
      throw new Error(`Skenario j: admin lain tidak boleh terkena 429, got ${otherAdminConfRes.status}`);
    }
    console.log('✓ j) Password: ganti password sendiri & reset password admin lain membatalkan token lama (401) & pembatas konfirmasi 429 terverifikasi');

    // -------------------------------------------------------------
    // k) Batas Percobaan Login (AUTH_LOGIN_MAX = 3 & AUTH_LOGIN_IP_MAX = 10)
    // -------------------------------------------------------------
    console.log('--- Menguji Batas Percobaan Login Gagal (Rate Limiting IP & Email) ---');
    const attackEmail = `victim.${Date.now()}@kalila-test.com`;

    // 1. Lapisan 2 (IP + Email): 3 kali percobaan login gagal dengan email yang sama
    for (let i = 1; i <= 3; i++) {
      const failRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: attackEmail, password: 'SalahPassword123!' }),
      });
      if (failRes.status !== 401) {
        throw new Error(`Skenario k: percobaan gagal ke-${i} harus 401, got ${failRes.status}`);
      }
    }

    // Percobaan ke-4 dengan email yang sama harus DITOLAK 429 (oleh pembatas IP + Email)
    const blockedRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: attackEmail, password: 'SalahPassword123!' }),
    });
    if (blockedRes.status !== 429) {
      throw new Error(`Skenario k: percobaan login ke-4 harus 429, got ${blockedRes.status}`);
    }
    const blockedData = await blockedRes.json();
    if (!blockedData.message || !blockedData.message.includes('Terlalu banyak percobaan login')) {
      throw new Error('Skenario k: pesan 429 harus berbahasa Indonesia');
    }

    // Kombinasi email LAIN belum terkena blokir (karena limit IP belum tercapai, total baru 3 kegagalan di IP)
    const otherEmailRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'other.person@kalila-test.com', password: 'SalahPassword123!' }),
    });
    if (otherEmailRes.status !== 401) {
      throw new Error(`Skenario k: email lain harusnya 401 bukan 429, got ${otherEmailRes.status}`);
    }

    // 2. Lapisan 1 (Per IP): Coba login gagal hingga total mencapai AUTH_LOGIN_IP_MAX (10 kegagalan)
    // Saat ini di IP sudah ada 4 kegagalan (3 victim + 1 other.person).
    // Tambahkan 6 kegagalan lagi dengan email berbeda-beda agar total kegagalan di IP menjadi 10:
    for (let j = 1; j <= 6; j++) {
      const multiEmail = `diff.${j}.${Date.now()}@kalila-test.com`;
      const multiRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: multiEmail, password: 'SalahPassword123!' }),
      });
      if (multiRes.status !== 401) {
        throw new Error(`Skenario k: percobaan multi email ke-${j} harus 401, got ${multiRes.status}`);
      }
    }

    // Percobaan ke-11 dengan email baru lagi harus DITOLAK 429 oleh pembatas IP
    const blockedIpRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `brand.new.${Date.now()}@kalila-test.com`, password: 'SalahPassword123!' }),
    });
    if (blockedIpRes.status !== 429) {
      throw new Error(`Skenario k: percobaan login ke-11 dari IP yang sama harus 429 oleh limiter IP, got ${blockedIpRes.status}`);
    }
    const blockedIpData = await blockedIpRes.json();
    if (!blockedIpData.message || !blockedIpData.message.includes('alamat IP ini')) {
      throw new Error('Skenario k: pesan 429 harus dari pembatas IP (alamat IP ini)');
    }
    console.log('✓ k) Batas login: Lapisan 1 (Per IP) & Lapisan 2 (Per IP + Email) terbukti menolak 429 secara independen');

    // -------------------------------------------------------------
    // l) Skrip createAdmin.js: Berhenti tanpa menyentuh database jika tanpa variabel
    // -------------------------------------------------------------
    console.log('--- Menguji Skrip createAdmin.js Tanpa Variabel Lingkungan ---');
    const scriptPath = path.resolve(__dirname, 'createAdmin.js');
    const execRes = spawnSync(process.execPath, [scriptPath], {
      env: { ...process.env, ADMIN_NAME: '', ADMIN_EMAIL: '', ADMIN_PASSWORD: '' },
      encoding: 'utf-8',
    });

    if (execRes.status !== 1) {
      throw new Error(`Skenario l: createAdmin.js tanpa variabel harus exit code 1, got ${execRes.status}`);
    }
    if (!execRes.stderr.includes('wajib diisi')) {
      throw new Error('Skenario l: createAdmin.js tidak menampilkan pesan kesalahan variabel wajib diisi');
    }
    console.log('✓ l) Skrip createAdmin.js terverifikasi: berhenti dengan pesan jelas sebelum menyentuh database saat variabel kosong');

    console.log('\n================================================================');
    console.log('SEMUA SKENARIO PENGUJIAN ADMIN USER (e - l) BERHASIL (ALL PASSED)!');
    console.log('================================================================\n');
  } finally {
    console.log('--- Memulai Pembersihan Data Uji Admin User ---');
    try {
      await cleanTrackedData();
      console.log('✓ Data uji admin user berhasil dibersihkan.');
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
  runAdminUserTests().catch((err) => {
    console.error('\n❌ PENGUJIAN ADMIN USER GAGAL DENGAN ERROR:');
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runAdminUserTests };
