const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const {
  getTodayWIB,
  getDayRangeWIB,
  addDays,
  diffDays,
  getMondayOfWeek,
  getMonthStart,
} = require('../utils/dateUtils');
const { resolveFinanceDateRange } = require('../validators/finance.validator');

const CATEGORIES = ['dekor', 'catering', 'wedding'];
const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

// Ekspresi tanggal transaksi efektif: paidAt -> verifiedAt -> createdAt
const EFFECTIVE_PAID_AT_EXPR = {
  $ifNull: ['$paidAt', { $ifNull: ['$verifiedAt', '$createdAt'] }],
};

/**
 * Membangun kondisi $or yang terindeks pada koleksi Payment untuk filter rentang tanggal efektif
 * (paidAt -> verifiedAt -> createdAt) dalam objek Date UTC (sudah dikonversi dari batas hari WIB).
 */
function buildEffectivePaidDateOr(startDate, endDate) {
  return [
    { paidAt: { $gte: startDate, $lte: endDate } },
    { paidAt: null, verifiedAt: { $gte: startDate, $lte: endDate } },
    { paidAt: null, verifiedAt: null, createdAt: { $gte: startDate, $lte: endDate } },
  ];
}

/**
 * Meng-escape karakter khusus regex untuk mencegah regex injection / ReDoS pada pencarian teks.
 */
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Menghitung persentase perubahan dibulatkan 1 angka desimal; null bila pembanding bernilai 0.
 */
function calcPercentChange(currentVal, previousVal) {
  if (!previousVal) {
    return null;
  }
  const pct = ((currentVal - previousVal) / Math.abs(previousVal)) * 100;
  return Math.round(pct * 10) / 10;
}

/**
 * Membuat struktur kosong byCategory agar ketiga kategori selalu tersedia.
 */
function createEmptyByCategory() {
  return {
    dekor: { gross: 0, refunds: 0, net: 0 },
    catering: { gross: 0, refunds: 0, net: 0 },
    wedding: { gross: 0, refunds: 0, net: 0 },
  };
}

/**
 * Menjalankan agregasi ringkasan arus kas approved pada rentang tanggal UTC [startDate, endDate].
 */
async function aggregateCashPeriod(startDate, endDate, includeTopAndCounts = true) {
  const facet = {
    overall: [
      {
        $group: {
          _id: null,
          dp: { $sum: { $cond: [{ $eq: ['$type', 'dp'] }, '$amount', 0] } },
          pelunasan: { $sum: { $cond: [{ $eq: ['$type', 'pelunasan'] }, '$amount', 0] } },
          pengembalian: { $sum: { $cond: [{ $eq: ['$type', 'pengembalian'] }, '$amount', 0] } },
          payments: { $sum: 1 },
        },
      },
    ],
    byCategory: [
      {
        $group: {
          _id: '$category',
          gross: {
            $sum: { $cond: [{ $in: ['$type', ['dp', 'pelunasan']] }, '$amount', 0] },
          },
          refunds: {
            $sum: { $cond: [{ $eq: ['$type', 'pengembalian'] }, '$amount', 0] },
          },
        },
      },
    ],
  };

  if (includeTopAndCounts) {
    facet.distinctBookings = [
      { $group: { _id: '$booking' } },
      { $count: 'count' },
    ];
    facet.topPackages = [
      {
        $group: {
          _id: '$packageName',
          gross: {
            $sum: { $cond: [{ $in: ['$type', ['dp', 'pelunasan']] }, '$amount', 0] },
          },
          refunds: {
            $sum: { $cond: [{ $eq: ['$type', 'pengembalian'] }, '$amount', 0] },
          },
          paymentsCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          packageName: '$_id',
          gross: { $round: ['$gross', 0] },
          refunds: { $round: ['$refunds', 0] },
          net: { $round: [{ $subtract: ['$gross', '$refunds'] }, 0] },
          paymentsCount: 1,
        },
      },
      { $sort: { net: -1, gross: -1, packageName: 1 } },
      { $limit: 5 },
    ];
  }

  const pipeline = [
    {
      $match: {
        status: 'approved',
        $or: buildEffectivePaidDateOr(startDate, endDate),
      },
    },
    {
      $lookup: {
        from: 'bookings',
        localField: 'booking',
        foreignField: '_id',
        pipeline: [{ $project: { category: 1, 'packageSnapshot.name': 1 } }],
        as: 'bookingDoc',
      },
    },
    { $unwind: '$bookingDoc' },
    {
      $project: {
        type: 1,
        amount: 1,
        booking: 1,
        category: '$bookingDoc.category',
        packageName: {
          $let: {
            vars: {
              trimmed: {
                $trim: { input: { $ifNull: ['$bookingDoc.packageSnapshot.name', ''] } },
              },
            },
            in: {
              $cond: [{ $eq: ['$$trimmed', ''] }, 'Tanpa paket', '$$trimmed'],
            },
          },
        },
      },
    },
    { $facet: facet },
  ];

  const [aggResult] = await Payment.aggregate(pipeline);
  const overallRow = aggResult?.overall?.[0] || {
    dp: 0,
    pelunasan: 0,
    pengembalian: 0,
    payments: 0,
  };

  const dp = Math.round(overallRow.dp || 0);
  const pelunasan = Math.round(overallRow.pelunasan || 0);
  const pengembalian = Math.round(overallRow.pengembalian || 0);
  const gross = dp + pelunasan;
  const refunds = pengembalian;
  const net = gross - refunds;

  const byCategory = createEmptyByCategory();
  for (const row of aggResult?.byCategory || []) {
    if (byCategory[row._id]) {
      const catGross = Math.round(row.gross || 0);
      const catRefunds = Math.round(row.refunds || 0);
      byCategory[row._id] = {
        gross: catGross,
        refunds: catRefunds,
        net: catGross - catRefunds,
      };
    }
  }

  return {
    gross,
    refunds,
    net,
    byType: { dp, pelunasan, pengembalian },
    byCategory,
    counts: {
      payments: overallRow.payments || 0,
      bookings: aggResult?.distinctBookings?.[0]?.count || 0,
    },
    topPackages: aggResult?.topPackages || [],
  };
}

