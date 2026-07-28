import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, SlidersHorizontal, BookOpen, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import { getCourses } from '../services/api';

const CATEGORIES = ['All','Robotics','Game Development','Drone Technology','IoT','AI & Machine Learning','Electronics','3D Printing','Coding'];
const LEVELS     = ['All','Beginner','Intermediate','Advanced'];
const PRICE_OPTS = ['All','Free','Paid'];

/* ── debounce helper ── */
function useDebounce(value, delay = 450) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const CoursesPage = () => {
  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState('All');
  const [level,    setLevel]    = useState('All');
  const [isFree,   setIsFree]   = useState('All');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 450);
  const catBarRef = useRef(null);

  const hasActiveFilters = category !== 'All' || level !== 'All' || isFree !== 'All' || search !== '';

  const clearAll = () => {
    setCategory('All'); setLevel('All'); setIsFree('All'); setSearch(''); setPage(1);
  };

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 12 };
    if (category !== 'All') params.category  = category;
    if (level    !== 'All') params.level     = level;
    if (isFree   === 'Free') params.isFree   = true;
    if (isFree   === 'Paid') params.isFree   = false;
    if (debouncedSearch)    params.search    = debouncedSearch;
    getCourses(params)
      .then(r => {
        setCourses(r.data.courses || []);
        setTotal(r.data.total    || 0);
        setPages(r.data.pages    || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, level, isFree, debouncedSearch, page]);

  /* reset page when filters change */
  useEffect(() => { setPage(1); }, [category, level, isFree, debouncedSearch]);

  /* scroll to top of results when page changes */
  const resultsRef = useRef(null);
  const handlePageChange = (p) => {
    setPage(p);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="courses-page">

      {/* ── Page Header ── */}
      <div className="page-header">
        <h1>STEM <span className="gradient-text">Courses</span></h1>
        <p>Master Robotics, Game Dev, Drone Tech, IoT, AI and more with expert-led courses.</p>
      </div>

      <div className="container courses-container">

        {/* ── Search + Quick Filters Row ── */}
        <div className="courses-search-row">
          <div className="search-box courses-search">
            <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              id="course-search"
              placeholder="Search courses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Price pills (always visible) */}
          <div className="quick-filters">
            {PRICE_OPTS.map(f => (
              <button key={f} className={`filter-pill ${isFree === f ? 'active' : ''}`} onClick={() => setIsFree(f)}>
                {f}
              </button>
            ))}
          </div>

          {/* Mobile toggle for more filters */}
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

        {/* ── Level Filter (collapsible on mobile) ── */}
        <div className={`level-filter-row ${filtersOpen ? 'open' : ''}`}>
          <span className="filter-group-label"><Filter size={13} /> Level</span>
          <div className="filter-group">
            {LEVELS.map(l => (
              <button key={l} className={`filter-pill ${level === l ? 'active' : ''}`} onClick={() => setLevel(l)}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* ── Category Scrollable Tabs ── */}
        <div className="cat-tabs-wrapper">
          <div className="cat-tabs" ref={catBarRef}>
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
            {loading ? 'Loading…' : `${total} course${total !== 1 ? 's' : ''} found`}
          </p>
          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearAll}>
              <X size={13} /> Clear filters
            </button>
          )}
        </div>

        {/* ── Course Grid ── */}
        {loading ? (
          <div className="grid-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="course-skeleton">
                <div className="skeleton skel-thumb" />
                <div className="skel-body">
                  <div className="skeleton skel-badge" />
                  <div className="skeleton skel-title" />
                  <div className="skeleton skel-title short" />
                  <div className="skeleton skel-line" />
                  <div className="skeleton skel-line short2" />
                  <div className="skeleton skel-stats" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><BookOpen size={48} /></div>
            <h3>No courses found</h3>
            <p>Try adjusting your search or filters to find what you're looking for.</p>
            {hasActiveFilters && (
              <button className="btn btn-primary" onClick={clearAll} style={{ marginTop: 20 }}>
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid-3">
            {courses.map(c => <CourseCard key={c._id} course={c} />)}
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
                  ? <span key={`ellipsis-${idx}`} className="page-ellipsis">…</span>
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
        .courses-page { min-height: 100vh; }
        .courses-container { padding-top: 32px; padding-bottom: 40px; }

        /* ── Search Row ── */
        .courses-search-row {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .courses-search {
          flex: 1;
          min-width: 200px;
        }
        .search-clear {
          background: none;
          border: none;
          color: var(--text-muted);
          padding: 2px;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: color 0.2s;
          flex-shrink: 0;
        }
        .search-clear:hover { color: var(--primary); }

        .quick-filters { display: flex; gap: 8px; flex-wrap: wrap; }

        /* ── Filter Toggle (mobile) ── */
        .filter-toggle-btn {
          display: none;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.02);
          color: var(--text-secondary);
          font-size: 13px; font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          position: relative;
          white-space: nowrap;
        }
        .filter-toggle-btn.active,
        .filter-toggle-btn:hover { border-color: var(--primary); color: var(--primary); background: rgba(0,240,255,0.05); }
        .filter-dot {
          position: absolute;
          top: 6px; right: 6px;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--primary);
          box-shadow: 0 0 6px var(--primary);
        }

        /* ── Level Filter Row ── */
        .level-filter-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding: 14px 20px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          margin-bottom: 16px;
          backdrop-filter: blur(20px);
        }
        .filter-group-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .filter-group { display: flex; gap: 8px; flex-wrap: wrap; }

        /* ── Category Tabs ── */
        .cat-tabs-wrapper {
          position: relative;
          margin-bottom: 24px;
        }
        .cat-tabs-wrapper::after {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 60px; height: 100%;
          background: linear-gradient(to right, transparent, var(--bg-dark));
          pointer-events: none;
          border-radius: 0 var(--radius) var(--radius) 0;
        }
        .cat-tabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .cat-tabs::-webkit-scrollbar { display: none; }
        .cat-tab {
          padding: 8px 18px;
          border-radius: 100px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-secondary);
          font-size: 13px; font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          flex-shrink: 0;
          transition: var(--transition);
        }
        .cat-tab:hover { color: var(--text-primary); border-color: rgba(0,240,255,0.3); background: rgba(0,240,255,0.04); }
        .cat-tab.active {
          background: rgba(0,240,255,0.1);
          color: var(--primary);
          border-color: var(--primary);
          box-shadow: 0 0 12px rgba(0,240,255,0.15);
        }

        /* ── Results Header ── */
        .results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .results-count { color: var(--text-secondary); font-size: 14px; }
        .clear-filters-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 14px;
          border-radius: var(--radius);
          border: 1px solid rgba(0,240,255,0.3);
          background: rgba(0,240,255,0.06);
          color: var(--primary);
          font-size: 12px; font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }
        .clear-filters-btn:hover { background: rgba(0,240,255,0.12); box-shadow: 0 0 12px rgba(0,240,255,0.15); }

        /* ── Skeleton ── */
        .course-skeleton { border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--border); background: var(--gradient-card); }
        .skel-thumb  { height: 180px; border-radius: 0; }
        .skel-body   { padding: 18px; display: flex; flex-direction: column; gap: 10px; }
        .skel-badge  { height: 22px; width: 80px; border-radius: 4px; }
        .skel-title  { height: 16px; width: 90%; border-radius: 4px; }
        .skel-title.short { width: 65%; }
        .skel-line   { height: 12px; width: 100%; border-radius: 4px; }
        .skel-line.short2 { width: 75%; }
        .skel-stats  { height: 12px; width: 60%; border-radius: 4px; margin-top: 4px; }

        /* ── Empty State ── */
        .empty-state {
          text-align: center;
          padding: 80px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .empty-icon {
          width: 88px; height: 88px;
          border-radius: 50%;
          background: rgba(0,240,255,0.06);
          border: 1px solid rgba(0,240,255,0.15);
          display: flex; align-items: center; justify-content: center;
          color: var(--primary);
          margin-bottom: 8px;
        }
        .empty-state h3 { font-size: 22px; color: var(--text-primary); }
        .empty-state p  { font-size: 15px; color: var(--text-muted); max-width: 360px; line-height: 1.6; }

        /* ── Pagination ── */
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          margin-top: 48px;
          flex-wrap: wrap;
        }
        .page-btn {
          min-width: 38px; height: 38px;
          padding: 0 10px;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-secondary);
          font-size: 14px; font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          display: flex; align-items: center; justify-content: center;
        }
        .page-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); background: rgba(0,240,255,0.07); }
        .page-btn.active {
          background: rgba(0,240,255,0.12);
          color: var(--primary);
          border-color: var(--primary);
          box-shadow: 0 0 12px rgba(0,240,255,0.2);
        }
        .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .page-nav { color: var(--text-muted); }
        .page-ellipsis {
          color: var(--text-muted);
          font-size: 14px;
          padding: 0 4px;
          display: flex; align-items: center;
        }

        /* ── Responsive ── */
        @media(max-width: 768px) {
          .filter-toggle-btn { display: flex; }
          .level-filter-row { display: none; }
          .level-filter-row.open { display: flex; }
          .quick-filters { display: none; }
        }
        @media(max-width: 640px) {
          .courses-search-row { gap: 8px; }
          .courses-search { min-width: 0; }
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

export default CoursesPage;
