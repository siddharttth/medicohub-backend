const mongoose = require('mongoose');

const SUBJECTS = [
  'Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology',
  'Microbiology', 'Forensic Medicine', 'Community Medicine', 'Medicine',
  'Surgery', 'Obstetrics & Gynaecology', 'Paediatrics', 'Orthopaedics',
  'Ophthalmology', 'ENT', 'Dermatology', 'Psychiatry', 'Radiology',
  'Anaesthesia', 'Other',
];

const NOTE_TYPES = ['PDF', 'Handwritten', 'Diagram', 'PYQ'];
const YEARS = ['1st', '2nd', '3rd', 'Final'];
const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'];

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subject: { type: String, required: true, enum: SUBJECTS },
  noteType: { type: String, required: true, enum: NOTE_TYPES },
  description: { type: String },
  fileUrl: { type: String }, // Cloudinary URL
  fileName: { type: String },
  fileType: { type: String },
  fileSize: { type: Number }, // bytes
  tags: [{ type: String }],
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  downloads: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  rating: {
    averageScore: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
  approvalStatus: { type: String, enum: APPROVAL_STATUSES, default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  year: { type: String, enum: YEARS },
  batch: { type: Number }, // graduation year
  isHighYield: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

noteSchema.virtual('ratingCount').get(function () {
  return this.rating?.count || 0;
});

noteSchema.index({ subject: 1 });
noteSchema.index({ noteType: 1 });
noteSchema.index({ uploadedBy: 1 });
noteSchema.index({ 'rating.averageScore': -1 });
noteSchema.index({ createdAt: -1 });
noteSchema.index({ subject: 1, createdAt: -1 });
noteSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
