const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Nama admin wajib diisi"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email admin wajib diisi"],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, "Format email tidak valid"],
        },
        password: {
            type: String,
            required: [true, "Password wajib diisi"],
            minlength: [6, "Password minimal 6 karakter"],
            select: false,
        },
        role: {
            type: String,
            default: "admin",
            enum: ["admin"],
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

adminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

adminSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Admin", adminSchema);
