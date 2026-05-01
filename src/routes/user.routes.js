const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const { updateProfile } = require('../validators/user.validator');

router.get('/:id', ctrl.getProfile);
router.patch('/:id', authenticate, upload.single('avatar'), validate(updateProfile), ctrl.updateProfile);
router.get('/:id/stats', ctrl.getStats);
router.get('/:id/streak', ctrl.getStreak);

module.exports = router;
