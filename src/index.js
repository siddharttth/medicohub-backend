require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');
const setupDropsSocket = require('./sockets/drops.socket');
const setupNotificationsSocket = require('./sockets/notifications.socket');
const startStreakJob = require('./jobs/streak.job');
const startTokenCleanupJob = require('./jobs/tokenCleanup.job');
const startDailyReminderJob = require('./jobs/dailyReminder.job');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
    credentials: true,
  },
});

// Make io accessible from controllers via req.app.get('io')
app.set('io', io);

setupDropsSocket(io);
setupNotificationsSocket(io);

const start = async () => {
  await connectDB();

  startStreakJob();
  startTokenCleanupJob();
  startDailyReminderJob();

  server.listen(PORT, () => {
    console.log(`\nMedicoHub API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health: http://localhost:${PORT}/health\n`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
