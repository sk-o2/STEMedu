import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { verifyEmail, resendVerification } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Loader, Mail } from 'lucide-react';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const { loginUser, user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const { data } = await verifyEmail(token);
        loginUser(data);
        setStatus('success');
        setTimeout(() => navigate('/dashboard'), 3000);
      } catch {
        setStatus('error');
      }
    };
    verify();
  }, [token]);

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      setResent(true);
    } catch {
      setResent(false);
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: 480, padding: 48, textAlign: 'center' }}>

        {status === 'loading' && (
          <>
            <Loader size={56} style={{ color: 'var(--primary)', margin: '0 auto 24px', animation: 'spin 1s linear infinite' }} />
            <h2 style={{ fontSize: 22, marginBottom: 12 }}>Verifying your email…</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(0,255,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--success)', boxShadow: '0 0 40px rgba(0,255,136,0.2)' }}>
              <CheckCircle size={44} />
            </div>
            <h2 style={{ fontSize: 24, marginBottom: 12 }}>Email Verified! 🎉</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
              Your account is now fully active.<br />
              Redirecting you to your dashboard…
            </p>
            <Link to="/dashboard" className="btn btn-primary" style={{ justifyContent: 'center' }}>Go to Dashboard</Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,0,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--danger)', boxShadow: '0 0 40px rgba(255,0,60,0.2)' }}>
              <XCircle size={44} />
            </div>
            <h2 style={{ fontSize: 24, marginBottom: 12 }}>Link Expired</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
              This verification link is invalid or has expired.<br />
              Request a new one below.
            </p>

            {!resent ? (
              <button className="btn btn-primary" style={{ justifyContent: 'center', marginBottom: 16 }} onClick={handleResend} disabled={resending}>
                <Mail size={16} /> {resending ? 'Sending…' : 'Resend Verification Email'}
              </button>
            ) : (
              <div style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 8, padding: '12px 20px', marginBottom: 16, color: 'var(--success)', fontSize: 14 }}>
                ✅ New verification email sent! Check your inbox.
              </div>
            )}

            <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Back to Login</Link>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default VerifyEmailPage;
