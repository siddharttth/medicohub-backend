const cron = require('node-cron');
const User = require('../models/User');

// Runs daily at 3 AM UTC — resets streak if user missed yesterday
const startStreakJob = () => {
  cron.schedule('0 3 * * *', async () => {
    console.log('[CRON] Running streak reset job...');
    try {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      yesterday.setUTCHours(0, 0, 0, 0);

      const result = await User.updateMany(
        {
          deletedAt: null,
          streakDays: { $gt: 0 },
          $or: [
            { lastActivityDate: { $lt: yesterday } },
            { lastActivityDate: null },
          ],
        },
        { $set: { streakDays: 0 } }
      );

      console.log(`[CRON] Streak reset for ${result.modifiedCount} users`);
    } catch (err) {
      console.error('[CRON] Streak job failed:', err);
    }
  }, { timezone: 'UTC' });
};

module.exports = startStreakJob;
