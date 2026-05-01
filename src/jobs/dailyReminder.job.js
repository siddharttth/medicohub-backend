const cron = require('node-cron');
const User = require('../models/User');
const emailService = require('../services/email.service');

// Runs daily at 9 AM UTC — sends study reminder to active users
const startDailyReminderJob = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Running daily reminder job...');
    try {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      // Target users with a streak who haven't been active in 2 days
      const users = await User.find({
        deletedAt: null,
        streakDays: { $gt: 0 },
        lastActivityDate: { $lt: twoDaysAgo },
        'settings.notifications': true,
      }).select('email name streakDays');

      let sent = 0;
      for (const user of users) {
        await emailService.sendDailyReminder(user).catch(() => {});
        sent++;
      }

      console.log(`[CRON] Daily reminder sent to ${sent} users`);
    } catch (err) {
      console.error('[CRON] Daily reminder job failed:', err);
    }
  }, { timezone: 'UTC' });
};

module.exports = startDailyReminderJob;
