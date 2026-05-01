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

  const getRoom = (payload) => {
    if (!payload) return 'general';
    const subject = typeof payload === 'string' ? payload : payload.subject;
    return subject || 'general';
  };

  const joinRoom = (socket, payload) => {
    const room = getRoom(payload);
    if (socket.currentSubjectRoom && socket.currentSubjectRoom !== room) {
      socket.leave(socket.currentSubjectRoom);
    }
    socket.currentSubjectRoom = room;
    socket.join(room);
  };

  const leaveRoom = (socket, payload) => {
    const room = getRoom(payload);
    socket.leave(room);
    if (socket.currentSubjectRoom === room) {
      socket.currentSubjectRoom = null;
    }
  };

  drops.on('connection', (socket) => {
    socket.on('join_room', (payload) => joinRoom(socket, payload));
    socket.on('join-room', (payload) => joinRoom(socket, payload));
    socket.on('join-subject', (payload) => joinRoom(socket, payload));

    socket.on('leave_room', (payload) => leaveRoom(socket, payload));
    socket.on('leave-room', (payload) => leaveRoom(socket, payload));
    socket.on('leave-subject', (payload) => leaveRoom(socket, payload));

    socket.on('disconnect', () => {});
  });
};

module.exports = setupDropsSocket;
