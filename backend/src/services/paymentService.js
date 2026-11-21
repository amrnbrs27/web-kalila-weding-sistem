const mongoose = require('mongoose');
const { Readable } = require('stream');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Setting = require('../models/Setting');
const { isDateAvailable, getMonthAvailability } = require('./availabilityService');
const { withSlotLock } = require('./slotService');
const { getEffectiveRecipients } = require('./email/recipientService');
const {
  triggerPaymentProofEmail,
  triggerBookingConfirmedEmail,
} = require('./email/emailService');
const {
  isCloudinaryConfigured,
  uploadAuthenticatedStream,
  destroyAuthenticatedAsset,
  generateSignedAuthenticatedUrl,
} = require('../config/cloudinary');
const AppError = require('../utils/AppError');

/**
 * Helper untuk menghitung status penagihan dan pembayaran booking
 * Mengabaikan payment dengan status 'pending', 'rejected', dan 'void'
 */
function getBookingBilling(booking, payments = []) {
  const total = booking.totalPrice ?? booking.packageSnapshot?.price ?? null;

  let dpPaid = 0;
  let pelunasanPaid = 0;
  let refunded = 0;

  for (const p of payments) {
    if (p.status === 'approved') {
      if (p.type === 'dp') {
        dpPaid += p.amount || 0;
      } else if (p.type === 'pelunasan') {
        pelunasanPaid += p.amount || 0;
      } else if (p.type === 'pengembalian') {
        refunded += p.amount || 0;
      }
    }
  }

  const remaining = total === null ? null : Math.max(total - dpPaid - pelunasanPaid, 0);
  const netReceived = dpPaid + pelunasanPaid - refunded;

  return {
    total,
    dpPaid,
    pelunasanPaid,
    refunded,
    remaining,
    netReceived,
  };
}

/**
 * 1. Informasi Pembayaran DP untuk Pelanggan
 */
async function getPaymentInfo(bookingId, userId) {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new AppError('Pesanan tidak ditemukan', 404);
  }

  const booking = await Booking.findOne({ _id: bookingId, customer: userId });
  if (!booking) {
    throw new AppError('Pesanan tidak ditemukan', 404);
  }

  if (booking.status !== 'menunggu_dp') {
    throw new AppError(
      `Informasi pembayaran hanya tersedia untuk pesanan menunggu pembayaran DP (status saat ini: ${booking.status})`,
      409
    );
  }

  if (booking.expiresAt && new Date(booking.expiresAt) < new Date()) {
    throw new AppError('Batas waktu pembayaran DP untuk pesanan ini telah berakhir', 409);
  }

  const settings = await Setting.getSettings();

  const hasBankInfo = Boolean(
    settings.bankName && settings.accountNumber && settings.accountHolder
  );
  const hasQris = Boolean(settings.qrisImage && settings.qrisImage.url);

  if (!hasBankInfo && !hasQris) {
    throw new AppError('Info pembayaran belum diatur oleh admin', 409);
  }

  const maxAttempts = settings.maxProofAttempts || 3;
  const remainingAttempts = Math.max(maxAttempts - (booking.proofAttempts || 0), 0);

  // Cari alasan penolakan terakhir bila ada
  const lastRejectedPayment = await Payment.findOne({
    booking: booking._id,
    status: 'rejected',
  })
    .sort({ createdAt: -1 })
    .lean();

  return {
    bookingNumber: booking.bookingNumber,
    dpAmount: booking.dpAmount,
    expiresAt: booking.expiresAt,
    bankName: settings.bankName || '',
    accountNumber: settings.accountNumber || '',
    accountHolder: settings.accountHolder || '',
    qrisImage: settings.qrisImage?.url || null,
    remainingAttempts,
    lastRejectionReason: lastRejectedPayment?.rejectionReason || null,
  };
}

/**
 * 2. Unggah Bukti Transfer oleh Pelanggan (Penyimpanan Privat Authenticated)
 */
