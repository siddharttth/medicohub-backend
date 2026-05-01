const Notification = require('../models/Notification');

const createNotification = async (userId, type, title, body, relatedId = null) => {
  const notif = await Notification.create({ userId, type, title, body, relatedId });
  return notif;
};

const broadcastNotification = (io, userId, notification) => {
  if (io) {
    io.of('/notifications').to(userId.toString()).emit('notification', notification);
  }
};

module.exports = { createNotification, broadcastNotification };
