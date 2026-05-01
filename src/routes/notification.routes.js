const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

router.post('/subscribe', authenticate, ctrl.subscribe);
// /read/all must come before /:id/read to avoid Express matching "all" as an :id param
router.patch('/read/all', authenticate, ctrl.markAllRead);
router.get('/:userId', authenticate, ctrl.getNotifications);
router.patch('/:id/read', authenticate, ctrl.markRead);

module.exports = router;
