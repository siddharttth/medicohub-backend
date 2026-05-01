const router = require('express').Router();
const { getBookmarks } = require('../controllers/note.controller');
const { authenticate } = require('../middleware/auth');

router.get('/:userId', authenticate, getBookmarks);

module.exports = router;
