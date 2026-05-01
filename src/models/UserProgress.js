const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  topicId: { type: String, required: true },
  topicTitle: { type: String },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });

userProgressSchema.index({ userId: 1, subject: 1 });
userProgressSchema.index({ userId: 1, topicId: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', userProgressSchema);
