const Achievement = require('../models/Achievement');
const { success } = require('../helpers/response');

exports.getAchievements = async (req, res) => {
  const achievements = await Achievement.find({ userId: req.params.userId })
    .sort({ unlockedAt: -1 });
  success(res, { achievements });
};
