import { useState, useEffect, useCallback } from 'react';
import {
  getTutorMentoringBookings, acceptMentoringBooking, rejectMentoringBooking,
  rescheduleMentoringBooking, addMeetingLink, markMentoringCompleted,
} from '../services/api';
import toast from 'react-hot-toast';
import {
  CheckCircle, XCircle, RefreshCw, Video, Calendar, Clock, User,
  MessageSquare, Link2, Trophy, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';

const fmt12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const StatusBadge = ({ status }) => {
  const MAP = {
    pending:     { color: '#f59e0b', label: '⏳ Pending' },
    confirmed:   { color: '#10b981', label: '✅ Confirmed' },
    rejected:    { color: '#ef4444', label: '❌ Rejected' },
    cancelled:   { color: '#6b7280', label: '🚫 Cancelled' },
    rescheduled: { color: '#6366f1', label: '🔄 Rescheduled' },
    completed:   { color: '#8b5cf6', label: '🏆 Completed' },
  };
  const s = MAP[status] || MAP.pending;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 12px', borderRadius:20, fontSize:11, fontWeight:700, background:`${s.color}22`, color:s.color, border:`1px solid ${s.color}44` }}>
      {s.label}
    </span>
  );
};

const inputStyle = {
  width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid var(--border)',
  background:'var(--bg-dark)', color:'var(--text-primary)', fontSize:13, boxSizing:'border-box',
};

// ─── Action Modals ─────────────────────────────────────────────────────────────
const RejectModal = ({ open, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(4px)', padding:16 }}>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:28, maxWidth:400, width:'100%' }}>
        <h3 style={{ margin:'0 0 16px', fontSize:18, display:'flex', alignItems:'center', gap:8 }}><XCircle size={20} color="#ef4444" /> Reject Booking</h3>
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for rejection (optional)" rows={3} style={{ ...inputStyle, resize:'vertical', marginBottom:16 }} />
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-primary)', cursor:'pointer' }}>Cancel</button>
          <button onClick={() => { onConfirm(reason); setReason(''); }} style={{ padding:'9px 18px', borderRadius:8, border:'none', background:'#ef4444', color:'#fff', cursor:'pointer', fontWeight:700 }}>Reject</button>
        </div>
      </div>
    </div>
  );
};

const RescheduleModal = ({ open, onClose, onConfirm }) => {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');
  const SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(4px)', padding:16 }}>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:28, maxWidth:400, width:'100%' }}>
        <h3 style={{ margin:'0 0 20px', fontSize:18, display:'flex', alignItems:'center', gap:8 }}><Calendar size={20} color="#6366f1" /> Reschedule</h3>
        <label style={{ display:'block', fontSize:13, color:'var(--text-secondary)', marginBottom:6 }}>New Date</label>
        <input type="date" min={new Date().toISOString().split('T')[0]} value={newDate} onChange={e => setNewDate(e.target.value)} style={{ ...inputStyle, marginBottom:14 }} />
        <label style={{ display:'block', fontSize:13, color:'var(--text-secondary)', marginBottom:6 }}>New Time</label>
        <select value={newTime} onChange={e => setNewTime(e.target.value)} style={{ ...inputStyle, marginBottom:14 }}>
          <option value="">Select time...</option>
          {SLOTS.map(s => <option key={s} value={s}>{fmt12(s)}</option>)}
        </select>
        <label style={{ display:'block', fontSize:13, color:'var(--text-secondary)', marginBottom:6 }}>Reason (optional)</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} style={{ ...inputStyle, resize:'vertical', marginBottom:16 }} placeholder="Why are you rescheduling?" />
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-primary)', cursor:'pointer' }}>Cancel</button>
          <button onClick={() => { if (newDate && newTime) { onConfirm(newDate, newTime, reason); setNewDate(''); setNewTime(''); setReason(''); } else toast.error('Select date & time'); }}
            style={{ padding:'9px 18px', borderRadius:8, border:'none', background:'#6366f1', color:'#fff', cursor:'pointer', fontWeight:700 }}>Reschedule</button>
        </div>
      </div>
    </div>
  );
};

