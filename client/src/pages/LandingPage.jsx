import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Zap, BookOpen, Cpu, ArrowRight, Star, Users, Shield, Award, ChevronRight, Play, Bot, MessageCircle, Mail, Phone, Send } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import ProjectCard from '../components/ProjectCard';
import { getFeaturedCourses, getFeaturedProjects } from '../services/api';

const CATEGORIES = [
  { name: 'Robotics', icon: '🤖', color: '#7c3aed', desc: 'Build intelligent robots' },
  { name: 'Game Development', icon: '🎮', color: '#06b6d4', desc: 'Create amazing games' },
  { name: 'Drone Technology', icon: '🚁', color: '#f59e0b', desc: 'Fly autonomous drones' },
  { name: 'IoT', icon: '📡', color: '#10b981', desc: 'Connect the world' },
  { name: 'AI & Machine Learning', icon: '🧠', color: '#ec4899', desc: 'Train AI models' },
  { name: 'Electronics', icon: '⚡', color: '#f97316', desc: 'Master circuits' },
  { name: '3D Printing', icon: '🖨️', color: '#84cc16', desc: 'Prototype anything' },
  { name: 'Coding', icon: '💻', color: '#3b82f6', desc: 'Code anything' },
];

const STATS = [
  { label: 'Students', value: '250+', icon: <Users size={22} /> },
  { label: 'Projects', value: '50+', icon: <Cpu size={22} /> },
  { label: 'Expert Tutors', value: '10+', icon: <Star size={22} /> },
  { label: 'Certifications', value: '5+', icon: <Award size={22} /> },
];

const FEATURES = [
  { icon: <Bot size={28} />, title: 'AI Project Assistant', desc: 'Tell us what components you have — our AI instantly suggests projects you can build today.', color: '#7c3aed' },
  { icon: <Cpu size={28} />, title: 'Step-by-Step Guides', desc: 'Crystal-clear project guides with code snippets, images, and tips at every stage.', color: '#06b6d4' },
  { icon: <MessageCircle size={28} />, title: 'Live Tutor Support', desc: 'Chat 1-on-1 with expert tutors for personalized help and instant doubt resolution.', color: '#10b981' },
  { icon: <Award size={28} />, title: 'Certificates', desc: 'Earn verifiable certificates recognized by top STEM companies and universities.', color: '#f59e0b' },
];

const TESTIMONIALS = [
  { name: 'Arjun Sharma', role: 'class 10, 16', text: 'The AI assistant suggested I build a line-following robot with parts I already had. Mind blown!', avatar: 'AS' },
  { name: 'Priya Patel', role: 'class 12, 18', text: 'I went from zero to publishing my first game in 3 months. The tutors are incredible!', avatar: 'PP' },
  { name: 'Rahul Kumar', role: 'IoT Developer, 20', text: "The step-by-step project guides are the best I've seen. Everything just works!", avatar: 'RK' },
];

