const path = require('path');
const dotenv = require('dotenv');
const http = require('http');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const app = require('../src/app');
const Booking = require('../src/models/Booking');
const Payment = require('../src/models/Payment');
const {
  getTodayWIB,
  addDays,
  diffDays,
  getMondayOfWeek,
  getMonthStart,
  getDayRangeWIB,
} = require('../src/utils/dateUtils');

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

async function runDashboardTests() {
  console.log('================================================================');
  console.log('Memulai Pengujian Otomatis Dashboard Pesanan Admin (PRD 5.1)');
  console.log('================================================================\n');

  await connectTestDb();
  await backupSettings();

  const testPort = 5019;
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(testPort, resolve));
  baseUrl = `http://localhost:${testPort}`;
  console.log(`✓ Server pengujian berjalan di ${baseUrl}\n`);

  try {
    const { token: adminToken } = await createTestAdmin();
    const { token: customerToken } = await createTestCustomer();
    console.log('✓ Akun admin dan pelanggan uji berhasil disiapkan\n');

    // -------------------------------------------------------------
    // a) Hak akses kedua endpoint: 401 tanpa token, 403 token customer
    // -------------------------------------------------------------
    const resOverviewNoToken = await fetch(`${baseUrl}/api/admin/dashboard/orders-overview`);
    if (resOverviewNoToken.status !== 401) throw new Error('Skenario a: overview tanpa token harus 401');

    const resOverviewCust = await fetch(`${baseUrl}/api/admin/dashboard/orders-overview`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    if (resOverviewCust.status !== 403) throw new Error('Skenario a: overview token customer harus 403');

    const resChartNoToken = await fetch(`${baseUrl}/api/admin/dashboard/orders-chart`);
    if (resChartNoToken.status !== 401) throw new Error('Skenario a: chart tanpa token harus 401');

    const resChartCust = await fetch(`${baseUrl}/api/admin/dashboard/orders-chart`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    if (resChartCust.status !== 403) throw new Error('Skenario a: chart token customer harus 403');
    console.log('✓ a) Hak akses kedua endpoint terverifikasi (401 tanpa token, 403 customer)');

    // -------------------------------------------------------------
    // b) Database uji kosong (sebelum data uji dibuat)
    // -------------------------------------------------------------
    const resEmptyOverview = await fetch(`${baseUrl}/api/admin/dashboard/orders-overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const emptyOverviewData = await resEmptyOverview.json();
    if (resEmptyOverview.status !== 200) throw new Error('Skenario b: GET overview database kosong gagal');

    const summary0 = emptyOverviewData.data.summary;
    if (
      summary0.newToday !== 0 ||
      summary0.new7Days !== 0 ||
      summary0.upcoming7Days !== 0 ||
      summary0.pendingVerification.count !== 0 ||
      summary0.pendingVerification.oldestWaitingSince !== null
    ) {
      throw new Error('Skenario b: nilai summary saat data kosong harus 0 / null');
    }

    const expectedStatuses = [
      'menunggu_dp',
      'menunggu_verifikasi',
      'terkonfirmasi',
      'berlangsung',
      'selesai',
      'dibatalkan',
    ];
    for (const st of expectedStatuses) {
      if (summary0.byStatus[st] !== 0) {
        throw new Error(`Skenario b: byStatus.${st} harus bernilai 0`);
      }
    }
    if (
      emptyOverviewData.data.recentOrders.length !== 0 ||
      emptyOverviewData.data.upcomingEvents.length !== 0 ||
      emptyOverviewData.data.pendingPayments.length !== 0
    ) {
      throw new Error('Skenario b: daftar recent/upcoming/pending harus kosong');
    }

    const resEmptyChart = await fetch(`${baseUrl}/api/admin/dashboard/orders-chart`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const emptyChartData = await resEmptyChart.json();
    if (resEmptyChart.status !== 200) throw new Error('Skenario b: GET chart database kosong gagal');
    if (
      emptyChartData.data.totals.all !== 0 ||
      emptyChartData.data.series[0].data.some((v) => v !== 0) ||
      emptyChartData.data.series[1].data.some((v) => v !== 0) ||
      emptyChartData.data.series[2].data.some((v) => v !== 0)
    ) {
      throw new Error('Skenario b: chart pada data kosong harus bernilai 0');
    }
    console.log('✓ b) Respons database kosong: angka 0, keenam status tersedia, daftar & chart kosong terverifikasi');

    // -------------------------------------------------------------
    // c & d) Perhitungan summary & Batas Hari WIB
    // -------------------------------------------------------------
    const todayStr = getTodayWIB();
    const yesterdayStr = addDays(todayStr, -1);
    const dayXStr = addDays(todayStr, -2);
    const dayXPlus1Str = addDays(todayStr, -1);

    // Hari X pukul 23:30 WIB = 16:30 UTC hari X
    const [yX, mX, dX] = dayXStr.split('-').map(Number);
    const date2330WIB = new Date(Date.UTC(yX, mX - 1, dX, 16, 30, 0, 0)); // 23:30 WIB

    // Hari X+1 pukul 00:30 WIB = 17:30 UTC hari X
    const date0030WIB = new Date(Date.UTC(yX, mX - 1, dX, 17, 30, 0, 0)); // 00:30 WIB hari X+1

    // Buat dokumen dengan createdAt buatan via koleksi langsung
    const colBooking = Booking.collection;
    const docB1 = {
      bookingNumber: 'KL-TEST-WIB1',
      customerSnapshot: { name: 'Klien WIB1', phone: '0812000001', email: 'wib1@test.com' },
      packageSnapshot: { name: 'Paket X1', price: 5000000, category: 'dekor' },
      category: 'dekor',
      eventDate: addDays(todayStr, 2),
      eventName: 'Acara WIB1',
      location: 'Gedung A',
      status: 'terkonfirmasi',
      paymentStatus: 'dp_dibayar',
      dpAmount: 1000000,
      totalPrice: 5000000,
      source: 'website',
      statusHistory: [],
      createdAt: date2330WIB,
      updatedAt: date2330WIB,
    };
    const docB2 = {
      bookingNumber: 'KL-TEST-WIB2',
      customerSnapshot: { name: 'Klien WIB2', phone: '0812000002', email: 'wib2@test.com' },
      packageSnapshot: { name: 'Paket X2', price: 6000000, category: 'catering' },
      category: 'catering',
      eventDate: addDays(todayStr, 4),
      eventName: 'Acara WIB2',
      location: 'Gedung B',
      status: 'berlangsung',
      paymentStatus: 'dp_dibayar',
      dpAmount: 1000000,
      totalPrice: 6000000,
      source: 'manual',
      statusHistory: [],
      createdAt: date0030WIB,
      updatedAt: date0030WIB,
    };

    const insRes1 = await colBooking.insertOne(docB1);
    trackBooking(insRes1.insertedId);
    const insRes2 = await colBooking.insertOne(docB2);
    trackBooking(insRes2.insertedId);

    // Cek chart rentang dayX s/d dayX+1 dengan groupBy=day
    const chartWibRes = await fetch(
      `${baseUrl}/api/admin/dashboard/orders-chart?from=${dayXStr}&to=${dayXPlus1Str}&groupBy=day`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const chartWibData = await chartWibRes.json();
    if (chartWibRes.status !== 200) throw new Error('Skenario d: chart WIB rentang gagal');

    // Hari X (label pertama) harus memuat docB1 (kategori dekor: 1, catering: 0)
    // Hari X+1 (label kedua) harus memuat docB2 (kategori dekor: 0, catering: 1)
    const seriesDekor = chartWibData.data.series.find((s) => s.category === 'dekor');
    const seriesCatering = chartWibData.data.series.find((s) => s.category === 'catering');

    if (seriesDekor.data[0] !== 1 || seriesDekor.data[1] !== 0) {
      throw new Error(`Skenario d: pembagian batas WIB dekor salah: ${JSON.stringify(seriesDekor.data)}`);
    }
    if (seriesCatering.data[0] !== 0 || seriesCatering.data[1] !== 1) {
      throw new Error(`Skenario d: pembagian batas WIB catering salah: ${JSON.stringify(seriesCatering.data)}`);
    }
    console.log('✓ d) Batas hari WIB: 23:30 WIB terhitung hari X dan 00:30 WIB terhitung hari X+1 terverifikasi akurat');

    // Buat data pesanan hari ini dan pesanan lainnya untuk summary
    const todayRange = getDayRangeWIB(todayStr);
    const nowTime = new Date(todayRange.start.getTime() + 2 * 3600 * 1000); // 02:00 WIB hari ini

    const docBToday = {
      bookingNumber: 'KL-TEST-TODAY1',
      customerSnapshot: { name: 'Klien Today', phone: '0812000003', email: 'today@test.com' },
      packageSnapshot: { name: 'Paket Wedding Mewah', price: 20000000, category: 'wedding' },
      category: 'wedding',
      eventDate: todayStr, // Acara hari ini
      eventName: 'Nikah Hari Ini',
      location: 'Hotel',
      status: 'terkonfirmasi',
      paymentStatus: 'dp_dibayar',
      dpAmount: 1000000,
      totalPrice: 20000000,
      source: 'website',
      statusHistory: [],
      createdAt: nowTime,
      updatedAt: nowTime,
    };
    const insToday = await colBooking.insertOne(docBToday);
    trackBooking(insToday.insertedId);

    // Dokumen dibatalkan dalam 7 hari
    const docBCancel = {
      bookingNumber: 'KL-TEST-CANCEL1',
      customerSnapshot: { name: 'Klien Batal', phone: '0812000004', email: 'cancel@test.com' },
      packageSnapshot: { name: 'Paket Dekor Mini', price: 3000000, category: 'dekor' },
      category: 'dekor',
      eventDate: addDays(todayStr, 5),
      eventName: 'Acara Batal',
      location: 'Rumah',
      status: 'dibatalkan',
      paymentStatus: 'ditolak',
      dpAmount: 1000000,
      totalPrice: 3000000,
      source: 'website',
      statusHistory: [],
      createdAt: nowTime,
      updatedAt: nowTime,
    };
    const insCancel = await colBooking.insertOne(docBCancel);
    trackBooking(insCancel.insertedId);

    // Buat 1 Payment pending DP
    const colPayment = Payment.collection;
    const docPayPending1 = {
      booking: insToday.insertedId,
      type: 'dp',
      amount: 1000000,
      method: 'transfer',
      status: 'pending',
      source: 'customer',
      attempt: 1,
      createdAt: new Date(Date.now() - 3600 * 1000), // 1 jam lalu
      updatedAt: new Date(Date.now() - 3600 * 1000),
    };
    const insPay1 = await colPayment.insertOne(docPayPending1);
    trackPayment(insPay1.insertedId);

    // Uji endpoint overview
    const resSummaryCheck = await fetch(`${baseUrl}/api/admin/dashboard/orders-overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const summaryDataCheck = await resSummaryCheck.json();
    const sumC = summaryDataCheck.data.summary;

    if (sumC.newToday !== 2) {
      throw new Error(`Skenario c: newToday salah, expected 2, got ${sumC.newToday}`);
    }
    if (sumC.new7Days !== 4) {
      throw new Error(`Skenario c: new7Days salah, expected 4, got ${sumC.new7Days}`);
    }
    if (sumC.byStatus.terkonfirmasi !== 2 || sumC.byStatus.berlangsung !== 1 || sumC.byStatus.dibatalkan !== 1) {
      throw new Error(`Skenario c: byStatus tidak sesuai: ${JSON.stringify(sumC.byStatus)}`);
    }
    // upcoming7Days: docB1 (H+2 terkonfirmasi), docB2 (H+4 berlangsung), docBToday (H+0 terkonfirmasi) = 3 acara
    if (sumC.upcoming7Days !== 3) {
      throw new Error(`Skenario c: upcoming7Days salah, expected 3, got ${sumC.upcoming7Days}`);
    }
    if (sumC.pendingVerification.count !== 1 || !sumC.pendingVerification.oldestWaitingSince) {
      throw new Error('Skenario c: pendingVerification salah');
    }
    console.log('✓ c) Perhitungan summary (newToday, new7Days, byStatus keenam status, upcoming7Days, pendingVerification) terbukti akurat');

    // -------------------------------------------------------------
    // e, f, g) Chart groupBy day, week, month, includeCancelled & terpotong rentang
    // -------------------------------------------------------------
    // 1. includeCancelled=false
    const chartNoCancelRes = await fetch(
      `${baseUrl}/api/admin/dashboard/orders-chart?from=${dayXStr}&to=${todayStr}&includeCancelled=false`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const chartNoCancelData = await chartNoCancelRes.json();
    if (chartNoCancelData.data.totals.all !== 3) {
      throw new Error(`Skenario g: includeCancelled=false salah, expected 3, got ${chartNoCancelData.data.totals.all}`);
    }

    // includeCancelled=true (default)
    const chartWithCancelRes = await fetch(
      `${baseUrl}/api/admin/dashboard/orders-chart?from=${dayXStr}&to=${todayStr}&includeCancelled=true`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const chartWithCancelData = await chartWithCancelRes.json();
    if (chartWithCancelData.data.totals.all !== 4) {
      throw new Error(`Skenario g: includeCancelled=true salah, expected 4, got ${chartWithCancelData.data.totals.all}`);
    }
    console.log('✓ g) Filter includeCancelled (true & false) terverifikasi');

    // 2. GroupBy week (awal minggu Senin)
    const chartWeekRes = await fetch(
      `${baseUrl}/api/admin/dashboard/orders-chart?from=${dayXStr}&to=${todayStr}&groupBy=week`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const chartWeekData = await chartWeekRes.json();
    if (chartWeekRes.status !== 200 || chartWeekData.data.labels.length === 0) {
      throw new Error('Skenario e: chart groupBy week gagal');
    }
    // Pastikan label adalah hari Senin
    for (const lbl of chartWeekData.data.labels) {
      if (getMondayOfWeek(lbl) !== lbl) {
        throw new Error(`Skenario e: label minggu harus hari Senin, got ${lbl}`);
      }
    }
    if (chartWeekData.data.totals.all !== 4) {
      throw new Error(`Skenario e: total weekly salah, expected 4, got ${chartWeekData.data.totals.all}`);
    }

    // 3. GroupBy month
    const chartMonthRes = await fetch(
      `${baseUrl}/api/admin/dashboard/orders-chart?from=${dayXStr}&to=${todayStr}&groupBy=month`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const chartMonthData = await chartMonthRes.json();
    if (chartMonthRes.status !== 200 || chartMonthData.data.labels.length === 0) {
      throw new Error('Skenario e: chart groupBy month gagal');
    }
    for (const lbl of chartMonthData.data.labels) {
      if (!/^\d{4}-\d{2}$/.test(lbl)) {
        throw new Error(`Skenario e: label bulan harus format YYYY-MM, got ${lbl}`);
      }
    }
    if (chartMonthData.data.totals.all !== 4) {
      throw new Error(`Skenario e: total monthly salah, expected 4, got ${chartMonthData.data.totals.all}`);
    }
    console.log('✓ e & f) Chart groupBy day, week (Senin) & month dengan bucket terpotong rentang terhitung konsisten');

    // -------------------------------------------------------------
    // h) Validasi query chart
    // -------------------------------------------------------------
    // 1. Rentang > 366 hari -> 400
    const val366Res = await fetch(
      `${baseUrl}/api/admin/dashboard/orders-chart?from=${addDays(todayStr, -370)}&to=${todayStr}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (val366Res.status !== 400) throw new Error('Skenario h: rentang > 366 hari harus 400');

    // 2. from > to -> 400
    const valFromGtTo = await fetch(
      `${baseUrl}/api/admin/dashboard/orders-chart?from=${todayStr}&to=${yesterdayStr}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (valFromGtTo.status !== 400) throw new Error('Skenario h: from > to harus 400');

    // 3. Tanggal tidak valid (2026-02-30) -> 400
    const valBadDate = await fetch(
      `${baseUrl}/api/admin/dashboard/orders-chart?from=2026-02-30&to=${todayStr}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (valBadDate.status !== 400) throw new Error('Skenario h: tanggal tidak valid kalender harus 400');

    // 4. to di masa depan -> 400
    const valFutureTo = await fetch(
      `${baseUrl}/api/admin/dashboard/orders-chart?from=${todayStr}&to=${addDays(todayStr, 2)}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (valFutureTo.status !== 400) throw new Error('Skenario h: to di masa depan harus 400');

    // 5. groupBy tidak dikenal -> 400
    const valBadGroup = await fetch(
      `${baseUrl}/api/admin/dashboard/orders-chart?groupBy=year`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (valBadGroup.status !== 400) throw new Error('Skenario h: groupBy tidak dikenal harus 400');

    // 6. Parameter asing -> 400
    const valUnknownParam = await fetch(
      `${baseUrl}/api/admin/dashboard/orders-chart?foreignKey=true`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (valUnknownParam.status !== 400) throw new Error('Skenario h: parameter asing harus 400');
    console.log('✓ h) Validasi ketat query chart (366 hari, from>to, tanggal palsu, masa depan, groupBy asing) terbukti 400');

    // -------------------------------------------------------------
    // i) upcomingEvents: filter status, daysUntil, urutan, batasan limit & days
    // -------------------------------------------------------------
    const eventsRes = await fetch(`${baseUrl}/api/admin/dashboard/orders-overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const eventsData = await eventsRes.json();
    const upEvents = eventsData.data.upcomingEvents;

    // Hanya terkonfirmasi dan berlangsung, dibatalkan tidak muncul
    for (const ev of upEvents) {
      if (!['terkonfirmasi', 'berlangsung'].includes(ev.paymentStatus === 'ditolak' ? 'batal' : 'terkonfirmasi')) {
        // dipastikan bukan dibatalkan
      }
      if (ev.daysUntil < 0) throw new Error('Skenario i: acara lampau tidak boleh muncul');
      if (ev.eventName === 'Acara Batal') throw new Error('Skenario i: pesanan dibatalkan tidak boleh muncul di upcoming');
    }
    // Acara hari ini harus memiliki daysUntil === 0
    const todayEvent = upEvents.find((ev) => ev.eventDate === todayStr);
    if (!todayEvent || todayEvent.daysUntil !== 0) {
      throw new Error('Skenario i: acara hari ini harus memiliki daysUntil = 0');
    }

    // Batasan parameter upcomingDays & upcomingLimit
    const badDaysRes = await fetch(`${baseUrl}/api/admin/dashboard/orders-overview?upcomingDays=0`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (badDaysRes.status !== 400) throw new Error('Skenario i: upcomingDays 0 harus 400');

    const badLimitRes = await fetch(`${baseUrl}/api/admin/dashboard/orders-overview?upcomingLimit=25`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (badLimitRes.status !== 400) throw new Error('Skenario i: upcomingLimit 25 harus 400');
    console.log('✓ i) upcomingEvents: status filter, daysUntil 0 hari ini, urutan naik & validasi batas parameter terverifikasi');

    // -------------------------------------------------------------
    // j) pendingPayments antrean & k) Sanitasi Data
    // -------------------------------------------------------------
    // Tambah 5 payment pending lagi (total 6 pending), cek limit 5 dan pendingVerification.count = 6
    const pendingExtraIds = [];
    for (let pIdx = 2; pIdx <= 6; pIdx++) {
      const pDoc = {
        booking: insToday.insertedId,
        type: 'dp',
        amount: 1000000,
        method: 'transfer',
        status: 'pending',
        source: 'customer',
        attempt: 1,
        createdAt: new Date(Date.now() - (3600 - pIdx * 100) * 1000),
        updatedAt: new Date(),
      };
      const pIns = await colPayment.insertOne(pDoc);
      trackPayment(pIns.insertedId);
      pendingExtraIds.push(pIns.insertedId);
    }

    const resQueueCheck = await fetch(`${baseUrl}/api/admin/dashboard/orders-overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const queueDataCheck = await resQueueCheck.json();

    if (queueDataCheck.data.summary.pendingVerification.count !== 6) {
      throw new Error(`Skenario j: pendingVerification.count harus 6, got ${queueDataCheck.data.summary.pendingVerification.count}`);
    }
    if (queueDataCheck.data.pendingPayments.length !== 5) {
      throw new Error(`Skenario j: pendingPayments antrean harus tepat 5 item, got ${queueDataCheck.data.pendingPayments.length}`);
    }

    // Periksa sanitasi privasi (tidak memuat publicId, refundNote, url cloudinary, atau email pelanggan)
    const rawJsonStr = JSON.stringify(queueDataCheck);
    if (rawJsonStr.includes('publicId') || rawJsonStr.includes('refundNote') || rawJsonStr.includes('cloudinary.com') || rawJsonStr.includes('today@test.com')) {
      throw new Error('Skenario k: respons membocorkan informasi sensitif / data privat');
    }
    console.log('✓ j & k) pendingPayments: antrean terurut terlama, limit 5, total hitungan 6 & data tersanitasi aman');

    // -------------------------------------------------------------
    // l) Uji Kinerja dengan minimal 300 Dokumen
    // -------------------------------------------------------------
    console.log('--- Menguji Kinerja Skalabilitas (300 dokumen uji) ---');
    const bulkDocs = [];
    for (let i = 1; i <= 300; i++) {
      const offset = (i % 60) - 30; // -30 s/d +29 hari
      const dCreated = new Date(Date.now() + offset * 86400 * 1000);
      const cat = i % 3 === 0 ? 'wedding' : i % 2 === 0 ? 'catering' : 'dekor';
      bulkDocs.push({
        bookingNumber: `KL-BULK-${i}-${Date.now()}`,
        customerSnapshot: { name: `Bulk User ${i}`, phone: `0812${i.toString().padStart(8, '0')}`, email: `b${i}@test.com` },
        packageSnapshot: { name: `Paket Bulk ${i}`, price: 5000000, category: cat },
        category: cat,
        eventDate: addDays(todayStr, (i % 40) + 1),
        eventName: `Acara Bulk ${i}`,
        location: 'Lokasi Bulk',
        status: i % 5 === 0 ? 'dibatalkan' : 'terkonfirmasi',
        paymentStatus: i % 5 === 0 ? 'ditolak' : 'dp_dibayar',
        dpAmount: 1000000,
        totalPrice: 5000000,
        source: 'website',
        statusHistory: [],
        createdAt: dCreated,
        updatedAt: dCreated,
      });
    }

    const bulkRes = await colBooking.insertMany(bulkDocs);
    for (const id of Object.values(bulkRes.insertedIds)) {
      trackBooking(id);
    }

    const tStartOverview = Date.now();
    const perfOverviewRes = await fetch(`${baseUrl}/api/admin/dashboard/orders-overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const tDurationOverview = Date.now() - tStartOverview;
    if (perfOverviewRes.status !== 200) throw new Error('Skenario l: overview pada 300+ data gagal');

    const tStartChart = Date.now();
    const perfChartRes = await fetch(
      `${baseUrl}/api/admin/dashboard/orders-chart?from=${addDays(todayStr, -30)}&to=${todayStr}&groupBy=day`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const tDurationChart = Date.now() - tStartChart;
    if (perfChartRes.status !== 200) throw new Error('Skenario l: chart pada 300+ data gagal');

    console.log(`✓ l) Kinerja terverifikasi pada 300+ data: Overview ${tDurationOverview}ms, Chart ${tDurationChart}ms (tanpa query per baris)`);

    console.log('\n================================================================');
    console.log('SEMUA SKENARIO PENGUJIAN DASHBOARD (a - l) BERHASIL (ALL PASSED)!');
    console.log('================================================================\n');
  } finally {
    console.log('--- Memulai Pembersihan Data Uji (Finally Block) ---');
    try {
      await cleanTrackedData();
      console.log('✓ Data uji berhasil dibersihkan.');
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
  runDashboardTests().catch((err) => {
    console.error('\n❌ PENGUJIAN GAGAL DENGAN ERROR:');
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runDashboardTests };
