const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  query: { type: String, required: true },
  filters: {
    subject: String,
    noteType: String,
    sortBy: String,
  },
  resultCount: { type: Number },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

searchHistorySchema.index({ userId: 1, timestamp: -1 });
// TTL: auto-delete after 30 days
searchHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
