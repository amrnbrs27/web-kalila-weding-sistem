const path = require('path');
const http = require('http');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Pastikan nilai batas ekspor default tidak mengganggu skenario sebelum uji rate limit m)
process.env.FINANCE_EXPORT_MAX = '50';

const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const app = require('../src/app');
const Booking = require('../src/models/Booking');
const Payment = require('../src/models/Payment');
const {
  getTodayWIB,
  addDays,
  diffDays,
  getMondayOfWeek,
  getMonthStart,
} = require('../src/utils/dateUtils');
const {
  buildEffectivePaidDateOr,
} = require('../src/services/financeService');

const {
  connectTestDb,
  disconnectTestDb,
  createTestAdmin,
  createTestCustomer,
  backupSettings,
  restoreSettings,
  cleanTrackedData,
  trackBooking,
  trackPayment,
} = require('./testUtils');

let server;
let baseUrl;

function wibDateTime(dateStr, hour = 0, minute = 0, second = 0, ms = 0) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hour, minute, second, ms) - 7 * 3600 * 1000);
}

function assert(cond, msg) {
  if (!cond) {
    throw new Error(msg);
  }
}

async function fetchJson(endpoint, token) {
  const res = await fetch(`${baseUrl}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, headers: res.headers, body };
}

async function fetchBinary(endpoint, token) {
  const res = await fetch(`${baseUrl}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const arrayBuf = await res.arrayBuffer();
  return {
    status: res.status,
    headers: res.headers,
    buffer: Buffer.from(arrayBuf),
  };
}

async function runFinanceTests() {
  console.log('================================================================');
  console.log('Memulai Pengujian Otomatis Dashboard Keuangan & Ekspor (PRD 5.2)');
  console.log('================================================================\n');

  await connectTestDb();
  await backupSettings();

  // Pastikan indeks terbaru pada Payment & Booking sudah terbentuk sebelum explain()
  await Payment.createIndexes();
  await Booking.createIndexes();

  const testPort = 5024;
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(testPort, resolve));
  baseUrl = `http://localhost:${testPort}`;
  console.log(`✓ Server pengujian berjalan di ${baseUrl}\n`);

  const today = getTodayWIB();
  const curYear = Number(today.slice(0, 4));
  const ytdFrom = `${curYear}-01-01`;

  try {
    const { user: adminUser, token: adminToken } = await createTestAdmin();
    const { token: customerToken } = await createTestCustomer();
    console.log('✓ Akun admin dan pelanggan uji sementara berhasil dibuat');

    // -----------------------------------------------------------------
    // a) 401 tanpa token dan 403 token customer pada SEMUA endpoint
    // -----------------------------------------------------------------
    const protectedUrls = [
      '/api/admin/finance/summary',
      '/api/admin/finance/chart',
      '/api/admin/finance/transactions',
      '/api/admin/finance/recap',
      '/api/admin/finance/outstanding',
      '/api/admin/finance/export?report=transactions&format=xlsx',
    ];
    for (const url of protectedUrls) {
      const noTok = await fetch(`${baseUrl}${url}`);
      assert(noTok.status === 401, `Skenario a: ${url} tanpa token harus 401 (dapat ${noTok.status})`);
      const custTok = await fetch(`${baseUrl}${url}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert(custTok.status === 403, `Skenario a: ${url} token customer harus 403 (dapat ${custTok.status})`);
    }
    console.log('✓ a) Kontrol akses 401/403 terverifikasi pada seluruh 6 endpoint finance');

    // -----------------------------------------------------------------
    // b) Database kosong
    // -----------------------------------------------------------------
    const emptySummary = await fetchJson('/api/admin/finance/summary', adminToken);
    assert(emptySummary.status === 200, 'Skenario b: summary kosong harus 200');
    const es = emptySummary.body.data;
    assert(
      es.gross === 0 &&
        es.refunds === 0 &&
        es.net === 0 &&
        es.byType.dp === 0 &&
        es.byType.pelunasan === 0 &&
        es.byType.pengembalian === 0 &&
        es.counts.payments === 0 &&
        es.counts.bookings === 0 &&
        es.change.net === null &&
        es.change.gross === null &&
        es.topPackages.length === 0 &&
        es.outstanding.count === 0 &&
        es.outstanding.amount === 0 &&
        es.outstanding.totalBelumDitetapkan === 0 &&
        es.pendingVerification.count === 0 &&
        es.pendingVerification.amount === 0,
      'Skenario b: summary kosong harus seluruhnya 0/null/kosong, dapat: ' + JSON.stringify(es)
    );
    for (const cat of ['dekor', 'catering', 'wedding']) {
      assert(
        es.byCategory[cat] &&
          es.byCategory[cat].gross === 0 &&
          es.byCategory[cat].refunds === 0 &&
          es.byCategory[cat].net === 0,
        `Skenario b: byCategory.${cat} harus nol`
      );
    }

    const emptyChart = await fetchJson('/api/admin/finance/chart', adminToken);
    assert(emptyChart.status === 200, 'Skenario b: chart kosong harus 200');
    assert(
      emptyChart.body.data.series.length === 3 &&
        emptyChart.body.data.series.every((s) => s.data.every((v) => v === 0)) &&
        emptyChart.body.data.totals.net === 0,
      'Skenario b: chart kosong seluruh bucket harus 0'
    );

    const emptyRecap = await fetchJson('/api/admin/finance/recap', adminToken);
    assert(emptyRecap.status === 200, 'Skenario b: recap kosong harus 200');
    assert(
      emptyRecap.body.data.rows.length === 12 &&
        emptyRecap.body.data.rows.every((r) => r.net === 0 && r.gross === 0 && r.refunds === 0),
      'Skenario b: recap bulanan kosong harus 12 baris nol'
    );

    const emptyTrx = await fetchJson('/api/admin/finance/transactions', adminToken);
    assert(emptyTrx.status === 200, 'Skenario b: transactions kosong harus 200');
    assert(
      emptyTrx.body.data.items.length === 0 &&
        emptyTrx.body.data.totals.masuk === 0 &&
        emptyTrx.body.data.totals.keluar === 0 &&
        emptyTrx.body.data.totals.net === 0 &&
        emptyTrx.body.data.totals.count === 0,
      'Skenario b: transactions kosong harus totals 0'
    );

    const emptyOut = await fetchJson('/api/admin/finance/outstanding', adminToken);
    assert(emptyOut.status === 200, 'Skenario b: outstanding kosong harus 200');
    assert(
      emptyOut.body.data.items.length === 0 && emptyOut.body.data.pagination.total === 0,
      'Skenario b: outstanding kosong harus []'
    );

    const emptyXlsx = await fetchBinary(
      '/api/admin/finance/export?report=transactions&format=xlsx',
      adminToken
    );
    assert(emptyXlsx.status === 200 && emptyXlsx.buffer.length > 0, 'Skenario b: export XLSX kosong harus 200');
    const wbEmpty = new ExcelJS.Workbook();
    await wbEmpty.xlsx.load(emptyXlsx.buffer);
    assert(wbEmpty.getWorksheet('Ringkasan') && wbEmpty.getWorksheet('Transaksi'), 'Skenario b: sheet XLSX kosong tidak lengkap');

    const emptyPdf = await fetchBinary(
      '/api/admin/finance/export?report=recap&format=pdf',
      adminToken
    );
    assert(
      emptyPdf.status === 200 &&
        emptyPdf.buffer.subarray(0, 4).toString() === '%PDF' &&
        emptyPdf.buffer.toString('latin1').trim().endsWith('%%EOF'),
      'Skenario b: export PDF kosong harus berkas PDF valid'
    );
    console.log('✓ b) Respons database kosong & ekspor berkas valid saat kosong terverifikasi');

    // -----------------------------------------------------------------
    // Persiapan data uji terkontrol (dinamis terhadap today WIB)
    // -----------------------------------------------------------------
    const fromDate = addDays(today, -9); // Rentang utama 10 hari: fromDate .. today
    const toDate = today;
    const prevTo = addDays(fromDate, -1);
    const prevFrom = addDays(fromDate, -10);

    const dayX = addDays(today, -4);
    const dayXPlus1 = addDays(today, -3);
    const dayBoundaryStart = fromDate;
    const dayBoundaryEnd = toDate;
    const dayPrev = addDays(fromDate, -2); // Di dalam periode pembanding
    const dayOutsideBeforePrev = addDays(fromDate, -1); // Tepat 23:59:59.999 WIB hari sebelum fromDate -> masuk previous!

    const colBooking = Booking.collection;
    const colPayment = Payment.collection;

    async function insertBookingRaw(doc) {
      const fullDoc = {
        bookingNumber: doc.bookingNumber,
        customer: null,
        customerSnapshot: {
          name: doc.customerName || 'Pelanggan Uji',
          phone: doc.customerPhone || '081200000001',
          email: doc.customerEmail || 'rahasia@kalila-test.com',
        },
        package: doc.package ?? null,
        packageSnapshot: doc.packageSnapshot,
        category: doc.category,
        eventDate: doc.eventDate || addDays(today, 10),
        eventName: doc.eventName || 'Acara Uji',
        location: doc.location || 'Lokasi Uji',
        notes: '',
        formData: {},
        source: doc.source || 'website',
        status: doc.status || 'terkonfirmasi',
        paymentStatus: doc.paymentStatus || 'dp_dibayar',
        dpAmount: 1000000,
        totalPrice: doc.totalPrice !== undefined ? doc.totalPrice : null,
        proofAttempts: 0,
        statusHistory: [],
        createdAt: doc.createdAt || new Date(),
        updatedAt: doc.createdAt || new Date(),
      };
      const res = await colBooking.insertOne(fullDoc);
      trackBooking(res.insertedId);
      return res.insertedId;
    }

    async function insertPaymentRaw(doc) {
      const createdAt = doc.createdAt || new Date();
      const fullDoc = {
        booking: doc.booking,
        type: doc.type,
        amount: doc.amount,
        method: doc.method || 'transfer',
        proof: {
          url: 'https://res.cloudinary.com/demo/image/authenticated/s--abc--/rahasia-bukti.jpg',
          publicId: 'kalila/proofs/secret-public-id-xyz',
        },
        status: doc.status || 'approved',
        rejectionReason: '',
        voidReason: doc.status === 'void' ? 'Dibatalkan uji' : '',
        attempt: 1,
        source: doc.source || 'customer',
        paidAt: doc.paidAt !== undefined ? doc.paidAt : null,
        verifiedBy: doc.verifiedBy !== undefined ? doc.verifiedBy : adminUser._id,
        verifiedAt: doc.verifiedAt !== undefined ? doc.verifiedAt : null,
        note: doc.note || '',
        createdAt,
        updatedAt: createdAt,
      };
      const res = await colPayment.insertOne(fullDoc);
      trackPayment(res.insertedId);
      return res.insertedId;
    }

    // 1. Booking Dekor (Paket A) - uji formula injection di nama & paket & catatan untuk XLSX nanti juga!
    const bDekorId = await insertBookingRaw({
      bookingNumber: 'KL-FIN-DEK1',
      customerName: '=1+1',
      customerPhone: '0812111111',
      packageSnapshot: { name: '@SUM(A1)', price: 6000000, category: 'dekor' },
      category: 'dekor',
      eventDate: addDays(today, -3), // Overdue!
      status: 'terkonfirmasi',
      paymentStatus: 'dp_dibayar',
      totalPrice: 7000000, // Override packageSnapshot.price -> sisa harus pakai 7.000.000
    });

    // DP approved pada fromDate 00:00:00.000 WIB (batas awal inklusif)
    await insertPaymentRaw({
      booking: bDekorId,
      type: 'dp',
      amount: 1000000,
      method: 'transfer',
      source: 'customer',
      status: 'approved',
      paidAt: wibDateTime(dayBoundaryStart, 0, 0, 0, 0),
      note: "+CMD|'/C calc'!A0",
    });

    // Pelunasan approved pada dayX 23:30 WIB lewat FALLBACK verifiedAt (paidAt = null)
    await insertPaymentRaw({
      booking: bDekorId,
      type: 'pelunasan',
      amount: 3000000,
      method: 'qris',
      source: 'manual',
      status: 'approved',
      paidAt: null,
      verifiedAt: wibDateTime(dayX, 23, 30, 0, 0),
      note: 'Fallback verifiedAt 23:30 WIB',
    });

    // Pengembalian approved pada dayXPlus1 00:30 WIB lewat FALLBACK createdAt (paidAt = null, verifiedAt = null)
    await insertPaymentRaw({
      booking: bDekorId,
      type: 'pengembalian',
      amount: 500000,
      method: 'tunai',
      source: 'manual',
      status: 'approved',
      paidAt: null,
      verifiedAt: null,
      createdAt: wibDateTime(dayXPlus1, 0, 30, 0, 0),
      note: 'Refund uji regex (literal.*',
    });
    // Sisa tagihan bDekorId: totalPrice 7.000.000 - DP 1.000.000 - Pelunasan 3.000.000 = 3.000.000 (refund tidak mengurangi piutang!)

    // 2. Booking Wedding (Paket Wedding Gold)
    const bWeddingId = await insertBookingRaw({
      bookingNumber: 'KL-FIN-WED1',
      customerName: 'Pengantin (Uji.*)',
      customerPhone: '0812222222',
      packageSnapshot: { name: 'Wedding Gold', price: 15000000, category: 'wedding' },
      category: 'wedding',
      eventDate: addDays(today, 5), // Belum overdue
      status: 'berlangsung',
      paymentStatus: 'dp_dibayar',
      totalPrice: null, // Pakai packageSnapshot.price = 15.000.000
    });
    // DP approved (1.000.000) + Pelunasan (4.000.000) pada batas akhir toDate 23:59:59.999 WIB
    await insertPaymentRaw({
      booking: bWeddingId,
      type: 'dp',
      amount: 1000000,
      method: 'transfer',
      source: 'customer',
      status: 'approved',
      paidAt: wibDateTime(dayX, 14, 0, 0, 0),
    });
    await insertPaymentRaw({
      booking: bWeddingId,
      type: 'pelunasan',
      amount: 4000000,
      method: 'transfer',
      source: 'manual',
      status: 'approved',
      paidAt: wibDateTime(dayBoundaryEnd, 23, 59, 59, 999),
    });
    // Pengembalian lebih besar pada dayXPlus1 untuk kategori wedding -> chart kategori wedding di dayXPlus1 jadi NEGATIF!
    await insertPaymentRaw({
      booking: bWeddingId,
      type: 'pengembalian',
      amount: 200000,
      method: 'lainnya',
      source: 'manual',
      status: 'approved',
      paidAt: wibDateTime(dayXPlus1, 10, 0, 0, 0),
    });
    // Sisa tagihan bWeddingId: 15.000.000 - (1.000.000 + 4.000.000) = 10.000.000

    // 3. Booking Catering TANPA NAMA PAKET (Tanpa paket)
    const bNoPkgId = await insertBookingRaw({
      bookingNumber: 'KL-FIN-CAT0',
      customerName: 'Tamu Tanpa Paket',
      customerPhone: '0812333333',
      package: null,
      packageSnapshot: { name: '', price: null, category: 'catering' },
      category: 'catering',
      eventDate: addDays(today, 8),
      status: 'selesai',
      paymentStatus: 'dp_dibayar',
      totalPrice: null, // total null -> masuk totalBelumDitetapkan!
    });
    await insertPaymentRaw({
      booking: bNoPkgId,
      type: 'dp',
      amount: 1000000,
      method: 'transfer',
      source: 'manual',
      status: 'approved',
      paidAt: wibDateTime(dayX, 12, 0, 0, 0),
    });

    // 4. Tambah 4 paket lainnya untuk uji Top 5 packages (>5 paket) + pending/rejected/void payments
    for (let i = 1; i <= 4; i += 1) {
      const bExtraId = await insertBookingRaw({
        bookingNumber: `KL-FIN-EXT${i}`,
        customerName: `Klien Paket ${i}`,
        packageSnapshot: { name: `Paket Ekstra ${i}`, price: 2000000, category: 'catering' },
        category: 'catering',
        eventDate: addDays(today, 15 + i),
        status: 'terkonfirmasi',
        paymentStatus: 'lunas', // Lunas -> TIDAK masuk outstanding
        totalPrice: 2000000,
      });
      await insertPaymentRaw({
        booking: bExtraId,
        type: 'dp',
        amount: i * 100000, // 100k, 200k, 300k, 400k
        status: 'approved',
        paidAt: wibDateTime(dayX, 9 + i, 0, 0, 0),
      });
    }

    // 5. Pembayaran non-approved (pending, rejected, void) -> tidak masuk pemasukan, pending masuk pendingVerification
    await insertPaymentRaw({
      booking: bDekorId,
      type: 'dp',
      amount: 1000000,
      status: 'pending',
      paidAt: null,
      verifiedBy: null,
      createdAt: wibDateTime(dayX, 11, 0, 0, 0),
    });
    await insertPaymentRaw({
      booking: bDekorId,
      type: 'dp',
      amount: 1000000,
      status: 'rejected',
      paidAt: null,
      verifiedAt: wibDateTime(dayX, 11, 5, 0, 0),
    });
    await insertPaymentRaw({
      booking: bDekorId,
      type: 'dp',
      amount: 1000000,
      status: 'void',
      paidAt: wibDateTime(dayX, 11, 10, 0, 0),
    });

    // 6. Booking menunggu_dp & dibatalkan -> TIDAK boleh masuk outstanding meskipun total > 0
    await insertBookingRaw({
      bookingNumber: 'KL-FIN-SKIP1',
      packageSnapshot: { name: 'Paket Skip', price: 5000000, category: 'dekor' },
      category: 'dekor',
      status: 'menunggu_dp',
      paymentStatus: 'belum_dp',
      totalPrice: 5000000,
    });
    await insertBookingRaw({
      bookingNumber: 'KL-FIN-SKIP2',
      packageSnapshot: { name: 'Paket Batal', price: 5000000, category: 'dekor' },
      category: 'dekor',
      status: 'dibatalkan',
      paymentStatus: 'dp_dibayar',
      totalPrice: 5000000,
    });

    // -----------------------------------------------------------------
    // c & d) Summary (tanpa previous -> change null, lalu dengan previous)
    // -----------------------------------------------------------------
    // Dekor: gross 4.000.000 (1jt + 3jt), refunds 500.000, net 3.500.000
    // Wedding: gross 5.000.000 (1jt + 4jt), refunds 200.000, net 4.800.000
    // Catering: Tanpa paket 1.000.000 + Paket Ekstra 1..4 (100k+200k+300k+400k = 1.000.000) -> gross 2.000.000, refunds 0, net 2.000.000
    // Total: gross 11.000.000, refunds 700.000, net 10.300.000
    // byType: dp = 1jt + 1jt + 1jt + 1jt = 4.000.000; pelunasan = 3jt + 4jt = 7.000.000; pengembalian = 700.000
    // payments count = 2(dekor in) + 1(dekor out) + 3(wed) + 1(cat0) + 4(cat extra) = 11; distinct bookings = 7
    const sumRes1 = await fetchJson(
      `/api/admin/finance/summary?from=${fromDate}&to=${toDate}`,
      adminToken
    );
    assert(sumRes1.status === 200, 'Skenario c: summary gagal 200');
    const s1 = sumRes1.body.data;
    assert(s1.gross === 11000000, `Skenario c: gross salah (${s1.gross})`);
    assert(s1.refunds === 700000, `Skenario c: refunds salah (${s1.refunds})`);
    assert(s1.net === 10300000, `Skenario c: net salah (${s1.net})`);
    assert(
      s1.byType.dp === 4000000 && s1.byType.pelunasan === 7000000 && s1.byType.pengembalian === 700000,
      'Skenario c: byType salah'
    );
    assert(
      s1.byCategory.dekor.net === 3500000 &&
        s1.byCategory.catering.net === 2000000 &&
        s1.byCategory.wedding.net === 4800000,
      'Skenario c: byCategory salah (wedding harus terhitung sebagai wedding)'
    );
    assert(s1.counts.payments === 11 && s1.counts.bookings === 7, 'Skenario c: counts salah');
    assert(s1.previous.net === 0 && s1.change.net === null && s1.change.gross === null, 'Skenario d: change saat previous 0 harus null');
    assert(
      s1.pendingVerification.count === 1 && s1.pendingVerification.amount === 1000000,
      'Skenario d: pendingVerification salah'
    );
    assert(
      s1.topPackages.length === 5 &&
        s1.topPackages[0].packageName === 'Wedding Gold' &&
        s1.topPackages[1].packageName === '@SUM(A1)' &&
        s1.topPackages[2].packageName === 'Tanpa paket',
      `Skenario d: topPackages urutan/Tanpa paket salah (${JSON.stringify(s1.topPackages)})`
    );

    // Tambah transaksi pada periode pembanding (tepat 23:59:59.999 WIB sehari sebelum fromDate!)
    const bPrevId = await insertBookingRaw({
      bookingNumber: 'KL-FIN-PREV1',
      packageSnapshot: { name: 'Paket Prev', price: 6000000, category: 'catering' },
      category: 'catering',
      status: 'selesai',
      paymentStatus: 'lunas',
      totalPrice: 6000000,
    });
    await insertPaymentRaw({
      booking: bPrevId,
      type: 'dp',
      amount: 5500000, // net & gross previous = 5.500.000 -> change.gross = 100.0, net = (10.3M - 5.5M)/5.5M = 87.3%
      status: 'approved',
      paidAt: wibDateTime(dayOutsideBeforePrev, 23, 59, 59, 999),
    });

    const sumRes2 = await fetchJson(
      `/api/admin/finance/summary?from=${fromDate}&to=${toDate}`,
      adminToken
    );
    const s2 = sumRes2.body.data;
    assert(
      s2.gross === 11000000 &&
        s2.previous.from === prevFrom &&
        s2.previous.to === prevTo &&
        s2.previous.net === 5500000 &&
        s2.change.gross === 100 &&
        s2.change.net === 87.3,
      `Skenario d: previous/change salah (${JSON.stringify(s2.previous)} ${JSON.stringify(s2.change)})`
    );
    console.log('✓ c & d) Summary, batas WIB 23:30/00:30, fallback paidAt, previous/change, topPackages ("Tanpa paket") terverifikasi');

    // -----------------------------------------------------------------
    // e) Chart (day, week, month; category net negatif, type positif, truncated bucket)
    // -----------------------------------------------------------------
    const chartDayCat = await fetchJson(
      `/api/admin/finance/chart?from=${fromDate}&to=${toDate}&groupBy=day&breakdown=category`,
      adminToken
    );
    assert(chartDayCat.status === 200, 'Skenario e: chart day category gagal');
    const cdc = chartDayCat.body.data;
    const idxDayX = cdc.labels.indexOf(dayX);
    const idxDayXPlus1 = cdc.labels.indexOf(dayXPlus1);
    assert(idxDayX !== -1 && idxDayXPlus1 !== -1, 'Skenario e: label dayX/dayX+1 tidak ada');
    const dekorSeries = cdc.series.find((s) => s.key === 'dekor').data;
    const wedSeries = cdc.series.find((s) => s.key === 'wedding').data;
    // Dekor dayX: pelunasan 3.000.000 (23:30 WIB), dayXPlus1: pengembalian -500.000 (00:30 WIB) -> negatif!
    assert(
      dekorSeries[idxDayX] === 3000000 && dekorSeries[idxDayXPlus1] === -500000,
      `Skenario e: batas WIB 23:30/00:30 atau nilai negatif pada chart salah (${dekorSeries[idxDayX]}, ${dekorSeries[idxDayXPlus1]})`
    );
    assert(wedSeries[idxDayXPlus1] === -200000, 'Skenario e: nilai negatif kategori wedding salah');

    const chartDayType = await fetchJson(
      `/api/admin/finance/chart?from=${fromDate}&to=${toDate}&groupBy=day&breakdown=type`,
      adminToken
    );
    const cdt = chartDayType.body.data;
    const pengembalianSeries = cdt.series.find((s) => s.key === 'pengembalian').data;
    assert(
      pengembalianSeries[idxDayXPlus1] === 700000 && cdt.totals.net === 10300000,
      'Skenario e: breakdown=type harus positif'
    );

    const chartWeek = await fetchJson(
      `/api/admin/finance/chart?from=${fromDate}&to=${toDate}&groupBy=week&breakdown=category`,
      adminToken
    );
    const firstWeekMonday = getMondayOfWeek(fromDate);
    assert(
      chartWeek.body.data.labels[0] === firstWeekMonday &&
        chartWeek.body.data.totals.net === 10300000,
      'Skenario e: chart week harus mulai Senin dan memotong hari sebelum fromDate (bPrevId tidak ikut!)'
    );

    const chartMonth = await fetchJson(
      `/api/admin/finance/chart?from=${fromDate}&to=${toDate}&groupBy=month&breakdown=category`,
      adminToken
    );
    assert(
      chartMonth.body.data.labels[0] === getMonthStart(fromDate) &&
        chartMonth.body.data.totals.net === 10300000,
      'Skenario e: chart month harus memotong bucket dan mempertahankan totals.net = summary.net'
    );
    console.log('✓ e) Chart day/week(Senin)/month, label, nol bucket, negatif net, dan pemotongan rentang terverifikasi');

    // -----------------------------------------------------------------
    // f) Transactions (filter, q regex safety, paginasi, sort whitelist, totals, privasi)
    // -----------------------------------------------------------------
    const trxVoid = await fetchJson(
      `/api/admin/finance/transactions?from=${fromDate}&to=${toDate}&status=void`,
      adminToken
    );
    assert(
      trxVoid.status === 200 &&
        trxVoid.body.data.items.length === 1 &&
        trxVoid.body.data.items[0].status === 'void',
      'Skenario f: filter status=void gagal'
    );

    const trxRegex1 = await fetchJson(
      `/api/admin/finance/transactions?from=${fromDate}&to=${toDate}&q=${encodeURIComponent('(Uji.*')}`,
      adminToken
    );
    assert(
      trxRegex1.status === 200 && trxRegex1.body.data.items.length === 3,
      `Skenario f: pencarian q karakter regex harus aman dan cocok literal (dapat ${trxRegex1.body?.data?.items?.length})`
    );

    const trxRegex2 = await fetchJson(
      `/api/admin/finance/transactions?from=${fromDate}&to=${toDate}&q=${encodeURIComponent('(')}`,
      adminToken
    );
    assert(trxRegex2.status === 200, 'Skenario f: q="(" tidak boleh crash regex');

    const trxPaged = await fetchJson(
      `/api/admin/finance/transactions?from=${fromDate}&to=${toDate}&category=dekor&method=qris&source=manual&type=pelunasan&page=1&limit=1&sort=nominal_besar`,
      adminToken
    );
    assert(
      trxPaged.status === 200 &&
        trxPaged.body.data.items.length === 1 &&
        trxPaged.body.data.items[0].amount === 3000000 &&
        trxPaged.body.data.items[0].direction === 'masuk',
      'Skenario f: filter gabungan dekor+qris+manual+pelunasan gagal'
    );

    const trxPageTest = await fetchJson(
      `/api/admin/finance/transactions?from=${fromDate}&to=${toDate}&page=2&limit=3&sort=terbaru`,
      adminToken
    );
    assert(
      trxPageTest.body.data.items.length === 3 &&
        trxPageTest.body.data.pagination.total === 11 &&
        trxPageTest.body.data.totals.masuk === 11000000 &&
        trxPageTest.body.data.totals.keluar === 700000 &&
        trxPageTest.body.data.totals.net === 10300000 &&
        trxPageTest.body.data.totals.count === 11,
      'Skenario f: totals harus menghitung SELURUH hasil filter, bukan hanya halaman aktif'
    );
    for (const item of trxPageTest.body.data.items) {
      assert(
        item.proof === undefined &&
          item.publicId === undefined &&
          item.url === undefined &&
          item.customerEmail === undefined,
        'Skenario f: item transaksi tidak boleh memuat publicId/bukti/email'
      );
      if (item.type === 'pengembalian') {
        assert(item.direction === 'keluar', 'Skenario f: pengembalian harus direction keluar');
      } else {
        assert(item.direction === 'masuk', 'Skenario f: dp/pelunasan harus direction masuk');
      }
    }

    const badSort = await fetchJson(
      `/api/admin/finance/transactions?from=${fromDate}&to=${toDate}&sort=hacked`,
      adminToken
    );
    assert(badSort.status === 400, 'Skenario f: sort di luar whitelist harus 400');
    console.log('✓ f) Filter transaksi, regex aman, paginasi, sort whitelist, totals penuh, & privasi terverifikasi');

    // -----------------------------------------------------------------
    // g) Recap (bulanan 12 baris, tahunan, validasi tahun)
    // -----------------------------------------------------------------
    const recapMonth = await fetchJson(`/api/admin/finance/recap?groupBy=month&year=${curYear}`, adminToken);
    assert(
      recapMonth.status === 200 &&
        recapMonth.body.data.rows.length === 12 &&
        recapMonth.body.data.rows[0].label === 'Januari',
      'Skenario g: recap bulanan harus 12 baris'
    );

    const recapYear = await fetchJson(
      `/api/admin/finance/recap?groupBy=year&fromYear=${Math.max(2000, curYear - 2)}&toYear=${curYear}`,
      adminToken
    );
    assert(
      recapYear.status === 200 && recapYear.body.data.rows.length === Math.min(3, curYear - 1999),
      'Skenario g: recap tahunan gagal'
    );

    const badYear1 = await fetchJson('/api/admin/finance/recap?groupBy=month&year=1999', adminToken);
    const badYear2 = await fetchJson(`/api/admin/finance/recap?groupBy=year&fromYear=${curYear}&toYear=${curYear - 1}`, adminToken);
    const badYear3 = await fetchJson(`/api/admin/finance/recap?groupBy=year&fromYear=2005&toYear=2020`, adminToken);
    assert(
      badYear1.status === 400 && badYear2.status === 400 && badYear3.status === 400,
      'Skenario g: tahun tidak valid atau rentang terbalik/>10 tahun harus 400'
    );
    console.log('✓ g) Rekap bulanan 12 baris, tahunan, & validasi tahun 400 terverifikasi');

    // -----------------------------------------------------------------
    // h) REKONSILIASI lintas 2 periode berbeda
    // -----------------------------------------------------------------
    for (const rng of [
      { f: fromDate, t: toDate, checkRecap: false },
      { f: ytdFrom, t: today, checkRecap: true },
    ]) {
      const rSum = (await fetchJson(`/api/admin/finance/summary?from=${rng.f}&to=${rng.t}`, adminToken)).body.data;
      const rChartCat = (await fetchJson(`/api/admin/finance/chart?from=${rng.f}&to=${rng.t}&breakdown=category`, adminToken)).body.data;
      const rChartType = (await fetchJson(`/api/admin/finance/chart?from=${rng.f}&to=${rng.t}&breakdown=type`, adminToken)).body.data;
      const rTrx = (await fetchJson(`/api/admin/finance/transactions?from=${rng.f}&to=${rng.t}&status=approved`, adminToken)).body.data;
      assert(
        rSum.net === rChartCat.totals.net &&
          rSum.net === rChartType.totals.net &&
          rSum.net === rTrx.totals.net,
        `Skenario h: ketidakcocokan rekonsiliasi periode ${rng.f}..${rng.t}`
      );
      if (rng.checkRecap) {
        const rRecap = (await fetchJson(`/api/admin/finance/recap?groupBy=month&year=${curYear}`, adminToken)).body.data;
        assert(rSum.net === rRecap.totals.net, 'Skenario h: recap.totals.net tidak cocok dengan summary.net YTD');
      }
    }
    console.log('✓ h) Rekonsiliasi 100% cocok antara summary, chart (category/type), transactions, dan recap');

    // -----------------------------------------------------------------
    // i) Outstanding (piutang, total null, overdue, sort, konsistensi summary)
    // -----------------------------------------------------------------
    const outAll = await fetchJson('/api/admin/finance/outstanding?sort=sisa_terbesar', adminToken);
    assert(outAll.status === 200, 'Skenario i: GET outstanding gagal');
    const outItems = outAll.body.data.items;
    assert(
      outItems.length === 2 &&
        outItems[0].bookingNumber === 'KL-FIN-WED1' &&
        outItems[0].remaining === 10000000 &&
        outItems[0].overdue === false &&
        outItems[0].daysUntil === 5 &&
        outItems[1].bookingNumber === 'KL-FIN-DEK1' &&
        outItems[1].remaining === 3000000 &&
        outItems[1].overdue === true &&
        outItems[1].daysUntil === -3,
      `Skenario i: daftar outstanding tidak sesuai (${JSON.stringify(outItems)})`
    );
    const outOverdue = await fetchJson('/api/admin/finance/outstanding?overdueOnly=true', adminToken);
    assert(
      outOverdue.body.data.items.length === 1 && outOverdue.body.data.items[0].bookingNumber === 'KL-FIN-DEK1',
      'Skenario i: filter overdueOnly=true salah'
    );
    const outPaged = await fetchJson('/api/admin/finance/outstanding?page=2&limit=1&sort=acara_terdekat', adminToken);
    assert(
      outPaged.body.data.items.length === 1 &&
        outPaged.body.data.items[0].bookingNumber === 'KL-FIN-WED1' &&
        outPaged.body.data.pagination.total === 2,
      'Skenario i: paginasi/sort acara_terdekat outstanding salah'
    );
    assert(
      s2.outstanding.count === 2 &&
        s2.outstanding.amount === 13000000 &&
        s2.outstanding.overdueCount === 1 &&
        s2.outstanding.totalBelumDitetapkan === 1,
      `Skenario i: angka outstanding pada summary tidak sama dengan daftar (${JSON.stringify(s2.outstanding)})`
    );
    console.log('✓ i) Outstanding, totalBelumDitetapkan, overdue/daysUntil, sort, paginasi, & sinkronisasi summary terverifikasi');

    // -----------------------------------------------------------------
    // j) Validasi 400 pada parameter buruk/tak dikenal
    // -----------------------------------------------------------------
    const futureDate = addDays(today, 2);
    const tooLongFrom = addDays(today, -366); // diff + 1 = 367 hari
    const badQueries = [
      `/api/admin/finance/summary?from=${toDate}&to=${fromDate}`,
      `/api/admin/finance/summary?from=${tooLongFrom}&to=${today}`,
      '/api/admin/finance/summary?from=2026-02-30',
      `/api/admin/finance/summary?to=${futureDate}`,
      '/api/admin/finance/chart?groupBy=hour',
      '/api/admin/finance/chart?breakdown=method',
      '/api/admin/finance/summary?unknownParam=1',
      '/api/admin/finance/outstanding?unknownParam=1',
      '/api/admin/finance/transactions?unknownParam=1',
    ];
    for (const qUrl of badQueries) {
      const rBad = await fetchJson(qUrl, adminToken);
      assert(rBad.status === 400, `Skenario j: ${qUrl} harus 400 (dapat ${rBad.status})`);
    }
    console.log('✓ j) Validasi Zod strict (400) untuk rentang, tanggal tidak valid, masa depan, & parameter tak dikenal terverifikasi');

    // -----------------------------------------------------------------
    // k) Ekspor XLSX: sheet, formula SUM, tanggal Date, angka, formula injection, tanpa PII/rahasia
    // -----------------------------------------------------------------
    const xlsxRes = await fetchBinary(
      `/api/admin/finance/export?report=transactions&format=xlsx&from=${fromDate}&to=${toDate}`,
      adminToken
    );
    assert(xlsxRes.status === 200, `Skenario k: export XLSX gagal (${xlsxRes.status})`);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(xlsxRes.buffer);
    const sheetSummary = wb.getWorksheet('Ringkasan');
    const sheetTrx = wb.getWorksheet('Transaksi');
    assert(sheetSummary && sheetTrx, 'Skenario k: sheet Ringkasan / Transaksi tidak ditemukan');
    assert(sheetTrx.views?.[0]?.state === 'frozen', 'Skenario k: header Transaksi harus frozen');
    assert(sheetTrx.getRow(1).font?.bold === true, 'Skenario k: header Transaksi harus bold');

    let foundFormulaInjCustomer = false;
    let foundFormulaInjPkg = false;
    let foundSumTotalRow = false;
    let foundDateType = false;
    let foundNumberType = false;

    sheetTrx.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const cellDate = row.getCell(2);
      if (cellDate.value instanceof Date) foundDateType = true;

      const cellCust = row.getCell(4);
      if (String(cellCust.value || '').includes('=1+1')) {
        assert(
          cellCust.type !== ExcelJS.ValueType.Formula && !cellCust.formula,
          'Skenario k: nama pelanggan "=1+1" tidak boleh tersimpan sebagai rumus'
        );
        assert(String(cellCust.value).startsWith("'"), 'Skenario k: nama "=1+1" harus diawali apostrof pengaman');
        foundFormulaInjCustomer = true;
      }

      const cellPkg = row.getCell(6);
      if (String(cellPkg.value || '').includes('@SUM(A1)')) {
        assert(
          cellPkg.type !== ExcelJS.ValueType.Formula && !cellPkg.formula,
          'Skenario k: nama paket "@SUM(A1)" tidak boleh tersimpan sebagai rumus'
        );
        foundFormulaInjPkg = true;
      }

      const cellAmt = row.getCell(12);
      if (typeof cellAmt.value === 'number' && cellAmt.value > 0) {
        foundNumberType = true;
      }
      if (cellAmt.formula && cellAmt.formula.startsWith('SUM(')) {
        foundSumTotalRow = true;
      }
    });

    assert(foundDateType, 'Skenario k: kolom tanggal harus bertipe Date');
    assert(foundNumberType, 'Skenario k: kolom nominal harus bertipe angka');
    assert(foundSumTotalRow, 'Skenario k: baris total harus memakai rumus SUM');
    assert(foundFormulaInjCustomer && foundFormulaInjPkg, 'Skenario k: uji teks formula injection tidak ditemukan');

    // Cek angka Ringkasan sama dengan JSON summary & tidak bocorkan email/publicId/URL bukti
    assert(sheetSummary.getRow(11).getCell(2).value === s2.net, 'Skenario k: net di Ringkasan XLSX harus sama dengan JSON summary');
    const xlsxRawXmlCheck = await wb.xlsx.writeBuffer();
    const rawStr = xlsxRawXmlCheck.toString('latin1');
    assert(
      !rawStr.includes('rahasia@kalila-test.com') &&
        !rawStr.includes('secret-public-id-xyz') &&
        !rawStr.includes('rahasia-bukti.jpg'),
      'Skenario k: berkas XLSX tidak boleh memuat email, publicId, atau URL bukti'
    );
    console.log('✓ k) Ekspor XLSX (sheet, SUM, Date, Number, proteksi formula injection, privasi) terverifikasi');

    // -----------------------------------------------------------------
    // l & n) Batch 1.000 baris untuk ekspor PDF streaming + uji kinerja >= 500 baris + explain()
    // -----------------------------------------------------------------
    const bulkBookings = [];
    for (let b = 0; b < 20; b += 1) {
      bulkBookings.push({
        _id: new mongoose.Types.ObjectId(),
        bookingNumber: `KL-BULK-${b}`,
        customer: null,
        customerSnapshot: { name: `Bulk Cust ${b}`, phone: '0812999999', email: 'bulk@test.com' },
        package: null,
        packageSnapshot: { name: `Paket Bulk ${b % 4}`, price: 2000000, category: 'catering' },
        category: b % 3 === 0 ? 'dekor' : b % 3 === 1 ? 'catering' : 'wedding',
        eventDate: addDays(today, 20),
        eventName: 'Acara Bulk',
        location: 'Lokasi Bulk',
        notes: '',
        formData: {},
        source: 'website',
        status: 'terkonfirmasi',
        paymentStatus: 'dp_dibayar',
        dpAmount: 1000000,
        totalPrice: 2000000,
        proofAttempts: 0,
        statusHistory: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await colBooking.insertMany(bulkBookings);
    bulkBookings.forEach((bk) => trackBooking(bk._id));

    const bulkPayments1000 = [];
    for (let i = 0; i < 1000; i += 1) {
      const pid = new mongoose.Types.ObjectId();
      bulkPayments1000.push({
        _id: pid,
        booking: bulkBookings[i % bulkBookings.length]._id,
        type: 'dp',
        amount: 100000,
        method: 'transfer',
        proof: { url: 'https://res.cloudinary.com/demo/bulk.jpg', publicId: 'bulk-secret-id' },
        status: 'approved',
        attempt: 1,
        source: 'customer',
        paidAt: wibDateTime(addDays(today, -(i % 5)), 12, 0, 0, 0),
        verifiedBy: adminUser._id,
        verifiedAt: new Date(),
        note: `Bulk note ${i}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      trackPayment(pid);
    }
    await colPayment.insertMany(bulkPayments1000);

    // l) Ekspor PDF 1.000 baris + cek header & waktu & memori
    const memBefore = process.memoryUsage().heapUsed;
    const tPdfStart = Date.now();
    const pdfRes1000 = await fetchBinary(
      `/api/admin/finance/export?report=transactions&format=pdf&from=${fromDate}&to=${toDate}&q=${encodeURIComponent('Bulk')}`,
      adminToken
    );
    const pdfMs = Date.now() - tPdfStart;
    const memDeltaMb = ((process.memoryUsage().heapUsed - memBefore) / (1024 * 1024)).toFixed(2);

    assert(pdfRes1000.status === 200, `Skenario l: export PDF 1.000 baris gagal (${pdfRes1000.status})`);
    assert(
      pdfRes1000.buffer.subarray(0, 4).toString() === '%PDF' &&
        pdfRes1000.buffer.toString('latin1').trim().endsWith('%%EOF'),
      'Skenario l: berkas PDF harus diawali %PDF dan diakhiri %%EOF'
    );
    const disp = pdfRes1000.headers.get('content-disposition') || '';
    assert(
      pdfRes1000.headers.get('content-type') === 'application/pdf' &&
        /^attachment; filename="[a-z0-9-]+\.pdf"$/.test(disp) &&
        !disp.includes('Bulk') &&
        pdfRes1000.headers.get('cache-control') === 'no-store' &&
        pdfRes1000.headers.get('x-content-type-options') === 'nosniff',
      `Skenario l: header keamanan/filename ekspor PDF tidak sesuai (${disp})`
    );
    console.log(
      `✓ l) Ekspor PDF streaming 1.000 baris lolos (ukuran=${pdfRes1000.buffer.length} byte, waktu=${pdfMs} ms, deltaHeap=${memDeltaMb} MB)`
    );

    // n) Kinerja & jumlah query O(1) dengan >1.000 Payment uji + explain()
    const perfResults = {};
    const queryCounts = {};
    let currentQueryCounter = 0;
    mongoose.set('debug', () => {
      currentQueryCounter += 1;
    });
    try {
      for (const [label, url] of [
        ['summary', `/api/admin/finance/summary?from=${fromDate}&to=${toDate}`],
        ['chart', `/api/admin/finance/chart?from=${fromDate}&to=${toDate}`],
        ['transactions', `/api/admin/finance/transactions?from=${fromDate}&to=${toDate}&page=1&limit=20`],
        ['recap', `/api/admin/finance/recap?groupBy=month&year=${curYear}`],
        ['outstanding', '/api/admin/finance/outstanding'],
      ]) {
        currentQueryCounter = 0;
        const t0 = Date.now();
        const r = await fetchJson(url, adminToken);
        const elapsed = Date.now() - t0;
        assert(r.status === 200, `Skenario n: ${label} gagal saat beban >1000 data`);
        perfResults[label] = `${elapsed} ms`;
        queryCounts[label] = currentQueryCounter;
        assert(
          currentQueryCounter <= 5,
          `Skenario n: jumlah query ${label} terlalu tinggi (${currentQueryCounter}), indikasi N+1`
        );
      }
    } finally {
      mongoose.set('debug', false);
    }

    const explainStart = wibDateTime(fromDate, 0, 0, 0, 0);
    const explainEnd = wibDateTime(toDate, 23, 59, 59, 999);
    const explainDoc = await colPayment
      .aggregate([
        {
          $match: {
            status: 'approved',
            $or: buildEffectivePaidDateOr(explainStart, explainEnd),
          },
        },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ])
      .explain('executionStats');
    const explainStr = JSON.stringify(explainDoc);
    const usesIndex = explainStr.includes('IXSCAN');
    const execStats =
      explainDoc?.stages?.[0]?.$cursor?.executionStats || explainDoc?.executionStats || {};
    const indexNames = Array.from(
      new Set([...explainStr.matchAll(/"indexName":"([^"]+)"/g)].map((m) => m[1]))
    );
    assert(usesIndex, 'Skenario n/1: explain() harus menunjukkan penggunaan IXSCAN indeks Payment');
    console.log(
      `✓ n) Kinerja >1.000 Payment lolos (${JSON.stringify(perfResults)}), queryCounts=${JSON.stringify(queryCounts)}`
    );
    console.log(
      `   explain(): IXSCAN=true, indexNames=${JSON.stringify(indexNames)}, nReturned=${execStats.nReturned}, totalKeysExamined=${execStats.totalKeysExamined}, totalDocsExamined=${execStats.totalDocsExamined}, executionTimeMillis=${execStats.executionTimeMillis}`
    );

    // -----------------------------------------------------------------
    // m) Melebihi batas baris (>2.000 untuk PDF -> 400, XLSX <= 20.000 -> 200), filter, invalid 400, rate limit 429
    // -----------------------------------------------------------------
    const bulkPaymentsMore = [];
    for (let i = 0; i < 1015; i += 1) {
      const pid = new mongoose.Types.ObjectId();
      bulkPaymentsMore.push({
        _id: pid,
        booking: bulkBookings[i % bulkBookings.length]._id,
        type: 'dp',
        amount: 100000,
        method: 'transfer',
        proof: { url: '', publicId: '' },
        status: 'approved',
        attempt: 1,
        source: 'customer',
        paidAt: wibDateTime(dayX, 13, 0, 0, 0),
        verifiedBy: adminUser._id,
        verifiedAt: new Date(),
        note: 'Overflow PDF',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      trackPayment(pid);
    }
    await colPayment.insertMany(bulkPaymentsMore); // Total dalam periode kini > 2.020 baris

    const overPdfRes = await fetchJson(
      `/api/admin/finance/export?report=transactions&format=pdf&from=${fromDate}&to=${toDate}`,
      adminToken
    );
    assert(
      overPdfRes.status === 400 && overPdfRes.body.message.toLowerCase().includes('persempit'),
      `Skenario m: ekspor PDF > 2.000 baris harus 400 dengan saran persempit (${overPdfRes.status}: ${overPdfRes.body?.message})`
    );

    const okXlsx2000 = await fetchBinary(
      `/api/admin/finance/export?report=transactions&format=xlsx&from=${fromDate}&to=${toDate}`,
      adminToken
    );
    assert(okXlsx2000.status === 200, 'Skenario m: ekspor XLSX ~2.026 baris (<= 20.000) harus tetap 200');

    // Filter diterapkan pada isi ekspor: hanya category=wedding + method=lainnya
    const filteredXlsx = await fetchBinary(
      `/api/admin/finance/export?report=transactions&format=xlsx&from=${fromDate}&to=${toDate}&category=wedding&method=lainnya`,
      adminToken
    );
    const wbFiltered = new ExcelJS.Workbook();
    await wbFiltered.xlsx.load(filteredXlsx.buffer);
    const fSheet = wbFiltered.getWorksheet('Transaksi');
    assert(fSheet.rowCount === 3, `Skenario m: filter ekspor harus menyisakan tepat 1 baris data + header + total (dapat ${fSheet.rowCount})`);

    const invalidFmt = await fetchJson('/api/admin/finance/export?report=transactions&format=csv', adminToken);
    const invalidRep = await fetchJson('/api/admin/finance/export?report=audit&format=pdf', adminToken);
    assert(invalidFmt.status === 400 && invalidRep.status === 400, 'Skenario m: format/report tidak dikenal harus 400');

    // Uji rate limit 429 dengan admin khusus dan FINANCE_EXPORT_MAX = 2
    const { token: rateAdminToken } = await createTestAdmin();
    process.env.FINANCE_EXPORT_MAX = '2';
    const rl1 = await fetchBinary('/api/admin/finance/export?report=recap&format=xlsx', rateAdminToken);
    const rl2 = await fetchBinary('/api/admin/finance/export?report=recap&format=xlsx', rateAdminToken);
    const rl3 = await fetchJson('/api/admin/finance/export?report=recap&format=xlsx', rateAdminToken);
    assert(
      rl1.status === 200 && rl2.status === 200 && rl3.status === 429,
      `Skenario m: rate limit ekspor harus 200, 200, 429 (dapat ${rl1.status}, ${rl2.status}, ${rl3.status})`
    );
    console.log('✓ m) Batas baris PDF 400, filter ekspor, format/report invalid 400, dan rate limit 429 terverifikasi');

    console.log('\n================================================================');
    console.log('SELURUH SKENARIO PENGUJIAN DASHBOARD KEUANGAN BERHASIL!');
    console.log('================================================================');
  } finally {
    await cleanTrackedData();
    // Verifikasi p) Tidak ada data uji tersisa
    const leftoverPayments = await Payment.countDocuments({
      booking: { $exists: true },
      'proof.publicId': { $in: ['kalila/proofs/secret-public-id-xyz', 'bulk-secret-id'] },
    });
    const leftoverBookings = await Booking.countDocuments({
      bookingNumber: { $regex: /^KL-(FIN|BULK)-/ },
    });
    if (leftoverPayments !== 0 || leftoverBookings !== 0) {
      throw new Error(
        `Skenario p gagal: masih ada sisa data uji di DB _test (payments=${leftoverPayments}, bookings=${leftoverBookings})`
      );
    }
    console.log('✓ p) Pembersihan data uji DB _test terverifikasi (0 dokumen uji tersisa)');

    await restoreSettings();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectTestDb();
  }
}

runFinanceTests().catch((err) => {
  console.error('\n❌ PENGUJIAN DASHBOARD KEUANGAN GAGAL:', err);
  process.exit(1);
});