async function uploadPaymentProof(bookingId, file, userId) {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      'Layanan penyimpanan Cloudinary belum dikonfigurasi. Unggah berkas tidak tersedia.',
      503
    );
  }

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new AppError('Pesanan tidak ditemukan', 404);
  }

  const booking = await Booking.findOne({ _id: bookingId, customer: userId });
  if (!booking) {
    throw new AppError('Pesanan tidak ditemukan', 404);
  }

  if (booking.status !== 'menunggu_dp') {
    throw new AppError(
      `Unggah bukti hanya diizinkan untuk pesanan menunggu pembayaran DP (status saat ini: ${booking.status})`,
      409
    );
  }

  const now = new Date();
  if (booking.expiresAt && new Date(booking.expiresAt) < now) {
    throw new AppError('Batas waktu unggah bukti pembayaran telah berakhir', 409);
  }

  const settings = await Setting.getSettings();
  const maxAttempts = settings.maxProofAttempts || 3;

  if (booking.proofAttempts >= maxAttempts) {
    throw new AppError(
      `Batas maksimal percobaan unggah bukti transfer telah tercapai (${maxAttempts} kali)`,
      409
    );
  }

  // Unggah berkas ke Cloudinary dengan tipe authenticated (privat)
  let uploadResult;
  try {
    uploadResult = await uploadAuthenticatedStream(file.buffer, {
      folder: 'kalila/payment-proofs',
    });
  } catch (err) {
    throw new AppError(`Gagal mengunggah bukti pembayaran: ${err.message}`, 500);
  }

  const publicId = uploadResult.public_id;

  // Cari daftar penerima admin sebelum memulai transaksi
  const { adminEmails } = await getEffectiveRecipients(settings);

  // Jalankan dalam MongoDB transaction dengan update bersyarat atomik
  try {
    const result = await mongoose.connection.transaction(async (session) => {
      const updatedBooking = await Booking.findOneAndUpdate(
        {
          _id: bookingId,
          status: 'menunggu_dp',
          expiresAt: { $gt: now },
          proofAttempts: { $lt: maxAttempts },
        },
        {
          status: 'menunggu_verifikasi',
          paymentStatus: 'menunggu_verifikasi',
          $inc: { proofAttempts: 1 },
          $push: {
            statusHistory: {
              status: 'menunggu_verifikasi',
              at: now,
              by: userId,
              note: `Bukti transfer diunggah (percobaan ke-${booking.proofAttempts + 1})`,
            },
          },
        },
        { session, returnDocument: 'after' }
      );

      if (!updatedBooking) {
        throw new AppError(
          'Pesanan telah kedaluwarsa, melebihi batas percobaan, atau telah diperbarui oleh proses lain',
          409
        );
      }

      const [payment] = await Payment.create(
        [
          {
            booking: bookingId,
            type: 'dp',
            amount: updatedBooking.dpAmount,
            method: 'transfer',
            status: 'pending',
            attempt: updatedBooking.proofAttempts,
            source: 'customer',
            proof: {
              url: '',
              publicId,
            },
          },
        ],
        { session }
      );

      // Enqueue notifikasi email bukti transfer ke admin di dalam transaksi yang sama
      await triggerPaymentProofEmail(
        updatedBooking,
        payment,
        adminEmails,
        settings,
        { session }
      );

      return { booking: updatedBooking, payment };
    });

    const packageName = result.booking.packageSnapshot?.name || result.booking.eventName;
    const adminWa = settings.adminWhatsapp || '';
    const whatsappMessage = `Halo Kalila Organizer, saya telah mengunggah bukti pembayaran DP untuk pesanan ${result.booking.bookingNumber} (${packageName}). Mohon untuk diverifikasi.`;

    return {
      booking: {
        _id: result.booking._id,
        bookingNumber: result.booking.bookingNumber,
        status: result.booking.status,
        paymentStatus: result.booking.paymentStatus,
        proofAttempts: result.booking.proofAttempts,
      },
      payment: {
        _id: result.payment._id,
        type: result.payment.type,
        amount: result.payment.amount,
        status: result.payment.status,
        attempt: result.payment.attempt,
        createdAt: result.payment.createdAt,
      },
      whatsapp: {
        adminWhatsapp: adminWa,
        message: whatsappMessage,
      },
    };
  } catch (err) {
    // Bersihkan aset Cloudinary bila transaksi database gagal
    try {
      await destroyAuthenticatedAsset(publicId);
    } catch (destroyErr) {
      console.error('[Rollback Cloudinary Gagal]:', destroyErr.message);
    }
    throw err;
  }
}

