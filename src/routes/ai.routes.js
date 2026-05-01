const router = require('express').Router();
const ctrl = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

router.post('/ask', authenticate, generalLimiter, ctrl.ask);
router.get('/ask/history', authenticate, ctrl.getHistory);
router.patch('/ask/:id/helpful', authenticate, ctrl.markHelpful);

module.exports = router;
