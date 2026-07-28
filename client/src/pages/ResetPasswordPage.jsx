import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const getStrength = (p) => {
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };
  const strength = getStrength(password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#ff003c', '#f59e0b', '#00f0ff', '#00ff88'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const { data } = await resetPassword(token, { password });
      loginUser(data);
      setDone(true);
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: 40 }}>

        {!done ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#7c3aed,#00f0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}>
                <Lock size={26} />
              </div>
              <h1 style={{ fontSize: 24, marginBottom: 8 }}>Set New Password</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Choose a strong password for your account.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', top: 14, left: 14, color: 'var(--text-muted)' }} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingLeft: 42, paddingRight: 42 }}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', color: 'var(--text-muted)' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColor : 'var(--border)', transition: '0.3s' }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</div>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', top: 14, left: 14, color: 'var(--text-muted)' }} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingLeft: 42, borderColor: confirm && confirm !== password ? 'var(--danger)' : undefined }}
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                  />
                </div>
                {confirm && confirm !== password && (
                  <div className="form-error">Passwords do not match</div>
                )}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,255,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--success)', boxShadow: '0 0 30px rgba(0,255,136,0.2)' }}>
              <CheckCircle size={36} />
            </div>
            <h2 style={{ fontSize: 22, marginBottom: 12 }}>Password Updated!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
              Your password has been changed successfully.<br />Redirecting you to your dashboard…
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
