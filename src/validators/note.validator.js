const Joi = require('joi');
const { SUBJECTS, NOTE_TYPES, YEARS } = require('../config/constants');

const uploadNote = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  subject: Joi.string().valid(...SUBJECTS).required(),
  noteType: Joi.string().valid(...NOTE_TYPES).insensitive().required(),
  description: Joi.string().trim().max(1000).optional(),
  tags: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
  year: Joi.string().valid(...YEARS).optional(),
  batch: Joi.number().integer().min(2000).max(2100).optional(),
});

const searchNotes = Joi.object({
  subject: Joi.string().valid(...SUBJECTS).optional(),
  noteType: Joi.string().valid(...NOTE_TYPES).insensitive().optional(),
  year: Joi.string().valid(...YEARS).optional(),
  sortBy: Joi.string().valid('rating', 'downloads', 'createdAt').default('createdAt'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  q: Joi.string().trim().optional(),
});

const rateNote = Joi.object({
  score: Joi.number().integer().min(1).max(5).required(),
  review: Joi.string().trim().max(500).optional(),
});

const requestNote = Joi.object({
  subject: Joi.string().valid(...SUBJECTS).required(),
  topic: Joi.string().trim().min(3).max(200).required(),
  noteType: Joi.string().valid('PDF', 'Diagram', 'Summary').required(),
  description: Joi.string().trim().max(500).optional(),
});

module.exports = { uploadNote, searchNotes, rateNote, requestNote };
