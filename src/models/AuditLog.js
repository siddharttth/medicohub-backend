const mongoose = require('mongoose');

const AUDIT_ACTIONS = ['approve-note', 'delete-message', 'ban-user', 'flag-content'];
const TARGET_TYPES = ['note', 'message', 'user'];

const auditLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: AUDIT_ACTIONS, required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  targetType: { type: String, enum: TARGET_TYPES, required: true },
  reason: { type: String },
  timestamp: { type: Date, default: Date.now },
}, {
  // Immutable: no updates or deletes
  timestamps: false,
});

auditLogSchema.index({ admin: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
