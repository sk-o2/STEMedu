const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
  fileUrl: String,
  read: { type: Boolean, default: false },
  readAt: Date,
}, { timestamps: true });

const ChatSessionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: { type: String, default: 'General Query' },
  messages: [MessageSchema],
  status: { type: String, enum: ['pending', 'open', 'closed'], default: 'pending' },
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  unreadCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', ChatSessionSchema);
