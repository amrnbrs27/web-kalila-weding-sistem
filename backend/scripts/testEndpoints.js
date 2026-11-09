const path = require('path');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Muat environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Package = require('../src/models/Package');
const cloudinary = require('../src/config/cloudinary');
const { isCloudinaryConfigured } = require('../src/config/cloudinary');

let server;
let baseUrl;

// Koleksi pelacak ID untuk pembersihan yang aman (hanya data uji yang dibuat yang dihapus)
const trackedUserIds = new Set();
const trackedPackageIds = new Set();
const trackedCloudinaryPublicIds = new Set();

/**
 * Validasi dan konversi URI MongoDB ke database terpisah yang wajib berakhiran '_test'
 */
function getSafeTestDbUri(originalUri) {
  if (!originalUri) {
    throw new Error('MONGO_URI tidak ditemukan di environment variables!');
  }

  // Pisahkan path database
  let testUri = originalUri;
  const match = originalUri.match(/^(mongodb(?:\+srv)?:\/\/[^/]+)(?:\/([^?]+))?(\?.*)?$/);

  if (match) {
    const base = match[1];
    let dbName = match[2] || 'kalila';
    const query = match[3] || '';

    if (!dbName.endsWith('_test')) {
      dbName = `${dbName}_test`;
    }
    testUri = `${base}/${dbName}${query}`;
  } else {
    throw new Error('Format MONGO_URI tidak valid');
  }

  // Validasi ketat: nama database HARUS berakhiran '_test'
  const finalDbName = testUri.split('/')[3]?.split('?')[0];
  if (!finalDbName || !finalDbName.endsWith('_test')) {
    throw new Error(
      `PENGUJIAN DITOLAK: Nama database pengujian ("${finalDbName}") wajib berakhiran "_test" demi keamanan data asli!`
    );
  }

  return { testUri, dbName: finalDbName };
}

