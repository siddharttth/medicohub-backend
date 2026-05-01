const { verifyAccessToken } = require('../helpers/token');
const User = require('../models/User');

const setupNotificationsSocket = (io) => {
  const notifications = io.of('/notifications');

  notifications.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('_id');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  notifications.on('connection', (socket) => {
    // Join personal room using userId
    socket.join(socket.user._id.toString());

    socket.on('disconnect', () => {});
  });
};

module.exports = setupNotificationsSocket;