/**
 * Mengambil ringkasan piutang saat ini (tidak terikat periode) secara konsisten
 * dengan daftar GET /api/admin/finance/outstanding.
 */
async function getOutstandingSummary(todayStr) {
  const [aggResult] = await Booking.aggregate([
    {
      $match: {
        status: { $in: ['terkonfirmasi', 'berlangsung', 'selesai'] },
        paymentStatus: { $ne: 'lunas' },
      },
    },
    {
      $project: {
        eventDate: 1,
        effectiveTotal: { $ifNull: ['$totalPrice', '$packageSnapshot.price'] },
      },
    },
    {
      $facet: {
        unpriced: [{ $match: { effectiveTotal: null } }, { $count: 'count' }],
        priced: [
          { $match: { effectiveTotal: { $ne: null } } },
          {
            $lookup: {
              from: 'payments',
              let: { bookingId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$booking', '$$bookingId'] },
                        { $eq: ['$status', 'approved'] },
                        { $in: ['$type', ['dp', 'pelunasan']] },
                      ],
                    },
                  },
                },
                {
                  $group: {
                    _id: null,
                    paidSum: { $sum: '$amount' },
                  },
                },
              ],
              as: 'paidInfo',
            },
          },
          {
            $addFields: {
              paidSum: { $ifNull: [{ $arrayElemAt: ['$paidInfo.paidSum', 0] }, 0] },
            },
          },
          {
            $addFields: {
              remaining: {
                $max: [{ $subtract: ['$effectiveTotal', '$paidSum'] }, 0],
              },
            },
          },
          { $match: { remaining: { $gt: 0 } } },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              amount: { $sum: '$remaining' },
              overdueCount: {
                $sum: { $cond: [{ $lt: ['$eventDate', todayStr] }, 1, 0] },
              },
            },
          },
        ],
      },
    },
  ]);

  const pricedRow = aggResult?.priced?.[0] || { count: 0, amount: 0, overdueCount: 0 };
  const unpricedCount = aggResult?.unpriced?.[0]?.count || 0;

  return {
    count: pricedRow.count || 0,
    amount: Math.round(pricedRow.amount || 0),
    overdueCount: pricedRow.overdueCount || 0,
    totalBelumDitetapkan: unpricedCount,
  };
}

/**
 * 1. Ringkasan Keuangan Dashboard Admin (PRD 5.2)
 */
