const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const attachmentSchema = new mongoose.Schema({
  fileUrl: String,
  fileName: String,
  fileType: String,
}, { _id: false });

const dropSchema = new mongoose.Schema({
  subject: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  authorName: { type: String },
  authorAvatar: { type: String },
  text: { type: String, required: true },
  attachments: [attachmentSchema],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likeCount: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false },
  pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  replies: [replySchema],
  status: { type: String, enum: ['visible', 'hidden', 'flagged'], default: 'visible' },
}, { timestamps: true });

dropSchema.index({ subject: 1 });
dropSchema.index({ author: 1 });
dropSchema.index({ createdAt: -1 });
dropSchema.index({ isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('Drop', dropSchema);
