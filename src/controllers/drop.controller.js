const Drop = require('../models/Drop');
const { success, created, paginated } = require('../helpers/response');
const ApiError = require('../helpers/apiError');
const { getPagination } = require('../helpers/pagination');

exports.getMessages = async (req, res) => {
  const { subject } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = { status: 'visible' };
  if (subject) filter.subject = subject;

  const [drops, totalCount] = await Promise.all([
    Drop.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatar role'),
    Drop.countDocuments(filter),
  ]);

  paginated(res, drops, totalCount, page, limit);
};

exports.createMessage = async (req, res) => {
  const { subject, text, isAnonymous } = req.body;

  const drop = await Drop.create({
    subject,
    text,
    author: isAnonymous ? null : req.user._id,
    authorName: isAnonymous ? 'Anonymous' : req.user.name,
    authorAvatar: isAnonymous ? null : req.user.avatar,
  });

  const populated = await drop.populate('author', 'name avatar role');

  // Broadcast via socket.io
  const io = req.app.get('io');
  if (io) {
    io.of('/drops').to(subject || 'general').emit('new-drop', populated);
  }

  created(res, { drop: populated }, 'Message posted');
};

exports.deleteMessage = async (req, res) => {
  const drop = await Drop.findById(req.params.id);
  if (!drop) throw ApiError.notFound('Message not found');

  const isOwner = drop.author?.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') throw ApiError.forbidden();

  drop.status = 'hidden';
  await drop.save();

  success(res, {}, 'Message deleted');
};

exports.likeMessage = async (req, res) => {
  const drop = await Drop.findById(req.params.id);
  if (!drop) throw ApiError.notFound('Message not found');

  const alreadyLiked = drop.likes.includes(req.user._id);
  if (alreadyLiked) throw ApiError.conflict('Already liked');

  drop.likes.push(req.user._id);
  drop.likeCount = drop.likes.length;
  await drop.save();

  success(res, { likeCount: drop.likeCount });
};

exports.unlikeMessage = async (req, res) => {
  const drop = await Drop.findById(req.params.id);
  if (!drop) throw ApiError.notFound('Message not found');

  drop.likes = drop.likes.filter(id => id.toString() !== req.user._id.toString());
  drop.likeCount = drop.likes.length;
  await drop.save();

  success(res, { likeCount: drop.likeCount });
};

exports.pinMessage = async (req, res) => {
  const drop = await Drop.findById(req.params.id);
  if (!drop) throw ApiError.notFound('Message not found');

  drop.isPinned = true;
  drop.pinnedBy = req.user._id;
  await drop.save();

  const io = req.app.get('io');
  if (io) {
    io.of('/drops').to(drop.subject || 'general').emit('drop-pinned', { dropId: drop._id });
  }

  success(res, {}, 'Message pinned');
};

exports.addReply = async (req, res) => {
  const drop = await Drop.findById(req.params.id);
  if (!drop) throw ApiError.notFound('Message not found');

  drop.replies.push({ author: req.user._id, text: req.body.text });
  await drop.save();
  await drop.populate('replies.author', 'name avatar');

  const io = req.app.get('io');
  if (io) {
    const reply = drop.replies[drop.replies.length - 1];
    io.of('/drops').to(drop.subject || 'general').emit('new-reply', { dropId: drop._id, reply });
  }

  success(res, { reply: drop.replies[drop.replies.length - 1] });
};
