const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Nama wajib diisi'], trim: true },
    email: {
      type: String, required: [true, 'Email wajib diisi'],
      unique: true, lowercase: true, trim: true,
    },
    phone: { type: String, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);