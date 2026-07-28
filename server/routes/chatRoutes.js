const express = require('express');
const router = express.Router();
const { getMySessions, getAllSessions, startSession, getMessages, sendMessage, closeSession, claimSession } = require('../controllers/chatController');
const { protect, authorize } = require('../middleware/auth');

router.get('/my-sessions', protect, getMySessions);
router.get('/all-sessions', protect, authorize('tutor', 'admin'), getAllSessions);
router.post('/start', protect, startSession);
router.get('/:id/messages', protect, getMessages);
router.post('/:id/messages', protect, sendMessage);
router.put('/:id/close', protect, closeSession);
router.put('/:id/claim', protect, authorize('tutor', 'admin'), claimSession);

module.exports = router;
