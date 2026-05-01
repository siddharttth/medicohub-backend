const router = require('express').Router();
const ctrl = require('../controllers/topic.controller');
const { authenticate } = require('../middleware/auth');

// Optional auth — authenticated users get their completion status overlaid
const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  require('../middleware/auth').authenticate(req, res, next);
};

router.get('/:subject', optionalAuth, ctrl.getTopics);
router.patch('/:topicId/complete', authenticate, ctrl.completeTopic);

module.exports = router;
