import { useAuth } from '../context/AuthContext';
import { BookOpen, Cpu, ArrowRight, Zap, Bot, Star, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import StudentMentoringSection from '../components/StudentMentoringSection';

const StudentDashboard = () => {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Student';

  const stats = [
    {
      label: 'Enrolled Courses',
      value: user?.enrolledCourses?.length || 0,
      icon: <BookOpen size={22} />,
      color: '#7c3aed',
      bg: 'rgba(124,58,237,0.12)',
      link: '/courses',
      linkLabel: 'Browse more',
    },
    {
      label: 'Saved Projects',
      value: user?.bookmarkedProjects?.length || 0,
      icon: <Cpu size={22} />,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
      link: '/projects',
      linkLabel: 'Explore projects',
    },
    {
      label: 'AI Sessions',
      value: '∞',
      icon: <Bot size={22} />,
      color: '#06b6d4',
      bg: 'rgba(6,182,212,0.12)',
      link: '/ai-assistant',
      linkLabel: 'Try AI Assistant',
    },
  ];

  return (
    <div className="sd-page">
      <div className="container sd-container">

        {/* ── Welcome Banner ── */}
        <div className="sd-welcome-banner">
          <div className="sd-welcome-left">
            <div className="sd-avatar-wrap">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=7c3aed&color=fff&size=96`}
                alt={user?.name}
                className="sd-avatar"
              />
              <div className="sd-avatar-ring" />
            </div>
            <div className="sd-welcome-text">
              <div className="sd-greeting">Welcome back 👋</div>
              <h1 className="sd-name">{firstName}!</h1>
              <p className="sd-tagline">Ready to continue your STEM journey?</p>
            </div>
          </div>
          <Link to="/ai-assistant" className="sd-ai-cta">
            <Bot size={18} />
            Try AI Project Assistant
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* ── Stats ── */}
        <div className="sd-stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="sd-stat-card card">
              <div className="sd-stat-icon" style={{ color: s.color, background: s.bg }}>
                {s.icon}
              </div>
              <div className="sd-stat-body">
                <div className="sd-stat-value">{s.value}</div>
                <div className="sd-stat-label">{s.label}</div>
              </div>
              <Link to={s.link} className="sd-stat-link" style={{ color: s.color }}>
                {s.linkLabel} <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>

        {/* ── My Learning Path ── */}
        <div className="sd-section">
          <div className="sd-section-header">
            <h2 className="sd-section-title">
              <BookOpen size={18} /> My Learning Path
            </h2>
            <Link to="/courses" className="btn btn-secondary btn-sm">
              Browse All <ArrowRight size={14} />
            </Link>
          </div>

          {!user?.enrolledCourses?.length ? (
            <div className="sd-empty-card card">
              <div className="sd-empty-icon"><BookOpen size={40} /></div>
              <h3>No courses enrolled yet</h3>
              <p>Explore our catalog and start your STEM journey today.</p>
              <Link to="/courses" className="btn btn-primary">
                <Zap size={16} /> Browse Courses
              </Link>
            </div>
          ) : (
            <div className="grid-3">
              {user.enrolledCourses.map(c =>
                c && typeof c === 'object' ? <CourseCard key={c._id} course={c} /> : null
              )}
            </div>
          )}
        </div>

        {/* ── Saved Projects ── */}
        {user?.bookmarkedProjects?.length > 0 && (
          <div className="sd-section">
            <div className="sd-section-header">
              <h2 className="sd-section-title">
                <Star size={18} /> Saved Projects
              </h2>
              <Link to="/projects" className="btn btn-secondary btn-sm">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="sd-projects-grid">
              {user.bookmarkedProjects.map(p => (
                <Link key={p._id} to={`/projects/${p.slug}`} className="sd-project-item card">
                  {p.thumbnail
                    ? <img src={p.thumbnail} alt={p.title} className="sd-proj-thumb" />
                    : (
                      <div className="sd-proj-thumb sd-proj-thumb-placeholder">
                        <Cpu size={22} />
                      </div>
                    )
                  }
                  <div className="sd-proj-info">
                    <div className="sd-proj-title">{p.title}</div>
                    <div className="sd-proj-category">{p.category}</div>
                  </div>
                  <ArrowRight size={15} className="sd-proj-arrow" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick Links ── */}
        <div className="sd-section">
          <h2 className="sd-section-title" style={{ marginBottom: 16 }}>
            <Zap size={18} /> Quick Actions
          </h2>
          <div className="sd-quick-links">
            {[
              { to: '/ai-assistant',    icon: <Bot size={20} />,   label: 'AI Assistant',      color: '#7c3aed', desc: 'Discover projects from your components' },
              { to: '/projects',         icon: <Cpu size={20} />,   label: 'Project Library',   color: '#06b6d4', desc: 'Step-by-step STEM project guides' },
              { to: '/courses',          icon: <BookOpen size={20} />, label: 'All Courses',    color: '#10b981', desc: 'Expert-led STEM courses' },
              { to: '/book-mentoring',   icon: <Video size={20} />, label: '1-on-1 Mentoring',  color: '#6366f1', desc: 'Personal sessions with expert tutors' },
            ].map((q, i) => (
              <Link key={i} to={q.to} className="sd-quick-card card" style={{ '--qc': q.color }}>
                <div className="sd-quick-icon" style={{ color: q.color, background: `${q.color}18` }}>{q.icon}</div>
                <div>
                  <div className="sd-quick-label">{q.label}</div>
                  <div className="sd-quick-desc">{q.desc}</div>
                </div>
                <ArrowRight size={16} className="sd-quick-arrow" style={{ color: q.color }} />
              </Link>
            ))}
          </div>
        </div>

        {/* ── 1-on-1 Mentoring ── */}
        <div className="sd-section">
          <StudentMentoringSection />
        </div>

      </div>

      <style>{`
        .sd-page { min-height: 100vh; padding-bottom: 60px; }
        .sd-container { padding-top: 40px; }

        /* ── Welcome Banner ── */
        .sd-welcome-banner {
          display: flex; align-items: center; justify-content: space-between;
          gap: 24px; flex-wrap: wrap;
          background: var(--gradient-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 28px 32px;
          margin-bottom: 28px;
          position: relative; overflow: hidden;
        }
        .sd-welcome-banner::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 0% 50%, rgba(124,58,237,0.12), transparent 60%);
          pointer-events: none;
        }
        .sd-welcome-left { display: flex; align-items: center; gap: 20px; position: relative; }
        .sd-avatar-wrap { position: relative; flex-shrink: 0; }
        .sd-avatar {
          width: 72px; height: 72px; border-radius: 50%;
          object-fit: cover; display: block;
          border: 2px solid rgba(124,58,237,0.5);
        }
        .sd-avatar-ring {
          position: absolute; inset: -4px; border-radius: 50%;
          border: 1.5px solid rgba(124,58,237,0.25);
          animation: ring-pulse 3s ease-in-out infinite;
        }
        @keyframes ring-pulse { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }

        .sd-greeting { font-size: 13px; color: var(--text-muted); font-weight: 600; letter-spacing: 0.3px; margin-bottom: 2px; }
        .sd-name { font-size: clamp(22px,3vw,32px); font-weight: 800; margin-bottom: 4px; letter-spacing: -0.5px; }
        .sd-tagline { font-size: 14px; color: var(--text-secondary); }

        .sd-ai-cta {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 22px; border-radius: var(--radius);
          background: rgba(124,58,237,0.15);
          border: 1px solid rgba(124,58,237,0.4);
          color: var(--primary-light);
          font-size: 14px; font-weight: 700;
          white-space: nowrap; transition: var(--transition);
          text-decoration: none; position: relative;
        }
        .sd-ai-cta:hover { background: rgba(124,58,237,0.25); box-shadow: 0 0 20px rgba(124,58,237,0.25); }

        /* ── Stats ── */
        .sd-stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 36px; }
        .sd-stat-card {
          display: flex; align-items: center; gap: 16px;
          padding: 20px; position: relative; overflow: hidden;
        }
        .sd-stat-icon {
          width: 50px; height: 50px; border-radius: 14px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .sd-stat-body { flex: 1; }
        .sd-stat-value { font-size: 28px; font-weight: 800; font-family: 'Space Grotesk',sans-serif; line-height: 1; margin-bottom: 4px; }
        .sd-stat-label { font-size: 13px; color: var(--text-muted); }
        .sd-stat-link {
          display: flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 600; white-space: nowrap;
          opacity: 0.8; transition: opacity 0.2s; text-decoration: none;
        }
        .sd-stat-link:hover { opacity: 1; }

        /* ── Sections ── */
        .sd-section { margin-bottom: 40px; }
        .sd-section-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px; flex-wrap: wrap; gap: 10px;
        }
        .sd-section-title {
          display: flex; align-items: center; gap: 9px;
          font-size: 20px; font-weight: 700;
        }

        /* ── Empty card ── */
        .sd-empty-card {
          text-align: center; padding: 52px 24px;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
        }
        .sd-empty-icon {
          width: 80px; height: 80px; border-radius: 50%;
          background: rgba(0,240,255,0.06); border: 1px solid rgba(0,240,255,0.15);
          display: flex; align-items: center; justify-content: center;
          color: var(--primary); margin-bottom: 4px;
        }
        .sd-empty-card h3 { font-size: 18px; }
        .sd-empty-card p  { font-size: 14px; color: var(--text-muted); max-width: 280px; line-height: 1.6; }

        /* ── Saved projects ── */
        .sd-projects-grid { display: flex; flex-direction: column; gap: 10px; }
        .sd-project-item {
          display: flex; align-items: center; gap: 14px; padding: 14px 16px;
          text-decoration: none; transition: border-color 0.2s, transform 0.2s;
        }
        .sd-project-item:hover { border-color: rgba(0,240,255,0.3); transform: translateX(3px); }
        .sd-proj-thumb {
          width: 56px; height: 56px; border-radius: 10px;
          object-fit: cover; flex-shrink: 0;
        }
        .sd-proj-thumb-placeholder {
          background: rgba(124,58,237,0.1); color: var(--primary-light);
          display: flex; align-items: center; justify-content: center;
        }
        .sd-proj-info { flex: 1; min-width: 0; }
        .sd-proj-title    { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px; }
        .sd-proj-category { font-size: 12px; color: var(--text-muted); }
        .sd-proj-arrow    { color: var(--text-muted); flex-shrink: 0; transition: transform 0.2s; }
        .sd-project-item:hover .sd-proj-arrow { transform: translateX(3px); color: var(--primary); }

        /* ── Quick links ── */
        .sd-quick-links { display: flex; flex-direction: column; gap: 10px; }
        .sd-quick-card {
          display: flex; align-items: center; gap: 16px; padding: 18px 20px;
          text-decoration: none; transition: border-color 0.25s, transform 0.2s;
        }
        .sd-quick-card:hover { border-color: var(--qc,rgba(0,240,255,0.35)); transform: translateX(4px); }
        .sd-quick-icon {
          width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .sd-quick-label { font-size: 15px; font-weight: 700; margin-bottom: 2px; color: var(--text-primary); }
        .sd-quick-desc  { font-size: 12px; color: var(--text-muted); }
        .sd-quick-arrow { margin-left: auto; flex-shrink: 0; transition: transform 0.2s; }
        .sd-quick-card:hover .sd-quick-arrow { transform: translateX(4px); }

        /* ── Responsive ── */
        @media(max-width: 768px) {
          .sd-stats-grid { grid-template-columns: 1fr; }
          .sd-welcome-banner { padding: 20px; }
          .sd-ai-cta { width: 100%; justify-content: center; }
        }
        @media(max-width: 540px) {
          .sd-stat-card { padding: 16px; }
          .sd-stat-value { font-size: 24px; }
          .sd-welcome-left { gap: 14px; }
          .sd-avatar { width: 56px; height: 56px; }
          .sd-name { font-size: 20px; }
        }
        @media(max-width: 420px) {
          .sd-stats-grid { gap: 10px; }
          .sd-section-title { font-size: 17px; }
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
