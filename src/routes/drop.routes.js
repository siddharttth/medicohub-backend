const router = require('express').Router();
const ctrl = require('../controllers/drop.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../validators/drop.validator');
const { generalLimiter, readLimiter } = require('../middleware/rateLimiter');

router.get('/messages', readLimiter, validate(v.getDrops, 'query'), ctrl.getMessages);
router.post('/messages', authenticate, generalLimiter, validate(v.createDrop), ctrl.createMessage);
router.delete('/messages/:id', authenticate, ctrl.deleteMessage);
router.post('/messages/:id/like', authenticate, ctrl.likeMessage);
router.delete('/messages/:id/like', authenticate, ctrl.unlikeMessage);
router.post('/messages/:id/pin', authenticate, authorize('admin'), ctrl.pinMessage);
router.post('/messages/:id/reply', authenticate, generalLimiter, validate(v.reply), ctrl.addReply);

module.exports = router;
