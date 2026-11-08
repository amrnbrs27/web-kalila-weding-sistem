const AppError = require('../utils/AppError');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const err = new AppError('Data yang dikirim tidak valid', 400);
    err.details = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return next(err);
  }
  req.body = result.data; // pakai data yang sudah dibersihkan
  next();
};

const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const err = new AppError('Parameter pencarian tidak valid', 400);
    err.details = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return next(err);
  }
  req.query = result.data; // pakai data yang sudah dibersihkan
  next();
};

module.exports = validate;
module.exports.validate = validate;
module.exports.validateQuery = validateQuery;
