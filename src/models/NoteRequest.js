const mongoose = require('mongoose');

const noteRequestSchema = new mongoose.Schema({
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  noteType: { type: String, enum: ['PDF', 'Diagram', 'Summary'], required: true },
  description: { type: String },
  status: { type: String, enum: ['open', 'fulfilled', 'closed'], default: 'open' },
  requestedAt: { type: Date, default: Date.now },
}, { timestamps: true });

noteRequestSchema.index({ subject: 1 });
noteRequestSchema.index({ status: 1 });
noteRequestSchema.index({ requestedAt: -1 });

module.exports = mongoose.model('NoteRequest', noteRequestSchema);
