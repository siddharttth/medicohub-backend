const ExamPack = require('../models/ExamPack');
const User = require('../models/User');
const { success, created, paginated } = require('../helpers/response');
const ApiError = require('../helpers/apiError');
const { getPagination } = require('../helpers/pagination');
const aiService = require('../services/ai.service');
const { updateStreak } = require('../helpers/streakUpdater');
const {
  EXAM_PACK_CACHE_TTL_MS,
  MAX_PACKS_PER_DAY,
  MAX_VIVA_PER_DAY,
} = require('../config/constants');

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const packsGeneratedToday = (userId) =>
  ExamPack.countDocuments({
    generatedByUser: userId,
    packType: { $ne: 'viva-practice' },
    generatedAt: { $gte: todayStart() },
  });

const vivaGeneratedToday = (userId) =>
  ExamPack.countDocuments({
    generatedByUser: userId,
    packType: 'viva-practice',
    generatedAt: { $gte: todayStart() },
  });

// ── Async generation helper ──────────────────────────────────────────────────
// Creates a "pending" DB record immediately, then generates in background.
// Returns the pack doc (with status:'pending') so the frontend can poll.
const generateAsync = async (packDoc, generatorFn) => {
  generatorFn()
    .then(async (content) => {
      packDoc.content = content;
      packDoc.status = 'done';
      await packDoc.save();
    })
    .catch(async (err) => {
      packDoc.status = 'failed';
      packDoc.errorMessage = err?.message ?? 'Generation failed';
      await packDoc.save();
    });
};

// ── Pack generation (async) ──────────────────────────────────────────────────
exports.generate = async (req, res) => {
  const { subject, type, topics } = req.body;

  if (!topics || topics.length === 0)
    throw ApiError.badRequest('Please provide at least one exam topic');

  const todayCount = await packsGeneratedToday(req.user._id);
  if (todayCount >= MAX_PACKS_PER_DAY)
    throw ApiError.badRequest(`Daily limit reached. You can generate ${MAX_PACKS_PER_DAY} packs per day.`);

  // Create the record immediately with status pending
  const pack = await ExamPack.create({
    subject,
    packType: type,
    inputTopics: topics,
    status: 'pending',
    content: {},
    generatedBy: `llama-3.3-70b-versatile (Groq)`,
    generatedAt: new Date(),
    expiresAt: new Date(Date.now() + EXAM_PACK_CACHE_TTL_MS),
    generatedByUser: req.user._id,
  });

  // Fire generation in background — do not await
  let generatorFn;
  if (type === 'full-pack') generatorFn = () => aiService.generateFullPack(subject, topics);
  else if (type === 'quick-review') generatorFn = () => aiService.generateQuickReview(subject, topics);
  else if (type === 'viva-only') generatorFn = () => aiService.generateVivaPack(subject, topics);
  else throw ApiError.badRequest('Invalid pack type');

  generateAsync(pack, generatorFn);
  updateStreak(req.user._id).catch(() => {});

  const remaining = MAX_PACKS_PER_DAY - todayCount - 1;
  created(res, { pack, packsRemainingToday: remaining }, 'Generation started');
};

// ── Poll job status ──────────────────────────────────────────────────────────
exports.getPackById = async (req, res) => {
  const pack = await ExamPack.findOne({
    _id: req.params.id,
    generatedByUser: req.user._id,
  });
  if (!pack) throw ApiError.notFound('Pack not found');
  success(res, { pack });
};

// ── User's own packs (not expired) ──────────────────────────────────────────
exports.getMyPacks = async (req, res) => {
  const { subject } = req.query;
  const filter = {
    generatedByUser: req.user._id,
    packType: { $ne: 'viva-practice' },
    expiresAt: { $gt: new Date() },
  };
  if (subject) filter.subject = subject;

  const packs = await ExamPack.find(filter).sort({ generatedAt: -1 }).limit(20);
  success(res, { packs });
};

// ── User's viva questions (today) ────────────────────────────────────────────
exports.getMyViva = async (req, res) => {
  const { subject } = req.query;
  const filter = {
    generatedByUser: req.user._id,
    packType: 'viva-practice',
    generatedAt: { $gte: todayStart() },
  };
  if (subject) filter.subject = subject;

  const docs = await ExamPack.find(filter).sort({ generatedAt: 1 });
  // Flatten all vivaQuestions from each doc into one array
  const questions = docs.flatMap((d) => d.content?.vivaQuestions ?? []);
  success(res, { questions });
};

// ── Viva practice generation (async) ────────────────────────────────────────
exports.generateViva = async (req, res) => {
  const { subject, topics } = req.body;

  const todayCount = await vivaGeneratedToday(req.user._id);
  if (todayCount >= MAX_VIVA_PER_DAY)
    throw ApiError.badRequest(`Daily viva limit reached. You can generate ${MAX_VIVA_PER_DAY} viva questions per day.`);

  const pack = await ExamPack.create({
    subject,
    packType: 'viva-practice',
    inputTopics: topics || [],
    status: 'pending',
    content: {},
    generatedAt: new Date(),
    expiresAt: new Date(Date.now() + EXAM_PACK_CACHE_TTL_MS),
    generatedByUser: req.user._id,
  });

  generateAsync(pack, async () => {
    const qa = await aiService.generateVivaQA(subject, topics || []);
    return { vivaQuestions: [qa] };
  });

  updateStreak(req.user._id).catch(() => {});

  const remaining = MAX_VIVA_PER_DAY - todayCount - 1;
  success(res, { packId: pack._id, vivaRemainingToday: remaining });
};

// ── Poll viva job ────────────────────────────────────────────────────────────
exports.getVivaById = async (req, res) => {
  const pack = await ExamPack.findOne({
    _id: req.params.id,
    generatedByUser: req.user._id,
    packType: 'viva-practice',
  });
  if (!pack) throw ApiError.notFound('Not found');

  if (pack.status === 'pending') {
    return success(res, { status: 'pending' });
  }
  if (pack.status === 'failed') {
    return success(res, { status: 'failed', error: pack.errorMessage });
  }
  const viva = pack.content?.vivaQuestions?.[0] ?? null;
  success(res, { status: 'done', viva });
};

// ── Daily usage ──────────────────────────────────────────────────────────────
exports.getDailyUsage = async (req, res) => {
  const [packs, viva] = await Promise.all([
    packsGeneratedToday(req.user._id),
    vivaGeneratedToday(req.user._id),
  ]);
  success(res, {
    packsUsed: packs,
    packsLimit: MAX_PACKS_PER_DAY,
    packsRemaining: Math.max(0, MAX_PACKS_PER_DAY - packs),
    vivaUsed: viva,
    vivaLimit: MAX_VIVA_PER_DAY,
    vivaRemaining: Math.max(0, MAX_VIVA_PER_DAY - viva),
  });
};

// ── Public packs (browse) ────────────────────────────────────────────────────
exports.getPacks = async (req, res) => {
  const { subject } = req.query;
  const { page, limit, skip } = getPagination(req.query);
  const filter = { expiresAt: { $gt: new Date() }, status: 'done' };
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
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { savedPacks: req.params.id } });
  success(res, {}, 'Pack saved');
};

exports.unsavePack = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $pull: { savedPacks: req.params.id } });
  success(res, {}, 'Pack removed from saved');
};

exports.getSavedPacks = async (req, res) => {
  const user = await User.findById(req.user._id).populate('savedPacks');
  success(res, { packs: user.savedPacks || [] });
};
