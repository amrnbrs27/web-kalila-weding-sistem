const CalendarBlock = require('../models/CalendarBlock');
const Booking = require('../models/Booking');
const Setting = require('../models/Setting');
const {
  getDatesInMonth,
  isDateInPast,
  isValidDate,
  isValidMonthFormat,
} = require('../utils/dateUtils');
const AppError = require('../utils/AppError');

/**
 * Mengambil data agregasi kalender mentah (blokir & booking aktif) untuk satu bulan
 */
async function getMonthRawData(monthStr, { session } = {}) {
  const monthRegex = new RegExp(`^${monthStr}-`);

  // Query blokir kalender dalam bulan tersebut
  const blocksQuery = CalendarBlock.find({ date: { $regex: monthRegex } }).lean();
  if (session) blocksQuery.session(session);
  const blocks = await blocksQuery;

  // Query booking aktif (terkonfirmasi & berlangsung) dalam bulan tersebut
  // menahan slot HANYA jika terkonfirmasi atau berlangsung
  const bookingAgg = [
    {
      $match: {
        eventDate: { $regex: monthRegex },
        status: { $in: ['terkonfirmasi', 'berlangsung'] },
      },
    },
    {
      $group: {
        _id: {
          date: '$eventDate',
          category: '$category',
        },
        count: { $sum: 1 },
      },
    },
  ];

  const bookingCountsRaw = session
    ? await Booking.aggregate(bookingAgg).session(session)
    : await Booking.aggregate(bookingAgg);

  // Ambil pengaturan batas maksimal acara
  const settings = await Setting.getSettings(session ? { session } : {});
  const maxEvents = {
    dekor: settings.maxEventsPerDay?.dekor ?? null,
    catering: settings.maxEventsPerDay?.catering ?? null,
    wedding: settings.maxEventsPerDay?.wedding ?? null,
  };

  return { blocks, bookingCountsRaw, maxEvents };
}

/**
 * Menghitung detail status dan ketersediaan untuk satu tanggal spesifik
 */
function computeDateStatus(dateStr, dateBlocks, rawCounts, maxEvents) {
  const past = isDateInPast(dateStr);

  const rawDekor = rawCounts.dekor || 0;
  const rawCatering = rawCounts.catering || 0;
  const rawWedding = rawCounts.wedding || 0;

  // Aturan PRD: Wedding memakan kuota 1 dekor dan 1 catering
  const effectiveCounts = {
    dekor: rawDekor + rawWedding,
    catering: rawCatering + rawWedding,
    wedding: rawWedding,
  };

  const isDekorBlocked = dateBlocks.some((b) => b.category === 'dekor');
  const isCateringBlocked = dateBlocks.some((b) => b.category === 'catering');
  const isWeddingBlocked = dateBlocks.some((b) => b.category === 'wedding');

  const isDekorFull = maxEvents.dekor !== null && effectiveCounts.dekor >= maxEvents.dekor;
  const isCateringFull = maxEvents.catering !== null && effectiveCounts.catering >= maxEvents.catering;
  // Wedding penuh jika kuota wedding penuh ATAU dekor penuh ATAU catering penuh
  const isWeddingFull =
    (maxEvents.wedding !== null && effectiveCounts.wedding >= maxEvents.wedding) ||
    isDekorFull ||
    isCateringFull;

  function evaluateCategory(category) {
    if (past) {
      return { status: 'lewat', available: false };
    }

    if (category === 'dekor') {
      if (isDekorBlocked) return { status: 'diblokir', available: false };
      if (isDekorFull) return { status: 'penuh', available: false };
      return { status: 'tersedia', available: true };
    }

    if (category === 'catering') {
      if (isCateringBlocked) return { status: 'diblokir', available: false };
      if (isCateringFull) return { status: 'penuh', available: false };
      return { status: 'tersedia', available: true };
    }

    if (category === 'wedding') {
      // Wedding tidak tersedia jika SALAH SATU dari wedding, dekor, atau catering diblokir
      if (isWeddingBlocked || isDekorBlocked || isCateringBlocked) {
        return { status: 'diblokir', available: false };
      }
      if (isWeddingFull) return { status: 'penuh', available: false };
      return { status: 'tersedia', available: true };
    }

    throw new AppError(`Kategori "${category}" tidak valid`, 400);
  }

  return {
    date: dateStr,
    isPast: past,
    blocks: dateBlocks,
    rawCounts: {
      dekor: rawDekor,
      catering: rawCatering,
      wedding: rawWedding,
    },
    effectiveCounts,
    availability: {
      dekor: evaluateCategory('dekor'),
      catering: evaluateCategory('catering'),
      wedding: evaluateCategory('wedding'),
    },
  };
}

/**
 * Mengambil ketersediaan satu bulan penuh untuk endpoint publik (spesifik satu kategori)
 */