const MeetingLinkModal = ({ open, onClose, onConfirm }) => {
  const [link, setLink] = useState('');
  const [platform, setPlatform] = useState('google_meet');
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(4px)', padding:16 }}>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:28, maxWidth:440, width:'100%' }}>
        <h3 style={{ margin:'0 0 20px', fontSize:18, display:'flex', alignItems:'center', gap:8 }}><Video size={20} color="#10b981" /> Add Meeting Link</h3>
        <label style={{ display:'block', fontSize:13, color:'var(--text-secondary)', marginBottom:6 }}>Platform</label>
        <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ ...inputStyle, marginBottom:14 }}>
          <option value="google_meet">Google Meet</option>
          <option value="zoom">Zoom</option>
          <option value="other">Other</option>
        </select>
        <label style={{ display:'block', fontSize:13, color:'var(--text-secondary)', marginBottom:6 }}>Meeting Link</label>
        <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://meet.google.com/..." style={{ ...inputStyle, marginBottom:8 }} />
        <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>The student will receive this link via email.</p>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-primary)', cursor:'pointer' }}>Cancel</button>
          <button onClick={() => { if (link) { onConfirm(link, platform); setLink(''); } else toast.error('Enter a meeting link'); }}
            style={{ padding:'9px 18px', borderRadius:8, border:'none', background:'#10b981', color:'#fff', cursor:'pointer', fontWeight:700 }}>Send Link</button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN ──────────────────────────────────────────────────────────────────────