/**
 * 3. Streaming Berkas Bukti Transfer (Khusus Admin atau Pemilik Pesanan)
 */
async function streamPaymentProof(paymentId, user, res) {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new AppError('Pembayaran tidak ditemukan', 404);
  }

  const payment = await Payment.findById(paymentId).populate('booking');
  if (!payment || !payment.booking) {
    throw new AppError('Pembayaran tidak ditemukan', 404);
  }

  const isAdmin = user.role === 'admin';
  const isOwner =
    payment.booking.customer && payment.booking.customer.toString() === user._id.toString();

  if (!isAdmin && !isOwner) {
    throw new AppError('Pembayaran tidak ditemukan', 404);
  }

  if (!payment.proof || !payment.proof.publicId) {
    throw new AppError('Bukti transfer tidak tersedia untuk pembayaran ini', 404);
  }

  if (!isCloudinaryConfigured()) {
    throw new AppError('Layanan Cloudinary tidak terkonfigurasi', 503);
  }

  const signedUrl = generateSignedAuthenticatedUrl(payment.proof.publicId);

  let fetchRes;
  try {
    fetchRes = await fetch(signedUrl);
  } catch (err) {
    throw new AppError(`Gagal menghubungkan ke penyimpanan gambar: ${err.message}`, 500);
  }

  if (!fetchRes.ok) {
    throw new AppError('Berkas bukti transfer tidak ditemukan di penyimpanan', 404);
  }

  const contentType = fetchRes.headers.get('content-type') || 'image/jpeg';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (fetchRes.body) {
    Readable.fromWeb(fetchRes.body).pipe(res);
  } else {
    const arrayBuffer = await fetchRes.arrayBuffer();
    res.end(Buffer.from(arrayBuffer));
  }
}

/**
 * 4. Daftar Pembayaran Admin dengan Filter & Kalkulasi Slot Efisien
 */
