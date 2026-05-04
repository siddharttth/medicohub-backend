const ApiError = require('../helpers/apiError');

const errorHandler = (err, req, res, _next) => {
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: 'Validation error', errors });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, message: `${field} already exists` });
  }

  if (err instanceof ApiError) {
    console.error('[ApiError]', err.statusCode, err.message, err.errors);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors.length > 0 && { errors: err.errors }),
    });
  }

  console.error('[Unhandled Error]', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
};

module.exports = errorHandler;
