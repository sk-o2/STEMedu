import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await getMe();
      setUser(data.user);
    } catch {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { loadUser(); }, [loadUser]);

  const loginUser = (data) => {
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const isEnrolled = (courseId) => user?.enrolledCourses?.some(c => (c._id || c) === courseId);
  const hasBatch = (batchId) => user?.purchasedBatches?.some(b => (b._id || b) === batchId);
  const isBookmarked = (projectId) => user?.bookmarkedProjects?.some(p => (p._id || p) === projectId);

  return (
    <AuthContext.Provider value={{ user, token, loading, loginUser, logoutUser, setUser, loadUser, isEnrolled, hasBatch, isBookmarked }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
