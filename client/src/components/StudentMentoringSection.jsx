import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyMentoringBookings, cancelMentoringBooking } from '../services/api';
import toast from 'react-hot-toast';
import { Calendar, Clock, Video, Plus, ExternalLink, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

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

const StudentMentoringSection = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    getMyMentoringBookings()
      .then(r => setBookings(r.data.bookings))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancelling(id);
    try {
      const r = await cancelMentoringBooking(id);
      setBookings(b => b.map(x => x._id === id ? r.data.booking : x));
      toast.success('Booking cancelled.');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel'); } finally { setCancelling(null); }
  };

  if (loading) return <div style={{ textAlign:'center', padding:32, color:'var(--text-secondary)' }}>Loading mentoring sessions...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800 }}>🎓 1-on-1 Mentoring</h2>
          <p style={{ margin:'4px 0 0', color:'var(--text-secondary)', fontSize:13 }}>Your personal mentoring sessions</p>
        </div>
        <Link to="/book-mentoring" style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none', boxShadow:'0 4px 14px rgba(99,102,241,.4)' }}>
          <Plus size={16} /> Book New Session
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div style={{ background:'var(--bg-card)', border:'2px dashed var(--border)', borderRadius:16, padding:48, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🎓</div>
          <h3 style={{ fontWeight:700, marginBottom:8 }}>No mentoring sessions yet</h3>
          <p style={{ color:'var(--text-secondary)', marginBottom:24, fontSize:14 }}>Book a 1-on-1 session with an expert tutor for personalized guidance.</p>
          <Link to="/book-mentoring" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 24px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontWeight:700, textDecoration:'none' }}>
            <Plus size={16} /> Book Your First Session
          </Link>
        </div>
      ) : (
        <div style={{ display:'grid', gap:12 }}>
          {bookings.map(b => (
            <div key={b._id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
              {/* Card header */}
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', flexWrap:'wrap', cursor:'pointer' }}
                onClick={() => setExpanded(e => e === b._id ? null : b._id)}>
                <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:20 }}>
                  🎯
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:2 }}>
                    {b.duration} Minute Session
                    {b.tutor && <span style={{ fontSize:12, fontWeight:400, color:'var(--text-secondary)', marginLeft:8 }}>with {b.tutor.name}</span>}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)', display:'flex', gap:12, flexWrap:'wrap' }}>
                    <span><Calendar size={11} style={{ verticalAlign:'middle' }} /> {b.date}</span>
                    <span><Clock size={11} style={{ verticalAlign:'middle' }} /> {fmt12(b.time)}</span>
                    <span style={{ color:'#6366f1', fontWeight:700 }}>#{b.bookingId}</span>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                  <StatusBadge status={b.status} />
                  {expanded === b._id ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === b._id && (
                <div style={{ padding:'0 20px 20px', borderTop:'1px solid var(--border)' }}>
                  <div style={{ paddingTop:16, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:16 }}>
                    {[
                      ['Package', `${b.duration} minutes`],
                      ['Amount', `₹${b.price}`],
                      ['Payment', b.paymentStatus?.toUpperCase()],
                      ['Tutor', b.tutor?.name || 'To be assigned'],
                    ].map(([k, v]) => (
                      <div key={k} style={{ background:'rgba(255,255,255,.03)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px' }}>
                        <div style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:4, textTransform:'uppercase', letterSpacing:'.5px' }}>{k}</div>
                        <div style={{ fontWeight:700, fontSize:14 }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {b.meetingLink && b.status !== 'cancelled' && b.status !== 'rejected' && (
                    <a href={b.meetingLink} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none', marginBottom:12 }}>
                      <Video size={16} /> Join Meeting <ExternalLink size={14} />
                    </a>
                  )}

                  {b.rejectionReason && (
                    <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#ef4444', marginBottom:12 }}>
                      ❌ Rejected: {b.rejectionReason}
                    </div>
                  )}
                  {b.rescheduleReason && (
                    <div style={{ background:'rgba(99,102,241,.08)', border:'1px solid rgba(99,102,241,.2)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#6366f1', marginBottom:12 }}>
                      🔄 Rescheduled: {b.rescheduleReason}
                    </div>
                  )}

                  {['pending', 'confirmed', 'rescheduled'].includes(b.status) && (
                    <button onClick={() => handleCancel(b._id)} disabled={cancelling === b._id} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1px solid rgba(239,68,68,.3)', background:'rgba(239,68,68,.08)', color:'#ef4444', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                      <XCircle size={14} /> {cancelling === b._id ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentMentoringSection;
