const Joi = require('joi');
const { SUBJECTS } = require('../config/constants');

const createDrop = Joi.object({
  subject: Joi.string().valid(...SUBJECTS).optional(),
  text: Joi.string().trim().min(1).max(2000).required(),
  isAnonymous: Joi.boolean().default(false),
});

const getDrops = Joi.object({
  subject: Joi.string().valid(...SUBJECTS).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

const reply = Joi.object({
  text: Joi.string().trim().min(1).max(1000).required(),
});

module.exports = { createDrop, getDrops, reply };
