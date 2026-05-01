const User = require('../models/User');

const updateStreak = async (userId) => {
  const user = await User.findById(userId).select('lastActivityDate streakDays dailyLog');
  if (!user) return;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const lastStr = user.lastActivityDate
    ? user.lastActivityDate.toISOString().split('T')[0]
    : null;

  if (lastStr === todayStr) return; // already logged today

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const newStreak = lastStr === yesterdayStr ? user.streakDays + 1 : 1;

  // Upsert today's daily log entry
  const existingLog = user.dailyLog.find(d => d.date.toISOString().split('T')[0] === todayStr);
  if (!existingLog) {
    user.dailyLog.push({ date: now, minutesSpent: 0 });
  }

  user.streakDays = newStreak;
  user.lastActivityDate = now;
  await user.save();

  return newStreak;
};

module.exports = { updateStreak };
