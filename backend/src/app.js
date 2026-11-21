const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Middlewares standar
app.use(cors());

// Parser khusus rute artikel admin (POST/PUT) dengan batas body 300 KB sebelum parser global
app.use('/api/admin/posts', (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    return express.json({ limit: '300kb' })(req, res, next);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Booking Dekor & Catering Kalila siap digunakan! 🚀',
  });
});

// Daftarkan rute API
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/auth', require('./routes/passwordReset.routes'));
app.use('/api/packages', require('./routes/package.routes'));
app.use('/api/admin/packages', require('./routes/adminPackage.routes'));
app.use('/api/settings', require('./routes/setting.routes'));
app.use('/api/admin/settings', require('./routes/adminSetting.routes'));
app.use('/api/admin/calendar', require('./routes/calendar.routes'));
app.use('/api/availability', require('./routes/availability.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/admin/bookings', require('./routes/adminBooking.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/admin/payments', require('./routes/adminPayment.routes'));
app.use('/api/admin/dashboard', require('./routes/dashboard.routes'));
app.use('/api/admin/finance', require('./routes/finance.routes'));
app.use('/api/portfolios', require('./routes/portfolio.routes'));
app.use('/api/admin/portfolios', require('./routes/adminPortfolio.routes'));
app.use('/api/admin/users', require('./routes/adminUser.routes'));
app.use('/api/admin/emails', require('./routes/adminEmail.routes'));
app.use('/api/posts', require('./routes/post.routes'));
app.use('/api/admin/posts', require('./routes/adminPost.routes'));

// Handler rute tidak ditemukan & error handler terpusat
app.use(notFound);
app.use(errorHandler);

module.exports = app;
