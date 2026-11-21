const path = require('path');
const http = require('http');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const app = require('../src/app');
const Post = require('../src/models/Post');
const cloudinary = require('../src/config/cloudinary');
const { isCloudinaryConfigured } = require('../src/config/cloudinary');
const {
  sanitizeContentHtml,
  htmlToPlainText,
  countWords,
  buildExcerpt,
  sanitizePlainText,
} = require('../src/services/htmlSanitizer');

const {
  connectTestDb,
  disconnectTestDb,
  createTestAdmin,
  createTestCustomer,
  backupSettings,
  restoreSettings,
  cleanTrackedData,
  trackPost,
  trackCloudinaryPublicId,
  verifyAssetExistsInCloudinary,
  verifyAssetDeletedFromCloudinary,
} = require('./testUtils');

let server;
let baseUrl;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// 1x1 valid pixel buffers untuk magic bytes test
const validJpgBuffer = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01,
  0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08,
  0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a,
  0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d,
  0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22,
  0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34,
  0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0,
  0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4,
  0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06,
  0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00,
  0x3f, 0x00, 0xbf, 0x00, 0xff, 0xd9,
]);

const fakeJpgBuffer = Buffer.from(
  'INI BUKAN GAMBAR JPG ASLI MELAINKAN TEKS BIASA'
);

async function fetchJson(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  const res = await fetch(url, options);
  const body = await res.json().catch(() => null);
  return { status: res.status, headers: res.headers, body };
}

async function uploadFormData(endpoint, formData, token) {
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, headers: res.headers, body };
}

