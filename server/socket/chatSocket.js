const ChatSession = require('../models/ChatSession');

const initSocket = (io) => {
  const onlineUsers = new Map(); // userId -> socketId

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join with userId
    socket.on('user_online', (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit('online_users', Array.from(onlineUsers.keys()));
      console.log(`👤 User online: ${userId}`);
    });

    // Join a chat session room
    socket.on('join_session', (sessionId) => {
      socket.join(sessionId);
      console.log(`💬 Joined session: ${sessionId}`);
    });

    // Leave a chat session room
    socket.on('leave_session', (sessionId) => {
      socket.leave(sessionId);
    });

    // Send message
    socket.on('send_message', async ({ sessionId, senderId, content, type = 'text' }) => {
      try {
        const session = await ChatSession.findById(sessionId);
        if (!session) return;

        const newMsg = { sender: senderId, content, type, read: false };
        session.messages.push(newMsg);
        session.lastMessage = content;
        session.lastMessageAt = new Date();
        session.unreadCount += 1;
        await session.save();

        const savedMsg = session.messages[session.messages.length - 1];

        // Broadcast to all in the session room
        io.to(sessionId).emit('new_message', {
          sessionId,
          message: savedMsg,
        });

        // Notify recipient if online
        const recipientId = session.student.toString() === senderId
          ? session.tutor?.toString()
          : session.student.toString();

        if (recipientId && onlineUsers.has(recipientId)) {
          io.to(onlineUsers.get(recipientId)).emit('message_notification', {
            sessionId,
            senderName: 'Someone',
            preview: content.substring(0, 60),
          });
        }
      } catch (err) {
        console.error('Socket send_message error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', ({ sessionId, userId, isTyping }) => {
      socket.to(sessionId).emit('user_typing', { userId, isTyping });
    });

    // Mark messages as read
    socket.on('mark_read', async ({ sessionId, userId }) => {
      try {
        const session = await ChatSession.findById(sessionId);
        if (!session) return;
        session.messages.forEach(m => {
          if (m.sender.toString() !== userId) m.read = true;
        });
        session.unreadCount = 0;
        await session.save();
        io.to(sessionId).emit('messages_read', { sessionId, userId });
      } catch (err) { console.error('mark_read error:', err); }
    });

    // Disconnect
    socket.on('disconnect', () => {
      for (const [userId, sid] of onlineUsers.entries()) {
        if (sid === socket.id) {
          onlineUsers.delete(userId);
          io.emit('online_users', Array.from(onlineUsers.keys()));
          console.log(`❌ User offline: ${userId}`);
          break;
        }
      }
    });
  });
};

module.exports = initSocket;
