const router = require('express').Router();
const ctrl = require('../controllers/file.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { generalLimiter } = require('../middleware/rateLimiter');

router.post('/upload', authenticate, generalLimiter, upload.single('file'), ctrl.uploadFile);
router.delete('/:publicId', authenticate, ctrl.deleteFile);

module.exports = router;
