const Joi = require('joi');
const { YEARS } = require('../config/constants');

const updateProfile = Joi.object({
  name: Joi.string().trim().min(2).max(60).optional(),
  bio: Joi.string().trim().max(300).optional().allow(''),
  college: Joi.string().trim().max(120).optional(),
  year: Joi.string().valid(...YEARS).optional(),
});

module.exports = { updateProfile };
