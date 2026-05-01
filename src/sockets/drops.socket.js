const { verifyAccessToken } = require('../helpers/token');
const User = require('../models/User');

const setupDropsSocket = (io) => {
  const drops = io.of('/drops');

  drops.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (token) {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.userId).select('name avatar role');
        socket.user = user;
      }
      next();
    } catch {
      // Allow unauthenticated connections for read-only
      next();
    }
  });

  drops.on('connection', (socket) => {
    socket.on('join-subject', (subject) => {
      socket.join(subject || 'general');
    });

    socket.on('leave-subject', (subject) => {
      socket.leave(subject || 'general');
    });

    socket.on('disconnect', () => {});
  });
};

module.exports = setupDropsSocket;