async function getAdminPayments(query) {
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.source) filter.source = query.source;

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = new Date(`${query.dateFrom}T00:00:00.000Z`);
    if (query.dateTo) filter.createdAt.$lte = new Date(`${query.dateTo}T23:59:59.999Z`);
  }

  if (query.q) {
    const escaped = query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    const matchingBookings = await Booking.find({
      $or: [
        { bookingNumber: regex },
        { 'customerSnapshot.name': regex },
        { 'customerSnapshot.phone': regex },
        { eventName: regex },
      ],
    })
      .select('_id')
      .lean();

    const bookingIds = matchingBookings.map((b) => b._id);
    filter.booking = { $in: bookingIds };
  }

  let sortObj = { createdAt: -1 }; // default terbaru
  if (query.sort === 'terlama') {
    sortObj = { createdAt: 1 };
  } else if (query.sort === 'terbaru') {
    sortObj = { createdAt: -1 };
  } else if (!query.sort && query.status === 'pending') {
    // Default terlama untuk antrean pending agar proses adil
    sortObj = { createdAt: 1 };
  }

  const page = query.page || 1;
  const limit = query.limit || 10;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate('booking verifiedBy voidedBy')
      .lean(),
    Payment.countDocuments(filter),
  ]);

  // Kalkulasi slot ketersediaan secara efisien untuk item pending
  const pendingItems = items.filter((item) => item.status === 'pending' && item.booking);
  const monthCategorySet = new Set();
  for (const item of pendingItems) {
    const eventDate = item.booking.eventDate;
    const cat = item.booking.category;
    if (eventDate && cat) {
      const monthStr = eventDate.slice(0, 7);
      monthCategorySet.add(`${cat}|${monthStr}`);
    }
  }

  const availabilityCache = new Map();
  await Promise.all(
    Array.from(monthCategorySet).map(async (key) => {
      const [category, monthStr] = key.split('|');
      try {
        const monthDates = await getMonthAvailability(category, monthStr);
        for (const d of monthDates) {
          availabilityCache.set(`${category}|${d.date}`, {
            available: d.available,
            status: d.status,
          });
        }
      } catch (err) {
        // Abaikan kegagalan cache bulanan
      }
    })
  );

  const formattedItems = items.map((item) => {
    const booking = item.booking || {};
    const bookingTotal = booking.totalPrice ?? booking.packageSnapshot?.price ?? null;

    const baseResult = {
      _id: item._id,
      type: item.type,
      amount: item.amount,
      method: item.method,
      status: item.status,
      attempt: item.attempt,
      source: item.source,
      rejectionReason: item.rejectionReason || null,
      voidReason: item.voidReason || null,
      paidAt: item.paidAt,
      verifiedBy: item.verifiedBy
        ? { _id: item.verifiedBy._id, name: item.verifiedBy.name }
        : null,
      verifiedAt: item.verifiedAt,
      voidedBy: item.voidedBy ? { _id: item.voidedBy._id, name: item.voidedBy.name } : null,
      voidedAt: item.voidedAt,
      createdAt: item.createdAt,
      booking: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        customerName: booking.customerSnapshot?.name || '',
        customerPhone: booking.customerSnapshot?.phone || '',
        packageName: booking.packageSnapshot?.name || '',
        category: booking.category,
        eventDate: booking.eventDate,
        total: bookingTotal,
        dpAmount: booking.dpAmount,
        status: booking.status,
      },
    };

    if (item.status === 'pending' && booking.eventDate && booking.category) {
      const cached = availabilityCache.get(`${booking.category}|${booking.eventDate}`);
      baseResult.slotAvailable = cached ? cached.available : false;
      baseResult.slotStatus = cached ? cached.status : 'tidak_tersedia';
    }

    return baseResult;
  });

  return {
    items: formattedItems,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * 5. Detail Pembayaran Admin Beserta Riwayat Percobaan Unggah
 */
async function getAdminPaymentById(paymentId) {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new AppError('Pembayaran tidak ditemukan', 404);
  }

  const payment = await Payment.findById(paymentId)
    .populate('booking verifiedBy voidedBy')
    .lean();

  if (!payment) {
    throw new AppError('Pembayaran tidak ditemukan', 404);
  }

  const booking = payment.booking || {};
  const bookingTotal = booking.totalPrice ?? booking.packageSnapshot?.price ?? null;

  // Riwayat percobaan unggah pada booking itu
  const uploadAttempts = await Payment.find({
    booking: booking._id,
    type: 'dp',
    source: 'customer',
  })
    .sort({ attempt: 1, createdAt: 1 })
    .select('attempt status rejectionReason createdAt verifiedAt paidAt')
    .lean();

  return {
    _id: payment._id,
    type: payment.type,
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
    attempt: payment.attempt,
    source: payment.source,
    rejectionReason: payment.rejectionReason || null,
    voidReason: payment.voidReason || null,
    paidAt: payment.paidAt,
    verifiedBy: payment.verifiedBy
      ? { _id: payment.verifiedBy._id, name: payment.verifiedBy.name }
      : null,
    verifiedAt: payment.verifiedAt,
    voidedBy: payment.voidedBy
      ? { _id: payment.voidedBy._id, name: payment.voidedBy.name }
      : null,
    voidedAt: payment.voidedAt,
    note: payment.note || '',
    createdAt: payment.createdAt,
    booking: {
      _id: booking._id,
      bookingNumber: booking.bookingNumber,
      customerName: booking.customerSnapshot?.name || '',
      customerPhone: booking.customerSnapshot?.phone || '',
      customerEmail: booking.customerSnapshot?.email || '',
      packageName: booking.packageSnapshot?.name || '',
      category: booking.category,
      eventDate: booking.eventDate,
      eventName: booking.eventName,
      location: booking.location,
      guestCount: booking.guestCount,
      total: bookingTotal,
      dpAmount: booking.dpAmount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      proofAttempts: booking.proofAttempts,
    },
    uploadAttempts,
  };
}

/**
 * 6. Menyetujui Pembayaran DP (Admin Approve)
 * Mengunci slot tanggal via withSlotLock dan memverifikasi ketersediaan slot
 */
