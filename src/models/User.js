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
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
