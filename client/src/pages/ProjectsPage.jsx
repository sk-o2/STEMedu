import { useState, useEffect, useRef } from 'react';
import { Search, X, SlidersHorizontal, Cpu, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import { getProjects } from '../services/api';

const CATEGORIES   = ['All','Robotics','Game Development','Drone Technology','IoT','AI & Machine Learning','Electronics','3D Printing','Coding'];
const DIFFICULTIES = ['All','Beginner','Intermediate','Advanced'];

/* ── debounce ── */
function useDebounce(value, delay = 450) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const ProjectsPage = () => {
  const [projects,    setProjects]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [category,    setCategory]    = useState('All');
  const [difficulty,  setDifficulty]  = useState('All');
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(1);
  const [total,       setTotal]       = useState(0);
  const [pages,       setPages]       = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 450);
  const resultsRef      = useRef(null);

  const hasActiveFilters =
    category !== 'All' || difficulty !== 'All' || search !== '';

  const clearAll = () => {
    setCategory('All'); setDifficulty('All'); setSearch(''); setPage(1);
  };

  /* fetch */
  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 12 };
    if (category   !== 'All') params.category   = category;
    if (difficulty !== 'All') params.difficulty  = difficulty;
    if (debouncedSearch)       params.search      = debouncedSearch;
    getProjects(params)
      .then(r => {
        setProjects(r.data.projects || []);
        setTotal(r.data.total  || 0);
        setPages(r.data.pages  || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, difficulty, debouncedSearch, page]);

  /* reset to page 1 when filters change */
  useEffect(() => { setPage(1); }, [category, difficulty, debouncedSearch]);

  const handlePageChange = (p) => {
    setPage(p);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="projects-page">

      {/* ── Header ── */}
      <div className="page-header">
        <h1>STEM <span className="gradient-text">Project Guides</span></h1>
        <p>Select a project and follow our step-by-step guide to build it from scratch.</p>
      </div>

      <div className="container proj-container">

        {/* ── Search + Toggle Row ── */}
        <div className="proj-search-row">
          <div className="search-box proj-search">
            <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              id="project-search"
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Difficulty pills — always visible on desktop */}
          <div className="proj-quick-filters">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                className={`filter-pill ${difficulty === d ? 'active' : ''}`}
                onClick={() => setDifficulty(d)}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Mobile filter toggle */}
          <button
            className={`filter-toggle-btn ${filtersOpen ? 'active' : ''}`}
            onClick={() => setFiltersOpen(v => !v)}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal size={16} />
            Filters
            {hasActiveFilters && <span className="filter-dot" />}
          </button>
        </div>

        {/* ── Difficulty row (collapsible on mobile) ── */}
        <div className={`diff-filter-row ${filtersOpen ? 'open' : ''}`}>
          <span className="filter-group-label"><Filter size={13} /> Difficulty</span>
          <div className="filter-group">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                className={`filter-pill ${difficulty === d ? 'active' : ''}`}
                onClick={() => setDifficulty(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* ── Category Tabs ── */}
        <div className="cat-tabs-wrapper">
          <div className="cat-tabs">
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`cat-tab ${category === c ? 'active' : ''}`}
                onClick={() => { setCategory(c); setPage(1); }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ── Results Header ── */}
        <div className="results-header" ref={resultsRef}>
          <p className="results-count">
            {loading ? 'Loading…' : `${total} project guide${total !== 1 ? 's' : ''} found`}
          </p>
          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearAll}>
              <X size={13} /> Clear filters
            </button>
          )}
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="proj-skeleton">
                <div className="skeleton skel-thumb" />
                <div className="skel-body">
                  <div className="skeleton skel-cat"   />
                  <div className="skeleton skel-title" />
                  <div className="skeleton skel-title short" />
                  <div className="skeleton skel-line"  />
                  <div className="skeleton skel-line  short2" />
                  <div className="skeleton skel-footer" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Cpu size={44} /></div>
            <h3>No projects found</h3>
            <p>Try adjusting your search or filters to discover something to build.</p>
            {hasActiveFilters && (
              <button className="btn btn-primary" onClick={clearAll} style={{ marginTop: 20 }}>
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid-3">
            {projects.map(p => <ProjectCard key={p._id} project={p} />)}
          </div>
        )}

        {/* ── Pagination ── */}
        {pages > 1 && !loading && (
          <div className="pagination">
            <button
              className="page-btn page-nav"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === pages || Math.abs(p - page) <= 2)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '…'
                  ? <span key={`el-${idx}`} className="page-ellipsis">…</span>
                  : <button
                      key={p}
                      className={`page-btn ${page === p ? 'active' : ''}`}
                      onClick={() => handlePageChange(p)}
                    >{p}</button>
              )
            }

            <button
              className="page-btn page-nav"
              disabled={page === pages}
              onClick={() => handlePageChange(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <div style={{ height: 60 }} />
      </div>

      <style>{`
        /* ── Page ── */
        .projects-page { min-height: 100vh; }
        .proj-container { padding-top: 32px; padding-bottom: 40px; }

        /* ── Search row ── */
        .proj-search-row {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .proj-search { flex: 1; min-width: 200px; }
        .search-clear {
          background: none; border: none;
          color: var(--text-muted); padding: 2px;
          display: flex; align-items: center;
          cursor: pointer; transition: color 0.2s; flex-shrink: 0;
        }
        .search-clear:hover { color: var(--primary); }
        .proj-quick-filters { display: flex; gap: 8px; flex-wrap: wrap; }

        /* ── Filter toggle (mobile) ── */
        .filter-toggle-btn {
          display: none;
          align-items: center; gap: 8px;
          padding: 9px 16px;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.02);
          color: var(--text-secondary);
          font-size: 13px; font-weight: 600;
          cursor: pointer; transition: var(--transition);
          position: relative; white-space: nowrap;
        }
        .filter-toggle-btn.active,
        .filter-toggle-btn:hover { border-color: var(--primary); color: var(--primary); background: rgba(0,240,255,0.05); }
        .filter-dot {
          position: absolute; top: 6px; right: 6px;
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--primary); box-shadow: 0 0 6px var(--primary);
        }

        /* ── Difficulty row ── */
        .diff-filter-row {
          display: flex;
          align-items: center; gap: 12px; flex-wrap: wrap;
          padding: 14px 20px;
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); margin-bottom: 16px;
          backdrop-filter: blur(20px);
        }
        .filter-group-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 1px;
          color: var(--text-muted); white-space: nowrap;
        }
        .filter-group { display: flex; gap: 8px; flex-wrap: wrap; }

        /* ── Category tabs ── */
        .cat-tabs-wrapper {
          position: relative;
          margin-bottom: 24px;
        }
        .cat-tabs-wrapper::after {
          content: '';
          position: absolute; top: 0; right: 0;
          width: 60px; height: 100%;
          background: linear-gradient(to right, transparent, var(--bg-dark));
          pointer-events: none;
        }
        .cat-tabs {
          display: flex; gap: 8px;
          overflow-x: auto; padding-bottom: 4px;
          scrollbar-width: none; -ms-overflow-style: none;
        }
        .cat-tabs::-webkit-scrollbar { display: none; }
        .cat-tab {
          padding: 8px 18px; border-radius: 100px;
          border: 1px solid var(--border); background: transparent;
          color: var(--text-secondary);
          font-size: 13px; font-weight: 600;
          white-space: nowrap; cursor: pointer; flex-shrink: 0;
          transition: var(--transition);
        }
        .cat-tab:hover { color: var(--text-primary); border-color: rgba(0,240,255,0.3); background: rgba(0,240,255,0.04); }
        .cat-tab.active {
          background: rgba(0,240,255,0.1); color: var(--primary);
          border-color: var(--primary); box-shadow: 0 0 12px rgba(0,240,255,0.15);
        }

        /* ── Results header ── */
        .results-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px; flex-wrap: wrap; gap: 10px;
        }
        .results-count { color: var(--text-secondary); font-size: 14px; }
        .clear-filters-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: var(--radius);
          border: 1px solid rgba(0,240,255,0.3);
          background: rgba(0,240,255,0.06);
          color: var(--primary);
          font-size: 12px; font-weight: 600;
          cursor: pointer; transition: var(--transition);
        }
        .clear-filters-btn:hover { background: rgba(0,240,255,0.12); box-shadow: 0 0 12px rgba(0,240,255,0.15); }

        /* ── Skeleton ── */
        .proj-skeleton {
          border-radius: var(--radius-lg); overflow: hidden;
          border: 1px solid var(--border); background: var(--gradient-card);
        }
        .skel-thumb  { height: 175px; border-radius: 0; }
        .skel-body   { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .skel-cat    { height: 12px; width: 70px; border-radius: 4px; }
        .skel-title  { height: 15px; width: 90%; border-radius: 4px; }
        .skel-title.short { width: 65%; }
        .skel-line   { height: 12px; width: 100%; border-radius: 4px; }
        .skel-line.short2 { width: 75%; }
        .skel-footer { height: 12px; width: 55%; border-radius: 4px; margin-top: 4px; }

        /* ── Empty state ── */
        .empty-state {
          text-align: center; padding: 80px 24px;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
        }
        .empty-icon {
          width: 88px; height: 88px; border-radius: 50%;
          background: rgba(0,240,255,0.06);
          border: 1px solid rgba(0,240,255,0.15);
          display: flex; align-items: center; justify-content: center;
          color: var(--primary); margin-bottom: 8px;
        }
        .empty-state h3 { font-size: 22px; color: var(--text-primary); }
        .empty-state p  { font-size: 15px; color: var(--text-muted); max-width: 360px; line-height: 1.6; }

        /* ── Pagination ── */
        .pagination {
          display: flex; justify-content: center; align-items: center;
          gap: 6px; margin-top: 48px; flex-wrap: wrap;
        }
        .page-btn {
          min-width: 38px; height: 38px; padding: 0 10px;
          border-radius: var(--radius); border: 1px solid var(--border);
          background: transparent; color: var(--text-secondary);
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: var(--transition);
          display: flex; align-items: center; justify-content: center;
        }
        .page-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); background: rgba(0,240,255,0.07); }
        .page-btn.active {
          background: rgba(0,240,255,0.12); color: var(--primary);
          border-color: var(--primary); box-shadow: 0 0 12px rgba(0,240,255,0.2);
        }
        .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .page-nav { color: var(--text-muted); }
        .page-ellipsis { color: var(--text-muted); font-size: 14px; padding: 0 4px; display: flex; align-items: center; }

        /* ── Responsive ── */
        @media(max-width: 768px) {
          .filter-toggle-btn { display: flex; }
          .diff-filter-row { display: none; }
          .diff-filter-row.open { display: flex; }
          .proj-quick-filters { display: none; }
        }
        @media(max-width: 640px) {
          .proj-search-row { gap: 8px; }
          .proj-search { min-width: 0; }
          .cat-tab { padding: 7px 14px; font-size: 12px; }
          .empty-state { padding: 52px 16px; }
          .empty-icon { width: 68px; height: 68px; }
          .empty-state h3 { font-size: 18px; }
        }
        @media(max-width: 420px) {
          .cat-tab { padding: 6px 12px; font-size: 11px; }
          .results-header { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
};

export default ProjectsPage;
