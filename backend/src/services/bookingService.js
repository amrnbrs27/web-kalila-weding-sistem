const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Package = require('../models/Package');
const Setting = require('../models/Setting');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { isDateAvailable } = require('./availabilityService');
const { withSlotLock } = require('./slotService');
const AppError = require('../utils/AppError');

/**
 * Validasi spesifik aturan form kategori dan jumlah tamu
 */
function validateCategoryFormData(category, guestCount, formData = {}) {
  if (category === 'dekor') {
    for (const key of Object.keys(formData)) {
      if (key !== 'decorArea') {
        throw new AppError(`Field "${key}" tidak diizinkan untuk kategori dekor`, 400);
      }
    }
  } else if (category === 'catering') {
    if (!guestCount || guestCount < 1) {
      throw new AppError('Jumlah tamu (guestCount) wajib diisi untuk kategori catering', 400);
    }
    for (const key of Object.keys(formData)) {
      if (key !== 'servingTime') {
        throw new AppError(`Field "${key}" tidak diizinkan untuk kategori catering`, 400);
      }
    }
    if (formData.servingTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(formData.servingTime)) {
      throw new AppError('Format servingTime harus berupa "HH:mm"', 400);
    }
  } else if (category === 'wedding') {
    if (!guestCount || guestCount < 1) {
      throw new AppError('Jumlah tamu (guestCount) wajib diisi untuk kategori wedding', 400);
    }
    for (const key of Object.keys(formData)) {
      if (key !== 'additionalNeeds') {
        throw new AppError(`Field "${key}" tidak diizinkan untuk kategori wedding`, 400);
      }
    }
  }
}

/**
 * Menyimpan booking dengan penanganan bentrok kode bookingNumber (E11000 retry hingga 5 kali)
 */
async function saveBookingWithRetry(bookingDoc, { session } = {}, maxRetries = 5) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      if (session) {
        return await bookingDoc.save({ session });
      }
      return await bookingDoc.save();
    } catch (err) {
      if (err.code === 11000 && err.keyPattern && err.keyPattern.bookingNumber) {
        attempt++;
        bookingDoc.bookingNumber = undefined; // trigger hook regenerate candidate
        if (attempt >= maxRetries) {
          throw new AppError('Gagal menghasilkan nomor booking yang unik setelah 5 percobaan', 500);
        }
      } else {
        throw err;
      }
    }
  }
}

/**
 * Proyeksi respons pesanan untuk pelanggan
 */
