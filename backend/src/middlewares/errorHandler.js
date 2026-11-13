const AppError = require('../utils/AppError');

exports.notFound = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} tidak ditemukan`, 404));
};

exports.errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Terjadi kesalahan pada server';

  if (err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413) {
    status = 413;
    message = 'Ukuran data yang dikirim melebihi batas yang diizinkan';
  } else if (err.code === 11000) {                       // data unik sudah ada
    status = 409;
    message = `${Object.keys(err.keyValue)[0]} sudah terdaftar`;
  } else if (err.name === 'ValidationError') {    // validasi Mongoose
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {          // id tidak valid
    status = 400;
    message = 'Format ID tidak valid';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token tidak valid atau sudah kedaluwarsa';
  }

  if (status === 500) console.error(err);         // error tak terduga dicatat di server

  res.status(status).json({
    success: false,
    message: status === 500 ? 'Terjadi kesalahan pada server' : message,
    ...(err.details && { errors: err.details }),
  });
};