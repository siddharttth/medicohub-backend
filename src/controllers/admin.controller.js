const Note = require('../models/Note');
const Drop = require('../models/Drop');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { success } = require('../helpers/response');
const ApiError = require('../helpers/apiError');
const emailService = require('../services/email.service');
const notificationService = require('../services/notification.service');

exports.moderate = async (req, res) => {
  const { action, reason } = req.body;
  const { id } = req.params;

  let target = await Note.findById(id) || await Drop.findById(id) || await User.findById(id);
  if (!target) throw ApiError.notFound('Target not found');

  const targetType = target.constructor.modelName.toLowerCase();

  if (action === 'approve' && targetType === 'note') {
    target.approvalStatus = 'approved';
    target.approvedBy = req.user._id;
    await target.save();

    const io = req.app.get('io');
    const notif = await notificationService.createNotification(
      target.uploadedBy,
      'note-approved',
      'Note Approved',
      `Your note "${target.title}" has been approved.`,
      target._id
    );
    notificationService.broadcastNotification(io, target.uploadedBy, notif);
    await emailService.sendNoteApproved(await User.findById(target.uploadedBy), target);
  } else if (action === 'reject' && targetType === 'note') {
    target.approvalStatus = 'rejected';
    await target.save();
  } else if (action === 'flag') {
    target.status = 'flagged';
    await target.save();
  } else if (action === 'delete-message' && targetType === 'drop') {
    target.status = 'hidden';
    await target.save();
  } else if (action === 'ban-user' && targetType === 'user') {
    target.deletedAt = new Date();
    await target.save();
  } else {
    throw ApiError.badRequest('Invalid action for target type');
  }

  await AuditLog.create({
    admin: req.user._id,
    action,
    targetId: id,
    targetType,
    reason,
  });

  success(res, {}, 'Moderation action applied');
};

exports.getStats = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalUsers, activeToday, notesUploaded, pendingNotes, topSubjectsAgg] = await Promise.all([
    User.countDocuments({ deletedAt: null }),
    User.countDocuments({ lastActivityDate: { $gte: today }, deletedAt: null }),
    Note.countDocuments({ deletedAt: null }),
    Note.countDocuments({ approvalStatus: 'pending', deletedAt: null }),
    Note.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  success(res, {
    totalUsers,
    activeToday,
    notesUploaded,
    pendingNotes,
    topSubjects: topSubjectsAgg.map(s => ({ subject: s._id, count: s.count })),
  });
};

exports.getPendingNotes = async (req, res) => {
  const notes = await Note.find({ approvalStatus: 'pending', deletedAt: null })
    .sort({ createdAt: 1 })
    .populate('uploadedBy', 'name email college');
  success(res, { notes });
};
