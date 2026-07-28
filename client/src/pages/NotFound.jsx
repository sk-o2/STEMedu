import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound = () => (
  <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyItems: 'center', flexDirection: 'column', textAlign: 'center', padding: 20 }}>
    <div style={{ fontSize: 'clamp(80px, 15vw, 150px)', fontWeight: 900, fontFamily: 'Space Grotesk', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>404</div>
    <h2 style={{ fontSize: 28, marginBottom: 16 }}>Page Not Found</h2>
    <p style={{ color: 'var(--text-secondary)', maxWidth: 400, marginBottom: 32, marginInline:'auto' }}>The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
    <Link to="/" className="btn btn-primary" style={{margin:'0 auto'}}><Home size={18} /> Back to Home</Link>
  </div>
);

export default NotFound;