function formatCustomerBookingResponse(booking) {
  const doc = booking.toObject ? booking.toObject() : booking;
  return {
    _id: doc._id,
    bookingNumber: doc.bookingNumber,
    status: doc.status,
    paymentStatus: doc.paymentStatus,
    category: doc.category,
    packageSnapshot: doc.packageSnapshot,
    eventDate: doc.eventDate,
    eventName: doc.eventName,
    location: doc.location,
    guestCount: doc.guestCount,
    notes: doc.notes,
    formData: doc.formData,
    dpAmount: doc.dpAmount,
    expiresAt: doc.expiresAt,
    cancelReason: doc.cancelReason || '',
    statusHistory: (doc.statusHistory || []).map((h) => ({
      status: h.status,
      at: h.at,
      note: h.note || '',
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * 1. Pembuatan pesanan oleh pelanggan publik
 */
async function createCustomerBooking(data, user) {
  // 1. Validasi paket
  const pkg = await Package.findById(data.packageId);
  if (!pkg || !pkg.isActive) {
    throw new AppError('Paket tidak ditemukan atau sedang tidak aktif', 404);
  }

  // 2. Validasi form khusus kategori
  validateCategoryFormData(pkg.category, data.guestCount, data.formData);

  // 3. Cek ketersediaan tanggal
  const avail = await isDateAvailable(pkg.category, data.eventDate);
  if (!avail.available) {
    if (avail.status === 'lewat') {
      throw new AppError(avail.reason || 'Tanggal acara sudah lewat', 400);
    }
    throw new AppError(
      avail.reason || `Tanggal ${data.eventDate} sudah tidak tersedia (${avail.status})`,
      409
    );
  }

  // 4. Cek pesanan aktif ganda untuk paket dan tanggal yang sama oleh pelanggan yang sama
  const existingActive = await Booking.findOne({
    customer: user._id,
    package: pkg._id,
    eventDate: data.eventDate,
    status: { $in: ['menunggu_dp', 'menunggu_verifikasi'] },
  });
  if (existingActive) {
    throw new AppError(
      'Anda sudah memiliki pesanan aktif yang menunggu pembayaran/verifikasi untuk paket dan tanggal ini',
      409
    );
  }

  // 5. Ambil pengaturan untuk DP dan batas waktu pembayaran
  const settings = await Setting.getSettings();
  const dpAmount = settings.dpAmount ?? 1000000;
  const deadlineHours = settings.paymentDeadlineHours ?? 24;
  const expiresAt = new Date(Date.now() + deadlineHours * 60 * 60 * 1000);

  // 6. Buat dokumen Booking baru
  const newBooking = new Booking({
    customer: user._id,
    customerSnapshot: {
      name: data.contactName || user.name,
      phone: data.contactPhone || user.phone,
      email: data.contactEmail || user.email,
    },
    package: pkg._id,
    packageSnapshot: {
      name: pkg.name,
      price: pkg.price,
      category: pkg.category,
    },
    category: pkg.category,
    eventDate: data.eventDate,
    eventName: data.eventName,
    location: data.location,
    guestCount: data.guestCount,
    notes: data.notes || '',
    formData: data.formData || {},
    source: 'website',
    status: 'menunggu_dp',
    paymentStatus: 'belum_dp',
    dpAmount,
    expiresAt,
    statusHistory: [
      {
        status: 'menunggu_dp',
        at: new Date(),
        by: null,
        note: 'Pesanan dibuat oleh pelanggan',
      },
    ],
  });

  const saved = await saveBookingWithRetry(newBooking);
  return formatCustomerBookingResponse(saved);
}

/**
 * 2. Mengambil riwayat pesanan pelanggan sendiri
 */
async function getCustomerBookings(userId, { status, page = 1, limit = 10 }) {
  const query = { customer: userId };
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(query),
  ]);

  return {
    items: items.map(formatCustomerBookingResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * 3. Mengambil detail pesanan pelanggan sendiri
 */
async function getCustomerBookingById(id, userId) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Pesanan tidak ditemukan', 404);
  }

  const booking = await Booking.findOne({ _id: id, customer: userId });
  if (!booking) {
    throw new AppError('Pesanan tidak ditemukan', 404);
  }

  return formatCustomerBookingResponse(booking);
}

/**
 * 4. Daftar pesanan untuk admin
 */
async function getAdminBookings(query) {
  const filter = {};

  if (query.category) filter.category = query.category;
  if (query.status) filter.status = query.status;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  if (query.source) filter.source = query.source;

  if (query.dateFrom || query.dateTo) {
    filter.eventDate = {};
    if (query.dateFrom) filter.eventDate.$gte = query.dateFrom;
    if (query.dateTo) filter.eventDate.$lte = query.dateTo;
  }

  if (query.q) {
    const escaped = query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    filter.$or = [
      { bookingNumber: regex },
      { 'customerSnapshot.name': regex },
      { 'customerSnapshot.phone': regex },
      { eventName: regex },
    ];
  }

  const sortMap = {
    terbaru: { createdAt: -1 },
    terlama: { createdAt: 1 },
    tanggal_acara_asc: { eventDate: 1 },
    tanggal_acara_desc: { eventDate: -1 },
  };
  const sort = sortMap[query.sort] || { createdAt: -1 };

  const page = query.page || 1;
  const limit = query.limit || 10;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * 5. Detail lengkap pesanan untuk admin
 */
async function getAdminBookingById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Pesanan tidak ditemukan', 404);
  }

  const booking = await Booking.findById(id).lean();
  if (!booking) {
    throw new AppError('Pesanan tidak ditemukan', 404);
  }

  const rawPayments = await Payment.find({ booking: id })
    .sort({ createdAt: -1 })
    .lean();

  // Sanitasi publicId Cloudinary agar tidak terekspos
  const payments = rawPayments.map((p) => {
    const pCopy = { ...p };
    if (pCopy.proof) {
      delete pCopy.proof.publicId;
    }
    return pCopy;
  });

  return {
    booking,
    payments,
  };
}

/**
 * 6. Pembaruan status pesanan oleh admin
 */
async function updateBookingStatus(id, { status: newStatus, reason, refundNote }, adminId) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Pesanan tidak ditemukan', 404);
  }

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new AppError('Pesanan tidak ditemukan', 404);
  }

  const cur = booking.status;

  // Status akhir tidak bisa diubah
  if (cur === 'selesai' || cur === 'dibatalkan') {
    throw new AppError(`Pesanan dengan status "${cur}" sudah final dan tidak dapat diubah`, 409);
  }

  // Larangan eksplisit mengubah menjadi terkonfirmasi via endpoint ini
  if (newStatus === 'terkonfirmasi') {
    throw new AppError(
      'Perubahan status menjadi terkonfirmasi hanya dapat dilakukan lewat persetujuan pembayaran atau DP manual',
      400
    );
  }

  // Validasi transisi status
  const validTransitions = {
    menunggu_dp: ['dibatalkan'],
    menunggu_verifikasi: ['dibatalkan'],
    terkonfirmasi: ['berlangsung', 'dibatalkan'],
    berlangsung: ['selesai'],
  };

  const allowed = validTransitions[cur] || [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(
      `Transisi status dari "${cur}" ke "${newStatus}" tidak diizinkan`,
      400
    );
  }

  // Pembatalan wajib menyertakan alasan
  if (newStatus === 'dibatalkan' && (!reason || !reason.trim())) {
    throw new AppError('Alasan pembatalan wajib diisi', 400);
  }

  const updateFields = {
    status: newStatus,
    $push: {
      statusHistory: {
        status: newStatus,
        at: new Date(),
        by: adminId,
        note: reason || refundNote || `Status diubah menjadi ${newStatus}`,
      },
    },
  };

  if (newStatus === 'dibatalkan') {
    updateFields.cancelReason = reason;
    if (refundNote) {
      updateFields.refundNote = refundNote;
    }
  }

  // Update atomik dengan pengecekan status saat ini agar aman dari bentrok konkuren dua admin
  const updated = await Booking.findOneAndUpdate(
    { _id: id, status: cur },
    updateFields,
    { returnDocument: 'after', runValidators: true }
  );

  if (!updated) {
    throw new AppError('Status pesanan telah berubah oleh proses lain', 409);
  }

  return updated;
}

