const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

const adminOnly = [authenticate, authorize('admin')];

router.post('/moderate/:id', ...adminOnly, generalLimiter, ctrl.moderate);
router.get('/stats', ...adminOnly, ctrl.getStats);
router.get('/notes/pending', ...adminOnly, ctrl.getPendingNotes);

module.exports = router;
