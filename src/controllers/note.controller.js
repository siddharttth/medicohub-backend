const mongoose = require('mongoose');
const Note = require('../models/Note');
const Rating = require('../models/Rating');
const Bookmark = require('../models/Bookmark');
const NoteRequest = require('../models/NoteRequest');
const { success, created, paginated } = require('../helpers/response');
const ApiError = require('../helpers/apiError');
const { uploadToCloudinary, deleteFromCloudinary } = require('../helpers/cloudinaryUpload');
const { getPagination } = require('../helpers/pagination');
const notificationService = require('../services/notification.service');
const achievementService = require('../services/achievement.service');
const { cached, invalidate, CACHE_TTL } = require('../helpers/cache');

exports.upload = async (req, res) => {
  if (!req.file) throw ApiError.badRequest('File is required');

  let tags = req.body.tags;
  if (typeof tags === 'string') {
    try { tags = JSON.parse(tags); } catch { tags = tags.split(',').map(t => t.trim()); }
  }

  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'medicohub/notes',
    resource_type: 'raw',
    use_filename: true,
  });

  const note = await Note.create({
    ...req.body,
    tags: tags || [],
    fileUrl: result.secure_url,
    fileSize: req.file.size,
    uploadedBy: req.user._id,
  });

  achievementService.checkAndAward(req.user._id).catch(() => {});
  created(res, { note }, 'Note uploaded and pending approval');
};

exports.search = async (req, res) => {
  const { subject, noteType, year, sortBy = 'createdAt', q } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = { deletedAt: null, approvalStatus: 'approved' };
  if (subject) filter.subject = subject;
  if (noteType) filter.noteType = noteType;
  if (year) filter.year = year;
  if (q) filter.$or = [
    { title: { $regex: q, $options: 'i' } },
    { description: { $regex: q, $options: 'i' } },
    { tags: { $in: [new RegExp(q, 'i')] } },
  ];

  const sortMap = {
    rating: { 'rating.averageScore': -1 },
    downloads: { downloads: -1 },
    createdAt: { createdAt: -1 },
  };

  const [notes, totalCount] = await Promise.all([
    Note.find(filter)
      .sort(sortMap[sortBy] || { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'name avatar college')
      .select('-fileUrl'),
    Note.countDocuments(filter),
  ]);

  paginated(res, notes, totalCount, page, limit);
};

exports.getOne = async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, deletedAt: null })
    .populate('uploadedBy', 'name avatar college role');
  if (!note) throw ApiError.notFound('Note not found');

  note.views += 1;
  await note.save();

  success(res, { note });
};

exports.download = async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, deletedAt: null, approvalStatus: 'approved' });
  if (!note) throw ApiError.notFound('Note not found');

  note.downloads += 1;
  await note.save();

  success(res, { fileUrl: note.fileUrl });
};

exports.deleteNote = async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, deletedAt: null });
  if (!note) throw ApiError.notFound('Note not found');

  const isOwner = note.uploadedBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') throw ApiError.forbidden();

  note.deletedAt = new Date();
  await note.save();

  success(res, {}, 'Note deleted');
};

exports.addBookmark = async (req, res) => {
  const noteExists = await Note.exists({ _id: req.params.id, deletedAt: null });
  if (!noteExists) throw ApiError.notFound('Note not found');

  await Bookmark.findOneAndUpdate(
    { userId: req.user._id, noteId: req.params.id },
    { userId: req.user._id, noteId: req.params.id },
    { upsert: true }
  );

  success(res, {}, 'Bookmarked');
};

exports.removeBookmark = async (req, res) => {
  await Bookmark.findOneAndDelete({ userId: req.user._id, noteId: req.params.id });
  success(res, {}, 'Bookmark removed');
};

exports.getBookmarks = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const userId = req.params.userId;

  const [bookmarks, totalCount] = await Promise.all([
    Bookmark.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'noteId', select: '-fileUrl', populate: { path: 'uploadedBy', select: 'name avatar' } }),
    Bookmark.countDocuments({ userId }),
  ]);

  paginated(res, bookmarks, totalCount, page, limit);
};

exports.rateNote = async (req, res) => {
  const { score, review } = req.body;
  const noteId = req.params.id;

  const note = await Note.findOne({ _id: noteId, deletedAt: null });
  if (!note) throw ApiError.notFound('Note not found');

  await Rating.findOneAndUpdate(
    { noteId, userId: req.user._id },
    { score, review },
    { upsert: true }
  );

  const agg = await Rating.aggregate([
    { $match: { noteId: new mongoose.Types.ObjectId(noteId) } },
    { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } },
  ]);

  note.rating = { averageScore: +(agg[0]?.avg || 0).toFixed(2), count: agg[0]?.count || 0 };
  await note.save();

  // Check achievements for note owner (top-rated)
  achievementService.checkAndAward(note.uploadedBy).catch(() => {});

  success(res, { rating: note.rating }, 'Rating saved');
};

exports.getReviews = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [reviews, totalCount] = await Promise.all([
    Rating.find({ noteId: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name avatar'),
    Rating.countDocuments({ noteId: req.params.id }),
  ]);

  paginated(res, reviews, totalCount, page, limit);
};

exports.requestNote = async (req, res) => {
  const request = await NoteRequest.create({ ...req.body, requestedBy: req.user._id });

  // Notify verified seniors about the request (fire-and-forget)
  const User = require('../models/User');
  const emailService = require('../services/email.service');
  User.find({ role: 'verified-senior', deletedAt: null }).select('email name').then(seniors => {
    seniors.forEach(senior => emailService.sendNoteRequest(senior, request).catch(() => {}));
  }).catch(() => {});

  created(res, { request }, 'Note request submitted');
};

exports.getTrending = async (req, res) => {
  const { subject, days = 7 } = req.query;
  const cacheKey = `trending:${subject || 'all'}:${days}`;

  const notes = await cached(cacheKey, CACHE_TTL.TRENDING, async () => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const filter = { deletedAt: null, approvalStatus: 'approved', createdAt: { $gte: since } };
    if (subject) filter.subject = subject;

    return Note.find(filter)
      .sort({ downloads: -1, views: -1 })
      .limit(10)
      .populate('uploadedBy', 'name avatar')
      .select('-fileUrl')
      .lean();
  });

  success(res, { notes });
};
