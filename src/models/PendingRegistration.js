const mongoose = require('mongoose');

const pendingRegistrationSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  name:         { type: String, required: true },
  college:      { type: String },
  year:         { type: String },
  otp:          { type: String, required: true },
  otpExpiry:    { type: Date, required: true },
  attempts:     { type: Number, default: 0 },
}, { timestamps: true });

// Auto-delete documents after 10 minutes
pendingRegistrationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);
