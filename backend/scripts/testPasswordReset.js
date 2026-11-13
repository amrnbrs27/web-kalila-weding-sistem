const path = require('path');
const http = require('http');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Inisialisasi environment untuk pengujian
process.env.EMAIL_PROVIDER = 'memory';
process.env.EMAIL_DAILY_LIMIT = '500';
process.env.EMAIL_BATCH_PER_TICK = '5';
delete process.env.EMAIL_REDIRECT_TO;

const originalOtpSecret =
  process.env.OTP_HMAC_SECRET || 'a_very_secure_test_hmac_secret_32_characters_minimum_len';
process.env.OTP_HMAC_SECRET = originalOtpSecret;
process.env.PASSWORD_RESET_OTP_TTL_MINUTES = '10';
process.env.PASSWORD_RESET_MAX_ATTEMPTS = '5';
process.env.PASSWORD_RESET_COOLDOWN_SECONDS = '60';
process.env.PASSWORD_RESET_MAX_PER_HOUR = '5';
process.env.PASSWORD_RESET_ALLOW_ADMIN = 'false';

// Naikkan batas rate limiter selama alur tes reguler agar tidak memblokir uji konkurensi
process.env.RESET_FORGOT_IP_MAX = '100';
process.env.RESET_VERIFY_IP_MAX = '100';
process.env.RESET_VERIFY_EMAIL_MAX = '100';
process.env.RESET_PASSWORD_IP_MAX = '100';

const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Setting = require('../src/models/Setting');
const EmailOutbox = require('../src/models/EmailOutbox');
const PasswordReset = require('../src/models/PasswordReset');

const {
  connectTestDb,
  disconnectTestDb,
  createTestAdmin,
  createTestCustomer,
  backupSettings,
  restoreSettings,
  cleanTrackedData,
  trackUser,
  trackEmail,
  trackPasswordReset,
} = require('./testUtils');

const {
  createMemoryProvider,
} = require('../src/services/email/providers/memoryProvider');
const emailService = require('../src/services/email/emailService');
const {
  setMemoryProviderInstance,
} = emailService;
const passwordResetService = require('../src/services/passwordResetService');
const { processEmailOutbox } = require('../src/jobs/sendEmails');

let server;
let baseUrl;
let memoryProvider;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchJson(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const res = await fetch(url, options);
  const body = await res.json().catch(() => null);
  return { status: res.status, headers: res.headers, body };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPasswordReset(userId, maxWaitMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const doc = await PasswordReset.findOne({ user: userId }).sort({ createdAt: -1 });
    if (doc) return doc;
    await sleep(100);
  }
  return await PasswordReset.findOne({ user: userId }).sort({ createdAt: -1 });
}

async function waitForOutbox(dedupeKey, maxWaitMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const doc = await EmailOutbox.findOne({ dedupeKey });
    if (doc) return doc;
    await sleep(100);
  }
  return await EmailOutbox.findOne({ dedupeKey });
}

function getLatestEmailFor(email) {
  const sent = memoryProvider.getSentEmails();
  const normalized = (email || '').toLowerCase().trim();
  const matching = sent.filter((e) => {
    const to = (e.to || '').toLowerCase().trim();
    return to === normalized;
  });
  return matching[matching.length - 1] || null;
}

// Log interceptor untuk memastikan rahasia tidak bocor (console + stdout/stderr)
const capturedLogs = [];
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const originalStdoutWrite = process.stdout.write;
const originalStderrWrite = process.stderr.write;

function startCapturingLogs() {
  capturedLogs.length = 0;
  console.log = (...args) => {
    capturedLogs.push(args.map(String).join(' '));
    originalConsoleLog(...args);
  };
  console.warn = (...args) => {
    capturedLogs.push(args.map(String).join(' '));
    originalConsoleWarn(...args);
  };
  console.error = (...args) => {
    capturedLogs.push(args.map(String).join(' '));
    originalConsoleError(...args);
  };
  process.stdout.write = function (chunk, ...rest) {
    if (chunk) capturedLogs.push(chunk.toString());
    return originalStdoutWrite.call(process.stdout, chunk, ...rest);
  };
  process.stderr.write = function (chunk, ...rest) {
    if (chunk) capturedLogs.push(chunk.toString());
    return originalStderrWrite.call(process.stderr, chunk, ...rest);
  };
}

function stopCapturingLogs() {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
  process.stdout.write = originalStdoutWrite;
  process.stderr.write = originalStderrWrite;
}

