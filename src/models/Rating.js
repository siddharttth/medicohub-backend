const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String },
}, { timestamps: true });

ratingSchema.index({ noteId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
