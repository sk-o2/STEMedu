import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import { Mail, Zap, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: 40 }}>

        {!sent ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#ff0055,#ff6b00)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff', boxShadow: '0 0 24px rgba(255,0,85,0.4)' }}>
                <Zap size={26} />
              </div>
              <h1 style={{ fontSize: 24, marginBottom: 8 }}>Forgot Password?</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                No worries! Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', top: 14, left: 14, color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: 42 }}
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14 }}>
              <Link to="/login" style={{ color: 'var(--primary-light)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </p>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,255,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--success)', boxShadow: '0 0 30px rgba(0,255,136,0.2)' }}>
              <CheckCircle size={36} />
            </div>
            <h2 style={{ fontSize: 22, marginBottom: 12 }}>Check your email!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              We sent a password reset link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.<br/>
              It expires in <strong>10 minutes</strong>.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
              Didn't get it? Check your spam folder or{' '}
              <button onClick={() => setSent(false)} style={{ background: 'none', color: 'var(--primary-light)', textDecoration: 'underline', fontSize: 13 }}>
                try again
              </button>.
            </p>
            <Link to="/login" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
