const ExamPack = require('../models/ExamPack');
const User = require('../models/User');
const { success, created, paginated } = require('../helpers/response');
const ApiError = require('../helpers/apiError');
const { getPagination } = require('../helpers/pagination');
const aiService = require('../services/ai.service');
const { updateStreak } = require('../helpers/streakUpdater');
const { EXAM_PACK_CACHE_TTL_MS } = require('../config/constants');

exports.generate = async (req, res) => {
  const { subject, type } = req.body;

  // Return cached pack if still valid
  const cached = await ExamPack.findOne({
    subject,
    packType: type,
    expiresAt: { $gt: new Date() },
    isCached: true,
  });

  if (cached) {
    cached.requestCount += 1;
    await cached.save();
    updateStreak(req.user._id).catch(() => {});
    return success(res, { pack: cached, fromCache: true });
  }

  const content = await aiService.generateExamPack(subject, type);

  const pack = await ExamPack.create({
    subject,
    packType: type,
    content,
    generatedBy: `llama-3.3-70b-versatile (Groq) @ ${new Date().toISOString()}`,
    generatedAt: new Date(),
    expiresAt: new Date(Date.now() + EXAM_PACK_CACHE_TTL_MS),
    isCached: true,
  });

  updateStreak(req.user._id).catch(() => {});

  created(res, { pack, fromCache: false }, 'Exam pack generated');
};

exports.getPacks = async (req, res) => {
  const { subject } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = { expiresAt: { $gt: new Date() } };
  if (subject) filter.subject = subject;

  const [packs, totalCount] = await Promise.all([
    ExamPack.find(filter).sort({ generatedAt: -1 }).skip(skip).limit(limit),
    ExamPack.countDocuments(filter),
  ]);

  paginated(res, packs, totalCount, page, limit);
};

exports.savePack = async (req, res) => {
  const pack = await ExamPack.findById(req.params.id);
  if (!pack) throw ApiError.notFound('Pack not found');

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { savedPacks: req.params.id },
  });

  success(res, {}, 'Pack saved');
};

exports.unsavePack = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { savedPacks: req.params.id },
  });
  success(res, {}, 'Pack removed from saved');
};

exports.getSavedPacks = async (req, res) => {
  const user = await User.findById(req.user._id).populate('savedPacks');
  success(res, { packs: user.savedPacks || [] });
};

exports.generateViva = async (req, res) => {
  const { subject } = req.body;
  const qa = await aiService.generateVivaQA(subject);
  updateStreak(req.user._id).catch(() => {});
  success(res, { viva: qa });
};