/**
 * 7. Pembuatan pesanan manual oleh admin
 */
async function createManualBooking(data, adminId) {
  let category;
  let packageSnapshot;
  let pkgId = null;

  if (data.packageId) {
    const pkg = await Package.findById(data.packageId);
    if (!pkg || !pkg.isActive) {
      throw new AppError('Paket tidak ditemukan atau sedang tidak aktif', 404);
    }
    category = pkg.category;
    packageSnapshot = {
      name: pkg.name,
      price: pkg.price,
      category: pkg.category,
    };
    pkgId = pkg._id;
  } else {
    // Tanpa packageId HANYA boleh untuk kategori catering (catering custom)
    const reqCategory = data.category || 'catering';
    if (reqCategory !== 'catering') {
      throw new AppError('Kategori dekor dan wedding wajib memilih paket yang tersedia', 400);
    }
    category = 'catering';
    packageSnapshot = {
      name: data.packageSnapshot?.name || 'Catering Custom',
      price: data.packageSnapshot?.price ?? null,
      category: 'catering',
    };
  }

  // Validasi form data kategori
  validateCategoryFormData(category, data.guestCount, data.formData);

  // Penentuan snapshot pelanggan
  let customerId = null;
  let customerSnapshot;

  if (data.customerId) {
    const custUser = await User.findById(data.customerId);
    if (!custUser) {
      throw new AppError('Akun pelanggan (customerId) tidak ditemukan', 400);
    }
    customerId = custUser._id;
    customerSnapshot = {
      name: data.contactName || custUser.name,
      phone: data.contactPhone || custUser.phone,
      email: data.contactEmail || custUser.email,
    };
  } else if (data.customer) {
    customerSnapshot = {
      name: data.customer.name,
      phone: data.customer.phone,
      email: data.customer.email || '',
    };
  } else {
    throw new AppError('Data pelanggan (customerId atau customer) wajib diisi', 400);
  }

  const settings = await Setting.getSettings();
  const dpAmount = settings.dpAmount ?? 1000000;

  // Kasus A: dpPaid = false (pesanan manual belum bayar DP)
  if (!data.dpPaid) {
    const avail = await isDateAvailable(category, data.eventDate);
    if (!avail.available) {
      if (avail.status === 'lewat') {
        throw new AppError(avail.reason || 'Tanggal acara sudah lewat', 400);
      }
      throw new AppError(
        avail.reason || `Tanggal ${data.eventDate} sudah tidak tersedia (${avail.status})`,
        409
      );
    }

    const expiresAt = new Date(Date.now() + (settings.paymentDeadlineHours || 24) * 60 * 60 * 1000);

    const manualBooking = new Booking({
      customer: customerId,
      customerSnapshot,
      package: pkgId,
      packageSnapshot,
      category,
      eventDate: data.eventDate,
      eventName: data.eventName,
      location: data.location,
      guestCount: data.guestCount,
      notes: data.notes || '',
      formData: data.formData || {},
      source: 'manual',
      status: 'menunggu_dp',
      paymentStatus: 'belum_dp',
      dpAmount,
      expiresAt,
      statusHistory: [
        {
          status: 'menunggu_dp',
          at: new Date(),
          by: adminId,
          note: 'Pesanan manual dibuat oleh admin (menunggu DP)',
        },
      ],
    });

    return await saveBookingWithRetry(manualBooking);
  }

  // Kasus B: dpPaid = true (pesanan manual langsung terkonfirmasi & mengunci slot)
  return await withSlotLock({ category, date: data.eventDate }, async (session) => {
    const manualBooking = new Booking({
      customer: customerId,
      customerSnapshot,
      package: pkgId,
      packageSnapshot,
      category,
      eventDate: data.eventDate,
      eventName: data.eventName,
      location: data.location,
      guestCount: data.guestCount,
      notes: data.notes || '',
      formData: data.formData || {},
      source: 'manual',
      status: 'terkonfirmasi',
      paymentStatus: 'dp_dibayar',
      dpAmount,
      expiresAt: null,
      statusHistory: [
        {
          status: 'terkonfirmasi',
          at: new Date(),
          by: adminId,
          note: `Pesanan manual dibuat oleh admin (DP lunas: ${data.dpMethod || 'tunai'})`,
        },
      ],
    });

    const saved = await saveBookingWithRetry(manualBooking, { session });

    // Buat Payment DP approved di dalam transaction yang sama
    const paidDate = data.dpPaidAt ? new Date(data.dpPaidAt) : new Date();
    await Payment.create(
      [
        {
          booking: saved._id,
          type: 'dp',
          amount: dpAmount,
          method: data.dpMethod || 'tunai',
          status: 'approved',
          source: 'manual',
          paidAt: paidDate,
          verifiedBy: adminId,
          verifiedAt: new Date(),
          note: data.dpNote || 'DP diterima langsung/manual oleh admin',
        },
      ],
      { session }
    );

    return saved;
  });
}

