const router = require('express').Router();
const ctrl = require('../controllers/note.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const v = require('../validators/note.validator');
const { generalLimiter, readLimiter } = require('../middleware/rateLimiter');

router.get('/trending', readLimiter, ctrl.getTrending);
router.get('/search', readLimiter, validate(v.searchNotes, 'query'), ctrl.search);
router.get('/requests', authenticate, readLimiter, ctrl.getPendingRequests);
router.get('/requests/mine', authenticate, readLimiter, ctrl.getMyRequests);

router.post('/upload', authenticate, generalLimiter, upload.single('file'), validate(v.uploadNote), ctrl.upload);
router.post('/request', authenticate, generalLimiter, validate(v.requestNote), ctrl.requestNote);
router.patch('/requests/:requestId/fulfill', authenticate, generalLimiter, ctrl.fulfillRequest);

router.get('/:id', readLimiter, ctrl.getOne);
router.get('/:id/download', authenticate, ctrl.download);
router.delete('/:id', authenticate, ctrl.deleteNote);

router.post('/:id/bookmark', authenticate, ctrl.addBookmark);
router.delete('/:id/bookmark', authenticate, ctrl.removeBookmark);

router.post('/:id/rate', authenticate, generalLimiter, validate(v.rateNote), ctrl.rateNote);
router.get('/:id/reviews', readLimiter, ctrl.getReviews);

module.exports = router;
