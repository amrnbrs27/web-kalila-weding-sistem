const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const publicUser = (u) => ({
  id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role,
});

exports.register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const user = await User.create({ name, email, phone, password }); // role selalu customer
  res.status(201).json({
    success: true,
    message: 'Registrasi berhasil',
    data: { token: signToken(user), user: publicUser(user) },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password)))
    throw new AppError('Email atau password salah', 401);
  if (!user.isActive) throw new AppError('Akun dinonaktifkan', 403);

  res.json({
    success: true,
    message: 'Login berhasil',
    data: { token: signToken(user), user: publicUser(user) },
  });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: publicUser(req.user) } });
});