async function approvePayment(paymentId, adminId) {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new AppError('Pembayaran tidak ditemukan', 404);
  }

  const payment = await Payment.findById(paymentId).populate('booking');
  if (!payment || !payment.booking) {
    throw new AppError('Pembayaran tidak ditemukan', 404);
  }

  if (payment.type !== 'dp' || payment.source !== 'customer' || payment.status !== 'pending') {
    throw new AppError(
      'Hanya pembayaran DP dari pelanggan berstatus pending yang dapat disetujui',
      409
    );
  }

  const booking = payment.booking;
  if (booking.status !== 'menunggu_verifikasi') {
    throw new AppError(
      `Persetujuan ditolak: status pesanan saat ini adalah "${booking.status}" (harus menunggu_verifikasi)`,
      409
    );
  }

  // Jalankan dalam withSlotLock agar atomik, serial, dan aman dari bentrok kuota
  return await withSlotLock({ category: booking.category, date: booking.eventDate }, async (session) => {
    const avail = await isDateAvailable(booking.category, booking.eventDate, { session });
    if (!avail.available) {
      throw new AppError(
        `Tanggal ${booking.eventDate} sudah tidak tersedia (${avail.status}). Pembayaran tetap menunggu dan pesanan belum terkonfirmasi.`,
        409
      );
    }

    const now = new Date();

    const updatedPayment = await Payment.findOneAndUpdate(
      { _id: paymentId, status: 'pending' },
      {
        status: 'approved',
        verifiedBy: adminId,
        verifiedAt: now,
        paidAt: now,
      },
      { session, returnDocument: 'after' }
    );

    if (!updatedPayment) {
      throw new AppError('Pembayaran telah disetujui atau diubah oleh proses lain', 409);
    }

    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'menunggu_verifikasi' },
      {
        status: 'terkonfirmasi',
        paymentStatus: 'dp_dibayar',
        expiresAt: null,
        $push: {
          statusHistory: {
            status: 'terkonfirmasi',
            at: now,
            by: adminId,
            note: 'Pembayaran DP disetujui admin',
          },
        },
      },
      { session, returnDocument: 'after' }
    );

    if (!updatedBooking) {
      throw new AppError('Status pesanan telah diubah oleh proses lain', 409);
    }

    const settings = await Setting.getSettings({ session });

    // Enqueue notifikasi email konfirmasi ke pelanggan di dalam transaction
    await triggerBookingConfirmedEmail(updatedBooking, settings, { session });

    return {
      payment: updatedPayment,
      booking: updatedBooking,
    };
  });
}

/**
 * 7. Menolak Pembayaran DP (Admin Reject)
 */
async function rejectPayment(paymentId, { reason }, adminId) {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new AppError('Pembayaran tidak ditemukan', 404);
  }

  const payment = await Payment.findById(paymentId).populate('booking');
  if (!payment || !payment.booking) {
    throw new AppError('Pembayaran tidak ditemukan', 404);
  }

  if (payment.status !== 'pending') {
    throw new AppError('Hanya pembayaran berstatus pending yang dapat ditolak', 409);
  }

  const booking = payment.booking;
  if (booking.status !== 'menunggu_verifikasi') {
    throw new AppError(
      `Penolakan gagal: status pesanan saat ini adalah "${booking.status}" (harus menunggu_verifikasi)`,
      409
    );
  }

  const settings = await Setting.getSettings();
  const maxAttempts = settings.maxProofAttempts || 3;
  const extensionHours = settings.rejectionExtensionHours ?? 6;

  const now = new Date();

  return await mongoose.connection.transaction(async (session) => {
    const updatedPayment = await Payment.findOneAndUpdate(
      { _id: paymentId, status: 'pending' },
      {
        status: 'rejected',
        rejectionReason: reason,
        verifiedBy: adminId,
        verifiedAt: now,
      },
      { session, returnDocument: 'after' }
    );

    if (!updatedPayment) {
      throw new AppError('Pembayaran telah diperbarui oleh proses lain', 409);
    }

    // Jika percobaan saat ini sudah mencapai batas maksimal, pesanan dibatalkan
    if (payment.attempt >= maxAttempts) {
      const updatedBooking = await Booking.findOneAndUpdate(
        { _id: booking._id, status: 'menunggu_verifikasi' },
        {
          status: 'dibatalkan',
          paymentStatus: 'ditolak',
          cancelReason: 'Bukti pembayaran ditolak dan batas percobaan unggah tercapai',
          $push: {
            statusHistory: {
              status: 'dibatalkan',
              at: now,
              by: adminId,
              note: `Bukti ditolak: ${reason} (batas ${maxAttempts} kali percobaan tercapai)`,
            },
          },
        },
        { session, returnDocument: 'after' }
      );

      if (!updatedBooking) {
        throw new AppError('Status pesanan telah berubah oleh proses lain', 409);
      }

      return { payment: updatedPayment, booking: updatedBooking };
    }

    // Jika belum mencapai batas, kembalikan ke menunggu_dp dan perpanjang waktu
    const oldExpiresTime = booking.expiresAt ? new Date(booking.expiresAt).getTime() : 0;
    const baseTime = Math.max(oldExpiresTime, now.getTime());
    const newExpiresAt = new Date(baseTime + extensionHours * 3600 * 1000);

    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'menunggu_verifikasi' },
      {
        status: 'menunggu_dp',
        paymentStatus: 'ditolak',
        expiresAt: newExpiresAt,
        $push: {
          statusHistory: {
            status: 'menunggu_dp',
            at: now,
            by: adminId,
            note: `Bukti ditolak: ${reason}. Batas waktu diperpanjang ${extensionHours} jam`,
          },
        },
      },
      { session, returnDocument: 'after' }
    );

    if (!updatedBooking) {
      throw new AppError('Status pesanan telah berubah oleh proses lain', 409);
    }

    return { payment: updatedPayment, booking: updatedBooking };
  });
}

