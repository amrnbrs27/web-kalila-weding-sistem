const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Nama paket wajib diisi"],
            trim: true,
        },
        category: {
            type: String,
            required: [true, "Kategori paket wajib diisi"],
            enum: ["dekor", "catering", "wedding"],
        },
        price: {
            type: Number,
            required: [true, "Harga paket wajib diisi"],
            min: [0, "Harga tidak boleh negatif"],
        },
        description: {
            type: String,
            default: "",
        },
        features: [
            {
                type: String,
                trim: true,
            },
        ],
        images: [
            {
                type: String,
            },
        ],
        // Spesifik untuk paket Dekor (lebar dekorasi bawaan dalam meter)
        decorWidth: {
            type: Number,
            default: null,
        },
        // Spesifik untuk Catering
        minPortion: {
            type: Number,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Package", packageSchema);
