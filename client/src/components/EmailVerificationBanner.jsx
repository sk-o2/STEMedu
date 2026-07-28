import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { resendVerification } from '../services/api';
import { AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If no user, or user is verified, or banner was dismissed, don't show
  if (!user || user.isVerified || dismissed) return null;

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendVerification();
      toast.success('Verification email sent! Check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--warning-light, rgba(245,158,11,0.15))', color: '#b45309', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, fontSize: 14, fontWeight: 500, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertCircle size={18} />
        <span>Please verify your email address to unlock all features.</span>
      </div>
      <button 
        onClick={handleResend} 
        disabled={loading}
        style={{ background: 'none', border: '1px solid #b45309', borderRadius: 4, padding: '4px 12px', color: '#b45309', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
      >
        {loading ? 'Sending...' : 'Resend Email'}
      </button>
      <button 
        onClick={() => setDismissed(true)} 
        style={{ position: 'absolute', right: 16, background: 'none', border: 'none', color: '#b45309', cursor: 'pointer' }}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default EmailVerificationBanner;
