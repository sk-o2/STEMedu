import { useState, useEffect } from 'react';
import { getAllSessions, claimSession } from '../services/api';
import { MessageCircle, CheckCircle, Hand, ArrowRight, Clock, RefreshCw, Inbox, Users, Video } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import TutorMentoringPanel from '../components/TutorMentoringPanel';

function timeAgo(date) {
  if (!date) return '';
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const TutorDashboard = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [claiming, setClaiming] = useState(null);
  const { onNewMessage, joinSession, onSessionClosed } = useSocket();

  const fetchSessions = () => {
    setLoading(true);
    getAllSessions()
      .then(r => setSessions(r.data.sessions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSessions(); }, []);

  useEffect(() => {
    const cleanup = onNewMessage(({ sessionId }) => {
      setSessions(prev =>
        prev
          .map(s => s._id === sessionId
            ? { ...s, unreadCount: (s.unreadCount || 0) + 1, lastMessageAt: new Date() }
            : s
          )
          .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      );
    });
    return cleanup;
  }, [onNewMessage]);

  useEffect(() => {
    const cleanup = onSessionClosed(() => fetchSessions());
    return cleanup;
  }, [onSessionClosed]);

  const handleClaim = async (id) => {
    setClaiming(id);
    try {
      await claimSession(id);
      toast.success('Session claimed! You can now chat with the student.');
      joinSession(id);
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim session');
      fetchSessions();
    } finally {
      setClaiming(null);
    }
  };

  const firstName         = user?.name?.split(' ')[0] || 'Tutor';
  const openSessions      = sessions.filter(s => s.status !== 'closed' && s.tutor?._id === user?._id);
  const closedSessions    = sessions.filter(s => s.status === 'closed' && s.tutor?._id === user?._id);
  const unassigned        = sessions.filter(s => s.status !== 'closed' && !s.tutor);
  const totalUnread       = openSessions.reduce((n, s) => n + (s.unreadCount || 0), 0);

  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'mentoring'

  return (
    <div className="td-page">
      <div className="container td-container">

        {/* ── Welcome Banner ── */}
        <div className="td-welcome-banner">
          <div className="td-welcome-left">
            <div className="td-avatar-wrap">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=0ea5e9&color=fff&size=96`}
                alt={user?.name}
                className="td-avatar"
              />
              {totalUnread > 0 && (
                <span className="td-unread-badge">{totalUnread}</span>
              )}
            </div>
            <div className="td-welcome-text">
              <div className="td-role-label">Tutor Portal</div>
              <h1 className="td-name">Hi, {firstName} 👋</h1>
              <p className="td-tagline">
                {unassigned.length > 0
                  ? `${unassigned.length} student${unassigned.length > 1 ? 's' : ''} waiting for help`
                  : 'No students in queue right now'}
              </p>
            </div>
          </div>
          <button className="td-refresh-btn" onClick={fetchSessions} title="Refresh sessions">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="td-stats-grid">
          {[
            {
              label: 'Active Chats',
              value: openSessions.length,
              icon: <MessageCircle size={22} />,
              color: '#06b6d4',
              bg: 'rgba(6,182,212,0.12)',
              note: totalUnread > 0 ? `${totalUnread} unread` : 'All caught up',
              urgent: totalUnread > 0,
            },
            {
              label: 'Waiting Students',
              value: unassigned.length,
              icon: <Hand size={22} />,
              color: '#f59e0b',
              bg: 'rgba(245,158,11,0.12)',
              note: unassigned.length > 0 ? 'Needs attention' : 'Queue clear',
              urgent: unassigned.length > 0,
            },
            {
              label: 'Resolved',
              value: closedSessions.length,
              icon: <CheckCircle size={22} />,
              color: '#10b981',
              bg: 'rgba(16,185,129,0.12)',
              note: 'Sessions closed',
              urgent: false,
            },
          ].map((s, i) => (
            <div key={i} className="td-stat-card card">
              <div className="td-stat-icon" style={{ color: s.color, background: s.bg }}>{s.icon}</div>
              <div className="td-stat-body">
                <div className="td-stat-value">{s.value}</div>
                <div className="td-stat-label">{s.label}</div>
                <div className="td-stat-note" style={{ color: s.urgent ? s.color : 'var(--text-muted)' }}>
                  {s.note}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tab switcher: Chats vs Mentoring ── */}
        <div style={{ display:'flex', gap:8, marginBottom:24, background:'rgba(255,255,255,.03)', border:'1px solid var(--border)', borderRadius:10, padding:4 }}>
          {[['chats', <MessageCircle size={15}/>, 'Chat Sessions'], ['mentoring', <Video size={15}/>, 'Mentoring Requests']].map(([id, icon, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'9px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:700,
              background: activeTab === id ? '#6366f1' : 'transparent',
              color: activeTab === id ? '#fff' : 'var(--text-secondary)' }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* ── Chat Sessions panel ── */}
        {activeTab === 'chats' && (
          <div className="td-panels">

          {/* Unassigned pool */}
          <div className="td-panel">
            <div className="td-panel-header">
              <div className="td-panel-dot" style={{ background: '#f59e0b', boxShadow: unassigned.length > 0 ? '0 0 8px #f59e0b' : 'none' }} />
              <h2 className="td-panel-title">Student Queue</h2>
              <span className="td-panel-count" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}>
                {unassigned.length}
              </span>
            </div>

            {loading ? (
              <div className="td-skeleton-list">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="td-skeleton-item">
                    <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className="skeleton" style={{ height: 13, width: '55%', borderRadius: 4 }} />
                      <div className="skeleton" style={{ height: 11, width: '40%', borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : unassigned.length === 0 ? (
              <div className="td-empty-panel">
                <Inbox size={36} />
                <p>Queue is clear — no students waiting.</p>
              </div>
            ) : (
              <div className="td-session-list">
                {unassigned.map(s => (
                  <div key={s._id} className="td-session-card unassigned">
                    <div className="td-session-left">
                      <img
                        src={s.student?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.student?.name || 'S')}&background=7c3aed&color=fff&size=40`}
                        alt={s.student?.name}
                        className="td-session-avatar"
                      />
                      <div className="td-session-info">
                        <div className="td-session-name">{s.student?.name || 'Student'}</div>
                        <div className="td-session-subject">{s.subject || 'General Inquiry'}</div>
                        <div className="td-session-time"><Clock size={11} /> {timeAgo(s.createdAt)}</div>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm td-claim-btn"
                      onClick={() => handleClaim(s._id)}
                      disabled={claiming === s._id}
                    >
                      {claiming === s._id ? 'Claiming…' : 'Claim'}
                      {claiming !== s._id && <ArrowRight size={13} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My active chats */}
          <div className="td-panel">
            <div className="td-panel-header">
              <div className="td-panel-dot" style={{ background: '#06b6d4', boxShadow: openSessions.length > 0 ? '0 0 8px #06b6d4' : 'none' }} />
              <h2 className="td-panel-title">My Active Chats</h2>
              <span className="td-panel-count" style={{ background: 'rgba(6,182,212,0.12)', color: '#06b6d4', borderColor: 'rgba(6,182,212,0.3)' }}>
                {openSessions.length}
              </span>
              {totalUnread > 0 && (
                <span className="td-unread-chip">{totalUnread} unread</span>
              )}
            </div>

            {loading ? (
              <div className="td-skeleton-list">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="td-skeleton-item">
                    <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className="skeleton" style={{ height: 13, width: '55%', borderRadius: 4 }} />
                      <div className="skeleton" style={{ height: 11, width: '40%', borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : openSessions.length === 0 ? (
              <div className="td-empty-panel">
                <Users size={36} />
                <p>No active chats — claim students from the queue.</p>
              </div>
            ) : (
              <div className="td-session-list">
                {openSessions.map(s => (
                  <div key={s._id} className="td-session-card active">
                    <div className="td-session-left">
                      <div className="td-session-avatar-wrap">
                        <img
                          src={s.student?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.student?.name || 'S')}&background=06b6d4&color=fff&size=40`}
                          alt={s.student?.name}
                          className="td-session-avatar"
                        />
                        {s.unreadCount > 0 && (
                          <span className="td-chat-unread-dot">{s.unreadCount}</span>
                        )}
                      </div>
                      <div className="td-session-info">
                        <div className="td-session-name">
                          {s.student?.name || 'Student'}
                        </div>
                        <div className="td-session-subject">{s.subject || 'General Inquiry'}</div>
                        <div className="td-session-time"><Clock size={11} /> {timeAgo(s.lastMessageAt)}</div>
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => window.dispatchEvent(new CustomEvent('open-tutor-chat', { detail: s._id }))}
                    >
                      Open Chat <ArrowRight size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        )}

        {/* ── Mentoring Requests panel ── */}
        {activeTab === 'mentoring' && (
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:24 }}>
            <TutorMentoringPanel />
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .td-page { min-height: 100vh; padding-bottom: 60px; }
        .td-container { padding-top: 40px; }

        /* ── Welcome ── */
        .td-welcome-banner {
          display: flex; align-items: center; justify-content: space-between;
          gap: 20px; flex-wrap: wrap;
          background: var(--gradient-card);
          border: 1px solid var(--border); border-radius: var(--radius-lg);
          padding: 24px 32px; margin-bottom: 24px;
          position: relative; overflow: hidden;
        }
        .td-welcome-banner::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 0% 50%, rgba(6,182,212,0.1), transparent 60%);
          pointer-events: none;
        }
        .td-welcome-left { display: flex; align-items: center; gap: 18px; position: relative; }
        .td-avatar-wrap { position: relative; flex-shrink: 0; }
        .td-avatar {
          width: 68px; height: 68px; border-radius: 50%;
          object-fit: cover; border: 2px solid rgba(6,182,212,0.5);
          display: block;
        }
        .td-unread-badge {
          position: absolute; top: -4px; right: -4px;
          background: var(--danger); color: #fff;
          font-size: 10px; font-weight: 800;
          width: 20px; height: 20px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid var(--bg-dark);
          box-shadow: 0 0 8px rgba(255,0,60,0.5);
        }
        .td-role-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 2px; }
        .td-name    { font-size: clamp(20px,3vw,28px); font-weight: 800; margin-bottom: 4px; }
        .td-tagline { font-size: 14px; color: var(--text-secondary); }

        .td-refresh-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 18px; border-radius: var(--radius);
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          font-size: 13px; font-weight: 600;
          cursor: pointer; transition: var(--transition);
          white-space: nowrap;
        }
        .td-refresh-btn:hover { border-color: var(--primary); color: var(--primary); }
        .spin { animation: spin 0.8s linear infinite; }

        /* ── Stats ── */
        .td-stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 28px; }
        .td-stat-card { display: flex; align-items: flex-start; gap: 16px; padding: 20px; }
        .td-stat-icon {
          width: 50px; height: 50px; border-radius: 14px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .td-stat-value { font-size: 30px; font-weight: 800; font-family: 'Space Grotesk',sans-serif; line-height: 1; margin-bottom: 4px; }
        .td-stat-label { font-size: 13px; color: var(--text-muted); margin-bottom: 4px; }
        .td-stat-note  { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

        /* ── Panels ── */
        .td-panels { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

        .td-panel-header {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 18px; flex-wrap: wrap;
        }
        .td-panel-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .td-panel-title { font-size: 18px; font-weight: 700; flex: 1; }
        .td-panel-count {
          padding: 2px 10px; border-radius: 100px;
          font-size: 12px; font-weight: 700; border: 1px solid;
        }
        .td-unread-chip {
          padding: 2px 10px; border-radius: 100px;
          background: rgba(255,0,60,0.12); color: var(--danger);
          border: 1px solid rgba(255,0,60,0.3);
          font-size: 11px; font-weight: 700;
          animation: pulse-chip 2s ease-in-out infinite;
        }
        @keyframes pulse-chip { 0%,100%{opacity:1} 50%{opacity:0.6} }

        /* ── Session cards ── */
        .td-session-list { display: flex; flex-direction: column; gap: 10px; }
        .td-session-card {
          display: flex; align-items: center; justify-content: space-between; gap: 14px;
          padding: 14px 16px; border-radius: var(--radius-lg);
          background: var(--gradient-card); border: 1px solid var(--border);
          transition: border-color 0.25s, box-shadow 0.25s;
        }
        .td-session-card.unassigned { border-left: 3px solid #f59e0b; }
        .td-session-card.active     { border-left: 3px solid #06b6d4; }
        .td-session-card:hover {
          border-color: rgba(0,240,255,0.3);
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .td-session-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
        .td-session-avatar-wrap { position: relative; flex-shrink: 0; }
        .td-session-avatar {
          width: 42px; height: 42px; border-radius: 50%; object-fit: cover;
          display: block;
        }
        .td-chat-unread-dot {
          position: absolute; top: -3px; right: -3px;
          background: var(--danger); color: #fff;
          font-size: 9px; font-weight: 800;
          min-width: 16px; height: 16px; border-radius: 100px;
          padding: 0 3px;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid var(--bg-dark);
          box-shadow: 0 0 6px rgba(255,0,60,0.5);
        }

        .td-session-info { flex: 1; min-width: 0; }
        .td-session-name    { font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
        .td-session-subject { font-size: 12px; color: var(--text-muted); margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .td-session-time {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; color: var(--text-muted);
        }

        .td-claim-btn { display: flex; align-items: center; gap: 6px; white-space: nowrap; }

        /* ── Empty ── */
        .td-empty-panel {
          text-align: center; padding: 40px 20px;
          color: var(--text-muted); display: flex; flex-direction: column; align-items: center; gap: 10px;
          border: 1px dashed var(--border); border-radius: var(--radius-lg);
        }
        .td-empty-panel p { font-size: 14px; max-width: 240px; line-height: 1.5; }

        /* ── Skeletons ── */
        .td-skeleton-list { display: flex; flex-direction: column; gap: 10px; }
        .td-skeleton-item {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px; border-radius: var(--radius-lg);
          border: 1px solid var(--border); background: var(--gradient-card);
        }

        /* ── Responsive ── */
        @media(max-width: 900px) {
          .td-panels { grid-template-columns: 1fr; }
          .td-stats-grid { grid-template-columns: 1fr; }
        }
        @media(max-width: 640px) {
          .td-welcome-banner { padding: 16px 20px; }
          .td-refresh-btn { width: 100%; justify-content: center; }
          .td-name { font-size: 20px; }
          .td-avatar { width: 54px; height: 54px; }
        }
        @media(max-width: 420px) {
          .td-session-card { flex-wrap: wrap; }
          .td-claim-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
};

export default TutorDashboard;
