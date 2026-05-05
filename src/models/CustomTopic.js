const mongoose = require('mongoose');

const customTopicSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: String, required: true },
  title: { type: String, required: true },
  yield: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

customTopicSchema.index({ userId: 1, subject: 1 });

module.exports = mongoose.model('CustomTopic', customTopicSchema);
