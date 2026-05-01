const Notification = require('../models/Notification');
const DeviceToken = require('../models/DeviceToken');
const { success, paginated } = require('../helpers/response');
const ApiError = require('../helpers/apiError');
const { getPagination } = require('../helpers/pagination');

exports.subscribe = async (req, res) => {
  const { deviceToken, platform } = req.body;

  await DeviceToken.findOneAndUpdate(
    { userId: req.user._id, deviceToken },
    { userId: req.user._id, deviceToken, platform, isActive: true },
    { upsert: true, new: true }
  );

  success(res, {}, 'Device subscribed');
};

exports.getNotifications = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const userId = req.params.userId;

  if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden();
  }

  const [notifications, totalCount] = await Promise.all([
    Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ userId }),
  ]);

  paginated(res, notifications, totalCount, page, limit);
};

exports.markRead = async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notif) throw ApiError.notFound('Notification not found');
  success(res, { notification: notif });
};

exports.markAllRead = async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
  success(res, {}, 'All notifications marked as read');
};