async function getFinanceSummary(query = {}) {
  const { today, from, to } = resolveFinanceDateRange(query.from, query.to);
  const days = diffDays(from, to) + 1;

  const prevTo = addDays(from, -1);
  const prevFrom = addDays(from, -days);

  const currRange = {
    start: getDayRangeWIB(from).start,
    end: getDayRangeWIB(to).end,
  };
  const prevRange = {
    start: getDayRangeWIB(prevFrom).start,
    end: getDayRangeWIB(prevTo).end,
  };

  const [currData, prevData, outstanding, pendingAgg] = await Promise.all([
    aggregateCashPeriod(currRange.start, currRange.end, true),
    aggregateCashPeriod(prevRange.start, prevRange.end, false),
    getOutstandingSummary(today),
    Payment.aggregate([
      { $match: { type: 'dp', status: 'pending' } },
      {
        $lookup: {
          from: 'bookings',
          localField: 'booking',
          foreignField: '_id',
          pipeline: [{ $project: { _id: 1 } }],
          as: 'bookingDoc',
        },
      },
      { $unwind: '$bookingDoc' },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
        },
      },
    ]),
  ]);

  const pendingRow = pendingAgg[0] || { count: 0, amount: 0 };

  return {
    period: { from, to, days },
    gross: currData.gross,
    refunds: currData.refunds,
    net: currData.net,
    byType: currData.byType,
    byCategory: currData.byCategory,
    counts: currData.counts,
    previous: {
      from: prevFrom,
      to: prevTo,
      gross: prevData.gross,
      refunds: prevData.refunds,
      net: prevData.net,
    },
    change: {
      net: calcPercentChange(currData.net, prevData.net),
      gross: calcPercentChange(currData.gross, prevData.gross),
    },
    topPackages: currData.topPackages,
    outstanding,
    pendingVerification: {
      count: pendingRow.count || 0,
      amount: Math.round(pendingRow.amount || 0),
    },
  };
}

/**
 * 2. Grafik Arus Kas Keuangan Dashboard Admin (PRD 5.2)
 */
async function getFinanceChart(query = {}) {
  const { from, to } = resolveFinanceDateRange(query.from, query.to);
  const groupBy = query.groupBy || 'day';
  const breakdown = query.breakdown || 'category';

  const fromRange = getDayRangeWIB(from);
  const toRange = getDayRangeWIB(to);

  const pipeline = [
    {
      $match: {
        status: 'approved',
        $or: buildEffectivePaidDateOr(fromRange.start, toRange.end),
      },
    },
  ];

  if (breakdown === 'category') {
    pipeline.push(
      {
        $lookup: {
          from: 'bookings',
          localField: 'booking',
          foreignField: '_id',
          pipeline: [{ $project: { category: 1 } }],
          as: 'bookingDoc',
        },
      },
      { $unwind: '$bookingDoc' },
      {
        $group: {
          _id: {
            day: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: EFFECTIVE_PAID_AT_EXPR,
                timezone: 'Asia/Jakarta',
              },
            },
            key: '$bookingDoc.category',
          },
          amount: {
            $sum: {
              $cond: [
                { $eq: ['$type', 'pengembalian'] },
                { $multiply: ['$amount', -1] },
                '$amount',
              ],
            },
          },
        },
      }
    );
  } else {
    pipeline.push(
      {
        $lookup: {
          from: 'bookings',
          localField: 'booking',
          foreignField: '_id',
          pipeline: [{ $project: { _id: 1 } }],
          as: 'bookingDoc',
        },
      },
      { $unwind: '$bookingDoc' },
      {
        $group: {
          _id: {
            day: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: EFFECTIVE_PAID_AT_EXPR,
                timezone: 'Asia/Jakarta',
              },
            },
            key: '$type',
          },
          amount: { $sum: '$amount' },
        },
      }
    );
  }

  const dailyAgg = await Payment.aggregate(pipeline);

  // Bangun seluruh tanggal dalam rentang [from, to]
  const labelsSet = new Set();
  const dateToBucketMap = new Map();
  let curDate = from;

  while (curDate <= to) {
    let bucket = curDate;
    if (groupBy === 'week') {
      bucket = getMondayOfWeek(curDate);
    } else if (groupBy === 'month') {
      bucket = getMonthStart(curDate);
    }
    labelsSet.add(bucket);
    dateToBucketMap.set(curDate, bucket);
    curDate = addDays(curDate, 1);
  }

  const labels = Array.from(labelsSet).sort();
  const keys =
    breakdown === 'category' ? ['dekor', 'catering', 'wedding'] : ['dp', 'pelunasan', 'pengembalian'];

  const bucketMaps = {};
  for (const key of keys) {
    bucketMaps[key] = new Map();
    for (const label of labels) {
      bucketMaps[key].set(label, 0);
    }
  }

  for (const row of dailyAgg) {
    const day = row._id?.day;
    const key = row._id?.key;
    if (bucketMaps[key] && dateToBucketMap.has(day)) {
      const bucket = dateToBucketMap.get(day);
      const prev = bucketMaps[key].get(bucket) || 0;
      bucketMaps[key].set(bucket, prev + Math.round(row.amount || 0));
    }
  }

  const series = keys.map((key) => ({
    key,
    data: labels.map((label) => bucketMaps[key].get(label) || 0),
  }));

  const totals = {};
  for (const s of series) {
    totals[s.key] = s.data.reduce((acc, v) => acc + v, 0);
  }

  if (breakdown === 'category') {
    totals.net = totals.dekor + totals.catering + totals.wedding;
  } else {
    totals.gross = totals.dp + totals.pelunasan;
    totals.net = totals.dp + totals.pelunasan - totals.pengembalian;
  }

  return {
    from,
    to,
    groupBy,
    breakdown,
    labels,
    series,
    totals,
  };
}

