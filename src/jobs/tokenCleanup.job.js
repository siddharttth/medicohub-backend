const cron = require('node-cron');
const User = require('../models/User');

// Runs daily at midnight UTC — clears expired reset tokens
const startTokenCleanupJob = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running token cleanup job...');
    try {
      const result = await User.updateMany(
        { resetPasswordExpiry: { $lt: new Date() }, resetPasswordHash: { $ne: null } },
        { $set: { resetPasswordHash: null, resetPasswordExpiry: null } }
      );
      console.log(`[CRON] Cleaned up tokens for ${result.modifiedCount} users`);
    } catch (err) {
      console.error('[CRON] Token cleanup job failed:', err);
    }
  }, { timezone: 'UTC' });
};

module.exports = startTokenCleanupJob;