const LandingPage = () => {
  const [courses, setCourses] = useState([]);
  const [projects, setProjects] = useState([]);

  const location = useLocation();
  const contactRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', type: 'General Inquiry', message: '' });

  useEffect(() => {
    getFeaturedCourses().then(r => setCourses(r.data.courses || [])).catch(() => {});
    getFeaturedProjects().then(r => setProjects(r.data.projects || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'demo') {
      const courseName = params.get('course') || 'a course';
      setFormData(prev => ({
        ...prev,
        type: 'Book a Demo',
        message: `Requested demo for ${courseName}`,
      }));
      setTimeout(() => {
        contactRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [location]);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return toast.error('Please fill all required fields');
    setSending(true);
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          from_name: formData.name,
          reply_to: formData.email,
          inquiry_type: formData.type,
          message: formData.message,
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );
      toast.success('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', type: 'General Inquiry', message: '' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to send message. Please check your EmailJS configuration.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="landing">

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-grid" />
        </div>
        <div className="container hero-content">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="hero-text">
            <div className="hero-badge"><Zap size={14} /> The #1 STEM Learning Platform</div>
            <h1>Build the <span className="gradient-text">Future</span><br />with STEM Education</h1>
            <p>Learn Robotics, Game Dev, Drone Tech, IoT, AI &amp; more — with AI-powered project guidance, step-by-step tutorials, and 1-on-1 tutor support.</p>
            <div className="hero-ctas">
              <Link to="/courses" className="btn btn-primary btn-lg"><BookOpen size={20} /> Explore Courses</Link>
              <Link to="/ai-assistant" className="btn btn-secondary btn-lg"><Bot size={20} /> Try AI Assistant</Link>
            </div>
            <div className="hero-social-proof">
              <div className="avatar-stack">
                {['A','B','C','D'].map(l => <div key={l} className="mini-avatar">{l}</div>)}
              </div>
              <span><strong>250+</strong> students already learning</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="hero-visual">
            <div className="hero-card-float">
              <div className="floating-card fc-1">
                <Bot size={20} style={{ color: '#7c3aed' }} />
                <div><div style={{ fontWeight: 600, fontSize: 13 }}>AI Suggests Project</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Based on your components</div></div>
              </div>
              <div className="floating-card fc-2">
                <span style={{ fontSize: 20 }}>🤖</span>
                <div><div style={{ fontWeight: 600, fontSize: 13 }}>Line Following Robot</div><div style={{ fontSize: 11, color: 'var(--success)' }}>✓ You can build this!</div></div>
              </div>
              <div className="floating-card fc-3">
                <Star size={16} fill="#f59e0b" stroke="none" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>4.9 / 5 Rating</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((s, i) => (
              <motion.div key={i} className="stat-card card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title gradient-text">Explore STEM Categories</h2>
            <p className="section-subtitle">From robotics to AI — find your passion and start building.</p>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map((cat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <Link to={`/courses?category=${encodeURIComponent(cat.name)}`} className="category-card" style={{ '--cat-color': cat.color }}>
                  <span className="cat-emoji">{cat.icon}</span>
                  <h3 className="cat-name">{cat.name}</h3>
                  <p className="cat-desc">{cat.desc}</p>
                  <ChevronRight size={16} className="cat-arrow" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Courses ── */}
      {courses.length > 0 && (
        <section className="section" style={{ background: 'rgba(124,58,237,0.03)' }}>
          <div className="container">
            <div className="section-header-row">
              <div>
                <h2 className="section-title">Featured <span className="gradient-text">Courses</span></h2>
                <p className="section-subtitle">Start with our most popular STEM courses.</p>
              </div>
              <Link to="/courses" className="btn btn-secondary">View All <ArrowRight size={16} /></Link>
            </div>
            <div className="grid-3">
              {courses.slice(0, 3).map(c => <CourseCard key={c._id} course={c} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── AI Assistant Feature ── */}
      <section className="section">
        <div className="container">
          <div className="ai-feature-section">
            <motion.div className="ai-feature-text" initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="hero-badge" style={{ marginBottom: 16 }}><Bot size={14} /> Powered by Google</div>
              <h2 className="section-title">What Can You Build<br /><span className="gradient-text">Right Now?</span></h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.8, fontSize: 'clamp(13px,2vw,16px)' }}>
                Tell our AI what electronic components you have — Arduino, sensors, motors, LEDs — and it will instantly suggest amazing projects you can build today, plus what to add next.
              </p>
              <ul className="ai-feature-list">
                {['Enter components you own', 'AI suggests buildable projects', 'Get step-by-step guidance', 'Add components to unlock more'].map((item, i) => (
                  <li key={i}><Zap size={16} style={{ color: 'var(--primary-light)', flexShrink: 0 }} /> {item}</li>
                ))}
              </ul>
              <Link to="/ai-assistant" className="btn btn-primary btn-lg" style={{ marginTop: 24 }}><Bot size={20} /> Try AI Assistant Free</Link>
            </motion.div>

            <motion.div className="ai-feature-demo" initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="demo-terminal">
                <div className="terminal-header"><div className="t-dot t-red" /><div className="t-dot t-yellow" /><div className="t-dot t-green" /></div>
                <div className="terminal-body">
                  <div className="t-user">I have: Arduino Uno, HC-SR04 sensor, 2 DC motors, L298N driver</div>
                  <div className="t-ai">
                    <Bot size={16} style={{ color: 'var(--primary-light)', flexShrink: 0 }} />
                    <div>
                      <strong>You can build 3 amazing projects right now!</strong><br /><br />
                      🤖 <strong>Obstacle Avoidance Robot</strong> — Beginner<br />
                      🚗 <strong>Remote Control Car</strong> — Intermediate<br />
                      📏 <strong>Distance Alarm System</strong> — Beginner<br /><br />
                      Add a Bluetooth module to unlock 5 more projects!
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section" style={{ background: 'rgba(6,182,212,0.03)' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', alignItems: 'center' }}>
            <h2 className="section-title">Everything You Need to <span className="gradient-text">Succeed</span></h2>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <motion.div key={i} className="feature-card card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="feature-icon" style={{ color: f.color, background: `${f.color}15` }}>{f.icon}</div>
                <div>
                  <h3 style={{ fontSize: 'clamp(15px,2vw,18px)', marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 'clamp(13px,1.5vw,15px)' }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Projects ── */}
      {projects.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header-row">
              <div>
                <h2 className="section-title">Popular <span className="gradient-text">Project Guides</span></h2>
                <p className="section-subtitle">Step-by-step guides for hands-on STEM projects.</p>
              </div>
              <Link to="/projects" className="btn btn-secondary">View All <ArrowRight size={16} /></Link>
            </div>
            <div className="grid-3">
              {projects.slice(0, 3).map(p => <ProjectCard key={p._id} project={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ── */}
      <section className="section" style={{ background: 'rgba(124,58,237,0.04)' }}>
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 40 }}>What Students <span className="gradient-text">Say</span></h2>
          <div className="grid-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} className="testimonial-card card" initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="t-stars">{[...Array(5)].map((_, j) => <Star key={j} size={14} fill="#f59e0b" stroke="none" />)}</div>
                <p className="t-text">"{t.text}"</p>
                <div className="t-author">
                  <div className="t-avatar">{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Us ── */}
      <section className="section" ref={contactRef} style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <h2 className="section-title">Get In <span className="gradient-text">Touch</span></h2>
            <p className="section-subtitle">Have questions or want to book a demo? We're here to help.</p>
          </div>

          <div className="contact-outer-grid">
            <div>
              <div className="card contact-info-card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 'clamp(16px,2.5vw,20px)', marginBottom: 20 }}>Contact Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, flexShrink: 0, background: 'rgba(124,58,237,0.1)', color: 'var(--primary-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mail size={20} /></div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email Us</div>
                      <div style={{ fontSize: 'clamp(13px,2vw,16px)', fontWeight: 600, wordBreak: 'break-all' }}>stemeduhere@gmail.com</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, flexShrink: 0, background: 'rgba(6,182,212,0.1)', color: '#06b6d4', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={20} /></div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Call Us</div>
                      <div style={{ fontSize: 'clamp(13px,2vw,16px)', fontWeight: 600 }}>+91 9721001168, +91 6386789974</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card contact-info-card" style={{ background: 'var(--gradient-card)' }}>
                <h3 style={{ fontSize: 'clamp(14px,2vw,18px)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={18} style={{ color: 'var(--success)' }} /> Secure &amp; Private</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>Your data is fully encrypted. We never share your email with third parties, and we typically respond within 24 hours.</p>
              </div>
            </div>

            <div className="card contact-form-card">
              <h3 className="contact-form-title">Send a Message</h3>
              <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="contact-name-email">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Your Name</label>
                    <input type="text" className="form-input" placeholder="name here..." value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-input" placeholder="email@gmail.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">How can we help?</label>
                  <select className="form-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option>General Inquiry</option>
                    <option>Book a Demo</option>
                    <option>Support</option>
                    <option>Partnership</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Message</label>
                  <textarea className="form-input" rows="4" placeholder="Tell us what you need..." value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} required></textarea>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} disabled={sending}>
                  {sending ? 'Sending...' : <><Send size={18} /> Send Message</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-banner">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(22px,5vw,48px)', marginBottom: 16 }}>Ready to Start Your <span className="gradient-text">STEM Journey?</span></h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 'clamp(13px,2vw,18px)' }}>Join 250+ students building the future today.</p>
          <div className="cta-actions">
            <Link to="/register" className="btn btn-primary btn-lg">Get Started Free <ArrowRight size={18} /></Link>
            <Link to="/courses" className="btn btn-secondary btn-lg">View Premium Courses</Link>
          </div>
        </div>
      </section>

      <style>{`
        /* ════ HERO ════ */
        .hero {
          min-height: 90vh;
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
          padding: 80px 0;
        }
        .hero-bg { position:absolute; inset:0; pointer-events:none; }
        .hero-orb { position:absolute; border-radius:50%; filter:blur(80px); }
        .hero-orb-1 {
          width: min(500px,130vw); height: min(500px,130vw);
          background: rgba(124,58,237,0.2);
          top:-100px; left:-100px;
          animation: float1 8s ease-in-out infinite;
        }
        .hero-orb-2 {
          width: min(400px,110vw); height: min(400px,110vw);
          background: rgba(6,182,212,0.15);
          bottom:-50px; right:-50px;
          animation: float2 10s ease-in-out infinite;
        }
        .hero-grid {
          position:absolute; inset:0;
          background-image:
            linear-gradient(rgba(139,92,246,0.07) 1px,transparent 1px),
            linear-gradient(90deg,rgba(139,92,246,0.07) 1px,transparent 1px);
          background-size: 60px 60px;
        }
        @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-30px)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,20px)} }
        .hero-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
          position: relative;
          z-index: 1;
        }
        .hero-badge {
          display: inline-flex; align-items:center; gap:8px;
          padding: 8px 16px; border-radius:100px;
          background: rgba(124,58,237,0.15);
          border: 1px solid rgba(124,58,237,0.3);
          color: var(--primary-light);
          font-size: 13px; font-weight:600; margin-bottom:20px;
        }
        .hero-text h1 { font-size:clamp(30px,5vw,64px); line-height:1.1; margin-bottom:20px; }
        .hero-text p  { font-size:clamp(14px,1.8vw,18px); color:var(--text-secondary); margin-bottom:32px; line-height:1.7; }
        .hero-ctas { display:flex; gap:16px; flex-wrap:wrap; margin-bottom:28px; }
        .hero-social-proof { display:flex; align-items:center; gap:12px; color:var(--text-secondary); font-size:14px; flex-wrap:wrap; }
        .avatar-stack { display:flex; }
        .mini-avatar {
          width:30px; height:30px; border-radius:50%;
          background: var(--gradient-primary);
          display:flex; align-items:center; justify-content:center;
          font-size:11px; font-weight:700;
          border: 2px solid var(--bg-dark);
          margin-left: -8px;
        }
        .mini-avatar:first-child { margin-left:0; }

        /* ════ FLOATING CARDS ════ */
        .hero-card-float { position:relative; height:400px; }
        .floating-card {
          position:absolute;
          background: var(--bg-elevated); border:1px solid var(--border);
          border-radius:16px; padding:14px 18px;
          display:flex; align-items:center; gap:12px;
          box-shadow: var(--shadow-card);
          animation: floatCard 4s ease-in-out infinite;
          white-space: nowrap;
        }
        .fc-1 { top:40px; left:0; animation-delay:0s; }
        .fc-2 { top:160px; right:20px; animation-delay:1s; }
        .fc-3 { bottom:80px; left:40px; animation-delay:2s; }
        @keyframes floatCard { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }

        /* ════ STATS ════ */
        .stats-section { padding:48px 0; background:rgba(255,255,255,0.02); border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
        .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:24px; }
        .stat-card { text-align:center; padding:28px 20px; }
        .stat-icon { color:var(--primary-light); margin-bottom:12px; display:flex; justify-content:center; }
        .stat-value {
          font-size: clamp(20px,3vw,32px); font-weight:800;
          font-family:'Space Grotesk',sans-serif;
          background: var(--gradient-primary);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .stat-label { color:var(--text-secondary); font-size:14px; margin-top:4px; }

        /* ════ SECTION HELPERS ════ */
        .section-header { margin-bottom:48px; }
        .section-header-row {
          display:flex; align-items:flex-end; justify-content:space-between;
          margin-bottom:36px; flex-wrap:wrap; gap:16px;
        }

        /* ════ CATEGORIES ════ */
        .categories-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
        .category-card {
          display:flex; flex-direction:column; padding:24px;
          border-radius:var(--radius-lg); background:var(--gradient-card);
          border:1px solid var(--border); transition:var(--transition);
          cursor:pointer; position:relative; overflow:hidden;
        }
        .category-card::before {
          content:''; position:absolute; inset:0;
          background: linear-gradient(135deg,var(--cat-color,#7c3aed) 0%,transparent 60%);
          opacity:0; transition:var(--transition);
        }
        .category-card:hover::before { opacity:0.08; }
        .category-card:hover { border-color:var(--cat-color); transform:translateY(-4px); }
        .cat-emoji { font-size:32px; margin-bottom:12px; }
        .cat-name  { font-size:15px; font-weight:700; margin-bottom:6px; color:var(--text-primary); }
        .cat-desc  { font-size:13px; color:var(--text-secondary); flex:1; }
        .cat-arrow { color:var(--text-muted); margin-top:12px; transition:var(--transition); }
        .category-card:hover .cat-arrow { color:var(--cat-color); transform:translateX(4px); }

        /* ════ AI FEATURE ════ */
        .ai-feature-section { display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:center; }
        .ai-feature-list { display:flex; flex-direction:column; gap:12px; }
        .ai-feature-list li { display:flex; align-items:center; gap:10px; font-size:15px; color:var(--text-secondary); }
        .demo-terminal { background:#07071a; border:1px solid rgba(124,58,237,0.3); border-radius:var(--radius-lg); overflow:hidden; box-shadow:var(--shadow-glow); }
        .terminal-header { padding:12px 16px; background:#0d0d1f; display:flex; gap:8px; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); }
        .t-dot { width:12px; height:12px; border-radius:50%; }
        .t-red{background:#ef4444;} .t-yellow{background:#f59e0b;} .t-green{background:#10b981;}
        .terminal-body { padding:20px; display:flex; flex-direction:column; gap:16px; }
        .t-user { background:rgba(124,58,237,0.2); border:1px solid rgba(124,58,237,0.3); border-radius:12px; padding:12px 16px; font-size:14px; color:var(--text-secondary); word-break:break-word; }
        .t-ai   { display:flex; gap:10px; background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.2); border-radius:12px; padding:12px 16px; font-size:14px; color:var(--text-primary); line-height:1.7; word-break:break-word; }

        /* ════ FEATURES ════ */
        .features-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr)); gap:20px; }
        .feature-card { display:flex; gap:20px; align-items:flex-start; }
        .feature-icon { width:56px; height:56px; border-radius:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        /* ════ TESTIMONIALS ════ */
        .t-stars  { display:flex; gap:3px; margin-bottom:12px; }
        .t-text   { color:var(--text-secondary); font-size:15px; line-height:1.7; margin-bottom:16px; }
        .t-author { display:flex; align-items:center; gap:12px; }
        .t-avatar { width:40px; height:40px; border-radius:50%; background:var(--gradient-primary); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; }

        /* ════ CTA BANNER ════ */
        .cta-banner { padding:80px 0; background:radial-gradient(ellipse at center,rgba(124,58,237,0.2) 0%,transparent 70%); border-top:1px solid var(--border); }
        .cta-actions { display:flex; gap:16px; justify-content:center; flex-wrap:wrap; }

        /* ════ CONTACT ════ */
        .contact-outer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(300px,100%), 1fr));
          gap: clamp(16px,4vw,48px);
          align-items: start;
        }
        .contact-info-card { padding: clamp(16px,3vw,32px) !important; }
        .contact-form-card { padding: clamp(16px,3vw,36px) !important; }
        .contact-form-title { font-size: clamp(18px,3vw,24px); margin-bottom: 20px; }
        .contact-name-email {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(180px,100%), 1fr));
          gap: 16px;
        }

        /* ════════════════════════════════════
           RESPONSIVE BREAKPOINTS
        ════════════════════════════════════ */

        /* Tablet landscape ≤1024px */
        @media(max-width:1024px) {
          .hero-content { gap:40px; }
          .categories-grid { grid-template-columns:repeat(3,1fr); }
          .ai-feature-section { gap:40px; }
        }

        /* Tablet portrait ≤900px */
        @media(max-width:900px) {
          .hero { min-height:auto; padding:100px 0 60px; }
          .hero-content { grid-template-columns:1fr; gap:0; text-align:center; }
          .hero-visual { display:none; }
          .hero-badge { margin:0 auto 20px; }
          .hero-ctas { justify-content:center; }
          .hero-social-proof { justify-content:center; }
          .stats-grid { grid-template-columns:repeat(2,1fr); gap:16px; }
          .categories-grid { grid-template-columns:repeat(2,1fr); gap:12px; }
          .ai-feature-section { grid-template-columns:1fr; gap:32px; }
          .ai-feature-text { text-align:center; }
          .ai-feature-list { align-items:center; }
          .section-header { margin-bottom:32px; }
          .cta-banner { padding:60px 0; }
        }

        /* Mobile ≤640px */
        @media(max-width:640px) {
          .hero { padding:88px 0 40px; }
          .hero-text h1 { font-size:clamp(24px,8vw,36px); }
          .hero-text p  { font-size:14px; margin-bottom:20px; }
          .hero-badge { font-size:12px; padding:6px 12px; margin-bottom:14px; }
          .hero-ctas { flex-direction:column; align-items:stretch; gap:10px; }
          .hero-ctas .btn { width:100%; justify-content:center; }
          .hero-social-proof { font-size:13px; }
          .stats-section { padding:28px 0; }
          .stats-grid { grid-template-columns:repeat(2,1fr); gap:10px; }
          .stat-card { padding:16px 10px; }
          .stat-value { font-size:20px; }
          .stat-label { font-size:12px; }
          .categories-grid { grid-template-columns:repeat(2,1fr); gap:8px; }
          .category-card { padding:14px; }
          .cat-emoji { font-size:24px; margin-bottom:8px; }
          .cat-name  { font-size:13px; }
          .cat-desc  { font-size:12px; }
          .section-header { margin-bottom:20px; }
          .section-header-row { flex-direction:column; align-items:flex-start; gap:10px; margin-bottom:20px; }
          .section-header-row > a { align-self:flex-start; }
          .ai-feature-section { gap:20px; }
          .ai-feature-list li { font-size:13px; }
          .terminal-body { padding:12px; gap:10px; }
          .t-user,.t-ai { font-size:13px; padding:10px 12px; }
          .feature-card { flex-direction:column; gap:12px; }
          .feature-icon { width:48px; height:48px; }
          .t-text { font-size:14px; }
          .cta-banner { padding:40px 0; }
          .cta-actions { flex-direction:column; align-items:center; }
          .cta-actions .btn { width:100%; max-width:320px; justify-content:center; }
        }

        /* Small mobile ≤420px */
        @media(max-width:420px) {
          .hero { padding:80px 0 28px; }
          .hero-text h1 { font-size:clamp(20px,7vw,28px); }
          .categories-grid { grid-template-columns:1fr 1fr; gap:6px; }
          .category-card { padding:10px 8px; }
          .cat-emoji { font-size:20px; }
          .cat-name  { font-size:11px; }
          .cat-desc  { font-size:10px; }
          .cat-arrow { display:none; }
          .stats-grid { gap:6px; }
          .stat-card { padding:14px 6px; }
          .stat-value { font-size:18px; }
          .stat-label { font-size:11px; }
          .stat-icon svg { width:16px; height:16px; }
        }

        /* Ultra-narrow ≤320px (319px devices) */
        @media(max-width:320px) {
          .hero { padding:72px 0 24px; }
          .hero-text h1 { font-size:20px; line-height:1.2; }
          .hero-text p  { font-size:12px; margin-bottom:12px; }
          .hero-badge { font-size:10px; padding:4px 8px; gap:4px; margin-bottom:10px; }
          .hero-ctas .btn { font-size:11px; padding:10px 12px; letter-spacing:0.3px; }
          .hero-social-proof { font-size:11px; gap:6px; }
          .mini-avatar { width:22px; height:22px; font-size:8px; }
          .stats-section { padding:18px 0; }
          .stats-grid { gap:4px; }
          .stat-card { padding:10px 4px; }
          .stat-icon svg { width:14px; height:14px; }
          .stat-value { font-size:16px; }
          .stat-label { font-size:9px; margin-top:2px; }
          .section-header { margin-bottom:14px; }
          .categories-grid { gap:4px; }
          .category-card { padding:8px 6px; border-radius:8px; }
          .cat-emoji { font-size:16px; margin-bottom:4px; }
          .cat-name  { font-size:10px; margin-bottom:2px; }
          .cat-desc  { font-size:9px; }
          .ai-feature-section { gap:14px; }
          .ai-feature-list li { font-size:11px; gap:5px; }
          .terminal-body { padding:8px; gap:8px; }
          .t-user,.t-ai { font-size:11px; padding:7px 9px; border-radius:8px; }
          .t-dot { width:8px; height:8px; }
          .feature-card { gap:8px; }
          .feature-icon { width:36px; height:36px; border-radius:10px; }
          .feature-icon svg { width:16px; height:16px; }
          .t-text { font-size:12px; }
          .t-avatar { width:32px; height:32px; font-size:11px; }
          .cta-banner { padding:28px 0; }
          .cta-actions .btn { font-size:11px; padding:10px 12px; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
