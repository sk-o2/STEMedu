import { Link } from 'react-router-dom';
import { Clock, Cpu, Eye, Heart, ArrowRight, Lock } from 'lucide-react';

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

const DIFFICULTY_COLORS = {
  beginner:     { bg: 'rgba(0,255,136,0.12)',  color: '#00ff88', border: 'rgba(0,255,136,0.3)'  },
  intermediate: { bg: 'rgba(0,240,255,0.12)',  color: '#00f0ff', border: 'rgba(0,240,255,0.3)'  },
  advanced:     { bg: 'rgba(255,0,60,0.12)',   color: '#ff003c', border: 'rgba(255,0,60,0.3)'   },
};

const ProjectCard = ({ project }) => {
  const color = CATEGORY_COLORS[project.category] || '#7c3aed';
  const diff  = project.difficulty?.toLowerCase();
  const diffStyle = DIFFICULTY_COLORS[diff] || DIFFICULTY_COLORS.beginner;

  return (
    <Link to={`/projects/${project.slug}`} className="project-card card">

      {/* ── Thumbnail ── */}
      <div className="proj-thumb">
        {project.thumbnail
          ? <img src={project.thumbnail} alt={project.title} loading="lazy" />
          : (
            <div
              className="proj-thumb-placeholder"
              style={{ background: `linear-gradient(135deg, ${color}28, ${color}0d)` }}
            >
              <Cpu size={48} style={{ color }} />
            </div>
          )
        }

        {/* difficulty badge — top left */}
        {project.difficulty && (
          <span
            className="proj-diff-badge"
            style={{ background: diffStyle.bg, color: diffStyle.color, borderColor: diffStyle.border }}
          >
            {project.difficulty}
          </span>
        )}

        {/* free / premium — top right */}
        <span className={`proj-price-badge ${project.isFree ? 'free' : 'premium'}`}>
          {project.isFree ? 'Free' : <><Lock size={10} /> Premium</>}
        </span>

        {/* hover overlay */}
        <div className="proj-hover-overlay">
          <span className="proj-hover-cta">
            View Step-by-Step Guide <ArrowRight size={15} />
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="proj-body">

        {/* category label */}
        <span className="proj-category" style={{ color }}>{project.category}</span>

        {/* title */}
        <h3 className="proj-title">{project.title}</h3>

        {/* description */}
        <p className="proj-desc">
          {project.shortDescription || project.description?.slice(0, 90)}
          {!project.shortDescription && project.description?.length > 90 ? '…' : ''}
        </p>

        {/* components needed */}
        <div className="proj-components">
          <Cpu size={13} />
          <span>{project.components?.length || 0} components needed</span>
        </div>

        {/* stats row */}
        <div className="proj-stats-row">
          {project.estimatedTime && (
            <span className="proj-stat"><Clock size={12} /> {project.estimatedTime}</span>
          )}
          <span className="proj-stat"><Eye   size={12} /> {project.views       || 0}</span>
          <span className="proj-stat"><Heart size={12} /> {project.likes?.length || 0}</span>
        </div>

        {/* CTA strip */}
        <div className="proj-cta-strip" style={{ '--c': color }}>
          Build This Project <ArrowRight size={13} />
        </div>
      </div>

      <style>{`
        /* ── Card shell ── */
        .project-card {
          padding: 0; cursor: pointer; overflow: hidden;
          display: flex; flex-direction: column;
          transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
        }
        .project-card:hover {
          transform: translateY(-4px);
          border-color: rgba(0,240,255,0.35);
          box-shadow: 0 16px 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,240,255,0.08);
        }

        /* ── Thumbnail ── */
        .proj-thumb {
          position: relative; height: 178px; overflow: hidden; flex-shrink: 0;
        }
        .proj-thumb img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.45s; display: block;
        }
        .project-card:hover .proj-thumb img { transform: scale(1.06); }
        .proj-thumb-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
        }

        /* badges */
        .proj-diff-badge {
          position: absolute; top: 10px; left: 10px;
          padding: 3px 10px; border-radius: 4px;
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.5px;
          border: 1px solid; backdrop-filter: blur(6px);
        }
        .proj-price-badge {
          position: absolute; top: 10px; right: 10px;
          display: flex; align-items: center; gap: 4px;
          padding: 3px 10px; border-radius: 4px;
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.5px;
          backdrop-filter: blur(6px);
        }
        .proj-price-badge.free    { background: rgba(0,255,136,0.15); color: #00ff88; border: 1px solid rgba(0,255,136,0.35); }
        .proj-price-badge.premium { background: rgba(255,0,85,0.15);  color: #ff0055; border: 1px solid rgba(255,0,85,0.35);  }

        /* hover overlay */
        .proj-hover-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.52);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.3s;
          backdrop-filter: blur(2px);
        }
        .project-card:hover .proj-hover-overlay { opacity: 1; }
        .proj-hover-cta {
          display: flex; align-items: center; gap: 8px;
          color: #fff; font-size: 13px; font-weight: 700; letter-spacing: 0.3px;
          padding: 10px 18px;
          border: 1.5px solid rgba(255,255,255,0.55);
          border-radius: 100px;
          background: rgba(255,255,255,0.1);
        }

        /* ── Body ── */
        .proj-body {
          padding: 14px 16px 16px;
          display: flex; flex-direction: column; gap: 8px;
          flex: 1;
        }
        .proj-category {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.8px;
        }
        .proj-title {
          font-size: 15px; font-weight: 700;
          color: var(--text-primary); line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .proj-desc {
          font-size: 13px; color: var(--text-secondary); line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
        }
        .proj-components {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: var(--text-muted);
        }

        /* stats */
        .proj-stats-row {
          display: flex; gap: 12px; flex-wrap: wrap;
          padding-top: 8px;
          border-top: 1px solid var(--border);
        }
        .proj-stat {
          display: flex; align-items: center; gap: 4px;
          font-size: 12px; color: var(--text-muted);
        }

        /* CTA strip */
        .proj-cta-strip {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 9px;
          border-radius: var(--radius);
          background: rgba(0,240,255,0.06);
          border: 1px solid rgba(0,240,255,0.2);
          color: var(--primary);
          font-size: 12px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.8px;
          transition: var(--transition);
          margin-top: auto;
        }
        .project-card:hover .proj-cta-strip {
          background: rgba(0,240,255,0.13);
          border-color: var(--primary);
          box-shadow: 0 0 14px rgba(0,240,255,0.18);
        }
      `}</style>
    </Link>
  );
};

export default ProjectCard;