async function runPasswordResetTests() {
  console.log('================================================================');
  console.log('Memulai Pengujian Otomatis Reset Password & OTP Email (PRD 4.1)');
  console.log('================================================================\n');

  startCapturingLogs();

  await connectTestDb();
  await backupSettings();

  // Bersihkan data uji awal agar bebas dari batas harian / sisa data uji lama
  await PasswordReset.deleteMany({});
  await EmailOutbox.deleteMany({});
  await mongoose.connection.collection('slotlocks').deleteMany({});

  // Pastikan indeks PasswordReset terbentuk
  await PasswordReset.createIndexes();
  await EmailOutbox.createIndexes();

  memoryProvider = createMemoryProvider();
  setMemoryProviderInstance(memoryProvider);

  const testPort = 5026;
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(testPort, resolve));
  baseUrl = `http://localhost:${testPort}`;
  console.log(`✓ Server pengujian berjalan di ${baseUrl}\n`);

  try {
    // -----------------------------------------------------------------
    // a) Respons forgot-password IDENTIK untuk semua keadaan
    // -----------------------------------------------------------------
    console.log('--- Menguji Skenario a: Respons forgot-password seragam ---');
    const { user: activeCustomer } = await createTestCustomer();
    const { user: inactiveCustomer } = await createTestCustomer();
    inactiveCustomer.isActive = false;
    await inactiveCustomer.save();

    const { user: adminUser, token: adminToken } = await createTestAdmin();

    const unregisteredEmail = `unregistered.${Date.now()}@kalila-test.com`;

    // 1. Customer aktif
    memoryProvider.clear();
    const resActive = await fetchJson('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: activeCustomer.email }),
    });

    assert(resActive.status === 200, `Forgot password customer aktif harus 200 (dapat ${resActive.status})`);
    assert(
      resActive.body.message === 'Jika email terdaftar, kode OTP telah dikirim.',
      `Pesan customer aktif tidak sesuai: ${resActive.body?.message}`
    );
    assert(
      resActive.body.data?.expiresInMinutes === Number(process.env.PASSWORD_RESET_OTP_TTL_MINUTES || 10) &&
        resActive.body.data?.resendAfterSeconds === Number(process.env.PASSWORD_RESET_COOLDOWN_SECONDS || 60),
      'Data konfigurasi respons customer aktif tidak sesuai'
    );

    // Tunggu proses latar belakang selesai
    const activeResetDoc = await waitForPasswordReset(activeCustomer._id);
    assert(activeResetDoc, 'Dokumen PasswordReset untuk customer aktif harus terbentuk');
    trackPasswordReset(activeResetDoc._id);

    const activeOutbox = await waitForOutbox(`password-reset:${activeResetDoc._id}`);
    assert(activeOutbox, 'Item outbox untuk customer aktif harus ada dengan dedupeKey benar');
    trackEmail(activeOutbox._id);
    assert(activeOutbox.type === 'password_reset_otp', 'Tipe outbox harus password_reset_otp');
    assert(activeOutbox.to === activeCustomer.email.toLowerCase(), 'Penerima outbox harus sesuai');

    // 2. Email tidak terdaftar
    memoryProvider.clear();
    const resUnreg = await fetchJson('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: unregisteredEmail }),
    });
    assert(resUnreg.status === 200, `Forgot password unreg harus 200 (dapat ${resUnreg.status})`);
    assert(
      resUnreg.body.message === resActive.body.message,
      'Pesan respons unreg harus identik dengan customer aktif'
    );
    assert(
      JSON.stringify(resUnreg.body.data) === JSON.stringify(resActive.body.data),
      'Data respons unreg harus identik'
    );
    await sleep(100);
    const unregOutbox = await EmailOutbox.findOne({ to: unregisteredEmail.toLowerCase() });
    assert(!unregOutbox, 'Tidak boleh ada outbox untuk email tidak terdaftar');

    // 3. Customer nonaktif
    memoryProvider.clear();
    const resInactive = await fetchJson('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inactiveCustomer.email }),
    });
    assert(resInactive.status === 200, 'Forgot password nonaktif harus 200');
    assert(resInactive.body.message === resActive.body.message, 'Pesan nonaktif harus identik');
    await sleep(100);
    const inactiveOutbox = await EmailOutbox.findOne({ to: inactiveCustomer.email.toLowerCase() });
    assert(!inactiveOutbox, 'Tidak boleh ada outbox untuk user nonaktif');

    // 4. Admin tanpa izin PASSWORD_RESET_ALLOW_ADMIN
    memoryProvider.clear();
    const resAdmin = await fetchJson('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminUser.email }),
    });
    assert(resAdmin.status === 200, 'Forgot password admin harus 200');
    assert(resAdmin.body.message === resActive.body.message, 'Pesan admin harus identik');
    await sleep(100);
    const adminOutbox = await EmailOutbox.findOne({ to: adminUser.email.toLowerCase() });
    assert(!adminOutbox, 'Tidak boleh ada outbox untuk admin bila ALLOW_ADMIN false');

    // 5. Format email tidak valid -> 400 Bad Request tanpa membocorkan keberadaan akun
    const resInvalidFormat = await fetchJson('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bukan-sebuah-email' }),
    });
    assert(resInvalidFormat.status === 400, 'Format email tidak valid harus 400 dari Zod');
    assert(resInvalidFormat.body.success === false, 'Format email tidak valid harus success: false');

    // 6. Tugas latar belakang gagal tidak menimbulkan unhandled rejection dan proses tetap stabil
    const { user: bgErrCust } = await createTestCustomer();
    const originalTriggerOtp = emailService.triggerPasswordResetOtpEmail;
    emailService.triggerPasswordResetOtpEmail = async () => {
      throw new Error('Simulasi galat latar belakang pengiriman email');
    };
    const resBgErr = await fetchJson('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: bgErrCust.email }),
    });
    assert(resBgErr.status === 200, 'Forgot password tetap mengembalikan 200 meskipun latar belakang galat');
    await sleep(150);
    emailService.triggerPasswordResetOtpEmail = originalTriggerOtp; // Kembalikan fungsi asli

    console.log('✓ a) Respons forgot-password identik untuk seluruh status akun dan outbox hanya terbuat untuk akun berhak\n');

    // -----------------------------------------------------------------
    // b) Validitas OTP, Kriptografi & Privasi Email
    // -----------------------------------------------------------------
    console.log('--- Menguji Skenario b: Validitas OTP, Kriptografi & Privasi Email ---');
    memoryProvider.clear();
    const { user: custB } = await createTestCustomer();
    const reqB = await passwordResetService.requestPasswordReset(custB.email);
    trackPasswordReset(reqB.passwordResetId);

    const sentEmails = memoryProvider.getSentEmails();
    assert(sentEmails.length >= 1, 'Harus ada email terkirim di memoryProvider');
    const otpEmail = sentEmails[sentEmails.length - 1];

    // Cek subject
    assert(
      otpEmail.subject === 'Kode OTP reset password',
      `Subject harus statis "Kode OTP reset password" (dapat: ${otpEmail.subject})`
    );

    // Ambil 6 digit OTP dari teks email
    const otpMatch = otpEmail.text.match(/\b\d{6}\b/);
    assert(otpMatch, 'Email harus memuat 6 digit kode OTP');
    const capturedOtp = otpMatch[0];

    // Pastikan di database hanya tersimpan hash, bukan teks OTP
    const resetInDb = await PasswordReset.findById(reqB.passwordResetId).lean();
    assert(resetInDb.otpHash && resetInDb.otpHash.length === 64, 'otpHash di database harus berupa 64-hex SHA256');
    assert(!resetInDb.otp, 'Field plain otp tidak boleh ada di dokumen PasswordReset');

    // Cek isi email memuat masa berlaku & peringatan
    assert(otpEmail.html.includes('10 menit') || otpEmail.text.includes('10 menit'), 'Email harus memuat masa berlaku 10 menit');
    assert(
      otpEmail.html.includes('Jangan bagikan kode OTP') || otpEmail.text.includes('Jangan bagikan kode OTP'),
      'Email harus memuat peringatan kerahasiaan'
    );
    assert(
      otpEmail.html.includes('Jika Anda tidak memintanya, abaikan email ini') ||
        otpEmail.text.includes('Jika Anda tidak memintanya, abaikan email ini'),
      'Email harus memuat kalimat abaikan bila tidak meminta'
    );

    // Pastikan tidak ada link / anchor tag pada HTML
    assert(!/<a\s/i.test(otpEmail.html), 'Email OTP tidak boleh memuat link (<a href>)');

    // Cek XSS escaping pada nama pengguna
    const { user: xssCustomer } = await createTestCustomer();
    xssCustomer.name = 'Budi <script>alert("xss")</script>';
    await xssCustomer.save();
    memoryProvider.clear();

    await passwordResetService.requestPasswordReset(xssCustomer.email);
    const xssSent = memoryProvider.getSentEmails();
    assert(xssSent.length > 0, 'Email XSS user harus terkirim');
    assert(
      !xssSent[0].html.includes('<script>'),
      'Tag <script> pada nama wajib di-escape di email HTML'
    );
    assert(
      xssSent[0].html.includes('&lt;script&gt;'),
      'Karakter HTML pada nama harus ter-escape menjadi entity'
    );

    console.log('✓ b) OTP 6 digit ber-hash, privasi subject, proteksi XSS nama, dan tidak ada link terverifikasi\n');

    // -----------------------------------------------------------------
    // c) Cooldown & Batas Per Jam
    // -----------------------------------------------------------------
    console.log('--- Menguji Skenario c: Cooldown & Batas Per Jam ---');
    const { user: cooldownCust } = await createTestCustomer();

    // Permintaan 1 -> sukses
    const req1 = await passwordResetService.requestPasswordReset(cooldownCust.email);
    assert(req1.enqueued, 'Permintaan 1 harus meng-enqueue email');
    trackPasswordReset(req1.passwordResetId);

    // Permintaan 2 seketika (cooldown < 60 detik) -> tidak meng-enqueue baru
    const req2 = await passwordResetService.requestPasswordReset(cooldownCust.email);
    assert(!req2.enqueued && req2.reason === 'cooldown', 'Permintaan 2 dalam 60 detik harus tertahan cooldown');

    // Simulasikan waktu cooldown telah berlalu (mundurkan createdAt 65 detik lalu via raw collection agar bypass Mongoose immutable)
    await PasswordReset.collection.updateOne(
      { _id: req1.passwordResetId },
      { $set: { createdAt: new Date(Date.now() - 65 * 1000) } }
    );
    await User.collection.updateOne(
      { _id: cooldownCust._id },
      { $set: { lastPasswordResetRequestAt: new Date(Date.now() - 65 * 1000) } }
    );

    // Permintaan 3 -> sukses membuat OTP baru dan OTP lama di-invalidate
    const req3 = await passwordResetService.requestPasswordReset(cooldownCust.email);
    assert(
      req3.enqueued,
      `Permintaan 3 setelah cooldown harus meng-enqueue OTP baru (dapat: enqueued=${req3.enqueued}, reason=${req3.reason})`
    );
    trackPasswordReset(req3.passwordResetId);

    const oldReset = await PasswordReset.findById(req1.passwordResetId);
    assert(oldReset.invalidatedAt, 'OTP lama harus ditandai invalidatedAt saat OTP baru dibuat');

    // Pengujian batas per jam (misal kita buat 3 record dalam 1 jam terakhir)
    process.env.PASSWORD_RESET_MAX_PER_HOUR = '3';
    const { user: limitCust } = await createTestCustomer();

    // Buat 3 permintaan dengan memundurkan waktu createdAt agar lolos cooldown
    for (let i = 0; i < 3; i++) {
      const r = await passwordResetService.requestPasswordReset(limitCust.email);
      assert(r.enqueued, `Permintaan limit ke-${i + 1} harus enqueued`);
      trackPasswordReset(r.passwordResetId);
      await PasswordReset.collection.updateOne(
        { _id: r.passwordResetId },
        { $set: { createdAt: new Date(Date.now() - (70 * (3 - i)) * 1000) } }
      );
      await User.collection.updateOne(
        { _id: limitCust._id },
        { $set: { lastPasswordResetRequestAt: new Date(Date.now() - (70 * (3 - i)) * 1000) } }
      );
    }

    // Permintaan ke-4 dalam 1 jam harus tertahan hourly_limit
    const req4 = await passwordResetService.requestPasswordReset(limitCust.email);
    assert(!req4.enqueued && req4.reason === 'hourly_limit', 'Permintaan ke-4 harus tertahan batas per jam');
    process.env.PASSWORD_RESET_MAX_PER_HOUR = '5'; // Kembalikan

    // Uji 10 permintaan forgot-password paralel untuk email yang sama (cooldown tidak bisa dilewati via paralelisme)
    const { user: parallelCust } = await createTestCustomer();
    memoryProvider.clear();
    const parallelResponses = await Promise.all(
      Array.from({ length: 10 }).map(() =>
        fetchJson('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: parallelCust.email }),
        })
      )
    );
    for (const res of parallelResponses) {
      assert(res.status === 200, 'Seluruh respons paralel forgot-password harus 200');
      assert(
        res.body.message === 'Jika email terdaftar, kode OTP telah dikirim.',
        'Pesan respons paralel harus identik'
      );
      assert(
        res.body.data?.expiresInMinutes === Number(process.env.PASSWORD_RESET_OTP_TTL_MINUTES || 10),
        'Data expiresInMinutes harus sesuai konfigurasi'
      );
    }
    await sleep(400);
    const activeResets = await PasswordReset.find({
      user: parallelCust._id,
      invalidatedAt: null,
    });
    assert(
      activeResets.length <= 1,
      `Harus paling banyak 1 PasswordReset aktif (dapat: ${activeResets.length})`
    );
    for (const r of activeResets) trackPasswordReset(r._id);

    const outboxItems = await EmailOutbox.find({
      to: parallelCust.email.toLowerCase(),
    });
    assert(
      outboxItems.length <= 1,
      `Harus paling banyak 1 outbox terkirim untuk permintaan paralel (dapat: ${outboxItems.length})`
    );
    for (const ob of outboxItems) trackEmail(ob._id);

    console.log('✓ c) Cooldown 60 detik dan penegakan batas per jam di level database terverifikasi\n');

    // -----------------------------------------------------------------
    // d) Verifikasi OTP (Benar, Salah, Batas Percobaan, Kedaluwarsa, Single-use)
    // -----------------------------------------------------------------
    console.log('--- Menguji Skenario d: Verifikasi OTP ---');
    const { user: verifyCust } = await createTestCustomer();
    memoryProvider.clear();

    const reqV = await passwordResetService.requestPasswordReset(verifyCust.email);
    trackPasswordReset(reqV.passwordResetId);

    const emailV = getLatestEmailFor(verifyCust.email);
    assert(emailV, 'Email untuk verifyCust harus ada');
    const otpV = emailV.text.match(/\b\d{6}\b/)[0];

    // 1. Format OTP salah (bukan 6 digit) -> 400
    const resBadOtp = await fetchJson('/api/auth/verify-reset-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verifyCust.email, otp: '12345' }),
    });
    assert(resBadOtp.status === 400, 'OTP kurang dari 6 digit harus 400');

    // 2. Email tidak terdaftar -> 400 identik
    const resUnregOtp = await fetchJson('/api/auth/verify-reset-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'unregistered@test.com', otp: '123456' }),
    });
    assert(resUnregOtp.status === 400, 'Verifikasi email tidak terdaftar harus 400');
    assert(
      resUnregOtp.body.message === 'Kode OTP salah atau sudah kedaluwarsa.',
      'Pesan verifikasi email unreg harus identik'
    );

    // 3. OTP Salah -> 400 identik & otpAttempts bertambah
    const wrongOtp = otpV === '111111' ? '222222' : '111111';
    const resWrong = await fetchJson('/api/auth/verify-reset-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verifyCust.email, otp: wrongOtp }),
    });
    assert(resWrong.status === 400, 'OTP salah harus 400');
    assert(resWrong.body.message === 'Kode OTP salah atau sudah kedaluwarsa.', 'Pesan OTP salah harus identik');

    const docAfterWrong = await PasswordReset.findById(reqV.passwordResetId);
    assert(docAfterWrong.otpAttempts === 1, 'otpAttempts harus bertambah menjadi 1');

    // 4. Batas maksimal percobaan (5 kali)
    await PasswordReset.updateOne({ _id: reqV.passwordResetId }, { $set: { otpAttempts: 4 } });
    const resFifthWrong = await fetchJson('/api/auth/verify-reset-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verifyCust.email, otp: wrongOtp }),
    });
    assert(resFifthWrong.status === 400, 'Percobaan ke-5 salah harus 400');

    const docLocked = await PasswordReset.findById(reqV.passwordResetId);
    assert(docLocked.invalidatedAt !== null, 'Dokumen harus di-invalidate setelah percobaan ke-5');

    // Coba dengan OTP yang BENAR setelah locked -> tetap ditolak 400
    const resTryCorrectAfterLock = await fetchJson('/api/auth/verify-reset-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verifyCust.email, otp: otpV }),
    });
    assert(resTryCorrectAfterLock.status === 400, 'OTP benar setelah batas percobaan habis wajib ditolak');

    // 5. OTP Kedaluwarsa
    const { user: expCust } = await createTestCustomer();
    const reqExp = await passwordResetService.requestPasswordReset(expCust.email);
    trackPasswordReset(reqExp.passwordResetId);
    const emailExp = getLatestEmailFor(expCust.email);
    assert(emailExp, 'Email untuk expCust harus ada');
    const otpExp = emailExp.text.match(/\b\d{6}\b/)[0];

    // Set otpExpiresAt ke masa lalu
    await PasswordReset.updateOne(
      { _id: reqExp.passwordResetId },
      { $set: { otpExpiresAt: new Date(Date.now() - 1000) } }
    );
    const resExpired = await fetchJson('/api/auth/verify-reset-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: expCust.email, otp: otpExp }),
    });
    assert(resExpired.status === 400, 'OTP kedaluwarsa harus 400');

    // 6. Verifikasi OTP Benar -> menghasilkan resetToken
    const { user: goodCust, rawPassword: goodCustRawPassword } = await createTestCustomer();
    const reqGood = await passwordResetService.requestPasswordReset(goodCust.email);
    assert(reqGood.enqueued, `reqGood harus enqueued (reason: ${reqGood.reason})`);
    trackPasswordReset(reqGood.passwordResetId);
    const emailGood = getLatestEmailFor(goodCust.email);
    assert(emailGood, 'Email untuk goodCust harus ada');
    const otpGood = emailGood.text.match(/\b\d{6}\b/)[0];

    const resGood = await fetchJson('/api/auth/verify-reset-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: goodCust.email, otp: otpGood }),
    });
    assert(
      resGood.status === 200,
      `Verifikasi OTP benar harus 200 (dapat ${resGood.status}: ${JSON.stringify(resGood.body)})`
    );
    assert(resGood.body.data?.resetToken, 'Respons harus memuat resetToken');
    const resetToken = resGood.body.data.resetToken;

    // 7. OTP tidak bisa dipakai dua kali
    const resGoodTwice = await fetchJson('/api/auth/verify-reset-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: goodCust.email, otp: otpGood }),
    });
    assert(resGoodTwice.status === 400, 'OTP yang sudah diverifikasi tidak boleh dapat diverifikasi ulang');

    // 8. Pemesanan jatah atomik: 30 tebakan salah paralel pada satu OTP aktif
    const { user: bruteCust } = await createTestCustomer();
    const reqBrute = await passwordResetService.requestPasswordReset(bruteCust.email);
    trackPasswordReset(reqBrute.passwordResetId);
    const emailBrute = getLatestEmailFor(bruteCust.email);
    const otpBrute = emailBrute.text.match(/\b\d{6}\b/)[0];

    const wrong30Promises = Array.from({ length: 30 }).map((_, idx) =>
      fetchJson('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: bruteCust.email, otp: String(900000 + idx) }),
      })
    );
    const results30 = await Promise.all(wrong30Promises);
    for (const r of results30) {
      assert(r.status === 400, `Setiap tebakan salah paralel harus 400 (dapat: ${r.status})`);
      assert(
        r.body.message === 'Kode OTP salah atau sudah kedaluwarsa.',
        'Pesan tebakan salah paralel harus identik'
      );
    }
    const docBrute = await PasswordReset.findById(reqBrute.passwordResetId);
    assert(
      docBrute.otpAttempts <= Number(process.env.PASSWORD_RESET_MAX_ATTEMPTS || 5),
      `Jumlah percobaan di database tidak boleh melebihi batas (dapat: ${docBrute.otpAttempts})`
    );

    // Tebakan benar setelah batas percobaan habis tetap ditolak 400
    const resCorrectAfterExhausted = await fetchJson('/api/auth/verify-reset-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: bruteCust.email, otp: otpBrute }),
    });
    assert(
      resCorrectAfterExhausted.status === 400,
      'OTP benar setelah jatah habis wajib ditolak 400'
    );

    // 9. Tebakan benar dikirim bersamaan dengan 29 tebakan salah (total 30 permintaan paralel)
    const { user: raceCust } = await createTestCustomer();
    const reqRace = await passwordResetService.requestPasswordReset(raceCust.email);
    trackPasswordReset(reqRace.passwordResetId);
    const emailRace = getLatestEmailFor(raceCust.email);
    const otpRace = emailRace.text.match(/\b\d{6}\b/)[0];

    const raceCalls = [
      fetchJson('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: raceCust.email, otp: otpRace }),
      }),
      ...Array.from({ length: 29 }).map((_, idx) =>
        fetchJson('/api/auth/verify-reset-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: raceCust.email, otp: String(800000 + idx) }),
        })
      ),
    ];
    raceCalls.sort(() => Math.random() - 0.5);

    const raceResults = await Promise.all(raceCalls);
    const successes = raceResults.filter((r) => r.status === 200);
    const failures = raceResults.filter((r) => r.status === 400);

    assert(
      successes.length <= 1,
      `Paling banyak 1 tebakan benar yang berhasil saat balapan (dapat: ${successes.length})`
    );
    assert(
      successes.length + failures.length === 30,
      'Semua permintaan harus mendapat respons 200 atau 400 tanpa error 500'
    );
    for (const r of raceResults) {
      assert(r.status !== 500, 'Tidak boleh ada error 500 saat race condition verifikasi');
    }

    console.log('✓ d) Verifikasi OTP benar, salah, kedaluwarsa, single-use, lockout, dan pemesanan jatah atomik terverifikasi\n');

    // -----------------------------------------------------------------
    // e) Reset Password, Login Baru/Lama, Invalidation JWT Lama & Kebijakan
    // -----------------------------------------------------------------
    console.log('--- Menguji Skenario e: Reset Password & Penegakan Kebijakan ---');
    // Login terlebih dahulu untuk mendapatkan JWT token lama
    const oldLoginRes = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: goodCust.email, password: goodCustRawPassword }),
    });
    assert(oldLoginRes.status === 200, 'Login lama harus berhasil');
    const oldJwtToken = oldLoginRes.body.data.token;

    // Verifikasi token JWT lama berfungsi pada /me
    const meResBefore = await fetchJson('/api/auth/me', {
      headers: { Authorization: `Bearer ${oldJwtToken}` },
    });
    assert(meResBefore.status === 200, '/me dengan token lama sebelum ganti password harus 200');

    // 1. Password melanggar kebijakan: kurang dari 8 karakter -> 400 dan token TIDAK terpakai
    const resWeak = await fetchJson('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, newPassword: 'pendek' }),
    });
    assert(resWeak.status === 400, 'Password pendek harus ditolak 400');

    // 2. Password tidak ada angka -> 400
    const resNoNum = await fetchJson('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, newPassword: 'hanyahurufaja' }),
    });
    assert(resNoNum.status === 400, 'Password tanpa angka harus ditolak 400');

    // 3. Password sama dengan email -> 400
    const resSameEmail = await fetchJson('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, newPassword: goodCust.email }),
    });
    assert(resSameEmail.status === 400, 'Password sama dengan email harus ditolak 400');

    // 4. Password sama dengan password lama -> 400
    const resSameOld = await fetchJson('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, newPassword: goodCustRawPassword }),
    });
    assert(resSameOld.status === 400, 'Password sama dengan password lama harus ditolak 400');

    // Pastikan token reset MASIH BISA digunakan setelah kegagalan kebijakan di atas
    const newPasswordValid = 'PasswordBaruKalila123!';
    const resResetSuccess = await fetchJson('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, newPassword: newPasswordValid }),
    });
    assert(
      resResetSuccess.status === 200,
      `Reset password dengan token valid harus 200 (dapat ${resResetSuccess.status}: ${JSON.stringify(resResetSuccess.body)})`
    );
    assert(
      resResetSuccess.body.message === 'Password berhasil diubah. Silakan masuk dengan password baru.',
      'Pesan sukses reset password harus sesuai'
    );
    assert(!resResetSuccess.body.data?.token, 'Respons reset password TIDAK boleh menyertakan token login');

    // 5. Coba pakai token reset sekali lagi -> 400
    const resResetReuse = await fetchJson('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, newPassword: 'AnotherPassword123!' }),
    });
    assert(resResetReuse.status === 400, 'Token reset yang sudah digunakan wajib ditolak 400');

    // 6. Login dengan password lama harus GAGAL (401)
    const loginOldFail = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: goodCust.email, password: goodCustRawPassword }),
    });
    assert(loginOldFail.status === 401, 'Login dengan password lama harus 401');

    // 7. Login dengan password baru harus SUKSES (200)
    const loginNewSuccess = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: goodCust.email, password: newPasswordValid }),
    });
    assert(loginNewSuccess.status === 200, 'Login dengan password baru harus 200');

    // 8. Token login JWT lama harus DITOLAK (401) karena passwordChangedAt
    const meResAfter = await fetchJson('/api/auth/me', {
      headers: { Authorization: `Bearer ${oldJwtToken}` },
    });
    assert(
      meResAfter.status === 401,
      `Token JWT lama harus otomatis ditolak 401 setelah ganti password (dapat ${meResAfter.status})`
    );

    console.log('✓ e) Reset password berhasil, login baru sukses, token login lama tertolak 401, dan token reset sekali pakai terverifikasi\n');

    // -----------------------------------------------------------------
    // f) Konkurensi: 2 Reset Password Bersamaan (Ulangi 5x) & 2 Verifikasi Bersamaan
    // -----------------------------------------------------------------
    console.log('--- Menguji Skenario f: Uji Konkurensi (5 Kali Iterasi) ---');
    for (let iter = 1; iter <= 5; iter++) {
      const { user: concCust } = await createTestCustomer();
      const reqConc = await passwordResetService.requestPasswordReset(concCust.email);
      trackPasswordReset(reqConc.passwordResetId);

      const emailConc = getLatestEmailFor(concCust.email);
      assert(emailConc, 'Email concCust harus ada');
      const otpConc = emailConc.text.match(/\b\d{6}\b/)[0];

      // Verifikasi untuk dapat token
      const verConc = await passwordResetService.verifyResetOtp(concCust.email, otpConc);
      const cToken = verConc.resetToken;

      // Jalankan 2 reset-password secara paralel bersamaan
      const [r1, r2] = await Promise.all([
        fetchJson('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resetToken: cToken, newPassword: `ConcPass${iter}123!` }),
        }),
        fetchJson('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resetToken: cToken, newPassword: `ConcPass${iter}123!` }),
        }),
      ]);

      const statuses = [r1.status, r2.status].sort();
      assert(
        statuses[0] === 200 && statuses[1] === 400,
        `Iterasi konkurensi ${iter}: harus tepat satu 200 dan satu 400 (dapat: ${r1.status} dan ${r2.status})`
      );
    }
    console.log('✓ f.1) 5 iterasi konkurensi reset-password bersamaan terverifikasi (tepat satu berhasil)');

    // Konkurensi dua verifikasi OTP bersamaan
    const { user: concOtpCust } = await createTestCustomer();
    const reqCOtp = await passwordResetService.requestPasswordReset(concOtpCust.email);
    trackPasswordReset(reqCOtp.passwordResetId);
    const emailCOtp = getLatestEmailFor(concOtpCust.email);
    assert(emailCOtp, 'Email concOtpCust harus ada');
    const otpCOtp = emailCOtp.text.match(/\b\d{6}\b/)[0];

    const [v1, v2] = await Promise.all([
      fetchJson('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: concOtpCust.email, otp: otpCOtp }),
      }),
      fetchJson('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: concOtpCust.email, otp: otpCOtp }),
      }),
    ]);
    const vStatuses = [v1.status, v2.status].sort();
    assert(
      vStatuses[0] === 200 && vStatuses[1] === 400,
      `Konkurensi verifikasi OTP: harus tepat satu 200 dan satu 400 (dapat: ${v1.status} dan ${v2.status})`
    );
    console.log('✓ f.2) Konkurensi verifikasi OTP bersamaan terverifikasi (tepat satu menghasilkan token)\n');

    // -----------------------------------------------------------------
    // g) Akun Nonaktif Setelah Verifikasi & Admin Dengan / Tanpa Flag
    // -----------------------------------------------------------------
    console.log('--- Menguji Skenario g: Akun Nonaktif & Izin Admin ---');
    const { user: deactCust } = await createTestCustomer();
    const reqDeact = await passwordResetService.requestPasswordReset(deactCust.email);
    trackPasswordReset(reqDeact.passwordResetId);
    const emailDeact = getLatestEmailFor(deactCust.email);
    assert(emailDeact, 'Email deactCust harus ada');
    const otpDeact = emailDeact.text.match(/\b\d{6}\b/)[0];

    const verDeact = await passwordResetService.verifyResetOtp(deactCust.email, otpDeact);
    const deactToken = verDeact.resetToken;

    // Nonaktifkan akun pelanggan di antara langkah 2 dan 3
    deactCust.isActive = false;
    await deactCust.save();

    const resResetDeact = await fetchJson('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken: deactToken, newPassword: 'DeactivatedUser123!' }),
    });
    assert(resResetDeact.status === 400, 'Akun nonaktif saat reset password wajib ditolak 400');
    assert(
      resResetDeact.body.message === 'Token reset tidak valid atau sudah kedaluwarsa.',
      'Pesan penolakan akun nonaktif harus identik dengan token tidak valid'
    );

    // Admin dengan PASSWORD_RESET_ALLOW_ADMIN = "true"
    process.env.PASSWORD_RESET_ALLOW_ADMIN = 'true';
    const { user: adminWithFlag } = await createTestAdmin();
    memoryProvider.clear();

    const reqAdminAllow = await passwordResetService.requestPasswordReset(adminWithFlag.email);
    assert(reqAdminAllow.enqueued, 'Admin harus menerima OTP jika ALLOW_ADMIN true');
    trackPasswordReset(reqAdminAllow.passwordResetId);

    const emailAdmin = getLatestEmailFor(adminWithFlag.email);
    assert(emailAdmin, 'Email adminWithFlag harus ada');
    const otpAdmin = emailAdmin.text.match(/\b\d{6}\b/)[0];

    const verAdmin = await passwordResetService.verifyResetOtp(adminWithFlag.email, otpAdmin);
    assert(verAdmin.resetToken, 'Admin harus berhasil verifikasi OTP saat ALLOW_ADMIN true');

    const resAdminReset = await fetchJson('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken: verAdmin.resetToken, newPassword: 'NewAdminPassword123!' }),
    });
    assert(resAdminReset.status === 200, 'Admin harus berhasil reset password saat ALLOW_ADMIN true');
    process.env.PASSWORD_RESET_ALLOW_ADMIN = 'false'; // Kembalikan default

    console.log('✓ g) Akun nonaktif di antara langkah 2 dan 3 ditolak, dan admin dengan ALLOW_ADMIN terverifikasi\n');

    // -----------------------------------------------------------------
    // h) Prioritas Antrean Email, notAfter Expired & Redaksi Privasi
    // -----------------------------------------------------------------
    console.log('--- Menguji Skenario h: Prioritas Email, notAfter & Redaksi Privasi ---');
    // 1. Prioritas: item priority 0 diproses sebelum priority 1
    const dummyBookingId = new mongoose.Types.ObjectId();
    const regularEmail = await EmailOutbox.create({
      type: 'booking_created_admin',
      dedupeKey: `test-priority-reg-${Date.now()}`,
      booking: dummyBookingId,
      to: 'admin@kalila-test.com',
      subject: 'Pesanan Baru Reguler',
      html: '<p>Regular</p>',
      text: 'Regular',
      priority: 1,
      createdAt: new Date(Date.now() - 5000), // Lebih lama
    });
    trackEmail(regularEmail._id);

    const otpEmailDoc = await EmailOutbox.create({
      type: 'password_reset_otp',
      dedupeKey: `test-priority-otp-${Date.now()}`,
      to: 'customer@kalila-test.com',
      subject: 'Kode OTP reset password',
      html: '<p>123456</p>',
      text: '123456',
      priority: 0,
      createdAt: new Date(), // Lebih baru
    });
    trackEmail(otpEmailDoc._id);

    memoryProvider.clear();
    // Proses batch ukuran 1
    process.env.EMAIL_BATCH_PER_TICK = '1';
    await processEmailOutbox();
    process.env.EMAIL_BATCH_PER_TICK = '5';

    const firstSent = memoryProvider.getSentEmails();
    assert(firstSent.length === 1, 'Tepat 1 email harus terkirim');
    assert(firstSent[0].subject === 'Kode OTP reset password', 'Item priority 0 (OTP) harus diproses lebih dahulu');

    // 2. notAfter expired menjadi skipped
    const expiredOtpEmail = await EmailOutbox.create({
      type: 'password_reset_otp',
      dedupeKey: `test-notafter-exp-${Date.now()}`,
      to: 'expired@kalila-test.com',
      subject: 'Kode OTP reset password',
      html: '<p>999999</p>',
      text: '999999',
      priority: 0,
      notAfter: new Date(Date.now() - 10000), // Kedaluwarsa
      status: 'pending',
    });
    trackEmail(expiredOtpEmail._id);

    await processEmailOutbox();
    const checkedExp = await EmailOutbox.findById(expiredOtpEmail._id);
    assert(checkedExp.status === 'skipped', 'Item dengan notAfter lewat harus menjadi skipped');
    assert(checkedExp.lastError === 'Kedaluwarsa sebelum terkirim', 'lastError harus sesuai');

    // 3. Privasi: setelah status akhir, html & text dikosongkan dan purgeAt = +1 hari
    const checkedOtpSent = await EmailOutbox.findById(otpEmailDoc._id);
    assert(checkedOtpSent.status === 'sent', 'OTP email harus sent');
    assert(checkedOtpSent.html === '' && checkedOtpSent.text === '', 'Field html dan text pada OTP email wajib dikosongkan setelah status sent');
    const expectedPurgeTime = checkedOtpSent.sentAt.getTime() + 24 * 60 * 60 * 1000;
    assert(
      Math.abs(checkedOtpSent.purgeAt.getTime() - expectedPurgeTime) < 5000,
      'purgeAt pada OTP email harus +1 hari'
    );

    // 4. Admin email endpoint tidak menampilkan konten OTP
    const resAdminEmails = await fetchJson('/api/admin/emails', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(resAdminEmails.status === 200, 'GET /api/admin/emails harus 200');

    const resAdminEmailDetail = await fetchJson(`/api/admin/emails/${otpEmailDoc._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(resAdminEmailDetail.status === 200, 'GET /api/admin/emails/:id harus 200');
    assert(resAdminEmailDetail.body.data.text === null, 'Endpoint detail email admin TIDAK boleh menampilkan text untuk tipe OTP');

    // 5. Pengiriman segera: kegagalan sementara meninggalkan item 'pending' untuk diulang job
    const { user: retryCust } = await createTestCustomer();
    const mockRetryProvider = {
      name: 'mock_retry',
      sendEmail: async () => ({
        success: false,
        retryable: true,
        error: 'Simulasi kegagalan sementara jaringan',
      }),
    };
    const prevProv = memoryProvider;
    setMemoryProviderInstance(mockRetryProvider);

    const reqRetry = await passwordResetService.requestPasswordReset(retryCust.email);
    trackPasswordReset(reqRetry.passwordResetId);

    const pendingOutbox = await EmailOutbox.findOne({ dedupeKey: `password-reset:${reqRetry.passwordResetId}` });
    assert(pendingOutbox, 'Outbox retry harus terbuat');
    trackEmail(pendingOutbox._id);
    assert(
      pendingOutbox.status === 'pending',
      `Item harus tetap 'pending' saat terjadi kegagalan sementara (dapat: ${pendingOutbox.status})`
    );
    assert(pendingOutbox.attempts === 1, 'attempts harus tercatat 1');
    assert(pendingOutbox.nextAttemptAt instanceof Date, 'nextAttemptAt harus terisi backoff');

    // Kembalikan memory provider asli
    setMemoryProviderInstance(prevProv);

    console.log('✓ h) Prioritas antrean, notAfter, pengosongan konten OTP, dan proteksi admin emails terverifikasi\n');

    // -----------------------------------------------------------------
    // i) Rate Limiting (IP & Email Hash Key)
    // -----------------------------------------------------------------
    console.log('--- Menguji Skenario i: Rate Limiting ---');
    // 1. Uji verifyEmailRateLimiter: batas per kunci email pada verify
    process.env.RESET_VERIFY_EMAIL_MAX = '3';
    const targetEmailRate = `ratelimit.${Date.now()}@kalila-test.com`;
    let gotEmail429 = false;
    for (let i = 0; i < 6; i++) {
      const res = await fetchJson('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmailRate, otp: '123456' }),
      });
      if (res.status === 429) {
        gotEmail429 = true;
        assert(
          res.body.message.includes('Terlalu banyak percobaan verifikasi kode OTP untuk email ini'),
          `Pesan 429 kunci email harus berbahasa Indonesia (dapat: ${res.body.message})`
        );
        break;
      }
    }
    assert(gotEmail429, 'Rate limit per email key pada verify-reset-otp harus memicu HTTP 429');

    // 2. Uji forgotIpRateLimiter: batas IP pada forgot-password (gunakan nilai kecil)
    process.env.RESET_FORGOT_IP_MAX = '1';
    let gotForgotIp429 = false;
    for (let i = 0; i < 5; i++) {
      const res = await fetchJson('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `iprate.${Date.now()}.${i}@kalila-test.com` }),
      });
      if (res.status === 429) {
        gotForgotIp429 = true;
        assert(
          res.body.message.includes('Terlalu banyak permintaan reset password dari alamat IP ini'),
          `Pesan 429 forgot IP harus berbahasa Indonesia (dapat: ${res.body.message})`
        );
        break;
      }
    }
    assert(gotForgotIp429, 'Batas IP pada forgot-password harus memicu HTTP 429');

    // Kembalikan batas rate limit
    process.env.RESET_FORGOT_IP_MAX = '100';
    process.env.RESET_VERIFY_EMAIL_MAX = '100';
    process.env.RESET_VERIFY_IP_MAX = '100';
    process.env.RESET_PASSWORD_IP_MAX = '100';

    console.log('✓ i) Rate limiting 429 berbahasa Indonesia terverifikasi\n');

    // -----------------------------------------------------------------
    // j) Konfigurasi OTP_HMAC_SECRET & Tidak Ada Kebocoran Rahasia di Log
    // -----------------------------------------------------------------
    console.log('--- Menguji Skenario j: Konfigurasi Secret & Proteksi Log ---');
    // 1. Secret kosong / pendek -> 503
    process.env.OTP_HMAC_SECRET = 'short';
    const res503Forgot = await fetchJson('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@kalila.com' }),
    });
    assert(res503Forgot.status === 503, `Secret pendek pada forgot-password harus 503 (dapat ${res503Forgot.status})`);
    assert(
      res503Forgot.body.message === 'Fitur reset password belum dikonfigurasi',
      'Pesan 503 harus sesuai'
    );

    const res503Verify = await fetchJson('/api/auth/verify-reset-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@kalila.com', otp: '123456' }),
    });
    assert(res503Verify.status === 503, 'Secret pendek pada verify harus 503');

    const res503Reset = await fetchJson('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken: 'dummy', newPassword: 'Pass123!Valid' }),
    });
    assert(res503Reset.status === 503, 'Secret pendek pada reset-password harus 503');
    process.env.OTP_HMAC_SECRET = originalOtpSecret; // Kembalikan

    // 2. Proteksi log konsol: pastikan secret, token, dan API key tidak pernah bocor ke log
    const allCapturedText = capturedLogs.join('\n');
    assert(!allCapturedText.includes(originalOtpSecret), 'Kunci OTP_HMAC_SECRET tidak boleh bocor ke konsol log');
    if (process.env.RESEND_API_KEY) {
      assert(!allCapturedText.includes(process.env.RESEND_API_KEY), 'RESEND_API_KEY tidak boleh muncul di konsol log');
    }
    assert(!allCapturedText.includes(resetToken), 'resetToken tidak boleh muncul di konsol log');

    // 3. Uji DEV_LOG_OTP
    const { user: devCust } = await createTestCustomer();
    const prevEnv = process.env.NODE_ENV;
    process.env.DEV_LOG_OTP = 'true';

    // Saat NODE_ENV === 'development' -> OTP dicetak
    process.env.NODE_ENV = 'development';
    const beforeDevCount = capturedLogs.length;
    const devReq = await passwordResetService.requestPasswordReset(devCust.email);
    trackPasswordReset(devReq.passwordResetId);
    const devLogText = capturedLogs.slice(beforeDevCount).join('\n');
    assert(devLogText.includes('[DEV_LOG_OTP] OTP:'), 'DEV_LOG_OTP harus mencetak OTP saat development');

    // Saat NODE_ENV === 'production' -> OTP diabaikan
    const { user: prodCust } = await createTestCustomer();
    process.env.NODE_ENV = 'production';
    const beforeProdCount = capturedLogs.length;
    const prodReq = await passwordResetService.requestPasswordReset(prodCust.email);
    trackPasswordReset(prodReq.passwordResetId);
    const prodLogText = capturedLogs.slice(beforeProdCount).join('\n');
    assert(!prodLogText.includes('[DEV_LOG_OTP] OTP:'), 'DEV_LOG_OTP harus diabaikan saat non-development');

    process.env.NODE_ENV = prevEnv || 'test';
    delete process.env.DEV_LOG_OTP;

    console.log('✓ j) 503 jika secret belum dikonfigurasi, proteksi log, dan DEV_LOG_OTP terverifikasi\n');

    // -----------------------------------------------------------------
    // k) TTL purgeAt & Invalidation Massal Dokumen Lama
    // -----------------------------------------------------------------
    console.log('--- Menguji Skenario k: TTL purgeAt & Invalidation Dokumen Lama ---');
    const { user: ttlCust } = await createTestCustomer();
    const reqTtl = await passwordResetService.requestPasswordReset(ttlCust.email);
    trackPasswordReset(reqTtl.passwordResetId);

    const ttlDoc = await PasswordReset.findById(reqTtl.passwordResetId);
    assert(ttlDoc.purgeAt instanceof Date, 'purgeAt harus berupa tanggal Date');
    const diffHours = (ttlDoc.purgeAt.getTime() - ttlDoc.createdAt.getTime()) / (3600 * 1000);
    assert(Math.round(diffHours) === 24, 'purgeAt harus 24 jam setelah createdAt');

    // Uji invalidation massal dokumen lain setelah reset sukses
    const { user: multiCust } = await createTestCustomer();

    // Buat token reset aktif untuk multiCust
    const validReset = await passwordResetService.requestPasswordReset(multiCust.email);
    assert(validReset.enqueued, 'validReset harus enqueued');
    trackPasswordReset(validReset.passwordResetId);
    const emailMulti = getLatestEmailFor(multiCust.email);
    assert(emailMulti, 'Email multiCust harus ada');
    const otpMulti = emailMulti.text.match(/\b\d{6}\b/)[0];
    const verMulti = await passwordResetService.verifyResetOtp(multiCust.email, otpMulti);

    // Buat dokumen tambahan lain milik user ini yang belum ter-invalidate
    const docOld1 = await PasswordReset.create({
      user: multiCust._id,
      email: multiCust.email,
      otpHash: 'dummyhash1'.repeat(6).slice(0, 64),
      otpExpiresAt: new Date(Date.now() + 600000),
      purgeAt: new Date(Date.now() + 86400000),
      invalidatedAt: null,
    });
    trackPasswordReset(docOld1._id);

    // Reset password
    await passwordResetService.resetPassword(verMulti.resetToken, 'NewMultiPass123!');

    // Pastikan docOld1 memiliki invalidatedAt setelah reset password berhasil
    const checkOld1 = await PasswordReset.findById(docOld1._id);
    assert(checkOld1.invalidatedAt !== null, 'Semua dokumen PasswordReset lama milik user harus ter-invalidate');

    console.log('✓ k) TTL purgeAt 24 jam dan invalidation massal dokumen lama terverifikasi\n');

    // -----------------------------------------------------------------
    // l) Invariansi Perilaku Modul Auth yang Ada (Register, Login, Me)
    // -----------------------------------------------------------------
    console.log('--- Menguji Skenario l: Perilaku Auth Standar Tetap Berfungsi ---');
    const randS = Math.floor(100000 + Math.random() * 900000);
    const regRes = await fetchJson('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Auth Invariance ${randS}`,
        email: `invariance.${randS}@kalila-test.com`,
        phone: '081234567890',
        password: 'Password123!',
      }),
    });
    assert(regRes.status === 201, 'Registrasi standar harus tetap 201');
    assert(regRes.body.data?.token, 'Registrasi harus mengembalikan token JWT');
    trackUser(regRes.body.data.user.id);

    const loginRes = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `invariance.${randS}@kalila-test.com`,
        password: 'Password123!',
      }),
    });
    assert(loginRes.status === 200, 'Login standar harus tetap 200');

    const meRes = await fetchJson('/api/auth/me', {
      headers: { Authorization: `Bearer ${loginRes.body.data.token}` },
    });
    assert(meRes.status === 200, 'GET /api/auth/me standar harus tetap 200');

    console.log('✓ l) Modul auth standar (register, login, me) tidak terganggu\n');

    // -----------------------------------------------------------------
    // n) Kebersihan Database
    // -----------------------------------------------------------------
    console.log('--- Menguji Skenario n: Verifikasi Kebersihan Database ---');
    await cleanTrackedData();
    await PasswordReset.deleteMany({});
    await EmailOutbox.deleteMany({});
    await mongoose.connection.collection('slotlocks').deleteMany({});
    await restoreSettings();

    const collections = await mongoose.connection.db.collections();
    console.log('Jumlah dokumen di database pengujian:');
    let dirtyCollections = 0;
    for (const col of collections) {
      const name = col.collectionName;
      if (name === 'settings' || name.startsWith('system.')) continue;
      const count = await col.countDocuments();
      console.log(` - ${name}: ${count}`);
      if (count > 0) {
        dirtyCollections++;
      }
    }
    assert(dirtyCollections === 0, `Masih terdapat ${dirtyCollections} koleksi kotor di database uji`);
    console.log('✓ n) Seluruh koleksi database uji bersih (0 dokumen uji tersisa)\n');

    console.log('================================================================');
    console.log('SEMUA SKENARIO PENGUJIAN RESET PASSWORD BERHASIL 100%!');
    console.log('================================================================\n');
  } finally {
    stopCapturingLogs();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await cleanTrackedData();
    await disconnectTestDb();
  }
}

if (require.main === module) {
  runPasswordResetTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('\n❌ PENGUJIAN GAGAL:', err);
      process.exit(1);
    });
}

module.exports = { runPasswordResetTests };