/**
 * 8. Membatalkan (Void) Pembayaran Manual yang Disetujui
 * Khusus tipe 'pelunasan' atau 'pengembalian' dengan source 'manual'
 */
async function voidPayment(paymentId, { reason }, adminId) {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new AppError('Pembayaran tidak ditemukan', 404);
  }

  const payment = await Payment.findById(paymentId).populate('booking');
  if (!payment || !payment.booking) {
    throw new AppError('Pembayaran tidak ditemukan', 404);
  }

  if (payment.status !== 'approved') {
    throw new AppError('Hanya pembayaran berstatus approved yang dapat di-void', 409);
  }

  if (payment.source !== 'manual') {
    throw new AppError('Pembayaran yang dilakukan oleh pelanggan tidak dapat di-void', 409);
  }

  if (payment.type !== 'pelunasan' && payment.type !== 'pengembalian') {
    throw new AppError(
      'Hanya pembayaran tipe pelunasan atau pengembalian yang dapat di-void (pembayaran DP tidak dapat di-void)',
      409
    );
  }

  const booking = payment.booking;
  const now = new Date();

  return await mongoose.connection.transaction(async (session) => {
    const updatedPayment = await Payment.findOneAndUpdate(
      { _id: paymentId, status: 'approved' },
      {
        status: 'void',
        voidReason: reason,
        voidedBy: adminId,
        voidedAt: now,
      },
      { session, returnDocument: 'after' }
    );

    if (!updatedPayment) {
      throw new AppError('Pembayaran telah diubah oleh proses lain', 409);
    }

    // Jika pelunasan di-void, kembalikan status pembayaran pesanan ke dp_dibayar jika sebelumnya lunas
    if (payment.type === 'pelunasan' && booking.paymentStatus === 'lunas') {
      await Booking.findByIdAndUpdate(
        booking._id,
        {
          paymentStatus: 'dp_dibayar',
          $push: {
            statusHistory: {
              status: booking.status,
              at: now,
              by: adminId,
              note: `Pembayaran pelunasan senilai Rp${payment.amount.toLocaleString('id-ID')} di-void: ${reason}`,
            },
          },
        },
        { session }
      );
    } else if (payment.type === 'pengembalian') {
      await Booking.findByIdAndUpdate(
        booking._id,
        {
          $push: {
            statusHistory: {
              status: booking.status,
              at: now,
              by: adminId,
              note: `Pengembalian dana senilai Rp${payment.amount.toLocaleString('id-ID')} di-void: ${reason}`,
            },
          },
        },
        { session }
      );
    }

    return updatedPayment;
  });
}

module.exports = {
  getBookingBilling,
  getPaymentInfo,
  uploadPaymentProof,
  streamPaymentProof,
  getAdminPayments,
  getAdminPaymentById,
  approvePayment,
  rejectPayment,
  voidPayment,
};

