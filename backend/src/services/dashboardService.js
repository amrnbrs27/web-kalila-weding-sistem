const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const {
  getTodayWIB,
  getDayRangeWIB,
  addDays,
  diffDays,
  getMondayOfWeek,
  getMonthStart,
} = require('../utils/dateUtils');

/**
 * 1. Overview Pesanan Dashboard Admin (PRD 5.1)
 */
async function getOrdersOverview(query = {}) {
  const recentLimit = query.recentLimit || 10;
  const upcomingDays = query.upcomingDays || 30;
  const upcomingLimit = query.upcomingLimit || 10;

  const todayStr = getTodayWIB();
  const todayRange = getDayRangeWIB(todayStr);

  const start7DaysStr = addDays(todayStr, -6);
  const sevenDaysRange = {
    start: getDayRangeWIB(start7DaysStr).start,
    end: todayRange.end,
  };

  const maxUpcoming7DaysStr = addDays(todayStr, 6);
  const maxUpcomingStr = addDays(todayStr, upcomingDays);

  const [
    newTodayCount,
    new7DaysCount,
    byStatusRaw,
    upcoming7DaysCount,
    pendingPaymentAgg,
    recentOrdersRaw,
    upcomingEventsRaw,
    pendingPaymentsRaw,
  ] = await Promise.all([
    // newToday: dibuat hari ini (WIB), semua status
    Booking.countDocuments({
      createdAt: { $gte: todayRange.start, $lte: todayRange.end },
    }),

    // new7Days: dibuat dalam 7 hari terakhir (WIB)
    Booking.countDocuments({
      createdAt: { $gte: sevenDaysRange.start, $lte: sevenDaysRange.end },
    }),

    // byStatus: agregasi per status semua waktu
    Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    // upcoming7Days: acara terkonfirmasi/berlangsung dari hari ini s/d 6 hari ke depan
    Booking.countDocuments({
      status: { $in: ['terkonfirmasi', 'berlangsung'] },
      eventDate: { $gte: todayStr, $lte: maxUpcoming7DaysStr },
    }),

    // pendingVerification: antrean pembayaran DP pending
    Payment.aggregate([
      { $match: { type: 'dp', status: 'pending' } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          oldestWaitingSince: { $min: '$createdAt' },
        },
      },
    ]),

    // recentOrders: 10 pesanan terbaru
    Booking.find({})
      .sort({ createdAt: -1 })
      .limit(recentLimit)
      .select(
        '_id bookingNumber createdAt status paymentStatus category packageSnapshot customerSnapshot eventDate eventName source'
      )
      .lean(),

    // upcomingEvents: acara terdekat
    Booking.find({
      status: { $in: ['terkonfirmasi', 'berlangsung'] },
      eventDate: { $gte: todayStr, $lte: maxUpcomingStr },
    })
      .sort({ eventDate: 1, createdAt: 1 })
      .limit(upcomingLimit)
      .select(
        '_id bookingNumber category packageSnapshot customerSnapshot eventDate eventName location paymentStatus'
      )
      .lean(),

    // pendingPayments: 5 antrean pembayaran DP pending terlama
    Payment.find({ type: 'dp', status: 'pending' })
      .sort({ createdAt: 1 })
      .limit(5)
      .populate('booking', 'bookingNumber customerSnapshot category eventDate')
      .select('_id booking amount createdAt attempt')
      .lean(),
  ]);

  // Normalisasi byStatus agar selalu memuat keenam status
  const byStatus = {
    menunggu_dp: 0,
    menunggu_verifikasi: 0,
    terkonfirmasi: 0,
    berlangsung: 0,
    selesai: 0,
    dibatalkan: 0,
  };
  for (const item of byStatusRaw) {
    if (byStatus[item._id] !== undefined) {
      byStatus[item._id] = item.count;
    }
  }

  // Normalisasi pendingVerification
  const pendingInfo = pendingPaymentAgg[0] || { count: 0, oldestWaitingSince: null };
  const pendingVerification = {
    count: pendingInfo.count,
    oldestWaitingSince: pendingInfo.oldestWaitingSince || null,
  };

  // Format recentOrders
  const recentOrders = recentOrdersRaw.map((b) => ({
    id: b._id,
    bookingNumber: b.bookingNumber,
    createdAt: b.createdAt,
    status: b.status,
    paymentStatus: b.paymentStatus,
    category: b.category,
    packageName: b.packageSnapshot?.name || '',
    customerName: b.customerSnapshot?.name || '',
    eventDate: b.eventDate,
    eventName: b.eventName,
    source: b.source,
  }));

  // Format upcomingEvents
  const upcomingEvents = upcomingEventsRaw.map((b) => ({
    id: b._id,
    bookingNumber: b.bookingNumber,
    category: b.category,
    packageName: b.packageSnapshot?.name || '',
    customerName: b.customerSnapshot?.name || '',
    customerPhone: b.customerSnapshot?.phone || '',
    eventDate: b.eventDate,
    eventName: b.eventName,
    location: b.location,
    paymentStatus: b.paymentStatus,
    daysUntil: Math.max(diffDays(todayStr, b.eventDate), 0),
  }));

  // Format pendingPayments
  const pendingPayments = pendingPaymentsRaw.map((p) => ({
    paymentId: p._id,
    bookingNumber: p.booking?.bookingNumber || '',
    customerName: p.booking?.customerSnapshot?.name || '',
    category: p.booking?.category || '',
    eventDate: p.booking?.eventDate || '',
    amount: p.amount,
    createdAt: p.createdAt,
    attempt: p.attempt,
  }));

  return {
    summary: {
      newToday: newTodayCount,
      new7Days: new7DaysCount,
      byStatus,
      upcoming7Days: upcoming7DaysCount,
      pendingVerification,
    },
    recentOrders,
    upcomingEvents,
    pendingPayments,
  };
}

