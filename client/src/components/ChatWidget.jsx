import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getMySessions, startSession, getMessages, closeSession } from '../services/api';
import toast from 'react-hot-toast';

const ChatWidget = () => {
  const { user } = useAuth();
  const { joinSession, sendSocketMessage, onNewMessage, onTyping, onSessionClaimed, onSessionClosed } = useSocket();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [step, setStep] = useState('select'); // 'select' | 'chat'
  const [tutorTyping, setTutorTyping] = useState(false);
  const bottomRef = useRef();

  // Listen for new messages
  useEffect(() => {
    if (!open) return;
    const cleanup = onNewMessage(({ sessionId, message }) => {
      if (session?._id === sessionId) {
        setMessages(prev => [...prev, message]);
      }
    });
    return cleanup;
  }, [open, session, onNewMessage]);

  // Listen for tutor claiming the session
  useEffect(() => {
    if (!open || !session) return;
    const cleanup = onSessionClaimed(({ sessionId, tutor }) => {
      if (session._id === sessionId) {
        setSession(prev => ({ ...prev, tutor }));
        toast.success(`${tutor.name} has joined your chat!`);
      }
    });
    return cleanup;
  }, [open, session, onSessionClaimed]);

  // Listen for session closed
  useEffect(() => {
    if (!open || !session) return;
    const cleanup = onSessionClosed(({ sessionId }) => {
      if (session._id === sessionId) {
        setSession(null);
        setStep('select');
        toast.success('Chat session was closed.');
      }
    });
    return cleanup;
  }, [open, session, onSessionClosed]);

  // Typing indicator
  useEffect(() => {
    const cleanup = onTyping(({ isTyping }) => setTutorTyping(isTyping));
    return cleanup;
  }, [onTyping]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const { data } = await getMySessions();
      const openSession = data.sessions?.find(s => s.status !== 'closed');
      if (openSession) {
        setSession(openSession);
        const msgData = await getMessages(openSession._id);
        setMessages(msgData.data.session.messages || []);
        joinSession(openSession._id);
        setStep('chat');
      } else {
        setStep('select');
      }
    } catch {
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleCustomOpen = async (e) => {
      const sessionId = e.detail;
      setOpen(true);
      setLoading(true);
      if (sessionId) {
        try {
          const { data } = await getMessages(sessionId);
          setSession(data.session);
          setMessages(data.session.messages || []);
          joinSession(sessionId);
          setStep('chat');
        } catch {
          toast.error('Failed to open chat');
          setOpen(false);
        } finally {
          setLoading(false);
        }
      } else {
        // No sessionId passed - student clicking Contact Tutor CTA
        try {
          const { data } = await getMySessions();
          const openSession = data.sessions?.find(s => s.status !== 'closed');
          if (openSession) {
            setSession(openSession);
            const msgData = await getMessages(openSession._id);
            setMessages(msgData.data.session.messages || []);
            joinSession(openSession._id);
            setStep('chat');
          } else {
            setStep('select');
          }
        } catch {
          setStep('select');
        } finally {
          setLoading(false);
        }
      }
    };
    window.addEventListener('open-tutor-chat', handleCustomOpen);
    return () => window.removeEventListener('open-tutor-chat', handleCustomOpen);
  }, [joinSession]);

  const handleStartSession = async () => {
    if (!subject.trim()) return toast.error('Please describe your query');
    setLoading(true);
    try {
      const { data } = await startSession({ subject });
      setSession(data.session);
      joinSession(data.session._id);
      setMessages([]);
      setStep('chat');
      toast.success('Query submitted! A tutor will claim your chat shortly.');
    } catch {
      toast.error('Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!text.trim() || !session) return;
    if (!session.tutor) return toast.error('Please wait for a tutor to join before sending messages.');
    sendSocketMessage({ sessionId: session._id, senderId: user._id, content: text });
    setText('');
  };

  const handleEndChat = async () => {
    if (!session) return;
    try {
      await closeSession(session._id);
    } catch {
      toast.error('Failed to end chat');
    }
  };

  return (
    <>
      {user?.role === 'student' && (
        <button className="chat-fab" onClick={() => open ? setOpen(false) : handleOpen()} aria-label="Chat with tutor" id="chat-fab-btn">
          {open ? <X size={24} color="#fff" /> : <MessageCircle size={24} color="#fff" />}
        </button>
      )}

      {open && (
        <div className="chat-panel">
          {/* Header */}
          <div className="chat-panel-header">
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={18} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Live Tutor Support</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {step === 'select'
                  ? 'Ask your STEM doubt'
                  : session?.tutor
                    ? <><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} /> {session.tutor.name} is your tutor</>
                    : <><Clock size={11} /> Waiting for a tutor to accept...</>
                }
              </div>
            </div>
            {step === 'chat' && session && (
              <button 
                onClick={handleEndChat} 
                style={{ background: 'var(--danger)', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginRight: 8 }}
              >
                End Chat
              </button>
            )}
            <button onClick={() => setOpen(false)} style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', cursor: 'pointer' }}><X size={18} /></button>
          </div>

          {/* Messages area */}
          <div className="chat-messages">
            {loading && <div style={{ textAlign: 'center', padding: 20 }}><Loader size={24} className="spin" style={{ color: 'var(--primary)' }} /></div>}

            {!loading && step === 'select' && (
              <div style={{ padding: '12px 4px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Hi {user?.name?.split(' ')[0]}! What do you need help with?</p>
                <textarea
                  className="form-input" rows={3} placeholder="Describe your question or topic..."
                  value={subject} onChange={e => setSubject(e.target.value)}
                  style={{ resize: 'none', fontSize: 14 }}
                />
                <button className="btn btn-primary btn-sm" onClick={handleStartSession} disabled={loading}>
                  {loading ? <Loader size={14} /> : 'Ask a Tutor'}
                </button>
              </div>
            )}

            {!loading && step === 'chat' && !session?.tutor && (
              <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#f59e0b' }}>
                  <Clock size={28} />
                </div>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>Waiting for a Tutor</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your query has been posted. An available tutor will claim it shortly!</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>Topic: {session?.subject}</p>
              </div>
            )}

            {!loading && step === 'chat' && session?.tutor && messages.map((msg, i) => (
              <div key={i} className={msg.sender === user._id || msg.sender?._id === user._id ? 'chat-msg-user' : 'chat-msg-other'}>
                {msg.content}
              </div>
            ))}

            {tutorTyping && <div className="chat-msg-other" style={{ fontStyle: 'italic', opacity: 0.7 }}>Tutor is typing…</div>}
            <div ref={bottomRef} />
          </div>

          {/* Input — only show when tutor has joined */}
          {step === 'chat' && session?.tutor && (
            <div className="chat-input-row">
              <input
                className="form-input" style={{ flex: 1, fontSize: 14 }}
                placeholder="Type your message..." value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              />
              <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={!text.trim()}>
                <Send size={15} />
              </button>
            </div>
          )}
        </div>
      )}
      <style>{`.spin { animation: spin 1s linear infinite; }`}</style>
    </>
  );
};

export default ChatWidget;
