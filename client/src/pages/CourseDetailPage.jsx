import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Users, BookOpen, Clock, Award, Check, Lock, Play, ChevronDown, ChevronUp, Presentation, Gamepad2, FileText, Link as LinkIcon } from 'lucide-react';
import { getCourse, enrollCourse, createCourseCheckout, createRazorpayCourseOrder, verifyRazorpayCoursePayment } from '../services/api';
import { loadRazorpayScript } from '../utils/razorpay';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CourseDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isEnrolled, loadUser } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    getCourse(slug).then(r => setCourse(r.data.course)).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  const toggleSection = (i) => setOpenSections(prev => ({ ...prev, [i]: !prev[i] }));

  const handleEnroll = async () => {
    if (!user) return toast.error('Please login to enroll');
    setEnrolling(true);
    try {
      await enrollCourse(course._id);
      await loadUser();
      toast.success('Enrolled successfully! 🎉');
      
      // Redirect to the LMS page
      setTimeout(() => {
        navigate(`/courses/lms/${course.slug}`);
      }, 500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enroll');
    } finally { setEnrolling(false); }
  };

  const handleCheckout = async () => {
    if (!user) return toast.error('Please login to purchase course');
    setEnrolling(true);
    try {
      // Load Razorpay SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        toast.error('Payment gateway failed to load. Please refresh and try again.');
        return;
      }

      // Create Razorpay Order on backend
      const res = await createRazorpayCourseOrder(course._id);

      if (res.data.isFree) {
        await loadUser();
        toast.success('🎉 Enrolled in free course!');
        navigate(`/courses/lms/${course.slug}`);
        return;
      }

      const { orderId, amount, currency, key } = res.data;

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

      // Open Razorpay Modal
      const options = {
        key: razorpayKey,
        amount: amount,
        currency: currency || 'INR',
        name: 'STEMEd Courses',
        description: course.title,
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
            setEnrolling(true);
            const verifyRes = await verifyRazorpayCoursePayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              courseId: course._id,
            });
            await loadUser();
            toast.success(verifyRes.data.message);
            navigate(`/courses/lms/${course.slug}`);
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          } finally {
            setEnrolling(false);
          }
        },
        modal: {
          ondismiss: function () {
            toast.error('Payment cancelled');
            setEnrolling(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (response) {
        toast.error(`Payment failed: ${response.error?.description || 'Unknown error'}`);
        setEnrolling(false);
      });
      razorpayInstance.open();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message || 'Failed to initiate Razorpay checkout';
      if (status === 503) {
        toast.error('⚠️ Payment gateway not configured on server. Contact support.');
      } else {
        toast.error(msg);
      }
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!course) return <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-muted)' }}>Course not found.</div>;

  const enrolled = user && (isEnrolled(course._id) || user.role === 'admin' || user.role === 'tutor');

  return (
    <div>
      {/* Hero */}
      <div className="hero-padding" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.1) 100%)', borderBottom: '1px solid var(--border)' }}>
        <div className="container layout-sidebar" style={{ gap: 48, alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <span className="badge badge-primary">{course.category}</span>
              <span className={`badge badge-${course.level?.toLowerCase()}`}>{course.level}</span>
              <span className={`badge ${course.isFree ? 'badge-free' : 'badge-paid'}`}>{course.isFree ? 'Free' : 'Paid'}</span>
            </div>
            <h1 style={{ fontSize: 'clamp(24px,3vw,40px)', marginBottom: 16, lineHeight: 1.2 }}>{course.title}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 17, marginBottom: 24, lineHeight: 1.7 }}>{course.shortDescription || course.description}</p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Star size={14} fill="#f59e0b" stroke="none" style={{ color: '#f59e0b' }} /> {course.rating || '4.8'} rating</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} /> {course.studentsEnrolled?.length || 0} students</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><BookOpen size={14} /> {course.totalLessons || 0} lessons</span>
              {course.totalDuration && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} /> {Math.floor(course.totalDuration / 60)}h {course.totalDuration % 60}m</span>}
              {course.certificate && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Award size={14} /> Certificate included</span>}
            </div>
            {course.instructor && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
                <img src={course.instructor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor.name)}&background=7c3aed&color=fff`} alt="" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Instructor</div>
                  <div style={{ fontWeight: 600 }}>{course.instructor.name}</div>
                </div>
              </div>
            )}
          </div>

          {/* Enroll Card */}
          <div className="card" style={{ position: 'sticky', top: 90 }}>
            {course.thumbnail ? <img src={course.thumbnail} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, marginBottom: 20 }} /> : null}
            <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 4, fontFamily: 'Space Grotesk' }}>
              {course.isFree ? <span className="gradient-text">Free</span> : <>₹{course.discountPrice || course.price}</>}
            </div>
            {!course.isFree && course.discountPrice && <div style={{ color: 'var(--text-muted)', textDecoration: 'line-through', fontSize: 16, marginBottom: 8 }}>₹{course.price}</div>}
            {enrolled ? (
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
                onClick={() => navigate(`/courses/lms/${course.slug}`)}
              >
                ✓ Enrolled — Open Learning Portal
              </button>
            ) : course.isFree ? (
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleEnroll} disabled={enrolling}>
                {enrolling ? 'Enrolling...' : 'Enroll for Free'}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleCheckout} disabled={enrolling}>
                  {enrolling ? 'Processing...' : 'Buy Course'}
                </button>
                <Link to={`/?action=demo&course=${encodeURIComponent(course.title)}`} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                  Request Demo
                </Link>
              </div>
            )}
            <ul style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {course.whatYouLearn?.slice(0, 4).map((item, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                  <Check size={16} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="container page-padding">
        <div className="layout-sidebar" style={{ gap: 48 }}>
          <div>
            {/* What you'll learn */}
            {course.whatYouLearn?.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 22, marginBottom: 20 }}>What You'll Learn</h2>
                <div className="grid-2" style={{ gap: 12 }}>
                  {course.whatYouLearn.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                      <Check size={15} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} /> {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {course.requirements?.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 22, marginBottom: 16 }}>Requirements</h2>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {course.requirements.map((r, i) => <li key={i} style={{ fontSize: 14, color: 'var(--text-secondary)', paddingLeft: 16, position: 'relative' }}>• {r}</li>)}
                </ul>
              </div>
            )}

            {/* Curriculum */}
            {course.curriculum?.length > 0 && (
              <div id="course-curriculum" style={{ scrollMarginTop: '80px' }}>
                <h2 style={{ fontSize: 22, marginBottom: 20 }}>Curriculum</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {course.curriculum.map((section, si) => (
                    <div key={si} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                      <button onClick={() => toggleSection(si)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'none', color: 'var(--text-primary)', fontWeight: 600 }}>
                        <span>{section.title}</span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                          <span>{section.lessons?.length || 0} lessons</span>
                          {openSections[si] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </button>
                      {openSections[si] && (
                        <div style={{ borderTop: '1px solid var(--border)' }}>
                          {section.lessons?.map((lesson, li) => {
                            let Icon = Play;
                            if (lesson.type === 'ppt') Icon = Presentation;
                            else if (lesson.type === 'activity') Icon = Gamepad2;
                            else if (lesson.type === 'pdf') Icon = FileText;
                            else if (lesson.type === 'link') Icon = LinkIcon;

                            const isAccessible = lesson.isFree || enrolled;

                            return (
                              <div key={li} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: li < section.lessons.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                {isAccessible ? <Icon size={14} style={{ color: 'var(--primary-light)' }} /> : <Lock size={14} style={{ color: 'var(--text-muted)' }} />}
                                
                                {isAccessible && lesson.url ? (
                                  <a href={lesson.url} target="_blank" rel="noreferrer" style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }} className="hover-link">
                                    {lesson.title}
                                  </a>
                                ) : (
                                  <span style={{ flex: 1, fontSize: 14, color: isAccessible ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                    {lesson.title}
                                  </span>
                                )}

                                {lesson.isFree && <span className="badge badge-free" style={{ fontSize: 10 }}>Free</span>}
                                {lesson.duration && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lesson.duration}m</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div />
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
