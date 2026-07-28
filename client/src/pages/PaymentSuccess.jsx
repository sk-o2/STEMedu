import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PaymentSuccess = () => {
  const { loadUser } = useAuth();

  useEffect(() => { loadUser(); }, [loadUser]);

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyItems: 'center', padding: 20 }}>
      <div className="card" style={{ maxWidth: 460, margin: '0 auto', textAlign: 'center', padding: 48 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyItems: 'center', margin: '0 auto 24px', animation: 'scaleIn 0.5s ease' }}>
          <CheckCircle size={40} style={{margin:'auto'}} />
        </div>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Payment Successful!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>Thank you for your purchase. The courses in this batch have been added to your dashboard.</p>
        <Link to="/dashboard" className="btn btn-primary" style={{ width: '100%', justifyItems: 'center', display:'flex', justifyContent:'center' }}>Go to Dashboard</Link>
      </div>
      <style>{`@keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }`}</style>
    </div>
  );
};

export default PaymentSuccess;
