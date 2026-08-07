import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMentoringPackages, getMentoringSlots, getMentoringTutors, bookMentoringSession,
  createRazorpayMentoringOrder, verifyRazorpayMentoringPayment,
} from '../services/api';
import { loadRazorpayScript } from '../utils/razorpay';

import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Clock, Calendar, CreditCard, CheckCircle, ChevronRight, ChevronLeft,
  User, Video, Zap, Star, ArrowRight, Shield, RefreshCw,
} from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const today = () => new Date().toISOString().split('T')[0];

// Generate next 30 days for calendar
const getCalendarDays = () => {
  const days = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 30; i++) {
    const date = new Date(d);
    date.setDate(d.getDate() + i);
    days.push(date.toISOString().split('T')[0]);
  }
  return days;
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const MAP = {
    pending:     { color: '#f59e0b', bg: '#f59e0b22', label: '⏳ Pending' },
    confirmed:   { color: '#10b981', bg: '#10b98122', label: '✅ Confirmed' },
    rejected:    { color: '#ef4444', bg: '#ef444422', label: '❌ Rejected' },
    cancelled:   { color: '#6b7280', bg: '#6b728022', label: '🚫 Cancelled' },
    rescheduled: { color: '#6366f1', bg: '#6366f122', label: '🔄 Rescheduled' },
    completed:   { color: '#8b5cf6', bg: '#8b5cf622', label: '🏆 Completed' },
  };
  const s = MAP[status] || MAP.pending;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:s.bg, color:s.color, border:`1px solid ${s.color}44`, whiteSpace:'nowrap' }}>
      {s.label}
    </span>
  );
};

