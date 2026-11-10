const path = require('path');
const dotenv = require('dotenv');
const http = require('http');

// Muat environment variables dari .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Package = require('../src/models/Package');
const cloudinary = require('../src/config/cloudinary');
const { isCloudinaryConfigured } = require('../src/config/cloudinary');

let server;
let baseUrl;

const {
  validateAndGetTestDbUri,
  extractDatabaseName,
  verifyAssetExistsInCloudinary,
  verifyAssetDeletedFromCloudinary,
} = require('./testUtils');

// Koleksi pelacak ID untuk pembersihan yang aman (hanya data uji yang dibuat yang dihapus)
const trackedUserIds = new Set();
const trackedPackageIds = new Set();
const trackedCloudinaryPublicIds = new Set();

async function runTests() {
  console.log('================================================================');
  console.log('Memulai Pengujian Otomatis Fitur Paket & Cloudinary Lengkap');
  console.log('================================================================\n');

  // 1. Validasi ketat MONGO_URI_TEST
  const { testUri, testDbName } = validateAndGetTestDbUri();
  console.log(`[Database Pengujian] Menggunakan database: "${testDbName}"`);

  try {
    // 2. Hubungkan ke test database
    await mongoose.connect(testUri);
    console.log('✓ Terhubung ke database pengujian MongoDB (MONGO_URI_TEST)');

    // 3. Jalankan HTTP server pengujian
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(5015, () => {
        baseUrl = 'http://localhost:5015';
        console.log(`✓ Server pengujian berjalan di ${baseUrl}\n`);
        resolve();
      });
    });

    // 4. Siapkan akun admin dan customer uji
    const adminRand = Date.now().toString().slice(-4);
    const adminUser = await User.create({
      name: `Admin Test ${adminRand}`,
      email: `admin.${adminRand}@kalila-test.com`,
      phone: `0812${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: 'AdminPassword123!',
      role: 'admin',
    });
    trackedUserIds.add(adminUser._id.toString());

    const custRand = Date.now().toString().slice(-4);
    const customerUser = await User.create({
      name: `Customer Test ${custRand}`,
      email: `customer.${custRand}@kalila-test.com`,
      phone: `0813${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: 'CustPassword123!',
      role: 'customer',
    });
    trackedUserIds.add(customerUser._id.toString());

    // Login admin
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminUser.email, password: 'AdminPassword123!' }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.data.token;
    console.log('✓ Login akun admin uji berhasil');

    // Login customer
    const custLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: customerUser.email, password: 'CustPassword123!' }),
    });
    const custLoginData = await custLoginRes.json();
    const custToken = custLoginData.data.token;
    console.log('✓ Login akun customer uji berhasil\n');

    // =========================================================================
    // BAGIAN 1: PROTEKSI & VALIDASI ATURAN PAKET
    // =========================================================================
    console.log('--- Bagian 1: Proteksi & Validasi Aturan Paket ---');

    // 1.1 Proteksi Admin (401 tanpa token, 403 token customer)
    const noTokenRes = await fetch(`${baseUrl}/api/admin/packages`);
    console.assert(noTokenRes.status === 401, `GET admin/packages tanpa token harus 401, got ${noTokenRes.status}`);

    const custTokenRes = await fetch(`${baseUrl}/api/admin/packages`, {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    console.assert(custTokenRes.status === 403, `GET admin/packages dengan customer token harus 403, got ${custTokenRes.status}`);
    console.log('✓ Proteksi endpoint admin terverifikasi (401 tanpa token, 403 peran customer)');

    // 1.2 Validasi decorWidthCm per kategori
    // Kategori dekor wajib isi decorWidthCm
    const dekorNoWidthRes = await fetch(`${baseUrl}/api/admin/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Paket Dekor Tanpa Lebar',
        category: 'dekor',
        price: 5000000,
      }),
    });
    console.assert(dekorNoWidthRes.status === 400, 'Kategori dekor tanpa decorWidthCm harus ditolak 400');

    // Kategori catering tidak boleh isi decorWidthCm
    const cateringWidthRes = await fetch(`${baseUrl}/api/admin/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Paket Catering Dengan Lebar',
        category: 'catering',
        price: 15000000,
        decorWidthCm: 300,
      }),
    });
    console.assert(cateringWidthRes.status === 400, 'Kategori catering dengan decorWidthCm harus ditolak 400');
    console.log('✓ Validasi decorWidthCm per kategori terverifikasi (dekor wajib, catering dilarang)');

    // 1.3 Slug bentrok / pembuatan otomatis dengan suffix angka
    const slugTestName = `Paket Unik Bersama ${Date.now()}`;
    const pkgSlug1Res = await fetch(`${baseUrl}/api/admin/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: slugTestName,
        category: 'dekor',
        price: 4000000,
        decorWidthCm: 300,
      }),
    });
    const pkgSlug1Data = await pkgSlug1Res.json();
    const pkg1Id = pkgSlug1Data.data.package._id;
    const pkg1Slug = pkgSlug1Data.data.package.slug;
    trackedPackageIds.add(pkg1Id);

    const pkgSlug2Res = await fetch(`${baseUrl}/api/admin/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: slugTestName, // Nama sama persis
        category: 'dekor',
        price: 4500000,
        decorWidthCm: 350,
      }),
    });
    const pkgSlug2Data = await pkgSlug2Res.json();
    const pkg2Id = pkgSlug2Data.data.package._id;
    const pkg2Slug = pkgSlug2Data.data.package.slug;
    trackedPackageIds.add(pkg2Id);

    console.assert(pkg1Slug !== pkg2Slug, 'Slug bentrok harus menghasilkan slug berbeda');
    console.assert(pkg2Slug.startsWith(`${pkg1Slug}-`), 'Slug kedua harus berakhiran angka unik');
    console.log(`✓ Slug bentrok ditangani otomatis (${pkg1Slug} -> ${pkg2Slug})`);

    // 1.4 Pencarian dengan karakter regex khusus
    const regexQuery = encodeURIComponent('.*+?^$|()[]{}');
    const regexSearchRes = await fetch(`${baseUrl}/api/packages?q=${regexQuery}`);
    console.assert(regexSearchRes.status === 200, 'Pencarian dengan karakter regex khusus harus mengembalikan 200 OK');
    console.log('✓ Pencarian dengan karakter khusus regex aman (escaped & tidak error 500)');

    // 1.5 Whitelist sort
    const badSortRes = await fetch(`${baseUrl}/api/packages?sort=drop_database`);
    console.assert(badSortRes.status === 400, 'Parameter sort ilegal harus ditolak 400');
    const goodSort1 = await fetch(`${baseUrl}/api/packages?sort=terbaru`);
    const goodSort2 = await fetch(`${baseUrl}/api/packages?sort=harga_asc`);
    const goodSort3 = await fetch(`${baseUrl}/api/packages?sort=harga_desc`);
    console.assert(goodSort1.status === 200 && goodSort2.status === 200 && goodSort3.status === 200, 'Whitelist sort harus 200');
    console.log('✓ Whitelist sort terverifikasi (hanya menerima terbaru, harga_asc, harga_desc)');

    // 1.6 Paket tidak aktif tersembunyi dari publik, tampil di admin
    const inactivePkgRes = await fetch(`${baseUrl}/api/admin/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `Paket Rahasia Internal ${Date.now()}`,
        category: 'dekor',
        price: 6000000,
        decorWidthCm: 400,
      }),
    });
    const inactivePkgData = await inactivePkgRes.json();
    const inactId = inactivePkgData.data.package._id;
    const inactSlug = inactivePkgData.data.package.slug;
    trackedPackageIds.add(inactId);

    // Nonaktifkan paket
    await fetch(`${baseUrl}/api/admin/packages/${inactId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ isActive: false }),
    });

    const pubListCheck = await fetch(`${baseUrl}/api/packages?q=Rahasia`);
    const pubListJson = await pubListCheck.json();
    const foundInPub = pubListJson.data.items.find((p) => p._id === inactId);
    console.assert(!foundInPub, 'Paket nonaktif tidak boleh muncul di publik GET /api/packages');

    const pubDetailCheck = await fetch(`${baseUrl}/api/packages/${inactSlug}`);
    console.assert(pubDetailCheck.status === 404, 'Paket nonaktif harus 404 di GET /api/packages/:slug');

    const adminListCheck = await fetch(`${baseUrl}/api/admin/packages?isActive=false`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminListJson = await adminListCheck.json();
    const foundInAdmin = adminListJson.data.items.find((p) => p._id === inactId);
    console.assert(foundInAdmin !== undefined, 'Paket nonaktif harus tetap tampil di admin GET /api/admin/packages');
    console.log('✓ Paket nonaktif terbukti tersembunyi dari publik (404) dan tampil di admin');

    // 1.7 Upload gambar: file palsu .jpg ditolak (magic bytes) dan file > 5 MB ditolak
    const boundaryPkg = '----TestBoundaryPkg' + Date.now();
    const fakePkgFile = Buffer.concat([
      Buffer.from(`--${boundaryPkg}\r\nContent-Disposition: form-data; name="images"; filename="fake.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
      Buffer.from('TEKS_BUKAN_GAMBAR'),
      Buffer.from(`\r\n--${boundaryPkg}--\r\n`),
    ]);
    const fakePkgUploadRes = await fetch(`${baseUrl}/api/admin/packages/${pkg1Id}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundaryPkg}`,
        Authorization: `Bearer ${adminToken}`,
      },
      body: fakePkgFile,
    });
    console.assert(fakePkgUploadRes.status === 400, 'Upload file palsu .jpg ke paket harus ditolak 400');
    console.log('✓ File palsu berekstensi .jpg ditolak (400 Bad Request via magic bytes)');

    const largePkgBoundary = '----TestBoundaryLargePkg' + Date.now();
    const largeBufferPkg = Buffer.alloc(5.2 * 1024 * 1024, 0xff);
    const largePkgBody = Buffer.concat([
      Buffer.from(`--${largePkgBoundary}\r\nContent-Disposition: form-data; name="images"; filename="large.png"\r\nContent-Type: image/png\r\n\r\n`),
      largeBufferPkg,
      Buffer.from(`\r\n--${largePkgBoundary}--\r\n`),
    ]);
    const largePkgUploadRes = await fetch(`${baseUrl}/api/admin/packages/${pkg1Id}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${largePkgBoundary}`,
        Authorization: `Bearer ${adminToken}`,
      },
      body: largePkgBody,
    });
    console.assert(largePkgUploadRes.status === 400, 'Upload file > 5 MB ke paket harus ditolak 400');
    console.log('✓ File di atas 5 MB pada unggah gambar paket ditolak (400 Bad Request)');

    // =========================================================================
    // BAGIAN 2: 6 SKENARIO CLOUDINARY AKTIF
    // =========================================================================
    console.log('\n--- Bagian 2: 6 Skenario Cloudinary Aktif ---');
    console.log(`[Status Cloudinary] Terkonfigurasi aktif: ${isCloudinaryConfigured()}`);

    // Buffer PNG valid (1x1 pixel PNG lengkap standar)
    const validPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );

    // Buffer JPEG valid (1x1 pixel JPEG lengkap standar)
    const validJpgBuffer = Buffer.from(
      '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q==',
      'base64'
    );

    // Buat paket dekor valid untuk pengujian skenario Cloudinary
    const pkgRes = await fetch(`${baseUrl}/api/admin/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Paket Pelaminan Garden Party',
        category: 'dekor',
        price: 8500000,
        description: 'Dekorasi outdoor tema garden party dengan bunga segar.',
        inclusions: ['Backdrop 6m', 'Lighting Set', 'Mini Garden'],
        decorWidthCm: 600,
      }),
    });
    const pkgData = await pkgRes.json();
    console.assert(pkgRes.status === 201, 'Pembuatan paket awal gagal');
    const pkgId = pkgData.data.package._id;
    const pkgSlug = pkgData.data.package.slug;
    trackedPackageIds.add(pkgId);
    console.log(`✓ Admin membuat paket dekor (ID: ${pkgId}, Slug: ${pkgSlug})\n`);

    // Skenario 1: Unggah 2 gambar valid & verifikasi di Cloudinary via api.resource
    console.log('--- Skenario 1: Unggah 2 gambar valid & verifikasi di Cloudinary ---');
    const formBatch1 = new FormData();
    formBatch1.append('images', new Blob([validPngBuffer], { type: 'image/png' }), 'gambar1.png');
    formBatch1.append('images', new Blob([validJpgBuffer], { type: 'image/jpeg' }), 'gambar2.jpg');

    const uploadRes1 = await fetch(`${baseUrl}/api/admin/packages/${pkgId}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formBatch1,
    });
    const uploadData1 = await uploadRes1.json();
    console.assert(uploadRes1.status === 200, `Upload 2 gambar harus 200, got ${uploadRes1.status}`);
    console.assert(uploadData1.data.package.images.length === 2, 'Jumlah gambar harus 2');

    const publicId1 = uploadData1.data.package.images[0].publicId;
    const publicId2 = uploadData1.data.package.images[1].publicId;
    trackedCloudinaryPublicIds.add(publicId1);
    trackedCloudinaryPublicIds.add(publicId2);

    const exists1 = await verifyAssetExistsInCloudinary(publicId1);
    const exists2 = await verifyAssetExistsInCloudinary(publicId2);
    console.assert(exists1, `Aset pertama (${publicId1}) harus ada di Cloudinary`);
    console.assert(exists2, `Aset kedua (${publicId2}) harus ada di Cloudinary`);
    console.log(`✓ Verifikasi Cloudinary API: Gambar 1 (${publicId1}) benar-benar ada di Cloudinary`);
    console.log(`✓ Verifikasi Cloudinary API: Gambar 2 (${publicId2}) benar-benar ada di Cloudinary`);

    // Skenario 2: Unggah hingga total 10 gambar & tolak unggahan ke-11
    console.log('\n--- Skenario 2: Unggah hingga total 10 gambar & tolak unggahan ke-11 ---');
    const formBatch2 = new FormData();
    for (let i = 3; i <= 6; i++) {
      formBatch2.append('images', new Blob([validPngBuffer], { type: 'image/png' }), `gambar${i}.png`);
    }
    const uploadRes2 = await fetch(`${baseUrl}/api/admin/packages/${pkgId}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formBatch2,
    });
    const uploadData2 = await uploadRes2.json();
    console.assert(uploadRes2.status === 200, 'Upload batch 2 gagal');
    console.assert(uploadData2.data.package.images.length === 6, 'Total gambar harus 6');
    for (let i = 2; i < 6; i++) {
      trackedCloudinaryPublicIds.add(uploadData2.data.package.images[i].publicId);
    }
    console.log('✓ Unggah tambahan 4 gambar berhasil (Total saat ini: 6 gambar)');

    const formBatch3 = new FormData();
    for (let i = 7; i <= 10; i++) {
      formBatch3.append('images', new Blob([validPngBuffer], { type: 'image/png' }), `gambar${i}.png`);
    }
    const uploadRes3 = await fetch(`${baseUrl}/api/admin/packages/${pkgId}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formBatch3,
    });
    const uploadData3 = await uploadRes3.json();
    console.assert(uploadRes3.status === 200, 'Upload batch 3 gagal');
    console.assert(uploadData3.data.package.images.length === 10, 'Total gambar harus genap 10');
    for (let i = 6; i < 10; i++) {
      trackedCloudinaryPublicIds.add(uploadData3.data.package.images[i].publicId);
    }
    console.log('✓ Unggah tambahan 4 gambar berhasil (Total mencapai batas maksimal: 10 gambar)');

    const formBatch4 = new FormData();
    formBatch4.append('images', new Blob([validPngBuffer], { type: 'image/png' }), 'gambar11.png');
    const uploadRes4 = await fetch(`${baseUrl}/api/admin/packages/${pkgId}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formBatch4,
    });
    const uploadData4 = await uploadRes4.json();
    console.assert(uploadRes4.status === 400, `Unggahan ke-11 harus ditolak 400, got ${uploadRes4.status}`);
    console.assert(
      uploadData4.message.includes('melebihi batas maksimal 10 gambar'),
      'Pesan penolakan harus jelas menyebut batas 10 gambar'
    );
    console.log('✓ Unggahan ke-11 ditolak (400 Bad Request): "melebihi batas maksimal 10 gambar per paket"');

    // Skenario 3: Hapus 1 gambar & verifikasi aset hilang di Cloudinary
    console.log('\n--- Skenario 3: Hapus 1 gambar & verifikasi aset hilang di Cloudinary ---');
    const image1 = uploadData3.data.package.images[0];
    const imageId1 = image1._id;
    const targetPublicId = image1.publicId;

    const delImgRes = await fetch(`${baseUrl}/api/admin/packages/${pkgId}/images/${imageId1}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const delImgData = await delImgRes.json();
    console.assert(delImgRes.status === 200, 'Hapus satu gambar gagal');
    console.assert(delImgData.data.package.images.length === 9, 'Sisa gambar di paket harus 9');

    const isDeletedFromCloudinary = await verifyAssetDeletedFromCloudinary(targetPublicId);
    console.assert(isDeletedFromCloudinary, `Aset (${targetPublicId}) harus hilang (404) dari Cloudinary`);
    trackedCloudinaryPublicIds.delete(targetPublicId);
    console.log(`✓ Verifikasi Cloudinary API: Aset (${targetPublicId}) benar-benar hilang (404 Not Found) di Cloudinary`);
    console.log('✓ Sisa gambar pada paket berkurang menjadi 9');

    // Skenario 4: PUT ubah kategori paket yang sudah punya gambar ditolak (400)
    console.log('\n--- Skenario 4: PUT ubah kategori pada paket bergambar ditolak (400) ---');
    const putChangeCatRes = await fetch(`${baseUrl}/api/admin/packages/${pkgId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ category: 'catering' }),
    });
    const putChangeCatData = await putChangeCatRes.json();
    console.assert(putChangeCatRes.status === 400, `Ubah kategori harus ditolak 400, got ${putChangeCatRes.status}`);
    console.assert(
      putChangeCatData.message.includes('sudah memiliki gambar yang tersimpan di folder Cloudinary'),
      'Pesan penolakan harus menjelaskan alasan folder Cloudinary'
    );
    console.log('✓ PUT ubah kategori paket yang sudah punya gambar ditolak (400 Bad Request)');

    // Skenario 5: Hapus paket yang masih punya gambar & verifikasi SEMUA aset hilang di Cloudinary
    console.log('\n--- Skenario 5: Hapus paket bergambar & verifikasi SEMUA aset hilang di Cloudinary ---');
    const getPkgRes = await fetch(`${baseUrl}/api/admin/packages/${pkgId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getPkgData = await getPkgRes.json();
    const remainingPublicIds = getPkgData.data.package.images.map((img) => img.publicId);
    console.assert(remainingPublicIds.length === 9, 'Harus ada 9 gambar yang akan dibersihkan');

    const delPkgRes = await fetch(`${baseUrl}/api/admin/packages/${pkgId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.assert(delPkgRes.status === 200, 'Hapus paket gagal');
    trackedPackageIds.delete(pkgId);
    console.log(`✓ DELETE /api/admin/packages/${pkgId} berhasil (200 OK)`);

    const checkDbPkg = await Package.findById(pkgId);
    console.assert(checkDbPkg === null, 'Paket harus terhapus dari MongoDB');
    console.log('✓ Dokumen paket terverifikasi terhapus dari MongoDB');

    for (const pid of remainingPublicIds) {
      const isGone = await verifyAssetDeletedFromCloudinary(pid);
      console.assert(isGone, `Aset (${pid}) harus terhapus dari Cloudinary`);
      trackedCloudinaryPublicIds.delete(pid);
    }
    console.log(`✓ Verifikasi Cloudinary API: Seluruh ${remainingPublicIds.length} aset gambar terverifikasi hilang (404 Not Found) di Cloudinary`);

    // Skenario 6: Respons publik GET /api/packages dan /api/packages/:slug tidak memuat publicId
    console.log('\n--- Skenario 6: Respons publik tidak memuat publicId ---');
    const pubPkgRes = await fetch(`${baseUrl}/api/admin/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Paket Publik Sanitasi Cloudinary',
        category: 'dekor',
        price: 5000000,
        description: 'Paket untuk verifikasi sanitasi publicId di publik.',
        decorWidthCm: 350,
      }),
    });
    const pubPkgData = await pubPkgRes.json();
    const pubPkgId = pubPkgData.data.package._id;
    const pubPkgSlug = pubPkgData.data.package.slug;
    trackedPackageIds.add(pubPkgId);

    const formPub = new FormData();
    formPub.append('images', new Blob([validPngBuffer], { type: 'image/png' }), 'pub_foto.png');
    const uploadPubRes = await fetch(`${baseUrl}/api/admin/packages/${pubPkgId}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formPub,
    });
    const uploadPubData = await uploadPubRes.json();
    const pubImagePublicId = uploadPubData.data.package.images[0].publicId;
    trackedCloudinaryPublicIds.add(pubImagePublicId);

    // 6a. Uji GET /api/packages (Publik)
    const getPublicListRes = await fetch(`${baseUrl}/api/packages?q=Sanitasi`);
    const getPublicListData = await getPublicListRes.json();
    console.assert(getPublicListRes.status === 200, 'GET /api/packages gagal');
    const matchedPublicPkg = getPublicListData.data.items.find((p) => p._id === pubPkgId);
    console.assert(matchedPublicPkg !== undefined, 'Paket harus ditemukan di publik');
    console.assert(matchedPublicPkg.images.length === 1, 'Harus memuat 1 gambar');
    console.assert(matchedPublicPkg.images[0].url !== undefined, 'Gambar harus memuat url');
    console.assert(matchedPublicPkg.images[0].publicId === undefined, 'publicId TIDAK BOLEH ada di GET /api/packages');
    console.log('✓ GET /api/packages (daftar publik): field publicId terbukti TIDAK ada');

    // 6b. Uji GET /api/packages/:slug (Publik)
    const getPublicSlugRes = await fetch(`${baseUrl}/api/packages/${pubPkgSlug}`);
    const getPublicSlugData = await getPublicSlugRes.json();
    console.assert(getPublicSlugRes.status === 200, 'GET /api/packages/:slug gagal');
    const slugPkg = getPublicSlugData.data.package;
    console.assert(slugPkg.images.length === 1, 'Harus memuat 1 gambar');
    console.assert(slugPkg.images[0].url !== undefined, 'Gambar harus memuat url');
    console.assert(slugPkg.images[0].publicId === undefined, 'publicId TIDAK BOLEH ada di GET /api/packages/:slug');
    console.log('✓ GET /api/packages/:slug (detail publik): field publicId terbukti TIDAK ada');

    // Bersihkan paket publik ini beserta gambarnya
    await fetch(`${baseUrl}/api/admin/packages/${pubPkgId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    trackedPackageIds.delete(pubPkgId);
    trackedCloudinaryPublicIds.delete(pubImagePublicId);
    console.log('✓ Paket publik uji dibersihkan');

    console.log('\n================================================================');
    console.log('SEMUA SKENARIO PENGUJIAN PAKET & CLOUDINARY BERHASIL (ALL PASSED)!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ PENGUJIAN MENGALAMI KESALAHAN:', err.message || err);
    process.exitCode = 1;
  } finally {
    console.log('--- Memulai Pembersihan Data Uji (Finally Block) ---');

    if (trackedUserIds.size > 0) {
      const userRes = await User.deleteMany({ _id: { $in: Array.from(trackedUserIds) } });
      console.log(`✓ Membersihkan ${userRes.deletedCount} akun pengguna uji`);
    }

    if (trackedPackageIds.size > 0) {
      const pkgRes = await Package.deleteMany({ _id: { $in: Array.from(trackedPackageIds) } });
      console.log(`✓ Membersihkan ${pkgRes.deletedCount} paket uji`);
    }

    if (trackedCloudinaryPublicIds.size > 0) {
      console.log(`Membersihkan ${trackedCloudinaryPublicIds.size} sisa aset uji di Cloudinary...`);
      for (const pid of trackedCloudinaryPublicIds) {
        try {
          await cloudinary.uploader.destroy(pid);
        } catch (err) {
          console.error(`[Pembersihan Gagal] Aset ${pid} gagal dibersihkan:`, err.message);
        }
      }
    }

    console.log(`✓ Sisa aset Cloudinary uji yang belum terhapus: ${trackedCloudinaryPublicIds.size}`);
    console.log('✓ Database dan Cloudinary bersih total dari data uji.');

    if (server) server.close();
    await mongoose.disconnect();
    process.exit(process.exitCode || 0);
  }
}

runTests();