/**
 * Membangun tahapan awal agregasi daftar transaksi (dipakai oleh endpoint JSON dan ekspor).
 */
function buildTransactionsBasePipeline(query = {}) {
  const { from, to } = resolveFinanceDateRange(query.from, query.to);
  const status = query.status || 'approved';
  const fromStart = getDayRangeWIB(from).start;
  const toEnd = getDayRangeWIB(to).end;

  const paymentMatch = {
    status,
    $or: buildEffectivePaidDateOr(fromStart, toEnd),
  };

  if (query.type) paymentMatch.type = query.type;
  if (query.method) paymentMatch.method = query.method;
  if (query.source) paymentMatch.source = query.source;

  const pipeline = [
    { $match: paymentMatch },
    {
      $lookup: {
        from: 'bookings',
        localField: 'booking',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              bookingNumber: 1,
              category: 1,
              'customerSnapshot.name': 1,
              'packageSnapshot.name': 1,
            },
          },
        ],
        as: 'bookingDoc',
      },
    },
    { $unwind: '$bookingDoc' },
  ];

  const bookingFilterMatch = {};
  if (query.category) {
    bookingFilterMatch['bookingDoc.category'] = query.category;
  }

  const qTrimmed = typeof query.q === 'string' ? query.q.trim() : '';
  if (qTrimmed) {
    const safeRegex = new RegExp(escapeRegex(qTrimmed), 'i');
    bookingFilterMatch.$or = [
      { 'bookingDoc.bookingNumber': safeRegex },
      { 'bookingDoc.customerSnapshot.name': safeRegex },
      { 'bookingDoc.packageSnapshot.name': safeRegex },
    ];
  }

  if (Object.keys(bookingFilterMatch).length > 0) {
    pipeline.push({ $match: bookingFilterMatch });
  }

  pipeline.push({
    $addFields: {
      effectivePaidAt: EFFECTIVE_PAID_AT_EXPR,
    },
  });

  return { pipeline, resolvedFilters: { ...query, from, to, status, q: qTrimmed } };
}

/**
 * Memetakan whitelist sort ke stage $sort MongoDB.
 */
function getTransactionSortStage(sortKey = 'terbaru') {
  switch (sortKey) {
    case 'terlama':
      return { effectivePaidAt: 1, createdAt: 1, _id: 1 };
    case 'nominal_besar':
      return { amount: -1, effectivePaidAt: -1, _id: -1 };
    case 'nominal_kecil':
      return { amount: 1, effectivePaidAt: -1, _id: -1 };
    case 'terbaru':
    default:
      return { effectivePaidAt: -1, createdAt: -1, _id: -1 };
  }
}

/**
 * Tahapan proyeksi dokumen transaksi agar tidak pernah memuat bukti, publicId, atau rekening.
 */