// ─── Step Indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ step }) => {
  const steps = ['Package', 'Date', 'Time Slot', 'Payment', 'Confirm'];
  return (
    <div style={{ display:'flex', alignItems:'center', marginBottom:40, justifyContent:'center', flexWrap:'wrap', gap:4 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display:'flex', alignItems:'center', gap:4 }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <div style={{
              width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:14, fontWeight:800, transition:'all .3s',
              background: i < step ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : i === step ? '#6366f1' : 'transparent',
              border: i === step ? '2px solid #6366f1' : i < step ? 'none' : '2px solid rgba(255,255,255,0.1)',
              color: i <= step ? '#fff' : 'var(--text-muted)',
              boxShadow: i === step ? '0 0 20px rgba(99,102,241,.5)' : 'none',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <span style={{ fontSize:11, color: i === step ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace:'nowrap', fontWeight: i === step ? 700 : 400 }}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width:32, height:2, background: i < step ? '#6366f1' : 'rgba(255,255,255,0.1)', marginBottom:20, transition:'background .3s' }} />
          )}
        </div>
      ))}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const BookMentoringPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [packages, setPackages] = useState({});
  const [tutors, setTutors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [calDays] = useState(getCalendarDays());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [completedBooking, setCompletedBooking] = useState(null);

  // Form state
  const [selectedPkg, setSelectedPkg] = useState('');
  const [selectedTutor, setSelectedTutor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [studentNote, setStudentNote] = useState('');

  // Load packages + tutors
  useEffect(() => {
    getMentoringPackages().then(r => setPackages(r.data.packages)).catch(() => {});
    getMentoringTutors().then(r => setTutors(r.data.tutors)).catch(() => {});
  }, []);

  // Load slots when date or tutor changes
  const loadSlots = useCallback(async (date, tutorId) => {
    if (!date) return;
    setLoadingSlots(true);
    try {
      const r = await getMentoringSlots({ date, tutorId: tutorId || undefined });
      setSlots(r.data.slots);
    } catch { setSlots([]); } finally { setLoadingSlots(false); }
  }, []);

  useEffect(() => { if (selectedDate) loadSlots(selectedDate, selectedTutor); }, [selectedDate, selectedTutor]);

  const pkgInfo = packages[selectedPkg];

  const handleBook = async () => {
    if (!user) { navigate('/login'); return; }
    setBooking(true);
    try {
      // Load Razorpay Checkout SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        toast.error('Payment gateway failed to load. Please refresh and try again.');
        return;
      }

      // Create Razorpay Order
      const res = await createRazorpayMentoringOrder({
        package: selectedPkg,
        date: selectedDate,
        time: selectedSlot,
        tutorId: selectedTutor || undefined,
        studentNote,
      });

      const { orderId, amount, currency, key, bookingPayload } = res.data;

      // Guard: backend must return a real order ID and key
      if (!orderId || !key) {
        toast.error('Payment setup failed — missing order details from server.');
        return;
      }

      // Use key from backend; fall back to Vite env var if needed
      const razorpayKey = key || import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        toast.error('Payment configuration error. Please contact support.');
        return;
      }

      // Open official Razorpay Checkout Modal
      const options = {
        key: razorpayKey,
        amount: amount,
        currency: currency || 'INR',
        name: 'STEMEd Mentoring',
        description: `1-on-1 ${pkgInfo?.label || 'Mentoring'} Session`,
        order_id: orderId,
        prefill: {
          name: user.name || '',
          email: user.email || '',
        },
        theme: {
          color: '#6366f1',
        },
        handler: async function (response) {
          try {
            setBooking(true);
            const verifyRes = await verifyRazorpayMentoringPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingPayload,
            });
            setCompletedBooking(verifyRes.data.booking);
            setStep(4);
            toast.success('🎉 Payment verified! Session booked successfully.');
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          } finally {
            setBooking(false);
          }
        },
        modal: {
          ondismiss: function () {
            toast.error('Payment cancelled');
            setBooking(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (response) {
        toast.error(`Payment failed: ${response.error?.description || 'Unknown error'}`);
        setBooking(false);
      });
      razorpayInstance.open();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message || 'Failed to initiate Razorpay payment';
      if (status === 503) {
        toast.error('⚠️ Payment gateway not configured on server. Contact support.');
      } else {
        toast.error(msg);
      }
    } finally {
      setBooking(false);
    }
  };

  const canNext = [
    !!selectedPkg,
    !!selectedDate,
    !!selectedSlot,
    true,
  ][step];

  // ── Step 0: Package Selection ──────────────────────────────────────────────
  const renderStep0 = () => (
    <div>
      <h2 style={{ textAlign:'center', marginBottom:8, fontSize:22 }}>Choose Your Package</h2>
      <p style={{ textAlign:'center', color:'var(--text-secondary)', marginBottom:32, fontSize:14 }}>
        Select the session duration that works best for you
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16, marginBottom:24 }}>
        {Object.entries(packages).map(([key, pkg]) => (
          <button key={key} onClick={() => setSelectedPkg(key)} style={{
            padding:'24px', borderRadius:16, border:`2px solid ${selectedPkg === key ? '#6366f1' : 'var(--border)'}`,
            background: selectedPkg === key ? 'rgba(99,102,241,.12)' : 'var(--bg-card)',
            cursor:'pointer', textAlign:'left', transition:'all .25s',
            boxShadow: selectedPkg === key ? '0 0 24px rgba(99,102,241,.3)' : 'none',
            transform: selectedPkg === key ? 'translateY(-2px)' : 'none',
          }}>
            <div style={{ fontSize:32, marginBottom:8 }}>{key === '30min' ? '⚡' : key === '1hr' ? '🎯' : '🚀'}</div>
            <div style={{ fontWeight:800, fontSize:18, marginBottom:4, color: selectedPkg === key ? '#6366f1' : 'var(--text-primary)' }}>{pkg.label}</div>
            <div style={{ fontSize:28, fontWeight:900, color: selectedPkg === key ? '#6366f1' : 'var(--text-primary)', marginBottom:8 }}>
              ₹{pkg.price}
            </div>
            <div style={{ fontSize:13, color:'var(--text-secondary)' }}>
              {key === '30min' && 'Quick doubt-clearing session'}
              {key === '1hr' && 'Deep-dive on any topic'}
              {key === '2hr' && 'Comprehensive mentoring session'}
            </div>
            {selectedPkg === key && (
              <div style={{ marginTop:12, color:'#6366f1', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
                <CheckCircle size={14} /> Selected
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Optional tutor selection */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:20 }}>
        <div style={{ fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:8, fontSize:15 }}>
          <User size={16} color="#6366f1" /> Choose Tutor (Optional)
        </div>
        <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:16 }}>
          Leave unselected and we'll assign an available tutor for you.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10 }}>
          {tutors.map(t => (
            <button key={t._id} onClick={() => setSelectedTutor(selectedTutor === t._id ? '' : t._id)} style={{
              display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10,
              border:`1px solid ${selectedTutor === t._id ? '#6366f1' : 'var(--border)'}`,
              background: selectedTutor === t._id ? 'rgba(99,102,241,.1)' : 'transparent',
              cursor:'pointer', textAlign:'left',
            }}>
              <img src={t.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=6366f1&color=fff`}
                alt="" style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover' }} />
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{t.name}</div>
                <div style={{ fontSize:11, color:'var(--text-secondary)' }}>Tutor</div>
              </div>
              {selectedTutor === t._id && <CheckCircle size={14} color="#6366f1" style={{ marginLeft:'auto' }} />}
            </button>
          ))}
          {tutors.length === 0 && <div style={{ color:'var(--text-muted)', fontSize:13 }}>No tutors available</div>}
        </div>
      </div>
    </div>
  );

  // ── Step 1: Date Selection ─────────────────────────────────────────────────
  const renderStep1 = () => {
    const weeks = [];
    for (let i = 0; i < calDays.length; i += 7) weeks.push(calDays.slice(i, i + 7));
    return (
      <div>
        <h2 style={{ textAlign:'center', marginBottom:8, fontSize:22 }}>Select a Date</h2>
        <p style={{ textAlign:'center', color:'var(--text-secondary)', marginBottom:32, fontSize:14 }}>
          Pick a date for your {pkgInfo?.label} session
        </p>
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:24, maxWidth:480, margin:'0 auto' }}>
          {/* Weekday header */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:8 }}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:12, fontWeight:700, color:'var(--text-muted)', padding:'4px 0' }}>{d}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
              {/* pad first week */}
              {wi === 0 && Array(new Date(week[0]).getDay()).fill(null).map((_, i) => <div key={i} />)}
              {week.map(day => {
                const d = new Date(day);
                const isToday = day === today();
                const isSelected = day === selectedDate;
                const isPast = day < today();
                return (
                  <button key={day} disabled={isPast} onClick={() => { setSelectedDate(day); setSelectedSlot(''); }}
                    style={{
                      padding:'10px 4px', borderRadius:10, border:`1px solid ${isSelected ? '#6366f1' : 'transparent'}`,
                      background: isSelected ? '#6366f1' : isToday ? 'rgba(99,102,241,.15)' : 'transparent',
                      color: isPast ? 'var(--text-muted)' : isSelected ? '#fff' : 'var(--text-primary)',
                      cursor: isPast ? 'not-allowed' : 'pointer', fontWeight: isToday || isSelected ? 700 : 400,
                      fontSize:14, opacity: isPast ? 0.4 : 1, transition:'all .2s',
                    }}>
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          ))}
          {selectedDate && (
            <div style={{ marginTop:16, textAlign:'center', color:'#6366f1', fontWeight:700, fontSize:14 }}>
              📅 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Step 2: Time Slot ──────────────────────────────────────────────────────
  const renderStep2 = () => (
    <div>
      <h2 style={{ textAlign:'center', marginBottom:8, fontSize:22 }}>Select a Time Slot</h2>
      <p style={{ textAlign:'center', color:'var(--text-secondary)', marginBottom:32, fontSize:14 }}>
        Available slots for {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' }) : selectedDate}
      </p>
      {loadingSlots ? (
        <div style={{ textAlign:'center', padding:40 }}>
          <RefreshCw size={32} style={{ animation:'spin 1s linear infinite', color:'var(--text-muted)' }} />
        </div>
      ) : slots.length === 0 ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--text-secondary)' }}>
          <Calendar size={48} style={{ opacity:.3, marginBottom:16 }} />
          <div style={{ fontSize:18, fontWeight:600, marginBottom:8 }}>No slots available</div>
          <div style={{ fontSize:14 }}>Try picking a different date.</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12, maxWidth:560, margin:'0 auto' }}>
          {slots.map(slot => (
            <button key={slot} onClick={() => setSelectedSlot(slot)} style={{
              padding:'16px 12px', borderRadius:12, border:`2px solid ${selectedSlot === slot ? '#6366f1' : 'var(--border)'}`,
              background: selectedSlot === slot ? 'rgba(99,102,241,.15)' : 'var(--bg-card)',
              color: selectedSlot === slot ? '#6366f1' : 'var(--text-primary)',
              cursor:'pointer', fontWeight: selectedSlot === slot ? 800 : 500,
              fontSize:16, transition:'all .2s',
              boxShadow: selectedSlot === slot ? '0 0 18px rgba(99,102,241,.3)' : 'none',
              transform: selectedSlot === slot ? 'scale(1.04)' : 'none',
            }}>
              <Clock size={16} style={{ display:'block', margin:'0 auto 6px' }} />
              {fmt12(slot)}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ── Step 3: Payment (Razorpay Integrated) ──────────────────────────────────
  const renderStep3 = () => (
    <div style={{ maxWidth:480, margin:'0 auto' }}>
      <h2 style={{ textAlign:'center', marginBottom:8, fontSize:22 }}>Complete Payment</h2>
      <p style={{ textAlign:'center', color:'var(--text-secondary)', marginBottom:32, fontSize:14 }}>
        Review your session details and pay securely via Razorpay
      </p>

      {/* Order Summary */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:24, marginBottom:20 }}>
        <div style={{ fontWeight:700, marginBottom:16, fontSize:15 }}>📋 Order Summary</div>
        {[
          ['Package', pkgInfo?.label],
          ['Duration', `${pkgInfo?.duration} minutes`],
          ['Date', selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' }) : ''],
          ['Time', fmt12(selectedSlot)],
          ['Tutor', tutors.find(t => t._id === selectedTutor)?.name || 'Auto-assigned'],
        ].map(([k, v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:14 }}>
            <span style={{ color:'var(--text-secondary)' }}>{k}</span>
            <span style={{ fontWeight:600 }}>{v}</span>
          </div>
        ))}
        <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0 0', fontSize:18, fontWeight:800 }}>
          <span>Total</span>
          <span style={{ color:'#6366f1' }}>₹{pkgInfo?.price}</span>
        </div>
      </div>

      {/* Note */}
      <div style={{ marginBottom:20 }}>
        <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text-secondary)', marginBottom:8 }}>
          Note for tutor (optional)
        </label>
        <textarea
          rows={3}
          value={studentNote}
          onChange={e => setStudentNote(e.target.value)}
          placeholder="E.g. I need help with Arduino servo motor control..."
          style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-dark)', color:'var(--text-primary)', fontSize:14, resize:'vertical', boxSizing:'border-box' }}
        />
      </div>

      {/* Razorpay Gateway Badge */}
      <div style={{ background:'rgba(99,102,241,.08)', border:'1px solid rgba(99,102,241,.25)', borderRadius:12, padding:'14px 18px', marginBottom:20, display:'flex', gap:12, alignItems:'center' }}>
        <Shield size={22} color="#6366f1" style={{ flexShrink:0 }} />
        <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.4 }}>
          <strong style={{ color:'var(--text-primary)' }}>Razorpay Payment Gateway</strong><br/>
          Supports UPI (GPay/PhonePe), Credit & Debit Cards, Netbanking, and Wallets.
        </div>
      </div>

      <button onClick={handleBook} disabled={booking} style={{
        width:'100%', padding:'16px', borderRadius:12, border:'none',
        background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff',
        fontSize:16, fontWeight:800, cursor: booking ? 'wait' : 'pointer',
        display:'flex', alignItems:'center', justifyContent:'center', gap:10,
        boxShadow:'0 4px 24px rgba(99,102,241,.4)', transition:'opacity .2s',
        opacity: booking ? 0.7 : 1,
      }}>
        {booking ? (
          <><RefreshCw size={18} style={{ animation:'spin 1s linear infinite' }} /> Processing Razorpay Checkout...</>
        ) : (
          <><CreditCard size={18} /> Pay ₹{pkgInfo?.price} via Razorpay</>
        )}
      </button>
    </div>
  );


  // ── Step 4: Success ────────────────────────────────────────────────────────
  const renderStep4 = () => (
    <div style={{ textAlign:'center', maxWidth:500, margin:'0 auto' }}>
      <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(16,185,129,.15)', border:'2px solid #10b981', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', animation:'popIn .4s cubic-bezier(.34,1.56,.64,1)' }}>
        <CheckCircle size={40} color="#10b981" />
      </div>
      <h2 style={{ fontSize:26, fontWeight:800, marginBottom:8 }}>Booking Confirmed! 🎉</h2>
      <p style={{ color:'var(--text-secondary)', marginBottom:32 }}>
        Your mentoring session has been booked. You'll receive a confirmation email shortly.
      </p>

      {completedBooking && (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:24, marginBottom:28, textAlign:'left' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <span style={{ fontWeight:700, fontSize:15 }}>Booking Details</span>
            <StatusBadge status={completedBooking.status} />
          </div>
          {[
            ['Booking ID',  completedBooking.bookingId],
            ['Tutor',       completedBooking.tutor?.name || 'To be assigned'],
            ['Package',     `${completedBooking.duration} min session`],
            ['Date',        new Date(completedBooking.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })],
            ['Time',        fmt12(completedBooking.time)],
            ['Amount Paid', `₹${completedBooking.price}`],
            ['Payment',     completedBooking.paymentStatus.toUpperCase()],
          ].map(([k, v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:14 }}>
              <span style={{ color:'var(--text-secondary)' }}>{k}</span>
              <span style={{ fontWeight:600 }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
        <button onClick={() => navigate('/dashboard')} style={{ padding:'12px 24px', borderRadius:10, border:'1px solid var(--border)', background:'transparent', color:'var(--text-primary)', cursor:'pointer', fontWeight:600, fontSize:14 }}>
          View My Bookings
        </button>
        <button onClick={() => { setStep(0); setSelectedPkg(''); setSelectedDate(''); setSelectedSlot(''); setSelectedTutor(''); setCompletedBooking(null); }} style={{ padding:'12px 24px', borderRadius:10, border:'none', background:'#6366f1', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:14 }}>
          Book Another Session
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'calc(100vh - 70px)', background:'var(--bg-dark)' }}>
      {/* Header */}
      <div style={{ background:'radial-gradient(ellipse at top,rgba(99,102,241,.15) 0%,transparent 60%)', padding:'60px 0 40px', textAlign:'center', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:20, background:'rgba(99,102,241,.12)', border:'1px solid rgba(99,102,241,.3)', color:'#6366f1', fontSize:13, fontWeight:700, marginBottom:16 }}>
          <Video size={14} /> 1-on-1 Mentoring
        </div>
        <h1 style={{ fontSize:'clamp(28px,5vw,48px)', fontWeight:900, marginBottom:12, letterSpacing:'-1px' }}>
          Book Your <span style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Personal Mentor</span>
        </h1>
        <p style={{ color:'var(--text-secondary)', fontSize:16, maxWidth:520, margin:'0 auto' }}>
          Get 1-on-1 guidance from expert tutors. Learn at your own pace, on your schedule.
        </p>

        {/* Trust badges */}
        <div style={{ display:'flex', gap:24, justifyContent:'center', marginTop:24, flexWrap:'wrap' }}>
          {[['⚡','Instant Booking'], ['🔒','Secure Payment'], ['📧','Email Confirmation'], ['💰','Money-back Guarantee']].map(([icon, text]) => (
            <div key={text} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text-secondary)' }}>
              <span>{icon}</span> {text}
            </div>
          ))}
        </div>
      </div>

      <div className="container" style={{ padding:'40px 24px' }}>
        {step < 4 && <StepIndicator step={step} />}

        {/* Step content */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, padding:'32px 28px', maxWidth:700, margin:'0 auto' }}>
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        {/* Navigation buttons */}
        {step < 4 && step < 3 && (
          <div style={{ display:'flex', justifyContent:'space-between', maxWidth:700, margin:'20px auto 0', gap:12 }}>
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 22px', borderRadius:10, border:'1px solid var(--border)', background:'transparent', color:'var(--text-primary)', cursor: step === 0 ? 'not-allowed' : 'pointer', opacity: step === 0 ? 0.4 : 1, fontWeight:600, fontSize:14 }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 28px', borderRadius:10, border:'none', background: canNext ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,.1)', color: canNext ? '#fff' : 'var(--text-muted)', cursor: canNext ? 'pointer' : 'not-allowed', fontWeight:700, fontSize:14, boxShadow: canNext ? '0 4px 16px rgba(99,102,241,.4)' : 'none' }}
            >
              {step === 2 ? 'Review & Pay' : 'Continue'} <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes popIn{from{transform:scale(.5);opacity:0} to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
};

export default BookMentoringPage;