/**
 * 8. Pencatatan pelunasan pesanan oleh admin
 */
async function recordSettlement(id, data, adminId) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Pesanan tidak ditemukan', 404);
  }

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new AppError('Pesanan tidak ditemukan', 404);
  }

  if (booking.paymentStatus === 'lunas') {
    throw new AppError('Pesanan sudah berstatus lunas', 409);
  }

  if (booking.paymentStatus !== 'dp_dibayar') {
    throw new AppError(
      'Pencatatan pelunasan hanya dapat dilakukan setelah status pembayaran DP dibayar',
      400
    );
  }

  if (!['terkonfirmasi', 'berlangsung', 'selesai'].includes(booking.status)) {
    throw new AppError(
      'Pelunasan hanya dapat dicatat untuk pesanan yang terkonfirmasi, berlangsung, atau selesai',
      400
    );
  }

  // Jalankan dalam satu MongoDB transaction
  return await mongoose.connection.transaction(async (session) => {
    const updated = await Booking.findOneAndUpdate(
      { _id: id, paymentStatus: 'dp_dibayar' },
      {
        paymentStatus: 'lunas',
        $push: {
          statusHistory: {
            status: booking.status,
            at: new Date(),
            by: adminId,
            note: `Pelunasan dicatat: Rp${data.amount.toLocaleString('id-ID')} (${data.method})`,
          },
        },
      },
      { session, returnDocument: 'after', runValidators: true }
    );

    if (!updated) {
      throw new AppError('Pesanan telah diperbarui oleh proses lain atau sudah lunas', 409);
    }

    const [payment] = await Payment.create(
      [
        {
          booking: id,
          type: 'pelunasan',
          amount: data.amount,
          method: data.method,
          status: 'approved',
          source: 'manual',
          paidAt: new Date(data.paidAt),
          verifiedBy: adminId,
          verifiedAt: new Date(),
          note: data.note || '',
        },
      ],
      { session }
    );

    return {
      booking: updated,
      payment,
    };
  });
}

module.exports = {
  createCustomerBooking,
  getCustomerBookings,
  getCustomerBookingById,
  getAdminBookings,
  getAdminBookingById,
  updateBookingStatus,
  createManualBooking,
  recordSettlement,
  validateCategoryFormData,
  formatCustomerBookingResponse,
  saveBookingWithRetry,
};