function getTransactionLookupAndProjectStages() {
  return [
    {
      $lookup: {
        from: 'users',
        localField: 'verifiedBy',
        foreignField: '_id',
        pipeline: [{ $project: { name: 1 } }],
        as: 'verifierDoc',
      },
    },
    { $unwind: { path: '$verifierDoc', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        id: '$_id',
        bookingNumber: { $ifNull: ['$bookingDoc.bookingNumber', ''] },
        customerName: { $ifNull: ['$bookingDoc.customerSnapshot.name', ''] },
        category: { $ifNull: ['$bookingDoc.category', ''] },
        packageName: { $ifNull: ['$bookingDoc.packageSnapshot.name', ''] },
        type: 1,
        direction: {
          $cond: [{ $eq: ['$type', 'pengembalian'] }, 'keluar', 'masuk'],
        },
        amount: { $round: ['$amount', 0] },
        method: 1,
        paidAt: '$effectivePaidAt',
        source: 1,
        status: 1,
        verifiedByName: { $ifNull: ['$verifierDoc.name', ''] },
        note: { $ifNull: ['$note', ''] },
      },
    },
  ];
}

/**
 * 3. Daftar Transaksi Keuangan Admin (Paginasi + Totals Seluruh Filter)
 */
async function getFinanceTransactions(query = {}) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const sortKey = query.sort || 'terbaru';

  const { pipeline, resolvedFilters } = buildTransactionsBasePipeline(query);
  const sortStage = getTransactionSortStage(sortKey);

  const [aggResult] = await Payment.aggregate([
    ...pipeline,
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              masuk: {
                $sum: { $cond: [{ $in: ['$type', ['dp', 'pelunasan']] }, '$amount', 0] },
              },
              keluar: {
                $sum: { $cond: [{ $eq: ['$type', 'pengembalian'] }, '$amount', 0] },
              },
              count: { $sum: 1 },
            },
          },
        ],
        items: [
          { $sort: sortStage },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          ...getTransactionLookupAndProjectStages(),
        ],
      },
    },
  ]);

  const rawTotals = aggResult?.totals?.[0] || { masuk: 0, keluar: 0, count: 0 };
  const masuk = Math.round(rawTotals.masuk || 0);
  const keluar = Math.round(rawTotals.keluar || 0);
  const count = rawTotals.count || 0;

  return {
    items: aggResult?.items || [],
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit) || 0,
    },
    totals: {
      masuk,
      keluar,
      net: masuk - keluar,
      count,
    },
    filters: {
      from: resolvedFilters.from,
      to: resolvedFilters.to,
      type: resolvedFilters.type || null,
      category: resolvedFilters.category || null,
      method: resolvedFilters.method || null,
      source: resolvedFilters.source || null,
      status: resolvedFilters.status,
      q: resolvedFilters.q || '',
      sort: sortKey,
    },
  };
}

/**
 * Menghitung jumlah baris transaksi dan totals untuk validasi batas ekspor.
 */
async function getTransactionsExportMeta(query = {}) {
  const { pipeline, resolvedFilters } = buildTransactionsBasePipeline(query);
  const [aggResult] = await Payment.aggregate([
    ...pipeline,
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        masuk: {
          $sum: { $cond: [{ $in: ['$type', ['dp', 'pelunasan']] }, '$amount', 0] },
        },
        keluar: {
          $sum: { $cond: [{ $eq: ['$type', 'pengembalian'] }, '$amount', 0] },
        },
      },
    },
  ]);

  const masuk = Math.round(aggResult?.masuk || 0);
  const keluar = Math.round(aggResult?.keluar || 0);

  // Rincian per kategori untuk sheet Ringkasan
  const catRows = await Payment.aggregate([
    ...pipeline,
    {
      $group: {
        _id: '$bookingDoc.category',
        masuk: {
          $sum: { $cond: [{ $in: ['$type', ['dp', 'pelunasan']] }, '$amount', 0] },
        },
        keluar: {
          $sum: { $cond: [{ $eq: ['$type', 'pengembalian'] }, '$amount', 0] },
        },
      },
    },
  ]);

  const byCategory = createEmptyByCategory();
  for (const row of catRows) {
    if (byCategory[row._id]) {
      const gross = Math.round(row.masuk || 0);
      const refunds = Math.round(row.keluar || 0);
      byCategory[row._id] = { gross, refunds, net: gross - refunds };
    }
  }

  return {
    count: aggResult?.count || 0,
    totals: {
      masuk,
      keluar,
      net: masuk - keluar,
      count: aggResult?.count || 0,
    },
    byCategory,
    filters: resolvedFilters,
  };
}

