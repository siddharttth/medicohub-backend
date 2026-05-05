const router = require('express').Router();
const ctrl = require('../controllers/topic.controller');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');

router.get('/:subject', optionalAuthenticate, ctrl.getTopics);
router.patch('/:topicId/complete', authenticate, ctrl.completeTopic);
router.get('/:subject/custom', authenticate, ctrl.getCustomTopics);
router.post('/:subject/custom', authenticate, ctrl.addCustomTopic);
router.patch('/custom/:id', authenticate, ctrl.editCustomTopic);
router.delete('/custom/:id', authenticate, ctrl.deleteCustomTopic);

module.exports = router;
