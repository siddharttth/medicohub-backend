const Joi = require('joi');
const { SUBJECTS, PACK_TYPES } = require('../config/constants');

const generate = Joi.object({
  subject: Joi.string().valid(...SUBJECTS).required(),
  type: Joi.string().valid(...PACK_TYPES).required(),
});

const viva = Joi.object({
  subject: Joi.string().valid(...SUBJECTS).required(),
});

module.exports = { generate, viva };
