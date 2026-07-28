import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import {
  Menu, X, Bell, ChevronDown, Zap, BookOpen, Cpu,
  MessageCircle, LogOut, LayoutDashboard, Bot, Sun, Moon
} from 'lucide-react';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { notifications }    = useSocket();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const dropRef   = useRef(null);

  /* scroll shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* close everything on route change */
  useEffect(() => {
    setMenuOpen(false);
    setDropOpen(false);
  }, [location]);

  /* close dropdown when clicking outside */
  useEffect(() => {
    if (!dropOpen) return;
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  /* close mobile menu on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') { setMenuOpen(false); setDropOpen(false); } };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  /* lock body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleTutorClick = (e) => {
    e.preventDefault();
    if (user?.role === 'student') {
      window.dispatchEvent(new CustomEvent('open-tutor-chat'));
    } else {
      navigate('/dashboard');
    }
  };

  const navLinks = [
    { to: '/courses',       label: 'Courses',      icon: <BookOpen size={16} /> },
    { to: '/projects',      label: 'Projects',     icon: <Cpu     size={16} /> },
    { to: '/ai-assistant',  label: 'AI Assistant', icon: <Bot     size={16} /> },
  ];

  const unreadCount = notifications?.length || 0;

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-inner">

          {/* ── Logo ── */}
          <Link to="/" className="navbar-logo">
            <div className="logo-icon"><Zap size={20} /></div>
            <span className="logo-text">STEM<span className="logo-accent">edu</span></span>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <ul className="navbar-links">
            {navLinks.map(({ to, label, icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`nav-link ${location.pathname.startsWith(to) ? 'active' : ''}`}
                >
                  {icon} {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* ── Right side ── */}
          <div className="navbar-right">

            {/* ── Theme Toggle (Desktop) ── */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              <span className="theme-toggle-icon" key={theme}>
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </span>
            </button>

            {/* Desktop: Contact Tutor Button */}
            {user && (
              <button
                onClick={handleTutorClick}
                className="btn btn-secondary btn-sm contact-tutor-btn desktop-only"
              >
                <MessageCircle size={16} /> Contact Tutor
              </button>
            )}

            {/* Mobile: Compact Tutor Chat Icon Button */}
            {user && (
              <button
                onClick={handleTutorClick}
                className="mobile-tutor-icon-btn mobile-only"
                title="Contact Tutor"
                aria-label="Contact Tutor"
              >
                <MessageCircle size={18} />
                <span className="tutor-pulse-dot" />
              </button>
            )}

            {/* User menu / Auth buttons */}
            {user ? (
              <div className="user-menu" ref={dropRef} onClick={() => setDropOpen(d => !d)}>
                <div className="user-avatar-wrap">
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7c3aed&color=fff`}
                    alt={user.name}
                    className="user-avatar"
                  />
                  {unreadCount > 0 && <span className="nav-notif-dot" />}
                </div>
                <span className="user-name">{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} className={`chevron ${dropOpen ? 'open' : ''}`} />

                {dropOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-user-info">
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7c3aed&color=fff`}
                        alt={user.name}
                        className="dropdown-avatar"
                      />
                      <div>
                        <div className="dropdown-user-name">{user.name}</div>
                        <div className="dropdown-user-role">{user.role || 'Student'}</div>
                      </div>
                    </div>
                    <hr className="dropdown-divider" />
                    <Link to="/dashboard" className="dropdown-item"><LayoutDashboard size={15} /> Dashboard</Link>
                    <button onClick={handleTutorClick} className="dropdown-item">
                      <MessageCircle size={15} /> Contact Tutor
                    </button>
                    {unreadCount > 0 && (
                      <div className="dropdown-item notif-item">
                        <Bell size={15} /> {unreadCount} notification{unreadCount > 1 ? 's' : ''}
                      </div>
                    )}
                    <hr className="dropdown-divider" />
                    <button className="dropdown-item danger" onClick={logoutUser}>
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login"    className="btn btn-ghost btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
              </div>
            )}

            {/* Hamburger */}
            <button
              className="hamburger"
              onClick={() => setMenuOpen(m => !m)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Menu Backdrop ── */}
      <div
        className={`mobile-backdrop ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* ── Mobile Menu Drawer ── */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>

        {/* User profile strip (logged in) */}
        {user && (
          <div className="mobile-user-strip">
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7c3aed&color=fff&size=60`}
              alt={user.name}
              className="mobile-user-avatar"
            />
            <div className="mobile-user-info">
              <div className="mobile-user-name">{user.name}</div>
              <div className="mobile-user-role">{user.role || 'Student'}</div>
            </div>
            {unreadCount > 0 && (
              <span className="mobile-notif-badge">{unreadCount}</span>
            )}
          </div>
        )}

        {/* Nav links */}
        <div className="mobile-nav-section">
          {navLinks.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={`mobile-nav-link ${location.pathname.startsWith(to) ? 'active' : ''}`}
            >
              <span className="mobile-nav-icon">{icon}</span>
              {label}
            </Link>
          ))}
        </div>

        {/* Logged-in actions */}
        {user ? (
          <>
            <div className="mobile-nav-divider" />
            <div className="mobile-nav-section">
              <Link to="/dashboard" className="mobile-nav-link">
                <span className="mobile-nav-icon"><LayoutDashboard size={16} /></span>
                Dashboard
              </Link>
              <button
                onClick={(e) => {
                  setMenuOpen(false);
                  handleTutorClick(e);
                }}
                className="mobile-nav-link"
              >
                <span className="mobile-nav-icon tutor-nav-icon"><MessageCircle size={16} /></span>
                Contact Tutor
                <span className="mobile-tutor-badge">Live</span>
              </button>
              {unreadCount > 0 && (
                <div className="mobile-nav-link notif">
                  <span className="mobile-nav-icon"><Bell size={16} /></span>
                  {unreadCount} Notification{unreadCount > 1 ? 's' : ''}
                </div>
              )}
            </div>
            <div className="mobile-nav-divider" />
            <div className="mobile-nav-section">
              <button className="mobile-nav-link danger" onClick={logoutUser}>
                <span className="mobile-nav-icon"><LogOut size={16} /></span>
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mobile-nav-divider" />
            <div className="mobile-nav-section mobile-auth-section">
              <Link to="/login"    className="btn btn-secondary" style={{ width:'100%', justifyContent:'center' }}>Login</Link>
              <Link to="/register" className="btn btn-primary"   style={{ width:'100%', justifyContent:'center' }}>Get Started Free</Link>
            </div>
          </>
        )}

        {/* ── Theme Toggle Row (Mobile Drawer) ── */}
        <div className="mobile-theme-toggle-row">
          <div className="mobile-theme-toggle-label">
            <span className="mobile-theme-label-icon">
              {isDark ? <Moon size={16} /> : <Sun size={16} />}
            </span>
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </div>
          <button
            className={`theme-toggle-pill ${isDark ? 'dark-mode' : 'light-mode'}`}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <span className="theme-toggle-knob">
              {isDark ? '🌙' : '☀️'}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Navbar;