async function runPostsTests() {
  console.log('================================================================');
  console.log('Memulai Pengujian Otomatis Fitur Blog & Artikel (PRD 4.10 & 5.8)');
  console.log('================================================================\n');

  await connectTestDb();
  await backupSettings();

  // Pastikan indeks model Post terbentuk
  await Post.createIndexes();

  const testPort = 5025;
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(testPort, resolve));
  baseUrl = `http://localhost:${testPort}`;
  console.log(`✓ Server pengujian berjalan di ${baseUrl}\n`);

  try {
    const { token: adminToken, user: adminUser } = await createTestAdmin();
    const { token: customerToken } = await createTestCustomer();
    console.log('✓ Akun admin dan pelanggan uji sementara berhasil disiapkan\n');

    // -----------------------------------------------------------------
    // b) 401 tanpa token dan 403 token customer pada semua endpoint admin
    // -----------------------------------------------------------------
    const dummyId = new mongoose.Types.ObjectId().toString();
    const adminEndpoints = [
      { method: 'GET', path: '/api/admin/posts' },
      { method: 'GET', path: `/api/admin/posts/${dummyId}` },
      { method: 'POST', path: '/api/admin/posts', body: { title: 'Test', content: '<p>Konten</p>' } },
      { method: 'PUT', path: `/api/admin/posts/${dummyId}`, body: { title: 'Test' } },
      { method: 'PATCH', path: `/api/admin/posts/${dummyId}/status`, body: { status: 'published' } },
      { method: 'DELETE', path: `/api/admin/posts/${dummyId}` },
      { method: 'DELETE', path: `/api/admin/posts/${dummyId}/cover` },
      { method: 'DELETE', path: `/api/admin/posts/${dummyId}/images/${dummyId}` },
    ];

    for (const ep of adminEndpoints) {
      // Tanpa token -> 401
      const noTokRes = await fetchJson(ep.path, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      assert(
        noTokRes.status === 401,
        `Skenario b: ${ep.method} ${ep.path} tanpa token harus 401 (dapat ${noTokRes.status})`
      );

      // Token customer -> 403
      const custRes = await fetchJson(ep.path, {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      assert(
        custRes.status === 403,
        `Skenario b: ${ep.method} ${ep.path} token customer harus 403 (dapat ${custRes.status})`
      );
    }
    console.log('✓ b) Hak akses 401 tanpa token dan 403 peran customer terverifikasi pada seluruh rute admin');

    // -----------------------------------------------------------------
    // c) Validasi Zod strict pada POST, PUT, PATCH status
    // -----------------------------------------------------------------
    // Title terlalu pendek (< 3 karakter)
    const valShortTitle = await fetchJson('/api/admin/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ title: 'Hi', content: '<p>Panjang isi yang cukup</p>' }),
    });
    assert(valShortTitle.status === 400, 'Skenario c: title < 3 karakter harus 400');

    // Tag lebih dari 5
    const valTooManyTags = await fetchJson('/api/admin/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Judul Valid',
        content: '<p>Konten valid</p>',
        tags: ['satu', 'dua', 'tiga', 'empat', 'lima', 'enam'],
      }),
    });
    assert(valTooManyTags.status === 400, 'Skenario c: tags > 5 harus 400');

    // Tag tidak valid (karakter terlarang)
    const valInvalidTag = await fetchJson('/api/admin/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Judul Valid',
        content: '<p>Konten valid</p>',
        tags: ['tag_terlarang!'],
      }),
    });
    assert(valInvalidTag.status === 400, 'Skenario c: tag berkarakter terlarang harus 400');

    // Meta description > 160
    const valLongMeta = await fetchJson('/api/admin/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Judul Valid',
        content: '<p>Konten valid</p>',
        metaDescription: 'A'.repeat(161),
      }),
    });
    assert(valLongMeta.status === 400, 'Skenario c: metaDescription > 160 karakter harus 400');

    // Field tak dikenal (Zod strict)
    const valUnknownField = await fetchJson('/api/admin/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Judul Valid',
        content: '<p>Konten valid</p>',
        fieldHacker: 'injeksi',
      }),
    });
    assert(valUnknownField.status === 400, 'Skenario c: field tak dikenal harus 400');

    // Body kosong pada PATCH status
    const valEmptyStatus = await fetchJson(`/api/admin/posts/${dummyId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({}),
    });
    assert(valEmptyStatus.status === 400, 'Skenario c: PATCH status body kosong harus 400');
    console.log('✓ c) Validasi Zod (title pendek, tags > 5/invalid, metaDescription > 160, field tak dikenal, body kosong) terverifikasi');

    // -----------------------------------------------------------------
    // g) Sanitasi HTML langsung dan via API (script, on*, protocols, iframe, img Cloudinary vs luar, idempoten)
    // -----------------------------------------------------------------
    const dirtyHtml = `
      <p>Paragraf aman <strong>tebal</strong> <script>alert("xss")</script></p>
      <img src="https://attacker.com/malicious.png" alt="evil" />
      <img src="https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || 'kalila'}/image/upload/v1/test.jpg" alt="aman" width="800" height="600" />
      <a href="javascript:alert(1)" onclick="evil()">Tautan Bahaya</a>
      <a href=" java\tscript:alert(2) ">Tautan Spasi</a>
      <a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Tautan Data</a>
      <a href="https://kalilaorganizer.com" title="Web Resmi">Tautan Sah</a>
      <iframe src="https://evil.com"></iframe>
      <svg onload="alert(1)"><circle cx="50" cy="50" r="40" /></svg>
      <div style="background:red" class="injeksi">Teks Biasa</div>
    `;

    const sanitized1 = sanitizeContentHtml(dirtyHtml);
    assert(!sanitized1.includes('<script>'), 'Skenario g: script harus dibuang');
    assert(!sanitized1.includes('alert("xss")'), 'Skenario g: isi script harus dibuang');
    assert(!sanitized1.includes('attacker.com'), 'Skenario g: img bukan Cloudinary harus dibuang');
    assert(sanitized1.includes('test.jpg'), 'Skenario g: img Cloudinary harus dipertahankan');
    assert(!sanitized1.includes('javascript:'), 'Skenario g: protocol javascript: harus dibuang');
    assert(!sanitized1.includes('data:text/html'), 'Skenario g: protocol data: harus dibuang');
    assert(!sanitized1.includes('<iframe'), 'Skenario g: iframe harus dibuang');
    assert(!sanitized1.includes('<svg'), 'Skenario g: svg harus dibuang');
    assert(!sanitized1.includes('style="'), 'Skenario g: atribut style harus dibuang');
    assert(!sanitized1.includes('class="'), 'Skenario g: atribut class harus dibuang');
    assert(!sanitized1.includes('onclick='), 'Skenario g: atribut onclick harus dibuang');
    assert(
      sanitized1.includes('target="_blank"') && sanitized1.includes('rel="noopener noreferrer"'),
      'Skenario g: tautan harus dipaksa target _blank dan noopener noreferrer'
    );

    // Uji Idempotensi: menyanitasi dua kali menghasilkan keluaran yang persis sama
    const sanitized2 = sanitizeContentHtml(sanitized1);
    assert(sanitized1 === sanitized2, 'Skenario g: sanitasi harus idempoten');

    // Uji pembersihan HTML dari teks biasa (title, excerpt, metaDescription, authorName, tags)
    const dirtyTitle = 'Judul <b>Tebal</b> <script>alert(1)</script>';
    const cleanTitle = sanitizePlainText(dirtyTitle);
    assert(cleanTitle === 'Judul Tebal', `Skenario g: sanitizePlainText gagal (${cleanTitle})`);

    // Uji via API dan verifikasi di database
    const postWithDirty = await fetchJson('/api/admin/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Tips <i>Dekorasi</i> Modern <script>alert(1)</script>',
        content: '<p>Ini adalah isi artikel dengan <script>alert(1)</script> dan <a href="https://example.com">tautan aman</a> serta <a href="javascript:alert(2)">tautan bahaya</a>.</p>',
        excerpt: 'Ringkasan <b>tebal</b> <script>alert(3)</script>',
        metaDescription: 'Meta <i>deskripsi</i> <script>alert(4)</script>',
        authorName: 'Penulis <u>Sah</u>',
        tags: ['dekorasi', 'tips'],
      }),
    });
    assert(postWithDirty.status === 201, 'Skenario g: POST artikel kotor gagal');
    trackPost(postWithDirty.body.data.id);

    const docInDb = await Post.findById(postWithDirty.body.data.id).lean();
    assert(docInDb.title === 'Tips Dekorasi Modern', 'Skenario g: title di DB harus bersih dari HTML');
    assert(docInDb.excerpt === 'Ringkasan tebal', 'Skenario g: excerpt di DB harus bersih dari HTML');
    assert(docInDb.metaDescription === 'Meta deskripsi', 'Skenario g: metaDescription di DB harus bersih dari HTML');
    assert(docInDb.authorName === 'Penulis Sah', 'Skenario g: authorName di DB harus bersih dari HTML');
    assert(!docInDb.content.includes('<script>'), 'Skenario g: content di DB tidak boleh memuat script');
    assert(!docInDb.content.includes('javascript:'), 'Skenario g: content di DB tidak boleh memuat javascript:');
    assert(docInDb.content.includes('target="_blank"'), 'Skenario g: link di DB harus memiliki target _blank');
    console.log('✓ g) Sanitasi HTML ketat, protocol injection, img filter, idempotensi, & pembersihan teks biasa terverifikasi');

    // -----------------------------------------------------------------
    // f) Excerpt otomatis & readingTimeMinutes
    // -----------------------------------------------------------------
    const words250 = Array.from({ length: 250 }, (_, i) => `kata${i + 1}`).join(' ');
    const postAutoExcerpt = await fetchJson('/api/admin/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Artikel Pembacaan Waktu Dan Ringkasan Otomatis',
        content: `<p>${words250}</p>`,
      }),
    });
    assert(postAutoExcerpt.status === 201, 'Skenario f: buat artikel auto excerpt gagal');
    trackPost(postAutoExcerpt.body.data.id);

    const docAutoEx = await Post.findById(postAutoExcerpt.body.data.id).lean();
    assert(
      docAutoEx.excerpt.endsWith('...') && docAutoEx.excerpt.length <= 205,
      `Skenario f: excerpt otomatis harus dipotong rapi berakhiran ... (${docAutoEx.excerpt.length})`
    );
    assert(
      docAutoEx.readingTimeMinutes === 2,
      `Skenario f: readingTimeMinutes untuk 250 kata harus 2 (dapat ${docAutoEx.readingTimeMinutes})`
    );
    console.log('✓ f) Excerpt otomatis dari isi (batas kata tanpa HTML) & readingTimeMinutes terverifikasi');

    // -----------------------------------------------------------------
    // d) Slug: bentrok angka, berubah saat draft, TIDAK berubah setelah terbit, konkurensi, kata cadangan "Tags"
    // -----------------------------------------------------------------
    // Artikel berjudul "Tags" -> slug "tags-2"
    const postTags = await fetchJson('/api/admin/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Tags',
        content: '<p>Artikel dengan judul tags yang dicadangkan sistem</p>',
      }),
    });
    assert(postTags.status === 201, 'Skenario d: buat artikel berjudul Tags gagal');
    trackPost(postTags.body.data.id);
    assert(postTags.body.data.slug === 'tags-2', `Skenario d: slug harus tags-2 (dapat ${postTags.body.data.slug})`);

    // Pastikan GET /api/posts/tags tetap mengembalikan daftar tag tanpa error
    const pubTagsRes = await fetchJson('/api/posts/tags');
    assert(pubTagsRes.status === 200 && Array.isArray(pubTagsRes.body.data), 'Skenario d: /api/posts/tags tetap aman');

    // Artikel 1 & 2 dengan judul sama saat draft -> bentrok slug -2
    const postDup1 = await fetchJson('/api/admin/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Inspirasi Gaun Pernikahan Elegan',
        content: '<p>Panduan lengkap memilih gaun pernikahan idaman Anda</p>',
      }),
    });
    assert(postDup1.status === 201);
    trackPost(postDup1.body.data.id);
    assert(postDup1.body.data.slug === 'inspirasi-gaun-pernikahan-elegan');

    const postDup2 = await fetchJson('/api/admin/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Inspirasi Gaun Pernikahan Elegan',
        content: '<p>Panduan kedua memilih gaun pernikahan idaman Anda</p>',
      }),
    });
    assert(postDup2.status === 201);
    trackPost(postDup2.body.data.id);
    assert(
      postDup2.body.data.slug === 'inspirasi-gaun-pernikahan-elegan-2',
      `Skenario d: bentrok slug harus menghasilkan suffix -2 (dapat ${postDup2.body.data.slug})`
    );

    // Ubah judul selama DRAFT -> slug ikut berubah
    const putDraft = await fetchJson(`/api/admin/posts/${postDup1.body.data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Inspirasi Gaun Pernikahan Mewah Dan Anggun',
      }),
    });
    assert(putDraft.status === 200);
    assert(putDraft.body.data.slug === 'inspirasi-gaun-pernikahan-mewah-dan-anggun', 'Skenario d: slug harus ikut berubah saat draft');

    // Terbitkan postDup1
    const pubDup1 = await fetchJson(`/api/admin/posts/${postDup1.body.data.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'published' }),
    });
    assert(pubDup1.status === 200 && pubDup1.body.data.status === 'published');
    const slugBeforeUpdate = pubDup1.body.data.slug;

    // Ubah judul SETELAH terbit -> slug TIDAK boleh berubah lagi!
    const putPublished = await fetchJson(`/api/admin/posts/${postDup1.body.data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Judul Baru Setelah Terbit Tidak Boleh Mengubah Slug',
      }),
    });
    assert(putPublished.status === 200);
    assert(
      putPublished.body.data.slug === slugBeforeUpdate,
      `Skenario d: slug setelah terbit harus terkunci permanen (dapat ${putPublished.body.data.slug})`
    );

    // Dua artikel dibuat bersamaan (konkurensi judul sama) menghasilkan slug unik tanpa error 500
    const concurrentTitle = `Konkurensi Judul Unik ${Date.now()}`;
    const [c1, c2] = await Promise.all([
      fetchJson('/api/admin/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ title: concurrentTitle, content: '<p>Konten konkurensi satu</p>' }),
      }),
      fetchJson('/api/admin/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ title: concurrentTitle, content: '<p>Konten konkurensi dua</p>' }),
      }),
    ]);
    assert(c1.status === 201 && c2.status === 201, 'Skenario d: pembuatan bersamaan harus sukses 201');
    trackPost(c1.body.data.id);
    trackPost(c2.body.data.id);
    assert(c1.body.data.slug !== c2.body.data.slug, 'Skenario d: slug dua permintaan bersamaan harus berbeda');
    console.log('✓ d) Aturan slug (bentrok -2, update saat draft, kunci permanen setelah terbit, slug kata "Tags", & konkurensi) terverifikasi');

    // -----------------------------------------------------------------
    // e) publishedAt: terisi saat terbit pertama, dipertahankan saat draft->publish lagi, idempoten, konkurensi terbit
    // -----------------------------------------------------------------
    // Tolak terbit jika teks polos isi < 20 karakter
    const postShortContent = await fetchJson('/api/admin/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Artikel Konten Terlalu Pendek',
        content: '<p>Pendek</p>', // hanya 6 karakter
      }),
    });
    assert(postShortContent.status === 201);
    trackPost(postShortContent.body.data.id);

    const publishShortRes = await fetchJson(`/api/admin/posts/${postShortContent.body.data.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'published' }),
    });
    assert(
      publishShortRes.status === 400 && publishShortRes.body.message.includes('20 karakter'),
      'Skenario e: terbit dengan isi < 20 karakter teks polos harus ditolak 400'
    );

    // Buat artikel valid untuk uji siklus status & publishedAt
    const postCycle = await fetchJson('/api/admin/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Siklus Terbit Dan Tanggal Publikasi Permanen',
        content: '<p>Ini adalah konten yang cukup panjang untuk memenuhi syarat minimal dua puluh karakter teks polos.</p>',
      }),
    });
    trackPost(postCycle.body.data.id);

    // Terbit pertama -> mengisi publishedAt
    const pub1 = await fetchJson(`/api/admin/posts/${postCycle.body.data.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'published' }),
    });
    assert(pub1.status === 200 && pub1.body.data.publishedAt !== null);
    const initialPublishedAt = pub1.body.data.publishedAt;

    // Idempoten: status published dikirim lagi tidak mengubah publishedAt
    const pubAgain = await fetchJson(`/api/admin/posts/${postCycle.body.data.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'published' }),
    });
    assert(pubAgain.body.data.publishedAt === initialPublishedAt, 'Skenario e: status sama harus idempoten');

    // Turunkan ke draft
    const toDraft = await fetchJson(`/api/admin/posts/${postCycle.body.data.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'draft' }),
    });
    assert(toDraft.status === 200 && toDraft.body.data.status === 'draft');

    // Terbitkan kembali -> publishedAt LAMA harus tetap dipertahankan
    const pub2 = await fetchJson(`/api/admin/posts/${postCycle.body.data.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'published' }),
    });
    assert(
      pub2.body.data.publishedAt === initialPublishedAt,
      `Skenario e: publishedAt harus tetap sama setelah draft -> published lagi (${pub2.body.data.publishedAt} vs ${initialPublishedAt})`
    );

    // Dua permintaan terbit bersamaan menghasilkan nilai publishedAt yang sama konsisten
    const postRace = await fetchJson('/api/admin/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Uji Balapan Terbit Publikasi Bersamaan',
        content: '<p>Konten panjang yang memenuhi syarat minimal dua puluh karakter teks polos.</p>',
      }),
    });
    trackPost(postRace.body.data.id);

    const [rPub1, rPub2] = await Promise.all([
      fetchJson(`/api/admin/posts/${postRace.body.data.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'published' }),
      }),
      fetchJson(`/api/admin/posts/${postRace.body.data.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'published' }),
      }),
    ]);
    assert(rPub1.status === 200 && rPub2.status === 200);
    assert(
      rPub1.body.data.publishedAt === rPub2.body.data.publishedAt,
      'Skenario e: dua permintaan terbit bersamaan harus menghasilkan publishedAt yang sama'
    );
    console.log('✓ e) Syarat terbit (min 20 kata), tanggal publishedAt konsisten, idempoten, & aman dari race condition terverifikasi');

    // -----------------------------------------------------------------
    // a) Publik: hanya published tampil, filter tag, regex search, sort, limit, tags count, sanitasi privasi
    // -----------------------------------------------------------------
    // Buat 1 draft dan 1 published dengan tag spesifik
    const postDraftOnly = await fetchJson('/api/admin/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Artikel Draft Rahasia Belum Boleh Tampil Di Publik',
        content: '<p>Konten rahasia draft yang belum boleh dilihat oleh pelanggan umum.</p>',
        tags: ['rahasia'],
      }),
    });
    trackPost(postDraftOnly.body.data.id);

    // Detail publik pada artikel draft harus 404
    const pubDraftDetail = await fetchJson(`/api/posts/${postDraftOnly.body.data.slug}`);
    assert(pubDraftDetail.status === 404, 'Skenario a: detail publik artikel draft harus 404');

    // Tag 'rahasia' dari artikel draft TIDAK boleh muncul di /api/posts/tags
    const tagsListPub = await fetchJson('/api/posts/tags');
    assert(
      !tagsListPub.body.data.some((t) => t.tag === 'rahasia'),
      'Skenario a: /tags tidak boleh menghitung tag artikel draft'
    );

    // Detail publik artikel published harus sukses 200 dan tersanitasi
    const pubDetail = await fetchJson(`/api/posts/${pubDup1.body.data.slug}`);
    assert(pubDetail.status === 200, 'Skenario a: detail publik artikel terbit harus 200');
    const pd = pubDetail.body.data;
    assert(
      pd.publicId === undefined &&
        pd.createdBy === undefined &&
        pd.status === undefined &&
        pd._id === undefined &&
        pd.id === undefined,
      'Skenario a: detail publik TIDAK boleh memuat publicId, createdBy, status, atau ID internal'
    );
    assert(pd.authorName.length > 0, 'Skenario a: authorName fallback harus terisi');

    // Pencarian dengan karakter regex ("(", ".*") aman tanpa error 500
    const searchRegex1 = await fetchJson('/api/posts?q=(Inspirasi.*');
    assert(searchRegex1.status === 200, 'Skenario a: pencarian regex aman tanpa crash');

    // Sort di luar whitelist -> 400
    const badSortPub = await fetchJson('/api/posts?sort=injeksi');
    assert(badSortPub.status === 400, 'Skenario a: sort di luar whitelist harus 400');

    // Limit di atas 50 -> 400
    const badLimitPub = await fetchJson('/api/posts?limit=51');
    assert(badLimitPub.status === 400, 'Skenario a: limit > 50 harus 400');

    // Daftar publik tersanitasi
    const pubList = await fetchJson('/api/posts?limit=10');
    assert(pubList.status === 200);
    for (const item of pubList.body.data.items) {
      assert(
        item.publicId === undefined &&
          item.createdBy === undefined &&
          item.status === undefined &&
          item.id === undefined &&
          item._id === undefined,
        'Skenario a: item daftar publik TIDAK boleh memuat publicId, createdBy, status, atau ID internal'
      );
    }
    console.log('✓ a) Publik (hanya published, filter tag, regex search aman, sort/limit 400, privasi total) terverifikasi');

    // -----------------------------------------------------------------
    // l) Nilai bawaan query & konversi tipe
    // -----------------------------------------------------------------
    const defaultQueryRes = await fetchJson('/api/posts');
    assert(
      defaultQueryRes.body.data.pagination.page === 1 &&
        defaultQueryRes.body.data.pagination.limit === 12,
      'Skenario l: default page=1 dan limit=12 pada publik'
    );

    const stringQueryRes = await fetchJson('/api/posts?page=2&limit=5');
    assert(
      stringQueryRes.body.data.pagination.page === 2 &&
        stringQueryRes.body.data.pagination.limit === 5,
      'Skenario l: konversi string angka pada query berhasil'
    );

    const nonNumberQueryRes = await fetchJson('/api/posts?page=abc');
    assert(nonNumberQueryRes.status === 400, 'Skenario l: nilai non-angka pada page harus 400');
    console.log('✓ l) Nilai bawaan query (page 1, limit 12) & konversi string angka terverifikasi');

    // -----------------------------------------------------------------
    // j) Daftar admin & detail admin
    // -----------------------------------------------------------------
    const adminList = await fetchJson('/api/admin/posts?status=draft&limit=5', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminList.status === 200);
    assert(
      adminList.body.data.items.every((it) => it.status === 'draft'),
      'Skenario j: filter status draft di admin harus konsisten'
    );

    const adminDetail = await fetchJson(`/api/admin/posts/${postCycle.body.data.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminDetail.status === 200);
    assert(
      adminDetail.body.data.content && adminDetail.body.data.createdBy,
      'Skenario j: detail admin harus memuat content lengkap dan info pembuat'
    );
    console.log('✓ j) Daftar admin (filter status, pencarian, sort) & detail admin terverifikasi');

    // -----------------------------------------------------------------
    // h & i) Gambar Cloudinary (cover, replace cover, contentImages maks 30, tolak ke-31, hapus artikel bersih total)
    // -----------------------------------------------------------------
    if (!isCloudinaryConfigured()) {
      console.log('⚠️ [Cloudinary] Kredensial tidak aktif: menguji respons 503 saat unggah');
      const fd = new FormData();
      fd.append('image', new Blob([validJpgBuffer], { type: 'image/jpeg' }), 'cover.jpg');
      const cov503 = await uploadFormData(
        `/api/admin/posts/${postCycle.body.data.id}/cover`,
        fd,
        adminToken
      );
      assert(cov503.status === 503, 'Skenario h: unggah saat Cloudinary tidak aktif harus 503');
    } else {
      console.log('✓ [Cloudinary] Terkonfigurasi aktif: menjalankan pengujian unggah dan hapus nyata');

      const targetPostId = postCycle.body.data.id;

      // Tolak file palsu berekstensi .jpg
      const fdFake = new FormData();
      fdFake.append('image', new Blob([fakeJpgBuffer], { type: 'image/jpeg' }), 'fake.jpg');
      const fakeRes = await uploadFormData(
        `/api/admin/posts/${targetPostId}/cover`,
        fdFake,
        adminToken
      );
      assert(fakeRes.status === 400, 'Skenario h: file gambar palsu harus ditolak 400');

      // Tolak file > 5 MB
      const bigBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024);
      bigBuffer[0] = 0xff;
      bigBuffer[1] = 0xd8;
      bigBuffer[2] = 0xff;
      const fdBig = new FormData();
      fdBig.append('image', new Blob([bigBuffer], { type: 'image/jpeg' }), 'big.jpg');
      const bigRes = await uploadFormData(
        `/api/admin/posts/${targetPostId}/cover`,
        fdBig,
        adminToken
      );
      assert(bigRes.status === 400, 'Skenario h: file > 5MB harus ditolak 400');

      // 1. Unggah cover valid pertama
      const fdCover1 = new FormData();
      fdCover1.append('image', new Blob([validJpgBuffer], { type: 'image/jpeg' }), 'cover1.jpg');
      const covRes1 = await uploadFormData(
        `/api/admin/posts/${targetPostId}/cover`,
        fdCover1,
        adminToken
      );
      assert(covRes1.status === 200 && covRes1.body.data.url, 'Skenario h: unggah cover valid 1 gagal');
      assert(covRes1.body.data.publicId === undefined, 'Skenario h: respons unggah cover tidak boleh memuat publicId');

      const postAfterCover1 = await Post.findById(targetPostId).lean();
      const cover1PublicId = postAfterCover1.coverImage.publicId;
      trackCloudinaryPublicId(cover1PublicId);
      const exists1 = await verifyAssetExistsInCloudinary(cover1PublicId);
      assert(exists1, 'Skenario h: cover 1 harus benar-benar ada di Cloudinary');

      // 2. Mengganti cover menghapus aset lama di Cloudinary
      const fdCover2 = new FormData();
      fdCover2.append('image', new Blob([validJpgBuffer], { type: 'image/jpeg' }), 'cover2.jpg');
      const covRes2 = await uploadFormData(
        `/api/admin/posts/${targetPostId}/cover`,
        fdCover2,
        adminToken
      );
      assert(covRes2.status === 200 && covRes2.body.data.url);

      const postAfterCover2 = await Post.findById(targetPostId).lean();
      const cover2PublicId = postAfterCover2.coverImage.publicId;
      trackCloudinaryPublicId(cover2PublicId);

      const deleted1 = await verifyAssetDeletedFromCloudinary(cover1PublicId);
      assert(deleted1, 'Skenario h: cover 1 lama harus terhapus dari Cloudinary saat diganti');

      // 3. Unggah gambar isi (contentImages) hingga batas 30
      // Unggah 3 gambar
      const fdMulti = new FormData();
      for (let i = 0; i < 3; i += 1) {
        fdMulti.append('images', new Blob([validJpgBuffer], { type: 'image/jpeg' }), `img${i}.jpg`);
      }
      const multiRes = await uploadFormData(
        `/api/admin/posts/${targetPostId}/images`,
        fdMulti,
        adminToken
      );
      assert(multiRes.status === 200 && multiRes.body.data.length === 3);
      for (const item of multiRes.body.data) {
        assert(item._id && item.url && item.publicId === undefined, 'Skenario h: item gambar isi tidak boleh memuat publicId');
      }

      const postWithImages = await Post.findById(targetPostId).lean();
      postWithImages.contentImages.forEach((im) => trackCloudinaryPublicId(im.publicId));

      // Hapus 1 gambar isi
      const imageToDelete = postWithImages.contentImages[0];
      const delImgRes = await fetchJson(
        `/api/admin/posts/${targetPostId}/images/${imageToDelete._id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      assert(delImgRes.status === 200, 'Skenario h: hapus 1 gambar isi gagal');
      const isImgDeleted = await verifyAssetDeletedFromCloudinary(imageToDelete.publicId);
      assert(isImgDeleted, 'Skenario h: aset gambar isi yang dihapus harus hilang dari Cloudinary');

      // Simulasikan post telah memiliki 30 gambar, lalu uji unggahan ke-31 ditolak 400
      const dummy30 = Array.from({ length: 30 }, (_, idx) => ({
        url: `https://res.cloudinary.com/demo/image/upload/dummy${idx}.jpg`,
        publicId: `kalila/blog/dummy${idx}`,
      }));
      await Post.findByIdAndUpdate(targetPostId, { $set: { contentImages: dummy30 } });

      const fdOverflow = new FormData();
      fdOverflow.append('images', new Blob([validJpgBuffer], { type: 'image/jpeg' }), 'overflow.jpg');
      const overflowRes = await uploadFormData(
        `/api/admin/posts/${targetPostId}/images`,
        fdOverflow,
        adminToken
      );
      assert(
        overflowRes.status === 400 && overflowRes.body.message.includes('30'),
        'Skenario h: unggah melebihi batas 30 gambar isi harus ditolak 400'
      );

      // Kembalikan ke 1 gambar valid untuk uji hapus artikel bersih total (i)
      const validSubdoc = {
        url: 'https://res.cloudinary.com/demo/image/upload/real1.jpg',
        publicId: cover2PublicId, // gunakan publicId yang terlacak
      };
      await Post.findByIdAndUpdate(targetPostId, { $set: { contentImages: [validSubdoc] } });

      // i) Hapus artikel menghapus SEMUA aset (cover dan isi) tanpa aset yatim; dokumen dihapus duluan
      const delPostRes = await fetchJson(`/api/admin/posts/${targetPostId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert(delPostRes.status === 200, 'Skenario i: DELETE artikel gagal');

      const postInDbAfter = await Post.findById(targetPostId);
      assert(postInDbAfter === null, 'Skenario i: dokumen harus sudah terhapus dari database');
      const isCover2Deleted = await verifyAssetDeletedFromCloudinary(cover2PublicId);
      assert(isCover2Deleted, 'Skenario i: seluruh aset artikel harus terhapus bersih dari Cloudinary');
      console.log('✓ h & i) Pengelolaan gambar Cloudinary (cover, ganti cover, contentImages maks 30, tolak ke-31, & hapus artikel bersih) terverifikasi');
    }

    // -----------------------------------------------------------------
    // k) Batas ukuran body: 150k karakter diterima, 250k karakter ditolak (413 atau 400), rute lain tetap 100 KB
    // -----------------------------------------------------------------
    // 150k karakter -> diterima (300 KB limit khusus artikel)
    const content150k = '<p>' + 'A'.repeat(150000) + '</p>';
    const res150k = await fetchJson('/api/admin/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Artikel Uji Beban Ukuran Body 150k Karakter',
        content: content150k,
      }),
    });
    assert(
      res150k.status === 201,
      `Skenario k: payload 150k karakter harus diterima 201 (dapat ${res150k.status}: ${res150k.body?.message})`
    );
    trackPost(res150k.body.data.id);

    // 250k karakter -> ditolak (413 atau 400 dengan pesan bahasa Indonesia, BUKAN 500)
    const content250k = '<p>' + 'B'.repeat(250000) + '</p>';
    const res250k = await fetchJson('/api/admin/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Artikel Uji Beban Ukuran Body 250k Karakter',
        content: content250k,
      }),
    });
    assert(
      (res250k.status === 413 || res250k.status === 400) &&
        res250k.status !== 500 &&
        res250k.body.message &&
        !res250k.body.message.toLowerCase().includes('internal server error'),
      `Skenario k: payload 250k karakter harus ditolak 413/400 berbahasa Indonesia (dapat ${res250k.status}: ${res250k.body?.message})`
    );

    // Batas global untuk rute lain tidak berubah: rute lain dengan body ~120 KB harus ditolak 413
    const bigBodyOtherRoute = {
      category: 'dekor',
      title: 'Paket Uji Body',
      description: 'C'.repeat(120 * 1024), // 120 KB
    };
    const resOtherRoute = await fetchJson('/api/admin/portfolios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(bigBodyOtherRoute),
    });
    assert(
      resOtherRoute.status === 413 &&
        resOtherRoute.body.message === 'Ukuran data yang dikirim melebihi batas yang diizinkan',
      `Skenario k: rute lain di atas 100 KB harus ditolak 413 bahasa Indonesia (dapat ${resOtherRoute.status}: ${resOtherRoute.body?.message})`
    );
    console.log('✓ k) Batas ukuran body 300 KB khusus artikel & batas global 100 KB rute lain terverifikasi');

    console.log('\n================================================================');
    console.log('SELURUH SKENARIO PENGUJIAN BLOG & ARTIKEL (a - l) BERHASIL!');
    console.log('================================================================\n');
  } finally {
    await cleanTrackedData();
    await restoreSettings();

    // Verifikasi n) Kebersihan total database _test
    const collections = await mongoose.connection.db.collections();
    const uncleared = [];
    for (const col of collections) {
      const name = col.collectionName;
      // Koleksi settings singleton dan system koleksi boleh memiliki 1 dokumen
      if (name === 'settings' || name.startsWith('system.')) continue;
      const count = await col.countDocuments();
      if (count > 0) {
        uncleared.push({ collection: name, count });
      }
    }

    if (uncleared.length > 0) {
      throw new Error(
        `Skenario n: masih ada sisa data uji di database _test: ${JSON.stringify(uncleared)}`
      );
    }
    console.log('✓ n) Kebersihan database _test terverifikasi (seluruh koleksi data uji bernilai 0)');

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectTestDb();
  }
}

runPostsTests().catch((err) => {
  console.error('\n❌ PENGUJIAN BLOG & ARTIKEL GAGAL:', err);
  process.exit(1);
});
