const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Nama lengkap wajib diisi"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email wajib diisi"],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, "Format email tidak valid"],
        },
        phone: {
            type: String,
            required: [true, "Nomor WhatsApp wajib diisi"],
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password wajib diisi"],
            minlength: [6, "Password minimal 6 karakter"],
            select: false,
        },
        resetPasswordToken: String,
        resetPasswordExpires: Date,
    },
    {
        timestamps: true,
    }
);

// Hash password sebelum disimpan
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method verifikasi password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
