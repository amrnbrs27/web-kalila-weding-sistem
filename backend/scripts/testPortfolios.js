const path = require('path');
const dotenv = require('dotenv');
const http = require('http');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const app = require('../src/app');
const Portfolio = require('../src/models/Portfolio');
const cloudinary = require('../src/config/cloudinary');
const {
  connectTestDb,
  disconnectTestDb,
  createTestAdmin,
  createTestCustomer,
  cleanTrackedData,
  trackPortfolio,
  trackCloudinaryPublicId,
  verifyAssetExistsInCloudinary,
  verifyAssetDeletedFromCloudinary,
} = require('./testUtils');

let server;
let baseUrl;

// Helper Buffer JPEG minimal valid
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

// Helper multipart form-data upload multiple images (field 'images')
function buildMultipleImagesMultipart(boundary, files) {
  const chunks = [];
  for (const f of files) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="images"; filename="${f.filename}"\r\nContent-Type: ${f.contentType || 'image/jpeg'}\r\n\r\n`
      )
    );
    chunks.push(f.buffer);
    chunks.push(Buffer.from('\r\n'));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return Buffer.concat(chunks);
}

async function runPortfolioTests() {
  console.log('================================================================');
  console.log('Memulai Pengujian Otomatis Portofolio & Cloudinary (PRD 4.9 & 5.8)');
  console.log('================================================================\n');

  await connectTestDb();

  const testPort = 5021;
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(testPort, resolve));
  baseUrl = `http://localhost:${testPort}`;
  console.log(`✓ Server pengujian portofolio berjalan di ${baseUrl}\n`);

  try {
    const { user: adminUser, token: adminToken } = await createTestAdmin();
    const { user: customerUser, token: customerToken } = await createTestCustomer();
    console.log('✓ Akun admin dan pelanggan uji berhasil disiapkan\n');

    // -------------------------------------------------------------
    // a) Endpoint Publik: dipublikasi vs draft, filter, sort whitelist, regex aman, sanitasi publicId
    // -------------------------------------------------------------
    console.log('--- Menguji Endpoint Publik Portofolio ---');
    const portPub1 = await Portfolio.create({
      category: 'dekor',
      title: 'Pernikahan Megah Rustic (Special & Grand)',
      slug: 'pernikahan-megah-rustic-grand',
      description: 'Dekorasi rustic megah di ballroom hotel berbintang dengan nuansa kayu hangat',
      eventDate: '2025-10-15',
      location: 'Grand Ballroom Hotel Mulia',
      isPublished: true,
      isFeatured: true,
      images: [
        { url: 'https://res.cloudinary.com/demo/image/upload/sample1.jpg', publicId: 'kalila/portfolios/sample1' },
        { url: 'https://res.cloudinary.com/demo/image/upload/sample2.jpg', publicId: 'kalila/portfolios/sample2' },
      ],
    });
    trackPortfolio(portPub1._id);

    const portPub2 = await Portfolio.create({
      category: 'catering',
      title: 'Catering Prasmanan Mewah Nusantara',
      slug: 'catering-prasmanan-mewah-nusantara',
      description: 'Menu hidangan nusantara lengkap 1000 porsi',
      eventDate: '2025-11-20',
      location: 'Gedung Dhanapala',
      isPublished: true,
      isFeatured: false,
      images: [
        { url: 'https://res.cloudinary.com/demo/image/upload/sample3.jpg', publicId: 'kalila/portfolios/sample3' },
      ],
    });
    trackPortfolio(portPub2._id);

    const portDraft = await Portfolio.create({
      category: 'wedding',
      title: 'Paket Wedding All-In Impian',
      slug: 'paket-wedding-all-in-impian',
      description: 'Paket lengkap dekor, catering dan dokumentasi draft rahasia',
      eventDate: '2026-05-10',
      location: 'Balai Samudera',
      isPublished: false,
      isFeatured: false,
    });
    trackPortfolio(portDraft._id);

    // 1. GET /api/portfolios (hanya isPublished = true)
    const listPubRes = await fetch(`${baseUrl}/api/portfolios`);
    const listPubData = await listPubRes.json();
    if (listPubRes.status !== 200 || !Array.isArray(listPubData.data)) {
      throw new Error('Skenario a: GET /api/portfolios gagal');
    }
    const foundDraftInPub = listPubData.data.some((p) => p.slug === portDraft.slug || p.id === portDraft._id.toString());
    if (foundDraftInPub) {
      throw new Error('Skenario a: portofolio unpublished (draft) bocor ke daftar publik!');
    }

    // Periksa cover, imageCount, dan pastikan publicId TIDAK ada
    const item1 = listPubData.data.find((p) => p.slug === portPub1.slug);
    if (!item1 || item1.cover !== portPub1.images[0].url || item1.imageCount !== 2) {
      throw new Error('Skenario a: ringkasan cover dan imageCount pada publik tidak sesuai');
    }
    const listPubStr = JSON.stringify(listPubData);
    if (listPubStr.includes('kalila/portfolios/sample1') || listPubStr.includes('publicId')) {
      throw new Error('Skenario a: respons publik membocorkan publicId!');
    }

    // 2. Filter category
    const catRes = await fetch(`${baseUrl}/api/portfolios?category=catering`);
    const catData = await catRes.json();
    if (!catData.data.every((p) => p.category === 'catering')) {
      throw new Error('Skenario a: filter category gagal');
    }

    // 3. Filter featured=true
    const featRes = await fetch(`${baseUrl}/api/portfolios?featured=true`);
    const featData = await featRes.json();
    if (featData.data.some((p) => p.slug === portPub2.slug) || !featData.data.some((p) => p.slug === portPub1.slug)) {
      throw new Error('Skenario a: filter featured gagal');
    }

    // 4. Pencarian aman regex
    const regexRes = await fetch(`${baseUrl}/api/portfolios?q=${encodeURIComponent('Special & Grand (.*)')}`);
    if (regexRes.status !== 200) {
      throw new Error('Skenario a: pencarian karakter regex khusus gagal');
    }

    // 5. Sort di luar whitelist -> 400
    const badSortRes = await fetch(`${baseUrl}/api/portfolios?sort=acak`);
    if (badSortRes.status !== 400) {
      throw new Error('Skenario a: sort di luar whitelist harus ditolak 400');
    }

    // 6. Limit di atas batas (>50) -> 400
    const badLimitRes = await fetch(`${baseUrl}/api/portfolios?limit=51`);
    if (badLimitRes.status !== 400) {
      throw new Error('Skenario a: limit di atas 50 harus ditolak 400');
    }

    // 7. GET /api/portfolios/:slug (detail publik)
    const detailPubRes = await fetch(`${baseUrl}/api/portfolios/${portPub1.slug}`);
    const detailPubData = await detailPubRes.json();
    if (detailPubRes.status !== 200 || !detailPubData.data.images || detailPubData.data.images.length !== 2) {
      throw new Error('Skenario a: detail portofolio publik gagal');
    }
    const detailPubStr = JSON.stringify(detailPubData);
    if (detailPubStr.includes('kalila/portfolios/sample1') || detailPubStr.includes('publicId')) {
      throw new Error('Skenario a: detail portofolio publik membocorkan publicId');
    }

    // 8. Detail portofolio unpublished -> 404
    const detailDraftRes = await fetch(`${baseUrl}/api/portfolios/${portDraft.slug}`);
    if (detailDraftRes.status !== 404) {
      throw new Error(`Skenario a: detail draft harus 404, got ${detailDraftRes.status}`);
    }
    console.log('✓ a) Endpoint publik terverifikasi: hanya published, cover/imageCount ringkas, sanitasi publicId, regex aman & batas query 400');

    // -------------------------------------------------------------
    // b) Proteksi Hak Akses Endpoint Admin Portofolio
    // -------------------------------------------------------------
    console.log('--- Menguji Proteksi Endpoint Admin Portofolio (401 & 403) ---');
    const adminEndpoints = [
      { method: 'GET', url: `${baseUrl}/api/admin/portfolios` },
      { method: 'GET', url: `${baseUrl}/api/admin/portfolios/${portPub1._id}` },
      { method: 'POST', url: `${baseUrl}/api/admin/portfolios`, body: JSON.stringify({ category: 'dekor', title: 'Uji Hak Akses' }) },
      { method: 'PUT', url: `${baseUrl}/api/admin/portfolios/${portPub1._id}`, body: JSON.stringify({ title: 'Ubah Hak Akses' }) },
      { method: 'PATCH', url: `${baseUrl}/api/admin/portfolios/${portPub1._id}/status`, body: JSON.stringify({ isPublished: false }) },
      { method: 'DELETE', url: `${baseUrl}/api/admin/portfolios/${portPub1._id}` },
      { method: 'POST', url: `${baseUrl}/api/admin/portfolios/${portPub1._id}/images` },
      { method: 'DELETE', url: `${baseUrl}/api/admin/portfolios/${portPub1._id}/images/507f1f77bcf86cd799439011` },
      { method: 'PATCH', url: `${baseUrl}/api/admin/portfolios/${portPub1._id}/images/507f1f77bcf86cd799439011/cover` },
    ];

    for (const ep of adminEndpoints) {
      const headersNoToken = ep.body ? { 'Content-Type': 'application/json' } : {};
      const resNoToken = await fetch(ep.url, { method: ep.method, headers: headersNoToken, body: ep.body });
      if (resNoToken.status !== 401) {
        throw new Error(`Skenario b: ${ep.method} ${ep.url} tanpa token harus 401, got ${resNoToken.status}`);
      }

      const headersCustomer = {
        Authorization: `Bearer ${customerToken}`,
        ...(ep.body ? { 'Content-Type': 'application/json' } : {}),
      };
      const resCustomer = await fetch(ep.url, { method: ep.method, headers: headersCustomer, body: ep.body });
      if (resCustomer.status !== 403) {
        throw new Error(`Skenario b: ${ep.method} ${ep.url} dengan token customer harus 403, got ${resCustomer.status}`);
      }
    }
    console.log('✓ b) Proteksi hak akses endpoint admin terverifikasi (401 tanpa token, 403 role customer)');

    // -------------------------------------------------------------
    // c) Validasi Zod & Slug Otomatis Portofolio
    // -------------------------------------------------------------
    console.log('--- Menguji Validasi Zod & Slug Portofolio ---');
    // 1. Kategori tidak valid -> 400
    const badCatRes = await fetch(`${baseUrl}/api/admin/portfolios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ category: 'elektronik', title: 'Porto Dekor Keren' }),
    });
    if (badCatRes.status !== 400) throw new Error('Skenario c: kategori tidak valid harus 400');

    // 2. Title terlalu pendek (<3 char) -> 400
    const shortTitleRes = await fetch(`${baseUrl}/api/admin/portfolios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ category: 'dekor', title: 'AB' }),
    });
    if (shortTitleRes.status !== 400) throw new Error('Skenario c: judul terlalu pendek harus 400');

    // 3. eventDate tidak valid kalender (2026-02-30) -> 400
    const badDateRes = await fetch(`${baseUrl}/api/admin/portfolios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ category: 'dekor', title: 'Porto Tanggal Palsu', eventDate: '2026-02-30' }),
    });
    if (badDateRes.status !== 400) throw new Error('Skenario c: tanggal palsu kalender harus 400');

    // 4. Field tak dikenal -> 400
    const unknownFieldRes = await fetch(`${baseUrl}/api/admin/portfolios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ category: 'dekor', title: 'Porto Valid', unknownField: 'hacker' }),
    });
    if (unknownFieldRes.status !== 400) throw new Error('Skenario c: field tak dikenal harus 400');

    // 5. Body kosong pada PATCH status -> 400
    const emptyStatusRes = await fetch(`${baseUrl}/api/admin/portfolios/${portPub1._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({}),
    });
    if (emptyStatusRes.status !== 400) throw new Error('Skenario c: body kosong status harus 400');

    // 6. Pembuatan slug otomatis & penanganan bentrok
    const createP1 = await fetch(`${baseUrl}/api/admin/portfolios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ category: 'dekor', title: 'Dekorasi Mewah Pelaminan Gold' }),
    });
    const dataP1 = await createP1.json();
    if (createP1.status !== 201 || !dataP1.data.slug) throw new Error('Skenario c: tambah portofolio 1 gagal');
    trackPortfolio(dataP1.data._id);
    const slug1 = dataP1.data.slug;

    // Buat portofolio dengan judul yang SAMA persis -> harus menghasilkan slug unik dengan suffix angka
    const createP2 = await fetch(`${baseUrl}/api/admin/portfolios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ category: 'catering', title: 'Dekorasi Mewah Pelaminan Gold' }),
    });
    const dataP2 = await createP2.json();
    if (createP2.status !== 201) throw new Error('Skenario c: tambah portofolio 2 dengan judul sama gagal');
    trackPortfolio(dataP2.data._id);
    const slug2 = dataP2.data.slug;

    if (slug1 === slug2 || !slug2.startsWith(slug1)) {
      throw new Error(`Skenario c: penanganan bentrok slug gagal, slug1="${slug1}", slug2="${slug2}"`);
    }

    // PUT ubah judul portofolio -> slug harus dibuat ulang
    const updateTitleRes = await fetch(`${baseUrl}/api/admin/portfolios/${dataP2.data._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ title: 'Catering Prasmanan Tradisional Jogja' }),
    });
    const updateTitleData = await updateTitleRes.json();
    if (updateTitleRes.status !== 200 || !updateTitleData.data.slug.includes('catering-prasmanan-tradisional-jogja')) {
      throw new Error('Skenario c: pembaruan slug saat title diubah gagal');
    }
    console.log('✓ c) Validasi Zod ketat & slug otomatis dengan suffix bentrok dan pembaruan judul terverifikasi');

    // -------------------------------------------------------------
    // d) Pengelolaan Gambar & Cloudinary
    // -------------------------------------------------------------
    console.log('--- Menguji Pengelolaan Gambar & Cloudinary Portofolio ---');
    const portImageTest = await Portfolio.create({
      category: 'dekor',
      title: 'Galeri Uji Gambar Cloudinary',
      slug: 'galeri-uji-gambar-cloudinary',
      description: 'Portofolio khusus uji unggah Cloudinary',
    });
    trackPortfolio(portImageTest._id);

    // 1. File palsu (magic bytes bukan gambar) -> 400
    const fakeBuffer = Buffer.from('INI BUKAN GAMBAR TAPI TEKS BIASA');
    const fakeBoundary = '----FakeBoundary' + Math.random().toString(16);
    const fakeBody = buildMultipleImagesMultipart(fakeBoundary, [
      { filename: 'palsu.jpg', buffer: fakeBuffer, contentType: 'image/jpeg' },
    ]);
    const fakeRes = await fetch(`${baseUrl}/api/admin/portfolios/${portImageTest._id}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${fakeBoundary}`,
        Authorization: `Bearer ${adminToken}`,
      },
      body: fakeBody,
    });
    if (fakeRes.status !== 400) {
      throw new Error(`Skenario d: file palsu harus 400, got ${fakeRes.status}`);
    }

    // 2. File di atas 5 MB -> 400
    const bigBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024);
    bigBuffer[0] = 0xff;
    bigBuffer[1] = 0xd8;
    bigBuffer[2] = 0xff;
    const bigBoundary = '----BigBoundary' + Math.random().toString(16);
    const bigBody = buildMultipleImagesMultipart(bigBoundary, [
      { filename: 'besar.jpg', buffer: bigBuffer, contentType: 'image/jpeg' },
    ]);
    const bigRes = await fetch(`${baseUrl}/api/admin/portfolios/${portImageTest._id}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${bigBoundary}`,
        Authorization: `Bearer ${adminToken}`,
      },
      body: bigBody,
    });
    if (bigRes.status !== 400) {
      throw new Error(`Skenario d: file > 5MB harus 400, got ${bigRes.status}`);
    }

    // 3. Unggah 3 gambar valid asli ke Cloudinary
    const imgBuf1 = createDummyJpegBuffer();
    const imgBuf2 = createDummyJpegBuffer();
    const imgBuf3 = createDummyJpegBuffer();
    const uploadBoundary = '----ValidUploadBoundary' + Math.random().toString(16);
    const uploadBody = buildMultipleImagesMultipart(uploadBoundary, [
      { filename: 'dekor1.jpg', buffer: imgBuf1 },
      { filename: 'dekor2.jpg', buffer: imgBuf2 },
      { filename: 'dekor3.jpg', buffer: imgBuf3 },
    ]);

    const uploadRes = await fetch(`${baseUrl}/api/admin/portfolios/${portImageTest._id}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${uploadBoundary}`,
        Authorization: `Bearer ${adminToken}`,
      },
      body: uploadBody,
    });
    const uploadData = await uploadRes.json();
    if (uploadRes.status !== 200 || !uploadData.data.images || uploadData.data.images.length !== 3) {
      throw new Error(`Skenario d: unggah 3 gambar valid gagal, status ${uploadRes.status}`);
    }

    // Periksa dokumen database dan lacak publicId untuk cleanup
    const docAfterUpload = await Portfolio.findById(portImageTest._id);
    for (const img of docAfterUpload.images) {
      trackCloudinaryPublicId(img.publicId);
      const exists = await verifyAssetExistsInCloudinary(img.publicId);
      if (!exists) {
        throw new Error(`Skenario d: aset ${img.publicId} tidak ditemukan di Cloudinary!`);
      }
    }

    // Respons admin menampilkan url gambar tetapi TIDAK field publicId
    const hasPublicIdField = uploadData.data.images.some((img) => img.publicId !== undefined);
    if (hasPublicIdField || JSON.stringify(uploadData).includes('"publicId"')) {
      throw new Error('Skenario d: respons upload admin membocorkan publicId!');
    }

    // 4. Jadikan sampul (pindahkan gambar ke-3 menjadi index 0)
    const thirdImageId = docAfterUpload.images[2]._id.toString();
    const thirdImagePublicId = docAfterUpload.images[2].publicId;

    const coverRes = await fetch(`${baseUrl}/api/admin/portfolios/${portImageTest._id}/images/${thirdImageId}/cover`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const coverData = await coverRes.json();
    if (coverRes.status !== 200 || coverData.data.images[0]._id !== thirdImageId) {
      throw new Error('Skenario d: set cover gagal memindahkan gambar ke urutan pertama');
    }
    const docAfterCover = await Portfolio.findById(portImageTest._id);
    if (docAfterCover.images[0].publicId !== thirdImagePublicId) {
      throw new Error('Skenario d: database tidak menyimpan gambar sampul baru di index 0');
    }

    // 5. Ubah kategori portofolio yang sudah punya gambar -> BERHASIL (folder tidak dipisah per kategori)
    const changeCatRes = await fetch(`${baseUrl}/api/admin/portfolios/${portImageTest._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ category: 'wedding' }),
    });
    const changeCatData = await changeCatRes.json();
    if (changeCatRes.status !== 200 || changeCatData.data.category !== 'wedding') {
      throw new Error('Skenario d: ubah kategori portofolio bergambar harus berhasil');
    }

    // 6. Hapus satu gambar -> aset terhapus di Cloudinary
    const imageToDeleteId = docAfterUpload.images[1]._id.toString();
    const imageToDeletePid = docAfterUpload.images[1].publicId;

    const delImgRes = await fetch(`${baseUrl}/api/admin/portfolios/${portImageTest._id}/images/${imageToDeleteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const delImgData = await delImgRes.json();
    if (delImgRes.status !== 200 || delImgData.data.images.length !== 2) {
      throw new Error('Skenario d: hapus satu gambar gagal');
    }
    const isDeletedSingle = await verifyAssetDeletedFromCloudinary(imageToDeletePid);
    if (!isDeletedSingle) {
      throw new Error(`Skenario d: aset ${imageToDeletePid} masih ada di Cloudinary setelah dihapus!`);
    }

    // 7. Unggah melebihi batas 12 gambar -> ditolak 400
    // Saat ini ada 2 gambar. Buat perulangan hingga 12 gambar.
    const addBatch1 = buildMultipleImagesMultipart('----B1', [
      { filename: 'b1.jpg', buffer: createDummyJpegBuffer() },
      { filename: 'b2.jpg', buffer: createDummyJpegBuffer() },
      { filename: 'b3.jpg', buffer: createDummyJpegBuffer() },
      { filename: 'b4.jpg', buffer: createDummyJpegBuffer() },
      { filename: 'b5.jpg', buffer: createDummyJpegBuffer() },
    ]);
    const addBatch1Res = await fetch(`${baseUrl}/api/admin/portfolios/${portImageTest._id}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data; boundary=----B1', Authorization: `Bearer ${adminToken}` },
      body: addBatch1,
    });
    if (addBatch1Res.status !== 200) throw new Error('Skenario d: tambah 5 gambar gagal');
    const docB1 = await Portfolio.findById(portImageTest._id);
    docB1.images.forEach((img) => trackCloudinaryPublicId(img.publicId));

    const addBatch2 = buildMultipleImagesMultipart('----B2', [
      { filename: 'b6.jpg', buffer: createDummyJpegBuffer() },
      { filename: 'b7.jpg', buffer: createDummyJpegBuffer() },
      { filename: 'b8.jpg', buffer: createDummyJpegBuffer() },
      { filename: 'b9.jpg', buffer: createDummyJpegBuffer() },
      { filename: 'b10.jpg', buffer: createDummyJpegBuffer() },
    ]);
    const addBatch2Res = await fetch(`${baseUrl}/api/admin/portfolios/${portImageTest._id}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data; boundary=----B2', Authorization: `Bearer ${adminToken}` },
      body: addBatch2,
    });
    if (addBatch2Res.status !== 200) throw new Error('Skenario d: tambah 5 gambar kedua (total 12) gagal');
    const docB2 = await Portfolio.findById(portImageTest._id);
    docB2.images.forEach((img) => trackCloudinaryPublicId(img.publicId));
    if (docB2.images.length !== 12) throw new Error('Skenario d: total gambar harus tepat 12');

    // Coba tambah gambar ke-13 -> 400
    const addExcess = buildMultipleImagesMultipart('----Excess', [
      { filename: 'b13.jpg', buffer: createDummyJpegBuffer() },
    ]);
    const excessRes = await fetch(`${baseUrl}/api/admin/portfolios/${portImageTest._id}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data; boundary=----Excess', Authorization: `Bearer ${adminToken}` },
      body: addExcess,
    });
    if (excessRes.status !== 400) {
      throw new Error(`Skenario d: upload melebihi 12 gambar harus 400, got ${excessRes.status}`);
    }

    // 8. Hapus portofolio -> SEMUA aset Cloudinary terhapus bersih
    const allPidsToDelete = docB2.images.map((img) => img.publicId);
    const delPortRes = await fetch(`${baseUrl}/api/admin/portfolios/${portImageTest._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (delPortRes.status !== 200) {
      throw new Error('Skenario d: DELETE portofolio gagal');
    }
    const checkDocDeleted = await Portfolio.findById(portImageTest._id);
    if (checkDocDeleted) {
      throw new Error('Skenario d: dokumen portofolio masih ada di database setelah dihapus');
    }

    for (const pid of allPidsToDelete) {
      const isDel = await verifyAssetDeletedFromCloudinary(pid);
      if (!isDel) {
        throw new Error(`Skenario d: aset ${pid} masih tertinggal di Cloudinary setelah portofolio dihapus!`);
      }
    }
    console.log('✓ d) Pengelolaan gambar & Cloudinary terverifikasi: magic bytes, batas 5MB, batas 12, sampul urutan 1, ubah kategori aman, & hapus total bersih tanpa aset yatim');

    console.log('\n================================================================');
    console.log('SEMUA SKENARIO PENGUJIAN PORTOFOLIO (a - d) BERHASIL (ALL PASSED)!');
    console.log('================================================================\n');
  } finally {
    console.log('--- Memulai Pembersihan Data Uji Portofolio ---');
    try {
      await cleanTrackedData();
      console.log('✓ Data uji portofolio dan aset Cloudinary berhasil dibersihkan.');
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
  runPortfolioTests().catch((err) => {
    console.error('\n❌ PENGUJIAN PORTOFOLIO GAGAL DENGAN ERROR:');
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runPortfolioTests };

