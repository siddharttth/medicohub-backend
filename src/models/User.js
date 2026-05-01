const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  minutesSpent: { type: Number, required: true },
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  college: { type: String, trim: true },
  year: { type: String },
  avatar: { type: String }, // Cloudinary URL
  bio: { type: String },
  streakDays: { type: Number, default: 0 },
  lastActivityDate: { type: Date },
  totalStudyHours: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'verified-senior', 'admin'], default: 'user' },
  dailyLog: [dailyLogSchema],
  settings: {
    theme: { type: String, default: 'light' },
    notifications: { type: Boolean, default: true },
    privacy: { type: String, enum: ['public', 'private'], default: 'public' },
  },
  savedPacks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ExamPack' }],
  refreshTokenHash: { type: String, default: null, select: false },
  resetPasswordHash: { type: String, default: null, select: false },
  resetPasswordExpiry: { type: Date, default: null, select: false },
  failedLoginAttempts: { type: Number, default: 0, select: false },
  lockUntil: { type: Date, default: null, select: false },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
