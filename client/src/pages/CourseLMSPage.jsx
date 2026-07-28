import { useState, useEffect, useRef } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { getCourse } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, FileText, Download, PlayCircle, Loader, Presentation, Gamepad2, Link as LinkIcon, ExternalLink, Play, Lock, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';

// Single component to render a lesson in the feed
const ContentCard = ({ lesson, isAccessible }) => {
  if (!isAccessible) {
    return (
      <div id={`lesson-${lesson._id}`} style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.05)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <Lock size={20} />
        </div>
        <div>
          <h4 style={{ fontSize: 16, margin: '0 0 4px 0', color: 'var(--text-muted)' }}>{lesson.title}</h4>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Locked</span>
        </div>
      </div>
    );
  }

  const renderEmbed = () => {
    if (lesson.type === 'video') {
      let videoUrl = lesson.url;
      if (videoUrl.includes('youtube.com/watch?v=')) {
        videoUrl = videoUrl.replace('watch?v=', 'embed/');
      }
      return (
        <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 8, overflow: 'hidden', marginTop: 16 }}>
          <iframe src={videoUrl} width="100%" height="100%" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={lesson.title}></iframe>
        </div>
      );
    }
    if (lesson.type === 'pdf' || lesson.type === 'ppt') {
      const docUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(lesson.url)}&embedded=true`;
      return (
        <div style={{ width: '100%', height: 500, background: '#fff', borderRadius: 8, overflow: 'hidden', marginTop: 16, border: '1px solid var(--border)' }}>
          <iframe src={docUrl} width="100%" height="100%" frameBorder="0" title={lesson.title}></iframe>
        </div>
      );
    }
    return (
      <div style={{ marginTop: 16 }}>
        <a href={lesson.url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
          <ExternalLink size={16} style={{ marginRight: 8 }} /> Open {lesson.type} in new tab
        </a>
      </div>
    );
  };

  return (
    <div id={`lesson-${lesson._id}`} style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
      <h4 style={{ fontSize: 18, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>{lesson.title}</h4>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ textTransform: 'capitalize' }}>{lesson.type}</span>
        {lesson.duration && <span>• {lesson.duration} mins</span>}
      </div>
      {renderEmbed()}
    </div>
  );
};

const CourseLMSPage = () => {
  const { slug } = useParams();
  const { isEnrolled, user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State for LHS and RHS collapsing
  const [openSidebarSections, setOpenSidebarSections] = useState({});
  const [openContentSections, setOpenContentSections] = useState({});
  const [activeLessonId, setActiveLessonId] = useState(null);

  useEffect(() => {
    getCourse(slug)
      .then(res => {
        const data = res.data.course;
        setCourse(data);
        
        // Open all sections by default
        const allOpen = {};
        data.curriculum?.forEach((_, i) => allOpen[i] = true);
        setOpenSidebarSections(allOpen);
        setOpenContentSections(allOpen);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleSidebarSection = (i) => setOpenSidebarSections(prev => ({ ...prev, [i]: !prev[i] }));
  const toggleContentSection = (i) => setOpenContentSections(prev => ({ ...prev, [i]: !prev[i] }));
  
  const collapseAll = () => {
    setOpenContentSections({});
  };

  const scrollToLesson = (lessonId) => {
    setActiveLessonId(lessonId);
    const element = document.getElementById(`lesson-${lessonId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!course) return <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>Course not found</div>;

  const canAccess = user?.role === 'admin' || user?.role === 'tutor' || isEnrolled(course._id) || course.isFree;
  if (!canAccess) return <Navigate to={`/courses/${slug}`} />;

  return (
    <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: 'var(--text-primary)' }}>
      {/* Top Navbar Header */}
      <div className="lms-header-padding" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 32 }}>
        <h1 style={{ fontSize: 20, margin: 0, fontWeight: 700 }}>{course.title}</h1>
        <div style={{ display: 'flex', gap: 24, fontSize: 14, fontWeight: 500 }}>
          <Link to="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Dashboard</Link>
          <Link to={`/courses/${slug}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Course details</Link>
        </div>
      </div>

      <div className="lms-layout">
        
        {/* LEFT SIDEBAR (TOC) */}
        <div className="lms-sidebar custom-scrollbar" style={{ background: 'var(--bg-dark)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <BookOpen size={20} style={{ color: 'var(--text-secondary)' }} />
          </div>
          
          <div style={{ padding: '12px 0' }}>
            {course.curriculum?.map((section, si) => (
              <div key={si} style={{ marginBottom: 4 }}>
                <button 
                  onClick={() => toggleSidebarSection(si)} 
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontSize: 14 }}
                >
                  {openSidebarSections[si] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {section.title}
                </button>
                
                {openSidebarSections[si] && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 16px 8px 36px' }}>
                    {section.lessons?.map((lesson, li) => {
                      const isActive = activeLessonId === lesson._id;
                      return (
                        <button 
                          key={li} 
                          onClick={() => scrollToLesson(lesson._id)}
                          style={{ 
                            display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', 
                            background: isActive ? 'var(--primary-light)' : 'transparent',
                            color: isActive ? '#fff' : 'var(--text-secondary)',
                            borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
                            transition: 'all 0.2s'
                          }}
                          className={!isActive ? 'hover-bg' : ''}
                        >
                          {lesson.title}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT CONTENT AREA (Feed) */}
        <div className="lms-content-padding custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {course.curriculum?.map((section, si) => (
              <div key={si} style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
                {/* Section Header */}
                <div style={{ padding: '20px 24px', borderBottom: openContentSections[si] ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                  <button 
                    onClick={() => toggleContentSection(si)} 
                    style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, cursor: 'pointer', padding: 0 }}
                  >
                    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {openContentSections[si] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                    {section.title}
                  </button>
                  {si === 0 && (
                    <button onClick={collapseAll} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }} className="hover-lift">
                      Collapse all
                    </button>
                  )}
                </div>

                {/* Section Lessons */}
                {openContentSections[si] && (
                  <div>
                    {section.lessons?.map((lesson, li) => {
                      const isAccessible = lesson.isFree || canAccess;
                      return <ContentCard key={lesson._id} lesson={lesson} isAccessible={isAccessible} />;
                    })}
                  </div>
                )}
              </div>
            ))}

          </div>
        </div>

      </div>
      
      {/* Scrollbar styles for dark theme */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-dark); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
      `}} />
    </div>
  );
};

export default CourseLMSPage;
