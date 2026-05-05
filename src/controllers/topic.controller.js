const UserProgress = require('../models/UserProgress');
const CustomTopic = require('../models/CustomTopic');
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

  const existing = await UserProgress.findOne({ userId: req.user._id, topicId });

  if (existing) {
    // Toggle off
    await existing.deleteOne();
    success(res, { topicId, completed: false, streakDays: null });
    return;
  }

  // Toggle on
  await UserProgress.create({
    userId: req.user._id, subject, topicId, topicTitle: topic.title, completedAt: new Date(),
  });

  const newStreak = await updateStreak(req.user._id);
  achievementService.checkAndAward(req.user._id).catch(() => {});

  success(res, { topicId, completed: true, streakDays: newStreak });
};

const toTopicDTO = (t) => ({ id: t._id.toString(), title: t.title, yield: t.yield, completed: false });

exports.getCustomTopics = async (req, res) => {
  const { subject } = req.params;
  const topics = await CustomTopic.find({ userId: req.user._id, subject }).lean();
  success(res, { topics: topics.map(toTopicDTO) });
};

exports.addCustomTopic = async (req, res) => {
  const { subject } = req.params;
  const title = req.body.title?.trim();
  if (!title) throw ApiError.badRequest('title is required');
  const topic = await CustomTopic.create({ userId: req.user._id, subject, title });
  success(res, { topic: toTopicDTO(topic) }, 'Created', 201);
};

exports.editCustomTopic = async (req, res) => {
  const { id } = req.params;
  const title = req.body.title?.trim();
  if (!title) throw ApiError.badRequest('title is required');
  const topic = await CustomTopic.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    { title },
    { new: true }
  );
  if (!topic) throw ApiError.notFound('Custom topic not found');
  success(res, { topic: toTopicDTO(topic) });
};

exports.deleteCustomTopic = async (req, res) => {
  const { id } = req.params;
  await CustomTopic.findOneAndDelete({ _id: id, userId: req.user._id });
  success(res, { deleted: true });
};
