const Joi = require('joi');
const { SUBJECTS, PACK_TYPES } = require('../config/constants');

const generate = Joi.object({
  subject: Joi.string().valid(...SUBJECTS).required(),
  type: Joi.string().valid(...PACK_TYPES).required(),
  topics: Joi.array().items(Joi.string().trim().min(1)).min(1).max(20).required()
    .messages({ 'array.min': 'Please enter at least one topic' }),
});

const viva = Joi.object({
  subject: Joi.string().valid(...SUBJECTS).required(),
  topics: Joi.array().items(Joi.string().trim().min(1)).min(1).max(20).required()
    .messages({ 'array.min': 'Please enter at least one topic for viva practice' }),
});

module.exports = { generate, viva };
