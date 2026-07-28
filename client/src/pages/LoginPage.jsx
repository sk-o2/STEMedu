import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';
import { Zap, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      const { data } = await login({ email, password });
      loginUser(data);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff', boxShadow: '0 0 20px rgba(124,58,237,0.5)' }}>
            <Zap size={24} />
          </div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Log in to continue your STEM journey</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', top: 14, left: 14, color: 'var(--text-muted)' }} />
              <input type="email" className="form-input" style={{ paddingLeft: 42 }} placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--primary-light)' }}>Forgot password?</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', top: 14, left: 14, color: 'var(--text-muted)' }} />
              <input type="password" className="form-input" style={{ paddingLeft: 42 }} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
