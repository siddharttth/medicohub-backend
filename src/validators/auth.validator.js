const Joi = require('joi');

const passwordRule = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .message('Password must be 8+ chars with uppercase, lowercase, and number');

const register = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: passwordRule.required(),
  name: Joi.string().trim().min(2).max(60).required(),
  college: Joi.string().trim().max(120).optional(),
  year: Joi.string().valid('1st', '2nd', '3rd', 'Final').optional(),
});

const login = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const forgotPassword = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
});

const resetPassword = Joi.object({
  token: Joi.string().required(),
  newPassword: passwordRule.required(),
});

const refresh = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = { register, login, forgotPassword, resetPassword, refresh };
