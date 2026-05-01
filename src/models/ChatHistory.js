const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  aiMessage: { type: String, required: true },
  aiResponse: { type: String, required: true },
  subject: { type: String },
  timestamp: { type: Date, default: Date.now },
  isMarkedAsHelpful: { type: Boolean, default: false },
}, { timestamps: true });

chatHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
