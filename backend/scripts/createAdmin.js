const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../src/models/User');

function validatePasswordPolicy(password, email) {
  if (typeof password !== 'string') return 'Password harus berupa string';
  if (password.length < 8) return 'Password minimal 8 karakter';
  if (Buffer.byteLength(password, 'utf8') > 72) return 'Password maksimal 72 byte';
  if (!/[a-zA-Z]/.test(password)) return 'Password harus mengandung minimal satu huruf';
  if (!/[0-9]/.test(password)) return 'Password harus mengandung minimal satu angka';
  if (email && password.toLowerCase() === email.toLowerCase()) {
    return 'Password tidak boleh sama dengan email';
  }
  return null;
}

async function run() {
  const name = process.env.ADMIN_NAME ? process.env.ADMIN_NAME.trim() : '';
  const email = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.trim().toLowerCase() : '';
  const password = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD : '';

  if (!name || !email || !password) {
    console.error('ERROR: Variabel lingkungan ADMIN_NAME, ADMIN_EMAIL, dan ADMIN_PASSWORD wajib diisi.');
    process.exit(1);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('ERROR: Format ADMIN_EMAIL tidak valid.');
    process.exit(1);
  }

  const passwordError = validatePasswordPolicy(password, email);
  if (passwordError) {
    console.error(`ERROR: Kebijakan password tidak terpenuhi: ${passwordError}`);
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('ERROR: Environment variable MONGO_URI tidak ditemukan.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`Akun dengan email ${email} sudah terdaftar. Tidak ada perubahan yang dilakukan.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    await User.create({
      name,
      email,
      password,
      role: 'admin',
      isActive: true,
    });

    console.log(`Akun admin (${email}) berhasil dibuat.`);
  } catch (err) {
    console.error('ERROR saat membuat admin:', err.message);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  run();
}

module.exports = { run, validatePasswordPolicy };
