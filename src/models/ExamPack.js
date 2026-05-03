const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  id: String,
  title: String,
  yield: { type: String, enum: ['high', 'medium', 'low'] },
}, { _id: false });

const pyqSchema = new mongoose.Schema({
  year: Number,
  marks: Number,
  type: String,
}, { _id: false });

const mcqSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answer: String,
}, { _id: false });

const qaSchema = new mongoose.Schema({
  question: String,
  answer: String,
}, { _id: false });

const examPackSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  packType: { type: String, enum: ['full-pack', 'viva-only', 'quick-review', 'viva-practice'], required: true },
  inputTopics: [String],
  // async job tracking
  status: { type: String, enum: ['pending', 'done', 'failed'], default: 'done' },
  errorMessage: { type: String },
  content: {
    // full-pack
    mcqs: [mcqSchema],
    shortQuestions: [qaSchema],
    longQuestions: [String],
    // quick-review
    reviewQuestions: [qaSchema],
    // viva-only
    vivaQuestions: [qaSchema],
    // legacy fields kept for compat
    topics: [topicSchema],
    mnemonics: [String],
    pyqs: [pyqSchema],
    tips: String,
  },
  generatedBy: { type: String, default: 'llama-3.3-70b-versatile' },
  generatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  // user who generated (for daily limit tracking)
  generatedByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requestCount: { type: Number, default: 1 },
  isCached: { type: Boolean, default: false },
}, { timestamps: true });

examPackSchema.pre('save', async function () {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
});

examPackSchema.index({ subject: 1 });
examPackSchema.index({ packType: 1 });
examPackSchema.index({ generatedAt: -1 });
examPackSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-delete

module.exports = mongoose.model('ExamPack', examPackSchema);
