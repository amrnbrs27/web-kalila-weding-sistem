const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Middlewares standar
app.use(cors());
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
app.use('/api/packages', require('./routes/package.routes'));
app.use('/api/admin/packages', require('./routes/adminPackage.routes'));

// Handler rute tidak ditemukan & error handler terpusat
app.use(notFound);
app.use(errorHandler);

module.exports = app;
