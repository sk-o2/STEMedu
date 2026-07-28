import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/api';
import { Zap, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formData;
    if (!name || !email || !password) return toast.error('Please fill all fields');
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      const { data } = await register({ name, email, password, role: 'student' });
      loginUser(data);
      toast.success('Account created successfully! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: 460, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff', boxShadow: '0 0 20px rgba(124,58,237,0.5)' }}>
            <Zap size={24} />
          </div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Create an Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Start your STEM learning journey today</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', top: 14, left: 14, color: 'var(--text-muted)' }} />
              <input type="text" name="name" className="form-input" style={{ paddingLeft: 42 }} placeholder="name here..." value={formData.name} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', top: 14, left: 14, color: 'var(--text-muted)' }} />
              <input type="email" name="email" className="form-input" style={{ paddingLeft: 42 }} placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', top: 14, left: 14, color: 'var(--text-muted)' }} />
              <input type="password" name="password" className="form-input" style={{ paddingLeft: 42 }} placeholder="••••••••" value={formData.password} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', top: 14, left: 14, color: 'var(--text-muted)' }} />
              <input type="password" name="confirmPassword" className="form-input" style={{ paddingLeft: 42 }} placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
