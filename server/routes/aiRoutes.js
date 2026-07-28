const express = require('express');
const router = express.Router();
const { suggestProjects, aiChat } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { success: false, message: 'Too many AI requests, please wait a minute' } });

router.post('/suggest', aiLimiter, suggestProjects);
router.post('/chat', aiLimiter, aiChat);

module.exports = router;