async function getMonthAvailability(category, monthStr) {
  if (!isValidMonthFormat(monthStr)) {
    throw new AppError('Format bulan tidak valid (harus YYYY-MM)', 400);
  }

  if (!['dekor', 'catering', 'wedding'].includes(category)) {
    throw new AppError('Kategori harus dekor, catering, atau wedding', 400);
  }

  const dates = getDatesInMonth(monthStr);
  const { blocks, bookingCountsRaw, maxEvents } = await getMonthRawData(monthStr);

  // Map blocks per date
  const blocksByDate = new Map();
  for (const block of blocks) {
    if (!blocksByDate.has(block.date)) {
      blocksByDate.set(block.date, []);
    }
    blocksByDate.get(block.date).push(block);
  }

  // Map booking counts per date
  const countsByDate = new Map();
  for (const item of bookingCountsRaw) {
    const d = item._id.date;
    const cat = item._id.category;
    if (!countsByDate.has(d)) {
      countsByDate.set(d, { dekor: 0, catering: 0, wedding: 0 });
    }
    countsByDate.get(d)[cat] = item.count;
  }

  return dates.map((dateStr) => {
    const dateBlocks = blocksByDate.get(dateStr) || [];
    const rawCounts = countsByDate.get(dateStr) || { dekor: 0, catering: 0, wedding: 0 };
    const dateDetail = computeDateStatus(dateStr, dateBlocks, rawCounts, maxEvents);
    const catAvail = dateDetail.availability[category];

    return {
      date: dateStr,
      status: catAvail.status,
      available: catAvail.available,
    };
  });
}

/**
 * Mengambil ringkasan kalender lengkap untuk dashboard admin (dipakai admin calendar)
 */
async function getMonthCalendarForAdmin(monthStr, categoryFilter = null) {
  if (!isValidMonthFormat(monthStr)) {
    throw new AppError('Format bulan tidak valid (harus YYYY-MM)', 400);
  }

  const dates = getDatesInMonth(monthStr);
  const { blocks, bookingCountsRaw, maxEvents } = await getMonthRawData(monthStr);

  const blocksByDate = new Map();
  for (const block of blocks) {
    if (!blocksByDate.has(block.date)) {
      blocksByDate.set(block.date, []);
    }
    blocksByDate.get(block.date).push(block);
  }

  const countsByDate = new Map();
  for (const item of bookingCountsRaw) {
    const d = item._id.date;
    const cat = item._id.category;
    if (!countsByDate.has(d)) {
      countsByDate.set(d, { dekor: 0, catering: 0, wedding: 0 });
    }
    countsByDate.get(d)[cat] = item.count;
  }

  return dates.map((dateStr) => {
    let dateBlocks = blocksByDate.get(dateStr) || [];
    if (categoryFilter) {
      dateBlocks = dateBlocks.filter((b) => b.category === categoryFilter);
    }
    const rawCounts = countsByDate.get(dateStr) || { dekor: 0, catering: 0, wedding: 0 };
    const dateDetail = computeDateStatus(dateStr, dateBlocks, rawCounts, maxEvents);

    return {
      date: dateStr,
      isBlocked: dateBlocks.length > 0,
      blocks: dateBlocks.map((b) => ({
        id: b._id,
        category: b.category,
        reason: b.reason || '',
      })),
      effectiveEventCounts: dateDetail.effectiveCounts,
      rawEventCounts: dateDetail.rawCounts,
      availability: categoryFilter
        ? dateDetail.availability[categoryFilter]
        : dateDetail.availability,
    };
  });
}

/**
 * Mengecek apakah satu tanggal tersedia untuk pemesanan (mendukung mongoose session untuk transaksi)
 */
async function isDateAvailable(category, dateStr, { session } = {}) {
  if (!isValidDate(dateStr)) {
    throw new AppError('Format atau nilai tanggal tidak valid (harus YYYY-MM-DD)', 400);
  }

  if (!['dekor', 'catering', 'wedding'].includes(category)) {
    throw new AppError('Kategori harus dekor, catering, atau wedding', 400);
  }

  if (isDateInPast(dateStr)) {
    return {
      available: false,
      status: 'lewat',
      reason: 'Tanggal acara sudah lewat',
    };
  }

  // Ambil blokir pada tanggal ini
  const blocksQuery = CalendarBlock.find({ date: dateStr }).lean();
  if (session) blocksQuery.session(session);
  const blocks = await blocksQuery;

  // Ambil booking aktif pada tanggal ini
  const bookingAgg = [
    {
      $match: {
        eventDate: dateStr,
        status: { $in: ['terkonfirmasi', 'berlangsung'] },
      },
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
      },
    },
  ];

  const bookingCountsRaw = session
    ? await Booking.aggregate(bookingAgg).session(session)
    : await Booking.aggregate(bookingAgg);

  const rawCounts = { dekor: 0, catering: 0, wedding: 0 };
  for (const item of bookingCountsRaw) {
    rawCounts[item._id] = item.count;
  }

  const settings = await Setting.getSettings(session ? { session } : {});
  const maxEvents = {
    dekor: settings.maxEventsPerDay?.dekor ?? null,
    catering: settings.maxEventsPerDay?.catering ?? null,
    wedding: settings.maxEventsPerDay?.wedding ?? null,
  };

  const computed = computeDateStatus(dateStr, blocks, rawCounts, maxEvents);
  const result = computed.availability[category];

  return {
    available: result.available,
    status: result.status,
    effectiveCounts: computed.effectiveCounts,
  };
}

module.exports = {
  getMonthAvailability,
  getMonthCalendarForAdmin,
  isDateAvailable,
  computeDateStatus,
};

