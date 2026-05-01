const rateLimit = require('express-rate-limit');

const make = (max, windowMs, message) =>
  rateLimit({ max, windowMs, message: { success: false, message }, standardHeaders: true, legacyHeaders: false });

const authLimiter = make(5, 60 * 1000, 'Too many auth attempts, please wait');
const generalLimiter = make(100, 60 * 1000, 'Too many requests');
const readLimiter = make(1000, 60 * 1000, 'Too many requests');

module.exports = { authLimiter, generalLimiter, readLimiter };
