const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        bookingCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false, // Boleh null jika dibuat via admin manual
        },
        package: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Package",
            required: true,
        },
        category: {
            type: String,
            required: true,
            enum: ["dekor", "catering", "wedding"],
        },
        eventDate: {
            type: Date,
            required: [true, "Tanggal acara wajib diisi"],
        },
        eventName: {
            type: String,
            required: [true, "Nama acara wajib diisi"],
            trim: true,
        },
        eventLocation: {
            type: String,
            required: [true, "Lokasi acara wajib diisi"],
            trim: true,
        },
        customerName: {
            type: String,
            required: [true, "Nama pemesan wajib diisi"],
            trim: true,
        },
        customerPhone: {
            type: String,
            required: [true, "Nomor WhatsApp pemesan wajib diisi"],
            trim: true,
        },
        customerEmail: {
            type: String,
            required: [true, "Email pemesan wajib diisi"],
            trim: true,
        },
        // Data Tambahan Spesifik Kategori
        decorSize: {
            type: String,
            default: "",
        },
        portionCount: {
            type: Number,
            default: null,
        },
        servingTime: {
            type: String,
            default: "",
        },
        weddingGuests: {
            type: Number,
            default: null,
        },
        notes: {
            type: String,
            default: "",
        },
        // Finansial & Status
        totalPrice: {
            type: Number,
            required: true,
        },
        dpAmount: {
            type: Number,
            default: 1000000, // Flat Rp1.000.000
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "dp_paid", "fully_paid", "cancelled", "refunded"],
            default: "pending",
        },
        orderStatus: {
            type: String,
            enum: ["menunggu_dp", "dikonfirmasi", "berlangsung", "selesai", "batal"],
            default: "menunggu_dp",
        },
        source: {
            type: String,
            enum: ["website", "manual"],
            default: "website",
        },
        expiresAt: {
            type: Date,
            required: true, // 24 jam sejak pesanan dibuat
        },
        hasDesignAccess: {
            type: Boolean,
            default: false, // Aktif setelah DP lunas untuk kategori dekor
        },
    },
    {
        timestamps: true,
    }
);

// Index tanggal dan status untuk query ketersediaan tanggal
bookingSchema.index({ eventDate: 1, category: 1, paymentStatus: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
