import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    socketRef.current = io( 'http://localhost:5000', { withCredentials: true, autoConnect: true });
    const socket = socketRef.current;

    socket.on('online_users', (users) => setOnlineUsers(users));
    socket.on('message_notification', (notif) => {
      setNotifications(prev => [notif, ...prev.slice(0, 9)]);
    });

    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    if (user && socketRef.current) {
      socketRef.current.emit('user_online', user._id);
    }
  }, [user]);

  const joinSession = (sessionId) => socketRef.current?.emit('join_session', sessionId);
  const leaveSession = (sessionId) => socketRef.current?.emit('leave_session', sessionId);
  const sendSocketMessage = (data) => socketRef.current?.emit('send_message', data);
  const sendTyping = (data) => socketRef.current?.emit('typing', data);
  const markRead = (data) => socketRef.current?.emit('mark_read', data);
  const onNewMessage = (cb) => { socketRef.current?.on('new_message', cb); return () => socketRef.current?.off('new_message', cb); };
  const onTyping = (cb) => { socketRef.current?.on('user_typing', cb); return () => socketRef.current?.off('user_typing', cb); };
  const onSessionClaimed = (cb) => { socketRef.current?.on('session_claimed', cb); return () => socketRef.current?.off('session_claimed', cb); };
  const onSessionClosed = (cb) => { socketRef.current?.on('session_closed', cb); return () => socketRef.current?.off('session_closed', cb); };
  const clearNotifications = () => setNotifications([]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers, notifications, joinSession, leaveSession, sendSocketMessage, sendTyping, markRead, onNewMessage, onTyping, onSessionClaimed, onSessionClosed, clearNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
