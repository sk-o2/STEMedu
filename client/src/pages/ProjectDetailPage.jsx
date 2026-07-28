import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock, Cpu, Heart, Eye, Check, ChevronRight, ChevronLeft,
  BookOpen, Github, ExternalLink, Bookmark, ArrowLeft,
  Lightbulb, AlertTriangle, Code2, Image as ImageIcon, CheckCircle2
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getProject, toggleLike, toggleBookmark } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  'Robotics':              '#7c3aed',
  'Game Development':      '#06b6d4',
  'Drone Technology':      '#f59e0b',
  'IoT':                   '#10b981',
  'AI & Machine Learning': '#ec4899',
  'Electronics':           '#f97316',
  '3D Printing':           '#84cc16',
  'Coding':                '#3b82f6',
};

const ProjectDetailPage = () => {
  const { slug }  = useParams();
  const { user }  = useAuth();
  const contentRef = useRef(null);

  const [project,           setProject]           = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [activeStep,        setActiveStep]        = useState(0);
  const [liked,             setLiked]             = useState(false);
  const [bookmarked,        setBookmarked]        = useState(false);
  const [checkedComponents, setCheckedComponents] = useState({});
  const [copiedCode,        setCopiedCode]        = useState(false);

  useEffect(() => {
    setLoading(true);
    getProject(slug)
      .then(r => {
        setProject(r.data.project);
        setLiked(r.data.project.likes?.includes(user?._id));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleLike = async () => {
    if (!user) return toast.error('Please login to like projects');
    try {
      const { data } = await toggleLike(project._id);
      setLiked(data.liked);
      setProject(p => ({ ...p, likes: { length: data.totalLikes } }));
    } catch { toast.error('Failed to update like'); }
  };

  const handleBookmark = async () => {
    if (!user) return toast.error('Please login to bookmark');
    try {
      await toggleBookmark(project._id);
      setBookmarked(b => !b);
      toast.success(bookmarked ? 'Removed from bookmarks' : 'Bookmarked!');
    } catch { toast.error('Failed'); }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const toggleComponent = (i) =>
    setCheckedComponents(prev => ({ ...prev, [i]: !prev[i] }));

  const goToStep = (idx) => {
    setActiveStep(idx);
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="proj-detail-loading">
      <div className="spinner" />
    </div>
  );

  /* ── Not found ── */
  if (!project) return (
    <div className="proj-not-found">
      <Cpu size={52} />
      <h2>Project not found</h2>
      <p>This project may have been removed or the link is incorrect.</p>
      <Link to="/projects" className="btn btn-primary">← Back to Projects</Link>
    </div>
  );

  const color      = CATEGORY_COLORS[project.category] || '#7c3aed';
  const totalSteps = project.steps?.length || 0;
  const progress   = totalSteps > 0 ? Math.round(((activeStep + 1) / totalSteps) * 100) : 0;
  const checkedCount = Object.values(checkedComponents).filter(Boolean).length;
  const compTotal    = project.components?.length || 0;
  const compProgress = compTotal > 0 ? Math.round((checkedCount / compTotal) * 100) : 0;

  const step = project.steps?.[activeStep];

  return (
    <div className="proj-detail-page">

      {/* ── Hero Banner ── */}
      <div className="proj-hero" style={{ '--accent': color }}>
        <div className="proj-hero-bg" style={{ background: `radial-gradient(ellipse at 30% 50%, ${color}22 0%, transparent 65%)` }} />
        <div className="container proj-hero-inner">

          {/* Back link */}
          <Link to="/projects" className="proj-back-link">
            <ArrowLeft size={16} /> Back to Projects
          </Link>

          {/* Badges */}
          <div className="proj-hero-badges">
            <span className="proj-badge-cat" style={{ background: `${color}20`, color, borderColor: `${color}50` }}>
              {project.category}
            </span>
            <span className={`badge badge-${project.difficulty?.toLowerCase()}`}>{project.difficulty}</span>
            <span className={`badge ${project.isFree ? 'badge-free' : 'badge-paid'}`}>
              {project.isFree ? 'Free' : 'Premium'}
            </span>
          </div>

          <h1 className="proj-hero-title">{project.title}</h1>
          <p className="proj-hero-desc">{project.description}</p>

          {/* Meta strip */}
          <div className="proj-meta-strip">
            {project.estimatedTime && (
              <div className="proj-meta-item">
                <Clock size={15} />
                <span>{project.estimatedTime}</span>
              </div>
            )}
            <div className="proj-meta-item">
              <Cpu size={15} />
              <span>{compTotal} components</span>
            </div>
            <div className="proj-meta-item">
              <Eye size={15} />
              <span>{project.views || 0} views</span>
            </div>
            <div className="proj-meta-item">
              <BookOpen size={15} />
              <span>{totalSteps} steps</span>
            </div>
            <div className="proj-meta-item">
              <Heart size={15} />
              <span>{project.likes?.length || 0} likes</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="proj-hero-actions">
            <button
              onClick={handleLike}
              className={`proj-action-btn ${liked ? 'liked' : ''}`}
            >
              <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
              {liked ? 'Liked' : 'Like'}
            </button>
            <button
              onClick={handleBookmark}
              className={`proj-action-btn ${bookmarked ? 'bookmarked' : ''}`}
            >
              <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
              {bookmarked ? 'Saved' : 'Bookmark'}
            </button>
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noreferrer" className="proj-action-btn">
                <Github size={16} /> Source Code
              </a>
            )}
            {project.videoUrl && (
              <a href={project.videoUrl} target="_blank" rel="noreferrer" className="proj-action-btn primary">
                <ExternalLink size={16} /> Watch Video
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Body ── */}
      <div className="container proj-body-container">
        <div className="proj-layout">

          {/* ════ SIDEBAR ════ */}
          <aside className="proj-sidebar">

            {/* Overall progress */}
            <div className="card proj-sidebar-card">
              <div className="sidebar-card-title">Your Progress</div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="progress-label">{progress}%</span>
              </div>
              <p className="progress-sub">Step {activeStep + 1} of {totalSteps}</p>
            </div>

            {/* Components checklist */}
            {compTotal > 0 && (
              <div className="card proj-sidebar-card">
                <div className="sidebar-card-title">
                  <Cpu size={14} /> Components Needed
                  <span className="comp-count-badge">{checkedCount}/{compTotal}</span>
                </div>

                {/* Component progress bar */}
                <div className="comp-prog-track">
                  <div className="comp-prog-fill" style={{ width: `${compProgress}%` }} />
                </div>

                <div className="comp-list">
                  {project.components.map((comp, i) => (
                    <label key={i} className={`comp-item ${checkedComponents[i] ? 'checked' : ''}`}>
                      <div className="comp-checkbox">
                        <input
                          type="checkbox"
                          checked={!!checkedComponents[i]}
                          onChange={() => toggleComponent(i)}
                        />
                        <div className="comp-check-ui">
                          {checkedComponents[i] && <Check size={10} />}
                        </div>
                      </div>
                      <span className="comp-name">
                        {comp.quantity > 1 ? <strong>{comp.quantity}×&nbsp;</strong> : ''}
                        {comp.name}
                        {comp.optional && <em className="comp-optional">optional</em>}
                      </span>
                    </label>
                  ))}
                </div>

                {checkedCount === compTotal && compTotal > 0 && (
                  <div className="comp-ready-banner">
                    <CheckCircle2 size={15} /> All components ready!
                  </div>
                )}
              </div>
            )}

            {/* Steps nav */}
            {totalSteps > 0 && (
              <div className="card proj-sidebar-card">
                <div className="sidebar-card-title">Steps</div>
                <div className="steps-nav">
                  {project.steps.map((s, i) => (
                    <button
                      key={i}
                      className={`step-nav-btn ${i === activeStep ? 'active' : ''} ${i < activeStep ? 'done' : ''}`}
                      onClick={() => goToStep(i)}
                    >
                      <div className="step-nav-dot">
                        {i < activeStep ? <Check size={10} /> : i + 1}
                      </div>
                      <span className="step-nav-label">{s.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* ════ STEP CONTENT ════ */}
          <main className="proj-content" ref={contentRef}>
            {!step ? (
              <div className="no-steps">
                <BookOpen size={44} />
                <h3>No steps available yet</h3>
                <p>Check back soon — the guide for this project is being prepared.</p>
              </div>
            ) : (
              <div className="step-panel" key={activeStep}>

                {/* Step header */}
                <div className="step-header">
                  <div className="step-num-badge">{step.stepNumber || activeStep + 1}</div>
                  <div className="step-header-text">
                    <div className="step-progress-label">
                      Step {activeStep + 1} of {totalSteps}
                    </div>
                    <h2 className="step-title">{step.title}</h2>
                  </div>
                </div>

                {/* Step description */}
                <div className="step-desc">{step.description}</div>

                {/* Images */}
                {step.images?.length > 0 && (
                  <div className="step-images">
                    <div className="step-section-label"><ImageIcon size={14} /> Images</div>
                    <div className={`step-img-grid ${step.images.length === 1 ? 'single' : ''}`}>
                      {step.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt={`Step ${step.stepNumber} — image ${i + 1}`}
                          loading="lazy"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Code snippet */}
                {step.codeSnippet && (
                  <div className="step-code-wrap">
                    <div className="step-code-header">
                      <span className="step-section-label" style={{ marginBottom: 0 }}>
                        <Code2 size={14} /> {step.codeLanguage || 'Code'}
                      </span>
                      <button
                        className={`copy-btn ${copiedCode ? 'copied' : ''}`}
                        onClick={() => handleCopyCode(step.codeSnippet)}
                      >
                        {copiedCode ? <><Check size={13} /> Copied!</> : 'Copy'}
                      </button>
                    </div>
                    <SyntaxHighlighter
                      language={step.codeLanguage || 'cpp'}
                      style={vscDarkPlus}
                      customStyle={{
                        borderRadius: '0 0 10px 10px',
                        margin: 0,
                        border: '1px solid rgba(124,58,237,0.25)',
                        borderTop: 'none',
                        fontSize: 13.5,
                        lineHeight: 1.65,
                      }}
                    >
                      {step.codeSnippet}
                    </SyntaxHighlighter>
                  </div>
                )}

                {/* Tip */}
                {step.tip && (
                  <div className="step-callout tip">
                    <Lightbulb size={16} className="callout-icon" />
                    <div>
                      <strong>Tip</strong>
                      <p>{step.tip}</p>
                    </div>
                  </div>
                )}

                {/* Warning */}
                {step.warning && (
                  <div className="step-callout warning">
                    <AlertTriangle size={16} className="callout-icon" />
                    <div>
                      <strong>Warning</strong>
                      <p>{step.warning}</p>
                    </div>
                  </div>
                )}

                {/* Prev / Next navigation */}
                <div className="step-nav-footer">
                  <button
                    className="btn btn-secondary step-nav-prev"
                    disabled={activeStep === 0}
                    onClick={() => goToStep(activeStep - 1)}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>

                  {activeStep < totalSteps - 1 ? (
                    <button
                      className="btn btn-primary step-nav-next"
                      onClick={() => goToStep(activeStep + 1)}
                    >
                      Next Step <ChevronRight size={16} />
                    </button>
                  ) : (
                    <div className="step-complete-badge">
                      <CheckCircle2 size={18} /> Project Complete! 🎉
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Loading / Not-found ── */
        .proj-detail-loading {
          min-height: 80vh;
          display: flex; align-items: center; justify-content: center;
        }
        .proj-not-found {
          min-height: 70vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 12px; text-align: center; padding: 40px 24px;
          color: var(--text-muted);
        }
        .proj-not-found h2 { font-size: 24px; color: var(--text-primary); }
        .proj-not-found p  { max-width: 340px; line-height: 1.6; }

        /* ── Hero ── */
        .proj-hero {
          position: relative;
          padding: 56px 0 48px;
          border-bottom: 1px solid var(--border);
          overflow: hidden;
        }
        .proj-hero-bg {
          position: absolute; inset: 0; pointer-events: none;
        }
        .proj-hero-inner {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; gap: 16px;
        }

        .proj-back-link {
          display: inline-flex; align-items: center; gap: 6px;
          color: var(--text-muted); font-size: 13px; font-weight: 500;
          transition: color 0.2s;
          width: fit-content;
        }
        .proj-back-link:hover { color: var(--primary); }

        .proj-hero-badges {
          display: flex; gap: 8px; flex-wrap: wrap;
        }
        .proj-badge-cat {
          display: inline-flex; align-items: center;
          padding: 4px 12px; border-radius: 4px;
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.6px;
          border: 1px solid;
        }

        .proj-hero-title {
          font-size: clamp(24px, 4vw, 44px);
          line-height: 1.15;
          letter-spacing: -0.5px;
          max-width: 780px;
        }
        .proj-hero-desc {
          font-size: clamp(14px, 1.8vw, 17px);
          color: var(--text-secondary);
          max-width: 680px;
          line-height: 1.75;
        }

        /* meta strip */
        .proj-meta-strip {
          display: flex; gap: 20px; flex-wrap: wrap;
          font-size: 13px; color: var(--text-muted);
        }
        .proj-meta-item {
          display: flex; align-items: center; gap: 6px;
        }

        /* action buttons */
        .proj-hero-actions {
          display: flex; gap: 10px; flex-wrap: wrap;
          margin-top: 4px;
        }
        .proj-action-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 18px;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.03);
          color: var(--text-secondary);
          font-size: 13px; font-weight: 600;
          cursor: pointer; transition: var(--transition);
          text-decoration: none;
        }
        .proj-action-btn:hover {
          border-color: rgba(0,240,255,0.4);
          color: var(--primary);
          background: rgba(0,240,255,0.06);
        }
        .proj-action-btn.liked {
          border-color: rgba(255,0,60,0.5);
          color: var(--danger);
          background: rgba(255,0,60,0.08);
        }
        .proj-action-btn.bookmarked {
          border-color: rgba(245,158,11,0.5);
          color: #f59e0b;
          background: rgba(245,158,11,0.08);
        }
        .proj-action-btn.primary {
          border-color: var(--primary);
          color: var(--primary);
          background: rgba(0,240,255,0.08);
          box-shadow: 0 0 12px rgba(0,240,255,0.12);
        }
        .proj-action-btn.primary:hover {
          background: rgba(0,240,255,0.16);
        }

        /* ── Layout ── */
        .proj-body-container { padding-top: 36px; padding-bottom: 60px; }
        .proj-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 28px;
          align-items: start;
        }

        /* ── Sidebar ── */
        .proj-sidebar {
          position: sticky; top: 88px;
          display: flex; flex-direction: column; gap: 16px;
        }
        .proj-sidebar-card {
          padding: 18px !important;
        }
        .sidebar-card-title {
          display: flex; align-items: center; gap: 7px;
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 1px;
          color: var(--text-muted);
          margin-bottom: 14px;
        }

        /* progress bar */
        .progress-bar-wrap {
          display: flex; align-items: center; gap: 10px; margin-bottom: 6px;
        }
        .progress-bar-track {
          flex: 1; height: 7px;
          background: rgba(255,255,255,0.06);
          border-radius: 100px; overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: var(--gradient-primary);
          border-radius: 100px;
          transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
        }
        .progress-label {
          font-size: 13px; font-weight: 700; color: var(--primary); min-width: 36px;
          text-align: right;
        }
        .progress-sub { font-size: 12px; color: var(--text-muted); }

        /* component checklist */
        .comp-count-badge {
          margin-left: auto;
          background: rgba(0,240,255,0.1);
          color: var(--primary);
          border: 1px solid rgba(0,240,255,0.25);
          border-radius: 100px;
          padding: 1px 8px;
          font-size: 10px; font-weight: 700;
        }
        .comp-prog-track {
          height: 4px; background: rgba(255,255,255,0.05);
          border-radius: 100px; overflow: hidden; margin-bottom: 12px;
        }
        .comp-prog-fill {
          height: 100%;
          background: var(--gradient-primary);
          border-radius: 100px;
          transition: width 0.4s;
        }
        .comp-list { display: flex; flex-direction: column; gap: 8px; }
        .comp-item {
          display: flex; align-items: flex-start; gap: 10px;
          cursor: pointer; padding: 6px 8px; border-radius: 8px;
          transition: background 0.15s;
        }
        .comp-item:hover { background: rgba(255,255,255,0.04); }
        .comp-item.checked .comp-name { color: var(--success); text-decoration: line-through; opacity: 0.75; }

        .comp-checkbox { position: relative; flex-shrink: 0; }
        .comp-checkbox input { position: absolute; opacity: 0; width: 0; height: 0; }
        .comp-check-ui {
          width: 18px; height: 18px; border-radius: 5px;
          border: 1.5px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
          color: #fff;
        }
        .comp-item.checked .comp-check-ui {
          background: var(--success);
          border-color: var(--success);
          box-shadow: 0 0 8px rgba(0,255,136,0.4);
        }

        .comp-name { font-size: 13px; color: var(--text-secondary); line-height: 1.4; }
        .comp-optional {
          display: inline-block; margin-left: 6px;
          font-size: 10px; color: var(--text-muted);
          font-style: normal;
          background: rgba(255,255,255,0.06); border-radius: 3px; padding: 1px 5px;
        }
        .comp-ready-banner {
          display: flex; align-items: center; gap: 7px;
          margin-top: 12px; padding: 9px 12px;
          background: rgba(0,255,136,0.1);
          border: 1px solid rgba(0,255,136,0.3);
          border-radius: 8px;
          font-size: 12px; font-weight: 600; color: var(--success);
        }

        /* steps navigation */
        .steps-nav { display: flex; flex-direction: column; gap: 3px; }
        .step-nav-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 8px;
          background: none; border: none;
          color: var(--text-muted);
          font-size: 12px; font-weight: 500;
          text-align: left; cursor: pointer; transition: var(--transition);
          width: 100%;
        }
        .step-nav-btn:hover { background: rgba(255,255,255,0.04); color: var(--text-secondary); }
        .step-nav-btn.active {
          background: rgba(124,58,237,0.18);
          color: var(--primary-light);
          font-weight: 700;
        }
        .step-nav-btn.done { color: var(--success); }

        .step-nav-dot {
          width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700;
          background: var(--bg-elevated);
          border: 1.5px solid var(--border);
          transition: all 0.2s;
        }
        .step-nav-btn.active .step-nav-dot {
          background: var(--gradient-primary);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 0 10px rgba(0,240,255,0.35);
        }
        .step-nav-btn.done .step-nav-dot {
          background: rgba(0,255,136,0.2);
          border-color: var(--success);
          color: var(--success);
        }
        .step-nav-label { flex: 1; line-height: 1.35; }

        /* ── Step Content ── */
        .proj-content { min-width: 0; }

        .no-steps {
          text-align: center; padding: 80px 24px;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          color: var(--text-muted);
        }
        .no-steps h3 { font-size: 20px; color: var(--text-secondary); }

        .step-panel {
          animation: fadeSlideIn 0.35s ease;
        }

        /* step header */
        .step-header {
          display: flex; gap: 16px; align-items: flex-start;
          margin-bottom: 24px;
        }
        .step-num-badge {
          width: 48px; height: 48px; flex-shrink: 0;
          border-radius: var(--radius);
          background: rgba(0,240,255,0.1);
          border: 1px solid rgba(0,240,255,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 800; color: var(--primary);
          box-shadow: 0 0 16px rgba(0,240,255,0.12) inset;
        }
        .step-header-text { padding-top: 2px; }
        .step-progress-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1px; color: var(--text-muted); margin-bottom: 5px;
        }
        .step-title {
          font-size: clamp(20px, 2.5vw, 30px);
          line-height: 1.2; letter-spacing: -0.3px;
        }

        /* step description */
        .step-desc {
          font-size: 15px; line-height: 1.85;
          color: var(--text-secondary);
          margin-bottom: 28px;
          white-space: pre-wrap;
        }

        /* section label */
        .step-section-label {
          display: flex; align-items: center; gap: 7px;
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 1px;
          color: var(--text-muted); margin-bottom: 10px;
        }

        /* images */
        .step-images { margin-bottom: 28px; }
        .step-img-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 14px;
        }
        .step-img-grid.single { grid-template-columns: 1fr; max-width: 600px; }
        .step-img-grid img {
          width: 100%; border-radius: 10px;
          border: 1px solid var(--border);
          transition: transform 0.3s;
          cursor: zoom-in;
        }
        .step-img-grid img:hover { transform: scale(1.02); }

        /* code */
        .step-code-wrap { margin-bottom: 28px; }
        .step-code-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 16px;
          background: #0d0d1f;
          border: 1px solid rgba(124,58,237,0.25);
          border-bottom: none;
          border-radius: 10px 10px 0 0;
        }
        .copy-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 4px 12px; border-radius: var(--radius);
          background: rgba(255,255,255,0.06);
          border: 1px solid var(--border);
          color: var(--text-muted);
          font-size: 11px; font-weight: 600;
          cursor: pointer; transition: var(--transition);
        }
        .copy-btn:hover { color: var(--primary); border-color: var(--primary); }
        .copy-btn.copied { color: var(--success); border-color: var(--success); background: rgba(0,255,136,0.08); }

        /* callouts */
        .step-callout {
          display: flex; gap: 12px; align-items: flex-start;
          padding: 14px 18px; border-radius: 10px; margin-bottom: 20px;
        }
        .step-callout.tip {
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.3);
          color: var(--success);
        }
        .step-callout.warning {
          background: rgba(245,158,11,0.1);
          border: 1px solid rgba(245,158,11,0.3);
          color: #f59e0b;
        }
        .step-callout .callout-icon { flex-shrink: 0; margin-top: 2px; }
        .step-callout strong { display: block; font-size: 13px; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
        .step-callout p { font-size: 14px; line-height: 1.6; margin: 0; opacity: 0.9; color: inherit; }

        /* prev / next */
        .step-nav-footer {
          display: flex; gap: 12px; align-items: center;
          margin-top: 36px; padding-top: 24px;
          border-top: 1px solid var(--border);
          flex-wrap: wrap;
        }
        .step-nav-prev { gap: 6px; }
        .step-nav-next { gap: 6px; margin-left: auto; }
        .step-complete-badge {
          display: flex; align-items: center; gap: 8px;
          margin-left: auto;
          padding: 12px 22px;
          border-radius: var(--radius);
          background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2));
          border: 1px solid rgba(16,185,129,0.4);
          color: var(--success);
          font-size: 15px; font-weight: 700;
          box-shadow: 0 0 20px rgba(16,185,129,0.15);
        }

        /* ── Responsive ── */
        @media(max-width: 960px) {
          .proj-layout {
            grid-template-columns: 1fr;
          }
          .proj-sidebar {
            position: static;
            /* collapse to horizontal scroll on tablet */
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 14px;
          }
        }
        @media(max-width: 640px) {
          .proj-hero { padding: 48px 0 36px; }
          .proj-hero-actions { gap: 8px; }
          .proj-action-btn { padding: 8px 14px; font-size: 12px; }
          .proj-meta-strip { gap: 12px; font-size: 12px; }
          .proj-sidebar {
            grid-template-columns: 1fr;
          }
          .step-num-badge { width: 40px; height: 40px; font-size: 17px; }
          .step-img-grid { grid-template-columns: 1fr; }
          .step-nav-footer { gap: 8px; }
          .step-nav-next { margin-left: 0; width: 100%; justify-content: center; }
          .step-complete-badge { margin-left: 0; width: 100%; justify-content: center; }
          .step-nav-prev { width: 100%; justify-content: center; }
        }
        @media(max-width: 420px) {
          .proj-hero-title { font-size: 22px; }
          .proj-hero-desc  { font-size: 14px; }
          .step-title { font-size: 19px; }
          .step-desc  { font-size: 14px; }
        }
      `}</style>
    </div>
  );
};

export default ProjectDetailPage;