/**
 * 2. Grafik Pesanan Masuk Dashboard Admin (PRD 5.1)
 */
async function getOrdersChart(query = {}) {
  const todayStr = getTodayWIB();
  const to = query.to || todayStr;
  const from = query.from || addDays(to, -29);
  const groupBy = query.groupBy || 'day';
  const includeCancelled =
    query.includeCancelled === false || query.includeCancelled === 'false' ? false : true;

  const fromRange = getDayRangeWIB(from);
  const toRange = getDayRangeWIB(to);

  const matchFilter = {
    createdAt: { $gte: fromRange.start, $lte: toRange.end },
  };

  if (!includeCancelled) {
    matchFilter.status = { $ne: 'dibatalkan' };
  }

  // Agregasi harian di MongoDB dengan timezone Asia/Jakarta
  const dailyAgg = await Booking.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          day: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: 'Asia/Jakarta',
            },
          },
          category: '$category',
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Bangun rentang seluruh tanggal dari from ke to
  const datesInRange = [];
  let curDate = from;
  while (curDate <= to) {
    datesInRange.push(curDate);
    curDate = addDays(curDate, 1);
  }

  // Buat urutan labels unik berdasarkan groupBy
  const labelsSet = new Set();
  const dateToBucketMap = new Map();

  for (const d of datesInRange) {
    let bucket;
    if (groupBy === 'day') {
      bucket = d;
    } else if (groupBy === 'week') {
      bucket = getMondayOfWeek(d);
    } else if (groupBy === 'month') {
      bucket = getMonthStart(d);
    }
    labelsSet.add(bucket);
    dateToBucketMap.set(d, bucket);
  }

  const labels = Array.from(labelsSet).sort();

  // Inisialisasi hitungan per kategori
  const categories = ['dekor', 'catering', 'wedding'];
  const bucketMaps = {
    dekor: new Map(),
    catering: new Map(),
    wedding: new Map(),
  };

  for (const cat of categories) {
    for (const label of labels) {
      bucketMaps[cat].set(label, 0);
    }
  }

  // Akumulasikan data harian ke bucket terkait
  for (const item of dailyAgg) {
    const day = item._id.day;
    const cat = item._id.category;
    const count = item.count;

    if (bucketMaps[cat] && dateToBucketMap.has(day)) {
      const bucket = dateToBucketMap.get(day);
      bucketMaps[cat].set(bucket, (bucketMaps[cat].get(bucket) || 0) + count);
    }
  }

  // Bentuk series
  const series = categories.map((cat) => ({
    category: cat,
    data: labels.map((label) => bucketMaps[cat].get(label) || 0),
  }));

  // Hitung totals
  const totalDekor = series[0].data.reduce((a, b) => a + b, 0);
  const totalCatering = series[1].data.reduce((a, b) => a + b, 0);
  const totalWedding = series[2].data.reduce((a, b) => a + b, 0);
  const totals = {
    dekor: totalDekor,
    catering: totalCatering,
    wedding: totalWedding,
    all: totalDekor + totalCatering + totalWedding,
  };

  return {
    from,
    to,
    groupBy,
    labels,
    series,
    totals,
  };
}

module.exports = {
  getOrdersOverview,
  getOrdersChart,
};