const TutorMentoringPanel = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reschedOpen, setReschedOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getTutorMentoringBookings({ status: statusFilter });
      setBookings(r.data.bookings);
    } catch { toast.error('Failed to load bookings'); } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (fn, id, ...args) => {
    try {
      const r = await fn(id, ...args);
      setBookings(b => b.map(x => x._id === id ? r.data.booking : x));
      toast.success('Done!');
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const pending = bookings.filter(b => b.status === 'pending').length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const completed = bookings.filter(b => b.status === 'completed').length;

  return (
    <div>
      <RejectModal open={rejectOpen} onClose={() => setRejectOpen(false)} onConfirm={(reason) => { doAction(rejectMentoringBooking, actionId, { reason }); setRejectOpen(false); }} />
      <RescheduleModal open={reschedOpen} onClose={() => setReschedOpen(false)} onConfirm={(d, t, r) => { doAction(rescheduleMentoringBooking, actionId, { newDate:d, newTime:t, reason:r }); setReschedOpen(false); }} />
      <MeetingLinkModal open={linkOpen} onClose={() => setLinkOpen(false)} onConfirm={(link, platform) => { doAction(addMeetingLink, actionId, { meetingLink:link, meetingPlatform:platform }); setLinkOpen(false); }} />

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        {[['⏳','Pending',pending,'#f59e0b'], ['✅','Confirmed',confirmed,'#10b981'], ['🏆','Completed',completed,'#8b5cf6']].map(([icon,lbl,val,col]) => (
          <div key={lbl} style={{ background:'var(--bg-card)', border:`1px solid ${col}33`, borderRadius:14, padding:'16px 20px', textAlign:'center' }}>
            <div style={{ fontSize:24, marginBottom:4 }}>{icon}</div>
            <div style={{ fontSize:28, fontWeight:800, color:col }}>{val}</div>
            <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        {['all','pending','confirmed','rescheduled','completed','cancelled','rejected'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding:'7px 14px', borderRadius:20, border:'1px solid var(--border)', cursor:'pointer', fontSize:12, fontWeight:600,
            background: statusFilter === s ? '#6366f1' : 'transparent', color: statusFilter === s ? '#fff' : 'var(--text-secondary)',
            textTransform:'capitalize',
          }}>{s}</button>
        ))}
        <button onClick={load} style={{ marginLeft:'auto', padding:'7px 12px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-secondary)', cursor:'pointer' }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--text-secondary)' }}>Loading...</div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign:'center', padding:60 }}>
          <Calendar size={48} style={{ opacity:.3, margin:'0 auto 16px' }} />
          <div style={{ fontWeight:600, color:'var(--text-secondary)' }}>No mentoring requests yet</div>
        </div>
      ) : (
        <div style={{ display:'grid', gap:12 }}>
          {bookings.map(b => (
            <div key={b._id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', transition:'box-shadow .2s' }}>
              {/* Card header */}
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', flexWrap:'wrap', cursor:'pointer' }}
                onClick={() => setExpanded(e => e === b._id ? null : b._id)}>
                <img src={b.student?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.student?.name||'S')}&background=6366f1&color=fff`}
                  alt="" style={{ width:42, height:42, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:15 }}>{b.student?.name}</div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)', display:'flex', gap:12, flexWrap:'wrap', marginTop:2 }}>
                    <span><Calendar size={11} style={{ verticalAlign:'middle' }} /> {b.date}</span>
                    <span><Clock size={11} style={{ verticalAlign:'middle' }} /> {fmt12(b.time)}</span>
                    <span>⏱ {b.duration} min</span>
                    <span style={{ color:'#10b981', fontWeight:700 }}>₹{b.price}</span>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                  <StatusBadge status={b.status} />
                  {expanded === b._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Expanded detail + actions */}
              {expanded === b._id && (
                <div style={{ padding:'0 20px 20px', borderTop:'1px solid var(--border)' }}>
                  <div style={{ paddingTop:16, marginBottom:16 }}>
                    {b.studentNote && (
                      <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', fontSize:13, color:'var(--text-secondary)', marginBottom:12 }}>
                        <strong style={{ color:'var(--text-primary)' }}>Student Note:</strong> {b.studentNote}
                      </div>
                    )}
                    {b.meetingLink && (
                      <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#10b981', marginBottom:12 }}>
                        <Link2 size={14} />
                        <a href={b.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color:'#10b981' }}>{b.meetingLink}</a>
                        <ExternalLink size={12} />
                      </div>
                    )}
                    {b.rejectionReason && <div style={{ fontSize:13, color:'#ef4444' }}>Rejection reason: {b.rejectionReason}</div>}
                    {b.rescheduleReason && <div style={{ fontSize:13, color:'#6366f1' }}>Reschedule reason: {b.rescheduleReason}</div>}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {b.status === 'pending' && (
                      <>
                        <button onClick={() => doAction(acceptMentoringBooking, b._id)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1px solid #10b98155', background:'rgba(16,185,129,.1)', color:'#10b981', cursor:'pointer', fontWeight:600, fontSize:13 }}>
                          <CheckCircle size={14} /> Accept
                        </button>
                        <button onClick={() => { setActionId(b._id); setRejectOpen(true); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1px solid #ef444455', background:'rgba(239,68,68,.1)', color:'#ef4444', cursor:'pointer', fontWeight:600, fontSize:13 }}>
                          <XCircle size={14} /> Reject
                        </button>
                        <button onClick={() => { setActionId(b._id); setReschedOpen(true); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-secondary)', cursor:'pointer', fontSize:13 }}>
                          <Calendar size={14} /> Reschedule
                        </button>
                      </>
                    )}
                    {b.status === 'confirmed' && (
                      <>
                        <button onClick={() => { setActionId(b._id); setLinkOpen(true); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'none', background:'#10b981', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:13 }}>
                          <Video size={14} /> {b.meetingLink ? 'Update Link' : 'Add Meeting Link'}
                        </button>
                        <button onClick={() => { setActionId(b._id); setReschedOpen(true); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-secondary)', cursor:'pointer', fontSize:13 }}>
                          <Calendar size={14} /> Reschedule
                        </button>
                        <button onClick={() => doAction(markMentoringCompleted, b._id)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1px solid #8b5cf655', background:'rgba(139,92,246,.1)', color:'#8b5cf6', cursor:'pointer', fontSize:13 }}>
                          <Trophy size={14} /> Mark Complete
                        </button>
                      </>
                    )}
                    {b.status === 'rescheduled' && (
                      <>
                        <button onClick={() => doAction(acceptMentoringBooking, b._id)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1px solid #10b98155', background:'rgba(16,185,129,.1)', color:'#10b981', cursor:'pointer', fontWeight:600, fontSize:13 }}>
                          <CheckCircle size={14} /> Confirm Reschedule
                        </button>
                        <button onClick={() => { setActionId(b._id); setLinkOpen(true); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-secondary)', cursor:'pointer', fontSize:13 }}>
                          <Video size={14} /> Add Link
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TutorMentoringPanel;
