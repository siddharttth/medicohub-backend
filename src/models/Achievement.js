const mongoose = require('mongoose');

const ACHIEVEMENT_TYPES = [
  'night-owl', 'verified-contributor', 'top-rated',
  '30-day-streak', 'first-upload', 'helpful-senior', 'power-user',
];

const achievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ACHIEVEMENT_TYPES, required: true },
  title: { type: String, required: true },
  description: { type: String },
  icon: { type: String }, // emoji or URL
  requirements: {
    streakDays: Number,
    notesShared: Number,
    likesReceived: Number,
  },
  unlockedAt: { type: Date, default: null },
  progress: {
    current: { type: Number, default: 0 },
    target: { type: Number, required: true },
  },
}, { timestamps: true });

achievementSchema.index({ userId: 1 });
achievementSchema.index({ type: 1 });
achievementSchema.index({ unlockedAt: -1 });

module.exports = mongoose.model('Achievement', achievementSchema);
