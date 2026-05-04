const router = require('express').Router();
const ctrl = require('../controllers/exam.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { generate, viva } = require('../validators/exam.validator');
const { generalLimiter, readLimiter } = require('../middleware/rateLimiter');

router.post('/generate', authenticate, generalLimiter, validate(generate), ctrl.generate);
router.post('/viva', authenticate, generalLimiter, validate(viva), ctrl.generateViva);
router.get('/usage', authenticate, ctrl.getDailyUsage);
router.get('/my-packs', authenticate, readLimiter, ctrl.getMyPacks);
router.get('/my-viva', authenticate, readLimiter, ctrl.getMyViva);
router.get('/pack/:id', authenticate, ctrl.getPackById);
router.get('/viva-job/:id', authenticate, ctrl.getVivaById);
router.get('/packs', readLimiter, ctrl.getPacks);
router.get('/packs/saved', authenticate, ctrl.getSavedPacks);
router.post('/packs/:id/save', authenticate, ctrl.savePack);
router.delete('/packs/:id/save', authenticate, ctrl.unsavePack);

module.exports = router;
