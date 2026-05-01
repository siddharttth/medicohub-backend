const router = require('express').Router();
const ctrl = require('../controllers/achievement.controller');
const { readLimiter } = require('../middleware/rateLimiter');

router.get('/:userId', readLimiter, ctrl.getAchievements);

module.exports = router;
