import { Link } from 'react-router-dom';
import { Star, Users, BookOpen, Lock, ArrowRight } from 'lucide-react';

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

const CourseCard = ({ course }) => {
  const color = CATEGORY_COLORS[course.category] || '#7c3aed';

  return (
    <Link to={`/courses/${course.slug}`} className="course-card card">

      {/* Thumbnail */}
      <div className="course-thumb">
        {course.thumbnail
          ? <img src={course.thumbnail} alt={course.title} loading="lazy" />
          : (
            <div className="thumb-placeholder" style={{ background: `linear-gradient(135deg, ${color}28, ${color}0d)` }}>
              <BookOpen size={44} style={{ color }} />
            </div>
          )
        }

        {/* Top-left: category badge */}
        <div className="thumb-top-left">
          <span className="cat-badge" style={{ background: `${color}28`, color, borderColor: `${color}55` }}>
            {course.category}
          </span>
        </div>

        {/* Top-right: lock */}
        {!course.isFree && (
          <div className="lock-icon">
            <Lock size={13} />
          </div>
        )}

        {/* Hover overlay */}
        <div className="thumb-hover-overlay">
          <span className="view-cta">View Course <ArrowRight size={15} /></span>
        </div>
      </div>

      {/* Body */}
      <div className="course-body">

        {/* Price + Level */}
        <div className="course-meta-top">
          <span className={`badge ${course.isFree ? 'badge-free' : 'badge-paid'}`}>
            {course.isFree ? 'Free' : `₹${course.discountPrice || course.price}`}
          </span>
          {course.level && (
            <span className={`badge badge-${course.level.toLowerCase()}`}>{course.level}</span>
          )}
        </div>

        {/* Title */}
        <h3 className="course-title">{course.title}</h3>

        {/* Description */}
        <p className="course-desc">
          {course.shortDescription || course.description?.slice(0, 90)}{course.description?.length > 90 ? '…' : ''}
        </p>

        {/* Instructor */}
        {course.instructor && (
          <div className="course-instructor">
            <img
              src={
                course.instructor.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor.name)}&background=7c3aed&color=fff&size=28`
              }
              alt={course.instructor.name}
            />
            <span>{course.instructor.name}</span>
          </div>
        )}

        {/* Stats row */}
        <div className="course-stats">
          <span><Star size={13} fill="#f59e0b" stroke="none" /> {course.rating || '4.8'}</span>
          <span><Users size={13} /> {course.studentsEnrolled?.length || 0} students</span>
          {course.totalLessons > 0 && (
            <span><BookOpen size={13} /> {course.totalLessons} lessons</span>
          )}
        </div>

        {/* CTA */}
        <div className="course-cta">
          <span className="course-cta-btn" style={{ '--c': color }}>
            {course.isFree ? 'Start Free' : 'Enroll Now'}
            <ArrowRight size={14} />
          </span>
        </div>
      </div>

      <style>{`
        /* ── Card shell ── */
        .course-card {
          padding: 0;
          cursor: pointer;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
        }
        .course-card:hover {
          transform: translateY(-4px);
          border-color: rgba(0,240,255,0.35);
          box-shadow: 0 16px 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,240,255,0.08);
        }

        /* ── Thumbnail ── */
        .course-thumb {
          position: relative;
          height: 185px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .course-thumb img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.45s;
          display: block;
        }
        .course-card:hover .course-thumb img { transform: scale(1.06); }

        .thumb-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
        }

        /* badges */
        .thumb-top-left { position: absolute; top: 10px; left: 10px; }
        .cat-badge {
          display: inline-flex; align-items: center;
          padding: 3px 10px;
          border-radius: 4px;
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.5px;
          border: 1px solid;
          backdrop-filter: blur(8px);
        }
        .lock-icon {
          position: absolute; top: 10px; right: 10px;
          background: rgba(0,0,0,0.65);
          color: #fff;
          width: 26px; height: 26px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(4px);
        }

        /* hover overlay */
        .thumb-hover-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          opacity: 0;
          transition: opacity 0.3s;
          backdrop-filter: blur(2px);
        }
        .course-card:hover .thumb-hover-overlay { opacity: 1; }
        .view-cta {
          display: flex; align-items: center; gap: 6px;
          color: #fff; font-size: 14px; font-weight: 700;
          letter-spacing: 0.3px;
          padding: 10px 20px;
          border: 1.5px solid rgba(255,255,255,0.6);
          border-radius: 100px;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(4px);
        }

        /* ── Body ── */
        .course-body {
          padding: 16px 18px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }
        .course-meta-top { display: flex; gap: 8px; flex-wrap: wrap; }

        .course-title {
          font-size: 15px; font-weight: 700;
          line-height: 1.4;
          color: var(--text-primary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .course-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
        }

        .course-instructor { display: flex; align-items: center; gap: 8px; }
        .course-instructor img { width: 22px; height: 22px; border-radius: 50%; object-fit: cover; }
        .course-instructor span { font-size: 12px; color: var(--text-muted); }

        .course-stats {
          display: flex; gap: 12px;
          font-size: 12px; color: var(--text-muted);
          flex-wrap: wrap;
          padding-top: 4px;
          border-top: 1px solid var(--border);
        }
        .course-stats span { display: flex; align-items: center; gap: 4px; }

        /* ── CTA strip ── */
        .course-cta { margin-top: auto; }
        .course-cta-btn {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          width: 100%;
          padding: 10px;
          border-radius: var(--radius);
          background: rgba(0,240,255,0.06);
          border: 1px solid rgba(0,240,255,0.2);
          color: var(--primary);
          font-size: 13px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.8px;
          transition: var(--transition);
        }
        .course-card:hover .course-cta-btn {
          background: rgba(0,240,255,0.13);
          border-color: var(--primary);
          box-shadow: 0 0 14px rgba(0,240,255,0.18);
        }
      `}</style>
    </Link>
  );
};

export default CourseCard;
