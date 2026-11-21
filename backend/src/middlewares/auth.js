const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

exports.authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (!token) throw new AppError('Silakan login terlebih dahulu', 401);

  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(payload.id).select('+passwordChangedAt');
  if (!user || !user.isActive) throw new AppError('Akun tidak ditemukan atau nonaktif', 401);

  if (user.passwordChangedAt) {
    const changedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
    if (payload.iat < changedTimestamp) {
      throw new AppError('Password telah diubah, silakan login kembali', 401);
    }
  }

  req.user = user;
  next();
});

exports.optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('+passwordChangedAt');
    if (user && user.isActive) {
      if (user.passwordChangedAt) {
        const changedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
        if (payload.iat < changedTimestamp) {
          return next();
        }
      }
      req.user = user;
    }
  } catch (err) {
    // Token tidak valid diabaikan untuk optional authenticate
  }
  next();
});

exports.requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return next(new AppError('Akses khusus admin', 403));
  next();
};
