import { Link } from 'react-router-dom';
import { Zap, Github, Twitter, Linkedin, Mail, BookOpen, Cpu, MessageCircle } from 'lucide-react';

const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer-grid">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <div className="logo-icon"><Zap size={18} /></div>
            <span>STEM<span style={{color:'var(--secondary)'}}>Ed</span></span>
          </Link>
          <p className="footer-tagline">Empowering the next generation of innovators through hands-on STEM education.</p>
          <div className="footer-socials">
            <a href="#" className="social-btn" aria-label="GitHub"><Github size={18} /></a>
            <a href="#" className="social-btn" aria-label="Twitter"><Twitter size={18} /></a>
            <a href="#" className="social-btn" aria-label="LinkedIn"><Linkedin size={18} /></a>
            <a href="mailto:stemeduhere@gmail.com" className="social-btn" aria-label="Email"><Mail size={18} /></a>
          </div>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Learn</h4>
          <ul className="footer-links">
            <li><Link to="/courses?category=Robotics">Robotics</Link></li>
            <li><Link to="/courses?category=Game Development">Game Development</Link></li>
            <li><Link to="/courses?category=Drone Technology">Drone Technology</Link></li>
            <li><Link to="/courses?category=IoT">IoT & Electronics</Link></li>
            <li><Link to="/courses?category=AI & Machine Learning">AI & Machine Learning</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Platform</h4>
          <ul className="footer-links">
            <li><Link to="/projects">Project Guides</Link></li>
            <li><Link to="/ai-assistant">AI Assistant</Link></li>
            <li><Link to="/batches">Pricing</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Contact Us</h4>
          <p style={{color:'var(--text-secondary)',fontSize:'14px',marginBottom:'12px'}}>Have questions? Our tutors are ready to help.</p>
          <Link to="/dashboard" className="btn btn-primary btn-sm" style={{width:'fit-content'}}>
            <MessageCircle size={15} /> Chat with Tutor
          </Link>
          <p style={{color:'var(--text-muted)',fontSize:'13px',marginTop:'12px'}}>stemeduhere@gmail.com</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} STEMedu. All rights reserved.</p>
        <div className="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Refund Policy</a>
        </div>
      </div>
    </div>

    <style>{`
      .footer { background: #07071a; border-top: 1px solid var(--border); padding: 64px 0 0; margin-top: 80px; }
      .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; gap: 48px; margin-bottom: 48px; }
      .footer-logo { display: flex; align-items: center; gap: 10px; font-family:'Space Grotesk',sans-serif; font-size:20px; font-weight:800; margin-bottom:16px; }
      .footer-tagline { color: var(--text-secondary); font-size:14px; line-height:1.7; margin-bottom:20px; }
      .footer-socials { display:flex; gap:10px; }
      .social-btn { width:36px; height:36px; border-radius:8px; background:var(--bg-elevated); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; color:var(--text-secondary); transition:var(--transition); }
      .social-btn:hover { background:var(--gradient-primary); color:#fff; border-color:transparent; }
      .footer-heading { font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); margin-bottom:16px; }
      .footer-links { display:flex; flex-direction:column; gap:10px; }
      .footer-links li a { color:var(--text-secondary); font-size:14px; transition:var(--transition); }
      .footer-links li a:hover { color:var(--primary-light); }
      .footer-bottom { border-top:1px solid var(--border); padding:24px 0; display:flex; align-items:center; justify-content:space-between; }
      .footer-bottom p { color:var(--text-muted); font-size:13px; }
      .footer-bottom-links { display:flex; gap:20px; }
      .footer-bottom-links a { color:var(--text-muted); font-size:13px; transition:var(--transition); }
      .footer-bottom-links a:hover { color:var(--text-primary); }
      @media(max-width:900px) { .footer-grid { grid-template-columns:1fr 1fr; } }
      @media(max-width:600px) { .footer-grid { grid-template-columns:1fr; } .footer-bottom { flex-direction:column; gap:12px; text-align:center; } }
    `}</style>
  </footer>
);

export default Footer;