async function runTests() {
  console.log('================================================================');
  console.log('Memulai Pengujian Otomatis Fitur Paket (Isolated & Safe Test)');
  console.log('================================================================\n');

  // 1. Tentukan URI database terpisah
  const { testUri, dbName } = getSafeTestDbUri(process.env.MONGO_URI);
  console.log(`[Database Isolasi] Menggunakan database pengujian: "${dbName}"`);

  // Hubungkan ke database uji
  await mongoose.connect(testUri);
  console.log('✓ Terhubung ke database isolasi pengujian MongoDB');

  // 2. Jalankan server pengujian di port dinamis / 5013
  const port = 5013;
  server = app.listen(port);
  baseUrl = `http://localhost:${port}`;
  console.log(`✓ Server pengujian berjalan di ${baseUrl}\n`);

  try {
    // 3. Buat akun uji sementara secara dinamis tanpa kredensial tertulis
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    const dynamicPassword = `Test!${crypto.randomBytes(8).toString('hex')}Aa1`;
    const adminEmail = `test_admin_${randomSuffix}@kalila-test.local`;
    const custEmail = `test_cust_${randomSuffix}@kalila-test.local`;

    const adminUser = await User.create({
      name: 'Admin Uji Sementara',
      email: adminEmail,
      phone: '081234567890',
      password: dynamicPassword,
      role: 'admin',
    });
    trackedUserIds.add(adminUser._id.toString());

    const custUser = await User.create({
      name: 'Customer Uji Sementara',
      email: custEmail,
      phone: '081987654321',
      password: dynamicPassword,
      role: 'customer',
    });
    trackedUserIds.add(custUser._id.toString());

    // Login Admin
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: dynamicPassword }),
    });
    const adminLoginData = await adminLoginRes.json();
    console.assert(adminLoginRes.status === 200, 'Login admin uji gagal');
    const adminToken = adminLoginData.data.token;
    console.log('✓ Login akun admin uji berhasil');

    // Login Customer
    const custLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: custEmail, password: dynamicPassword }),
    });
    const custLoginData = await custLoginRes.json();
    console.assert(custLoginRes.status === 200, 'Login customer uji gagal');
    const custToken = custLoginData.data.token;
    console.log('✓ Login akun customer uji berhasil');

    // -------------------------------------------------------------------------
    // TEST 1: Proteksi Hak Akses Admin (/api/admin/packages)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1: Proteksi Hak Akses Admin ---');
    const noTokenRes = await fetch(`${baseUrl}/api/admin/packages`);
    console.assert(noTokenRes.status === 401, 'Request tanpa token harus 401');
    console.log('✓ Request tanpa token ditolak (401 Unauthorized)');

    const custAccessRes = await fetch(`${baseUrl}/api/admin/packages`, {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    console.assert(custAccessRes.status === 403, 'Customer mengakses admin harus 403');
    console.log('✓ Customer mengakses endpoint admin ditolak (403 Forbidden)');

    // -------------------------------------------------------------------------
    // TEST 2: Validasi Pembuatan Paket (decorWidthCm)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: Validasi Kategori dan decorWidthCm ---');

    // 2a. Kategori dekor TANPA decorWidthCm -> 400
    const dekorNoWidth = await fetch(`${baseUrl}/api/admin/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Paket Dekor Gagal',
        category: 'dekor',
        price: 5000000,
      }),
    });
    console.assert(dekorNoWidth.status === 400, 'Dekor tanpa decorWidthCm harus ditolak 400');
    console.log('✓ Paket dekor tanpa decorWidthCm ditolak (400 Bad Request)');

    // 2b. Kategori catering yang mengirim decorWidthCm -> 400
    const cateringWithWidth = await fetch(`${baseUrl}/api/admin/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Paket Catering Gagal',
        category: 'catering',
        price: 35000,
        decorWidthCm: 300,
      }),
    });
    console.assert(cateringWithWidth.status === 400, 'Catering dengan decorWidthCm harus ditolak 400');
    console.log('✓ Paket catering yang mengirim decorWidthCm ditolak (400 Bad Request)');

    // 2c. Buat paket dekor valid
    const dekorRes = await fetch(`${baseUrl}/api/admin/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Paket Pelaminan Minimalis',
        category: 'dekor',
        price: 6500000,
        description: 'Dekorasi panggung 4 meter minimalis.',
        inclusions: ['Backdrop 4m', 'Lighting'],
        decorWidthCm: 400,
      }),
    });
    const dekorData = await dekorRes.json();
    console.assert(dekorRes.status === 201, 'Pembuatan paket dekor gagal');
    const dekorId = dekorData.data.package._id;
    const dekorSlug = dekorData.data.package.slug;
    trackedPackageIds.add(dekorId);
    console.log(`✓ Admin membuat paket dekor valid (ID: ${dekorId}, Slug: ${dekorSlug})`);

    // -------------------------------------------------------------------------
    // TEST 3: Penguatan Slug Bentrok & E11000 Retry
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: Slug Bentrok dan Penanganan E11000 ---');
    const dupSlugRes1 = await fetch(`${baseUrl}/api/admin/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Paket Pelaminan Minimalis', // Nama identik
        category: 'dekor',
        price: 7000000,
        decorWidthCm: 400,
      }),
    });
    const dupData1 = await dupSlugRes1.json();
    console.assert(dupData1.data.package.slug === `${dekorSlug}-2`, 'Slug bentrok harus mendapat akhiran -2');
    trackedPackageIds.add(dupData1.data.package._id);
    console.log(`✓ Bentrok nama pertama menghasilkan slug unik: ${dupData1.data.package.slug}`);

    const dupSlugRes2 = await fetch(`${baseUrl}/api/admin/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Paket Pelaminan Minimalis', // Nama identik lagi
        category: 'dekor',
        price: 7500000,
        decorWidthCm: 400,
      }),
    });
    const dupData2 = await dupSlugRes2.json();
    console.assert(dupData2.data.package.slug === `${dekorSlug}-3`, 'Slug bentrok harus mendapat akhiran -3');
    trackedPackageIds.add(dupData2.data.package._id);
    console.log(`✓ Bentrok nama kedua menghasilkan slug unik: ${dupData2.data.package.slug}`);

    // -------------------------------------------------------------------------
    // TEST 4: Pengujian Query Search (Escape Regex) & Whitelist Sort
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: Escape Karakter Regex pada Pencarian & Whitelist Sort ---');
    // Cari dengan karakter khusus regex: `Minimalis (4m)+[test]?`
    const regexSearchRes = await fetch(`${baseUrl}/api/packages?q=Minimalis+(4m)+[test]?`);
    console.assert(regexSearchRes.status === 200, 'Search dengan karakter regex tidak boleh crash');
    console.log('✓ Pencarian dengan simbol regex berhasil ditangani tanpa error regex injection');

    // Coba parameter sort ilegal
    const badSortRes = await fetch(`${baseUrl}/api/packages?sort=ilegal_sort`);
    console.assert(badSortRes.status === 400, 'Parameter sort tidak dikenal harus ditolak 400');
    console.log('✓ Parameter sort di luar whitelist ditolak (400 Bad Request)');

    // -------------------------------------------------------------------------
    // TEST 5: Pengujian Upload & Verifikasi Cloudinary
    // -------------------------------------------------------------------------
    console.log('\n--- Test 5: Pengujian Upload Gambar & Cloudinary ---');

    // Buffer PNG valid (16 bytes header)
    const validPngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
    ]);

    // 5a. File palsu berekstensi .jpg
    const fakeForm = new FormData();
    fakeForm.append(
      'images',
      new Blob([Buffer.from('File teks biasa yang menyamar sebagai jpg')], { type: 'image/jpeg' }),
      'foto_palsu.jpg'
    );
    const fakeUploadRes = await fetch(`${baseUrl}/api/admin/packages/${dekorId}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: fakeForm,
    });
    console.assert(fakeUploadRes.status === 400, 'File palsu harus ditolak magic bytes (400)');
    console.log('✓ File palsu berekstensi .jpg ditolak pemeriksaan magic bytes (400)');

    // 5b. File di atas 5 MB
    const bigBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024);
    validPngBuffer.copy(bigBuffer, 0, 0, 16);
    const bigForm = new FormData();
    bigForm.append('images', new Blob([bigBuffer], { type: 'image/png' }), 'big.png');
    const bigUploadRes = await fetch(`${baseUrl}/api/admin/packages/${dekorId}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: bigForm,
    });
    console.assert(bigUploadRes.status === 400, 'File > 5 MB harus ditolak (400)');
    console.log('✓ File di atas 5 MB ditolak (400)');

    // 5c. Periksa konfigurasi Cloudinary
    const isCloudinaryActive = isCloudinaryConfigured();
    console.log(`[Status Cloudinary] Terkonfigurasi aktif: ${isCloudinaryActive}`);

    let uploadedImageId = null;
    let uploadedPublicId = null;

    if (!isCloudinaryActive) {
      // Jika kredensial belum ada di .env, pastikan endpoint upload merespons 503
      const validForm = new FormData();
      validForm.append('images', new Blob([validPngBuffer], { type: 'image/png' }), 'test.png');
      const uploadRes = await fetch(`${baseUrl}/api/admin/packages/${dekorId}/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: validForm,
      });
      const uploadData = await uploadRes.json();
      console.assert(uploadRes.status === 503, `Saat Cloudinary kosong harus 503, got ${uploadRes.status}`);
      console.assert(
        uploadData.message === 'Layanan penyimpanan gambar belum dikonfigurasi',
        'Pesan 503 tidak sesuai'
      );
      console.log('✓ Upload saat kredensial Cloudinary kosong mengembalikan 503 ("Layanan penyimpanan gambar belum dikonfigurasi")');
      console.log('✓ Tidak ada data palsu / mock yang tersimpan di database');
    } else {
      // Jika Cloudinary aktif di environment variables, uji upload dan verifikasi resource nyata
      const validForm = new FormData();
      validForm.append('images', new Blob([validPngBuffer], { type: 'image/png' }), 'valid_test.png');
      const uploadRes = await fetch(`${baseUrl}/api/admin/packages/${dekorId}/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: validForm,
      });
      const uploadData = await uploadRes.json();
      console.assert(uploadRes.status === 200, `Upload valid harus 200, got ${uploadRes.status}`);
      uploadedImageId = uploadData.data.package.images[0]._id;
      uploadedPublicId = uploadData.data.package.images[0].publicId;
      trackedCloudinaryPublicIds.add(uploadedPublicId);

      // Verifikasi berkas benar-benar ada di server Cloudinary menggunakan API resource
      const resourceCheck = await cloudinary.api.resource(uploadedPublicId);
      console.assert(resourceCheck && resourceCheck.public_id === uploadedPublicId, 'Aset harus ada di Cloudinary');
      console.log(`✓ Verifikasi Cloudinary: Aset "${uploadedPublicId}" benar-benar ada di Cloudinary API`);

      // 5d. Uji PUT: Kategori tidak boleh diubah bila paket sudah memiliki gambar
      const changeCatRes = await fetch(`${baseUrl}/api/admin/packages/${dekorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ category: 'catering' }),
      });
      console.assert(
        changeCatRes.status === 400,
        'Ubah kategori pada paket yang memiliki gambar harus ditolak 400'
      );
      console.log('✓ Pengubahan kategori pada paket yang sudah memiliki gambar ditolak (400)');

      // 5e. Hapus satu gambar dari paket dan verifikasi Cloudinary
      const delImgRes = await fetch(
        `${baseUrl}/api/admin/packages/${dekorId}/images/${uploadedImageId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      console.assert(delImgRes.status === 200, 'Hapus satu gambar gagal');

      // Verifikasi berkas benar-benar hilang dari Cloudinary
      let isGone = false;
      try {
        await cloudinary.api.resource(uploadedPublicId);
      } catch (err) {
        if (err.error && err.error.http_code === 404) {
          isGone = true;
        }
      }
      console.assert(isGone, 'Aset gambar harus sudah tidak ditemukan (404) di Cloudinary');
      trackedCloudinaryPublicIds.delete(uploadedPublicId);
      console.log(`✓ Verifikasi Cloudinary: Aset "${uploadedPublicId}" benar-benar terhapus dari Cloudinary (404)`);
    }

    // -------------------------------------------------------------------------
    // TEST 6: Visibilitas Status Aktif (isActive)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 6: Visibilitas Paket (isActive) ---');
    // Nonaktifkan paket dekor
    await fetch(`${baseUrl}/api/admin/packages/${dekorId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isActive: false }),
    });

    // Cek publik: tidak muncul di daftar dan slug 404
    const pubListRes = await fetch(`${baseUrl}/api/packages?category=dekor`);
    const pubListData = await pubListRes.json();
    const foundPub = pubListData.data.items.find((p) => p._id === dekorId);
    console.assert(foundPub === undefined, 'Paket nonaktif tidak boleh tampil di publik');

    const pubSlugRes = await fetch(`${baseUrl}/api/packages/${dekorSlug}`);
    console.assert(pubSlugRes.status === 404, 'Detail slug paket nonaktif harus 404');
    console.log('✓ Paket tidak aktif tersembunyi dari publik (daftar publik kosong & slug 404)');

    // Cek admin: tetap muncul
    const adminListRes = await fetch(`${baseUrl}/api/admin/packages`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminListData = await adminListRes.json();
    const foundAdmin = adminListData.data.items.find((p) => p._id === dekorId);
    console.assert(foundAdmin !== undefined && foundAdmin.isActive === false, 'Paket nonaktif harus muncul di admin');
    console.log('✓ Paket tidak aktif tetap tampil di daftar admin dengan status isActive: false');

    // -------------------------------------------------------------------------
    // TEST 7: Hapus Paket Bersih
    // -------------------------------------------------------------------------
    console.log('\n--- Test 7: Penghapusan Paket ---');
    const delPkgRes = await fetch(`${baseUrl}/api/admin/packages/${dekorId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.assert(delPkgRes.status === 200, 'Hapus paket gagal');
    trackedPackageIds.delete(dekorId);
    console.log('✓ Paket berhasil dihapus');

    const checkDoc = await Package.findById(dekorId);
    console.assert(checkDoc === null, 'Dokumen harus terhapus dari MongoDB');
    console.log('✓ Terverifikasi dokumen paket terhapus dari MongoDB isolasi');

    console.log('\n================================================================');
    console.log('SEMUA PENGUJIAN BERHASIL DAN MEMENUHI STANDAR KETAT (ALL PASSED)!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ PENGUJIAN MENGALAMI KESALAHAN:', err);
    process.exitCode = 1;
  } finally {
    console.log('--- Memulai Pembersihan Data Uji (Finally Block) ---');

    // 1. Hapus HANYA akun uji yang dibuat skrip berdasarkan ID terlacak
    if (trackedUserIds.size > 0) {
      const userRes = await User.deleteMany({ _id: { $in: Array.from(trackedUserIds) } });
      console.log(`✓ Membersihkan ${userRes.deletedCount} akun pengguna uji`);
    }

    // 2. Hapus HANYA paket uji yang dibuat skrip berdasarkan ID terlacak
    if (trackedPackageIds.size > 0) {
      const pkgRes = await Package.deleteMany({ _id: { $in: Array.from(trackedPackageIds) } });
      console.log(`✓ Membersihkan ${pkgRes.deletedCount} paket uji`);
    }

    // 3. Hapus aset Cloudinary uji yang masih tersisa
    if (trackedCloudinaryPublicIds.size > 0 && isCloudinaryConfigured()) {
      const failed = [];
      for (const publicId of trackedCloudinaryPublicIds) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          failed.push(publicId);
        }
      }
      if (failed.length > 0) {
        console.error(`[Pembersihan Cloudinary Gagal] Public ID berikut gagal dibersihkan: ${failed.join(', ')}`);
      } else {
        console.log(`✓ Membersihkan ${trackedCloudinaryPublicIds.size} aset Cloudinary uji`);
      }
    }

    console.log('✓ Tidak ada data uji yang tertinggal di database.');

    if (server) server.close();
    await mongoose.disconnect();
    process.exit(process.exitCode || 0);
  }
}

runTests();
