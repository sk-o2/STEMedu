const ChatSession = require('../models/ChatSession');
const User = require('../models/User');

// @desc Get student's chat sessions
exports.getMySessions = async (req, res, next) => {
  try {
    const sessions = await ChatSession.find({ student: req.user.id })
      .populate('tutor', 'name avatar')
      .sort({ lastMessageAt: -1 })
      .select('-messages');
    res.status(200).json({ success: true, sessions });
  } catch (err) { next(err); }
};

// @desc Get all sessions (tutor/admin)
exports.getAllSessions = async (req, res, next) => {
  try {
    const query = req.user.role === 'tutor' 
      ? { $or: [{ tutor: req.user.id }, { tutor: null }] } 
      : {};
    const sessions = await ChatSession.find(query)
      .populate('student', 'name avatar email')
      .populate('tutor', 'name avatar')
      .sort({ lastMessageAt: -1 })
      .select('-messages');
    res.status(200).json({ success: true, sessions });
  } catch (err) { next(err); }
};

// @desc Start new chat session
exports.startSession = async (req, res, next) => {
  try {
    const { subject } = req.body;
    const session = await ChatSession.create({
      student: req.user.id,
      tutor: null,
      subject: subject || 'General Query',
    });
    res.status(201).json({ success: true, session });
  } catch (err) { next(err); }
};

// @desc Get messages in a session
exports.getMessages = async (req, res, next) => {
  try {
    const session = await ChatSession.findById(req.params.id)
      .populate('messages.sender', 'name avatar role');
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    // Auth check
    if (session.student.toString() !== req.user.id && session.tutor?.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    // Mark messages as read
    session.messages.forEach(m => { if (m.sender.toString() !== req.user.id) m.read = true; });
    session.unreadCount = 0;
    await session.save();
    res.status(200).json({ success: true, session });
  } catch (err) { next(err); }
};

// @desc Send message (REST fallback)
exports.sendMessage = async (req, res, next) => {
  try {
    const session = await ChatSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    const msg = { sender: req.user.id, content: req.body.content, type: req.body.type || 'text' };
    session.messages.push(msg);
    session.lastMessage = req.body.content;
    session.lastMessageAt = new Date();
    await session.save();
    res.status(201).json({ success: true, message: session.messages[session.messages.length - 1] });
  } catch (err) { next(err); }
};

// @desc Close session
exports.closeSession = async (req, res, next) => {
  try {
    const session = await ChatSession.findByIdAndUpdate(req.params.id, { status: 'closed' }, { new: true });
    
    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(session._id.toString()).emit('session_closed', { sessionId: session._id });
    }
    
    res.status(200).json({ success: true, session });
  } catch (err) { next(err); }
};

// @desc Claim unassigned session
// @route PUT /api/chat/:id/claim
// @access Private/Tutor
exports.claimSession = async (req, res, next) => {
  try {
    if (req.user.role !== 'tutor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    const session = await ChatSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    
    if (session.tutor) {
      return res.status(400).json({ success: false, message: 'Session already claimed by another tutor' });
    }
    
    session.tutor = req.user.id;
    session.status = 'open';
    await session.save();
    await session.populate('tutor', 'name avatar');

    // Emit real-time event so student's widget updates immediately
    const io = req.app.get('io');
    if (io) {
      io.to(session._id.toString()).emit('session_claimed', {
        sessionId: session._id,
        tutor: { _id: session.tutor._id, name: session.tutor.name, avatar: session.tutor.avatar }
      });
    }
    
    res.status(200).json({ success: true, session });
  } catch (err) { next(err); }
};