/**
 * Membuka kursor streaming agregasi transaksi untuk ekspor berukuran besar (hemat memori).
 */
function createTransactionsExportCursor(query = {}) {
  const sortKey = query.sort || 'terbaru';
  const { pipeline } = buildTransactionsBasePipeline(query);
  return Payment.aggregate([
    ...pipeline,
    { $sort: getTransactionSortStage(sortKey) },
    ...getTransactionLookupAndProjectStages(),
  ]).cursor({ batchSize: 500 });
}

/**
 * 4. Rekap Pendapatan Bulanan / Tahunan (PRD 5.2)
 */
async function getFinanceRecap(query = {}) {
  const currentYear = Number(getTodayWIB().slice(0, 4));
  const groupBy = query.groupBy || 'month';
  const resolvedYear = query.year !== undefined ? Number(query.year) : currentYear;
  const resolvedToYear = query.toYear !== undefined ? Number(query.toYear) : currentYear;
  const resolvedFromYear =
    query.fromYear !== undefined ? Number(query.fromYear) : Math.max(2000, resolvedToYear - 2);

  let startDate;
  let endDate;
  let rowKeys = [];

  if (groupBy === 'month') {
    startDate = getDayRangeWIB(`${resolvedYear}-01-01`).start;
    endDate = getDayRangeWIB(`${resolvedYear}-12-31`).end;
    rowKeys = Array.from({ length: 12 }, (_, idx) => idx + 1);
  } else {
    startDate = getDayRangeWIB(`${resolvedFromYear}-01-01`).start;
    endDate = getDayRangeWIB(`${resolvedToYear}-12-31`).end;
    for (let y = resolvedFromYear; y <= resolvedToYear; y += 1) {
      rowKeys.push(y);
    }
  }

  const periodExpr =
    groupBy === 'month'
      ? { $month: { date: EFFECTIVE_PAID_AT_EXPR, timezone: 'Asia/Jakarta' } }
      : { $year: { date: EFFECTIVE_PAID_AT_EXPR, timezone: 'Asia/Jakarta' } };

  const aggRows = await Payment.aggregate([
    {
      $match: {
        status: 'approved',
        $or: buildEffectivePaidDateOr(startDate, endDate),
      },
    },
    {
      $lookup: {
        from: 'bookings',
        localField: 'booking',
        foreignField: '_id',
        pipeline: [{ $project: { category: 1 } }],
        as: 'bookingDoc',
      },
    },
    { $unwind: '$bookingDoc' },
    {
      $group: {
        _id: {
          period: periodExpr,
          category: '$bookingDoc.category',
          type: '$type',
        },
        amount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const rowMap = new Map();
  for (const key of rowKeys) {
    rowMap.set(key, {
      gross: 0,
      refunds: 0,
      net: 0,
      byCategory: { dekor: 0, catering: 0, wedding: 0 },
      counts: { payments: 0 },
    });
  }

  for (const item of aggRows) {
    const periodKey = item._id?.period;
    const cat = item._id?.category;
    const type = item._id?.type;
    const amount = Math.round(item.amount || 0);
    const count = item.count || 0;

    const target = rowMap.get(periodKey);
    if (!target) continue;

    target.counts.payments += count;
    if (type === 'pengembalian') {
      target.refunds += amount;
      if (CATEGORIES.includes(cat)) {
        target.byCategory[cat] -= amount;
      }
    } else {
      target.gross += amount;
      if (CATEGORIES.includes(cat)) {
        target.byCategory[cat] += amount;
      }
    }
    target.net = target.gross - target.refunds;
  }

  const totals = {
    gross: 0,
    refunds: 0,
    net: 0,
    byCategory: { dekor: 0, catering: 0, wedding: 0 },
    counts: { payments: 0 },
  };

  const rows = rowKeys.map((key) => {
    const data = rowMap.get(key);
    totals.gross += data.gross;
    totals.refunds += data.refunds;
    totals.net += data.net;
    totals.counts.payments += data.counts.payments;
    for (const cat of CATEGORIES) {
      totals.byCategory[cat] += data.byCategory[cat];
    }

    if (groupBy === 'month') {
      return {
        label: MONTH_NAMES_ID[key - 1],
        month: key,
        period: `${resolvedYear}-${String(key).padStart(2, '0')}`,
        ...data,
      };
    }

    return {
      label: String(key),
      year: key,
      ...data,
    };
  });

  if (groupBy === 'month') {
    return {
      groupBy: 'month',
      year: resolvedYear,
      rows,
      totals,
    };
  }

  return {
    groupBy: 'year',
    fromYear: resolvedFromYear,
    toYear: resolvedToYear,
    rows,
    totals,
  };
}

/**
 * 5. Daftar Pesanan Belum Lunas / Piutang (PRD 5.2)
 */
async function getFinanceOutstanding(query = {}) {
  const todayStr = getTodayWIB();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const overdueOnly = query.overdueOnly === true || query.overdueOnly === 'true';
  const sortKey = query.sort || 'acara_terdekat';

  const baseMatch = {
    status: { $in: ['terkonfirmasi', 'berlangsung', 'selesai'] },
    paymentStatus: { $ne: 'lunas' },
  };
  if (overdueOnly) {
    baseMatch.eventDate = { $lt: todayStr };
  }

  const sortStage =
    sortKey === 'sisa_terbesar'
      ? { remaining: -1, eventDate: 1, _id: 1 }
      : { eventDate: 1, createdAt: 1, _id: 1 };

  const [aggResult] = await Booking.aggregate([
    { $match: baseMatch },
    {
      $project: {
        bookingNumber: 1,
        customerName: '$customerSnapshot.name',
        customerPhone: '$customerSnapshot.phone',
        category: 1,
        packageName: '$packageSnapshot.name',
        eventDate: 1,
        createdAt: 1,
        total: { $ifNull: ['$totalPrice', '$packageSnapshot.price'] },
      },
    },
    { $match: { total: { $ne: null } } },
    {
      $lookup: {
        from: 'payments',
        let: { bookingId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$booking', '$$bookingId'] },
                  { $eq: ['$status', 'approved'] },
                  { $in: ['$type', ['dp', 'pelunasan']] },
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              dpPaid: {
                $sum: { $cond: [{ $eq: ['$type', 'dp'] }, '$amount', 0] },
              },
              pelunasanPaid: {
                $sum: { $cond: [{ $eq: ['$type', 'pelunasan'] }, '$amount', 0] },
              },
            },
          },
        ],
        as: 'paidInfo',
      },
    },
    {
      $addFields: {
        dpPaid: { $ifNull: [{ $arrayElemAt: ['$paidInfo.dpPaid', 0] }, 0] },
        pelunasanPaid: { $ifNull: [{ $arrayElemAt: ['$paidInfo.pelunasanPaid', 0] }, 0] },
      },
    },
    {
      $addFields: {
        remaining: {
          $max: [{ $subtract: ['$total', { $add: ['$dpPaid', '$pelunasanPaid'] }] }, 0],
        },
      },
    },
    { $match: { remaining: { $gt: 0 } } },
    {
      $facet: {
        totalCount: [{ $count: 'count' }],
        items: [
          { $sort: sortStage },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              id: '$_id',
              bookingNumber: 1,
              customerName: { $ifNull: ['$customerName', ''] },
              customerPhone: { $ifNull: ['$customerPhone', ''] },
              category: 1,
              packageName: { $ifNull: ['$packageName', ''] },
              eventDate: 1,
              total: { $round: ['$total', 0] },
              dpPaid: { $round: ['$dpPaid', 0] },
              remaining: { $round: ['$remaining', 0] },
            },
          },
        ],
      },
    },
  ]);

  const total = aggResult?.totalCount?.[0]?.count || 0;
  const items = (aggResult?.items || []).map((item) => ({
    ...item,
    overdue: item.eventDate < todayStr,
    daysUntil: diffDays(todayStr, item.eventDate),
  }));

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
}

module.exports = {
  CATEGORIES,
  MONTH_NAMES_ID,
  getFinanceSummary,
  getFinanceChart,
  getFinanceTransactions,
  getTransactionsExportMeta,
  createTransactionsExportCursor,
  getFinanceRecap,
  getFinanceOutstanding,
  // Diekspor untuk inspeksi explain() dan pengujian indeks
  buildEffectivePaidDateOr,
};

