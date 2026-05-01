const UserProgress = require('../models/UserProgress');
const { success } = require('../helpers/response');
const ApiError = require('../helpers/apiError');
const { getTopicsForSubject } = require('../config/topics');
const { updateStreak } = require('../helpers/streakUpdater');
const achievementService = require('../services/achievement.service');

exports.getTopics = async (req, res) => {
  const { subject } = req.params;
  const topics = getTopicsForSubject(subject);

  // If authenticated, overlay which topics the user has completed
  let completedIds = new Set();
  if (req.user) {
    const progress = await UserProgress.find({ userId: req.user._id, subject }).select('topicId');
    completedIds = new Set(progress.map(p => p.topicId));
  }

  const result = topics.map(t => ({
    ...t,
    completed: completedIds.has(t.id),
  }));

  success(res, { subject, topics: result });
};

exports.completeTopic = async (req, res) => {
  const { topicId } = req.params;
  const { subject } = req.body;

  if (!subject) throw ApiError.badRequest('subject is required in body');

  const topics = getTopicsForSubject(subject);
  const topic = topics.find(t => t.id === topicId);
  if (!topic) throw ApiError.notFound('Topic not found');

  // Upsert — idempotent
  await UserProgress.findOneAndUpdate(
    { userId: req.user._id, topicId },
    { userId: req.user._id, subject, topicId, topicTitle: topic.title, completedAt: new Date() },
    { upsert: true, new: true }
  );

  // Update streak
  const newStreak = await updateStreak(req.user._id);

  // Check and award achievements async (don't block response)
  achievementService.checkAndAward(req.user._id).catch(() => {});

  success(res, { topicId, completed: true, streakDays: newStreak });
};
