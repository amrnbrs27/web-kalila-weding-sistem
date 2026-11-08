require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await User.create({
    name: 'Admin',
    email: 'admin@gmail.com',
    phone: '08123456789',
    password: 'kalila123',
    role: 'admin',
  });
  console.log('Admin dibuat');
  process.exit(0);
})();