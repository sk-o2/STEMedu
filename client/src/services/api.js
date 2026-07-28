import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);
export const changePassword = (data) => API.put('/auth/change-password', data);
export const forgotPassword = (data) => API.post('/auth/forgot-password', data);
export const resetPassword = (token, data) => API.put(`/auth/reset-password/${token}`, data);
export const verifyEmail = (token) => API.get(`/auth/verify-email/${token}`);
export const resendVerification = () => API.post('/auth/resend-verification');

// Courses
export const getCourses = (params) => API.get('/courses', { params });
export const getFeaturedCourses = () => API.get('/courses/featured');
export const getCourse = (slug) => API.get(`/courses/${slug}`);
export const enrollCourse = (id) => API.post(`/courses/${id}/enroll`);
export const addReview = (id, data) => API.post(`/courses/${id}/review`, data);
export const createCourseCheckout = (id) => API.post(`/courses/${id}/checkout`);
export const createCourse = (data) => API.post('/courses', data);
export const updateCourse = (id, data) => API.put(`/courses/${id}`, data);
export const deleteCourse = (id) => API.delete(`/courses/${id}`);

// Projects
export const getProjects = (params) => API.get('/projects', { params });
export const getFeaturedProjects = () => API.get('/projects/featured');
export const getProject = (slug) => API.get(`/projects/${slug}`);
export const toggleLike = (id) => API.put(`/projects/${id}/like`);
export const toggleBookmark = (id) => API.put(`/projects/${id}/bookmark`);
export const createProject = (data) => API.post('/projects', data);
export const updateProject = (id, data) => API.put(`/projects/${id}`, data);
export const deleteProject = (id) => API.delete(`/projects/${id}`);

// Uploads
export const uploadFile = (formData) => API.post('/upload/file', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const uploadImage = (formData) => API.post('/upload/image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// AI
export const suggestProjects = (data) => API.post('/ai/suggest', data);
export const aiChat = (data) => API.post('/ai/chat', data);

// Chat
export const getMySessions = () => API.get('/chat/my-sessions');
export const getAllSessions = () => API.get('/chat/all-sessions');
export const startSession = (data) => API.post('/chat/start', data);
export const getMessages = (id) => API.get(`/chat/${id}/messages`);
export const sendMessage = (id, data) => API.post(`/chat/${id}/messages`, data);
export const closeSession = (id) => API.put(`/chat/${id}/close`);
export const claimSession = (id) => API.put(`/chat/${id}/claim`);

// Admin - Stats
export const getAdminStats = () => API.get('/admin/stats');

// Admin - Users
export const getUsers = (params) => API.get('/admin/users', { params });
export const updateUserRole = (id, role) => API.put(`/admin/users/${id}/role`, { role });
export const adminUpdateUser = (id, data) => API.put(`/admin/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/admin/users/${id}`);

// Admin - Courses
export const adminGetCourses = (params) => API.get('/admin/courses', { params });
export const adminGetCourseAnalytics = () => API.get('/admin/courses/analytics');
export const adminGetCourse = (id) => API.get(`/admin/courses/${id}`);
export const adminCreateCourse = (data) => API.post('/admin/courses', data);
export const adminUpdateCourse = (id, data) => API.put(`/admin/courses/${id}`, data);
export const adminDeleteCourse = (id) => API.delete(`/admin/courses/${id}`);

// Admin - Projects
export const adminGetProjects = (params) => API.get('/admin/projects', { params });
export const adminGetProject = (id) => API.get(`/admin/projects/${id}`);
export const adminCreateProject = (data) => API.post('/admin/projects', data);
export const adminUpdateProject = (id, data) => API.put(`/admin/projects/${id}`, data);
export const adminDeleteProject = (id) => API.delete(`/admin/projects/${id}`);

// Mentoring
export const getMentoringPackages = () => API.get('/mentoring/packages');
export const getMentoringSlots = (params) => API.get('/mentoring/slots', { params });
export const getMentoringTutors = () => API.get('/mentoring/tutors');
export const bookMentoringSession = (data) => API.post('/mentoring/book', data);
export const getMyMentoringBookings = () => API.get('/mentoring/my-bookings');
export const cancelMentoringBooking = (id) => API.put(`/mentoring/my-bookings/${id}/cancel`);
export const getTutorMentoringBookings = (params) => API.get('/mentoring/tutor-bookings', { params });
export const acceptMentoringBooking = (id) => API.put(`/mentoring/tutor-bookings/${id}/accept`);
export const rejectMentoringBooking = (id, data) => API.put(`/mentoring/tutor-bookings/${id}/reject`, data);
export const rescheduleMentoringBooking = (id, data) => API.put(`/mentoring/tutor-bookings/${id}/reschedule`, data);
export const addMeetingLink = (id, data) => API.put(`/mentoring/tutor-bookings/${id}/meeting-link`, data);
export const markMentoringCompleted = (id) => API.put(`/mentoring/tutor-bookings/${id}/complete`);
export const adminGetMentoringBookings = (params) => API.get('/mentoring/admin/all', { params });
export const adminGetMentoringRevenue = () => API.get('/mentoring/admin/revenue');
export const adminCancelMentoringBooking = (id) => API.put(`/mentoring/admin/${id}/cancel`);
export const adminAssignTutor = (id, tutorId) => API.put(`/mentoring/admin/${id}/assign-tutor`, { tutorId });
export const adminUpdateMentoringPricing = (data) => API.put('/mentoring/admin/pricing', data);

// Razorpay Payment Gateway
export const createRazorpayCourseOrder = (courseId) => API.post(`/courses/${courseId}/create-razorpay-order`);
export const verifyRazorpayCoursePayment = (data) => API.post('/courses/verify-razorpay-payment', data);
export const createRazorpayMentoringOrder = (data) => API.post('/mentoring/create-razorpay-order', data);
export const verifyRazorpayMentoringPayment = (data) => API.post('/mentoring/verify-razorpay-payment', data);

export default API;

