import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import EmailVerificationBanner from './components/EmailVerificationBanner';
import ChatWidget from './components/ChatWidget';
import LandingPage from './pages/LandingPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CourseLMSPage from './pages/CourseLMSPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import AIAssistantPage from './pages/AIAssistantPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import StudentDashboard from './pages/StudentDashboard';
import TutorDashboard from './pages/TutorDashboard';
import AdminPanel from './pages/AdminPanel';
import PaymentSuccess from './pages/PaymentSuccess';
import BookMentoringPage from './pages/BookMentoringPage';
import NotFound from './pages/NotFound';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function App() {
  const { user } = useAuth();
  return (
    <div className="app">
      <Navbar />
      <EmailVerificationBanner />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:slug" element={<CourseDetailPage />} />
          <Route path="/courses/lms/:slug" element={<CourseLMSPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              {user?.role === 'admin' ? <AdminPanel /> : user?.role === 'tutor' ? <TutorDashboard /> : <StudentDashboard />}
            </ProtectedRoute>
          } />
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>} />
          <Route path="/book-mentoring" element={<ProtectedRoute><BookMentoringPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      {user && <ChatWidget />}
    </div>
  );
}

export default App;
