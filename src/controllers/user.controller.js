const User = require('../models/User');
const Note = require('../models/Note');
const Drop = require('../models/Drop');
const { success } = require('../helpers/response');
const ApiError = require('../helpers/apiError');
const { uploadToCloudinary } = require('../helpers/cloudinaryUpload');
const { cached, invalidate, CACHE_TTL } = require('../helpers/cache');

exports.getProfile = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, deletedAt: null })
    .select('name college year avatar bio streakDays role createdAt');
  if (!user) throw ApiError.notFound('User not found');

  const notesShared = await Note.countDocuments({ uploadedBy: user._id, deletedAt: null, approvalStatus: 'approved' });
  success(res, { ...user.toObject(), notesShared });
};

exports.updateProfile = async (req, res) => {
  if (req.params.id !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden();
  }

  const updates = { ...req.body };

  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'medicohub/avatars',
      resource_type: 'image',
      transformation: [{ width: 400, height: 400, crop: 'fill' }],
    });
    updates.avatar = result.secure_url;
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-passwordHash');

  if (!user) throw ApiError.notFound('User not found');
  invalidate(`user:stats:${req.params.id}`).catch(() => {});
  success(res, { user });
};

exports.getStats = async (req, res) => {
  const userId = req.params.id;
  const cacheKey = `user:stats:${userId}`;

  const stats = await cached(cacheKey, CACHE_TTL.USER_STATS, async () => {
    const [user, notesShared, notesDownloadedAgg, messagesPosted] = await Promise.all([
      User.findOne({ _id: userId, deletedAt: null }).select('streakDays totalStudyHours'),
      Note.countDocuments({ uploadedBy: userId, deletedAt: null, approvalStatus: 'approved' }),
      Note.aggregate([
        { $match: { uploadedBy: require('mongoose').Types.ObjectId.createFromHexString(userId) } },
        { $group: { _id: null, total: { $sum: '$downloads' } } },
      ]),
      Drop.countDocuments({ author: userId, status: 'visible' }),
    ]);

    if (!user) return null;
    return {
      streakDays: user.streakDays,
      notesShared,
      totalStudyHours: user.totalStudyHours,
      notesDownloaded: notesDownloadedAgg[0]?.total || 0,
      messagesPosted,
    };
  });

  if (!stats) throw ApiError.notFound('User not found');
  success(res, stats);
};

exports.logStudySession = async (req, res) => {
  const userId = req.user._id;
  const { minutes } = req.body;
  if (!minutes || minutes <= 0) return success(res, {});

  const todayStr = new Date().toISOString().split('T')[0];
  const user = await User.findById(userId).select('dailyLog totalStudyHours');
  if (!user) throw ApiError.notFound('User not found');

  const log = user.dailyLog.find(d => d.date.toISOString().split('T')[0] === todayStr);
  if (log) {
    log.minutesSpent += minutes;
  } else {
    user.dailyLog.push({ date: new Date(), minutesSpent: minutes });
  }
  user.totalStudyHours = Math.round(((user.totalStudyHours || 0) * 60 + minutes) / 60 * 10) / 10;
  await user.save();
  invalidate(`user:stats:${userId}`).catch(() => {});
  success(res, { totalStudyHours: user.totalStudyHours });
};

exports.getStreak = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, deletedAt: null }).select('dailyLog');
  if (!user) throw ApiError.notFound('User not found');

  const today = new Date();
  const days = [];
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const log = user.dailyLog.find(
      d => d.date.toISOString().split('T')[0] === dateStr
    );
    days.push({ date: dateStr, isActive: !!log, minutesSpent: log?.minutesSpent || 0 });
  }

  success(res, { streak: days });
};
