const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

router.post('/subscribe', authenticate, ctrl.subscribe);
router.get('/:userId', authenticate, ctrl.getNotifications);
router.patch('/:id/read', authenticate, ctrl.markRead);
router.patch('/read/all', authenticate, ctrl.markAllRead);

module.exports = router;
