const router = require('express').Router();
const ctrl = require('../controllers/topic.controller');
const { authenticate } = require('../middleware/auth');

// Optional auth — authenticated users get their completion status overlaid.
// Any token error (expired, invalid) is silently ignored — user gets guest response.
const { verifyAccessToken } = require('../helpers/token');
const User = require('../models/User');
const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next();
    const token = header.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    if (user) req.user = user;
  } catch {
    // expired or invalid — continue as guest
  }
  next();
};

router.get('/:subject', optionalAuth, ctrl.getTopics);
router.patch('/:topicId/complete', authenticate, ctrl.completeTopic);

module.exports = router;
