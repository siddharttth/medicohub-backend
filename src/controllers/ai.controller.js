const ChatHistory = require('../models/ChatHistory');
const { success } = require('../helpers/response');
const { getPagination } = require('../helpers/pagination');
const aiService = require('../services/ai.service');
const Joi = require('joi');
const { SUBJECTS } = require('../config/constants');
const ApiError = require('../helpers/apiError');

const askSchema = Joi.object({
  question: Joi.string().trim().min(3).max(1000).required(),
  subject: Joi.string().valid(...SUBJECTS).optional(),
});

exports.ask = async (req, res) => {
  const { error, value } = askSchema.validate(req.body);
  if (error) throw ApiError.badRequest(error.details[0].message);

  const { question, subject } = value;

  const history = await ChatHistory.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('aiMessage aiResponse');

  const answer = await aiService.askQuestion(question, subject, history.reverse());

  await ChatHistory.create({
    userId: req.user._id,
    aiMessage: question,
    aiResponse: answer,
    subject,
  });

  success(res, { answer, subject });
};

exports.getHistory = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [history, totalCount] = await Promise.all([
    ChatHistory.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ChatHistory.countDocuments({ userId: req.user._id }),
  ]);

  const { paginated } = require('../helpers/response');
  paginated(res, history, totalCount, page, limit);
};

exports.markHelpful = async (req, res) => {
  await ChatHistory.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isMarkedAsHelpful: true }
  );
  success(res, {}, 'Marked as helpful');
};
