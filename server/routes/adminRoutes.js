const express = require('express');
const router = express.Router();
const {
  getStats,
  getUsers,
  updateUserRole,
  updateUser,
  deleteUser,
  getAllCourses,
  getCourseAnalytics,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

// Dashboard
router.get('/stats', getStats);

// Users
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Courses (admin full access - including unpublished)
router.get('/courses', getAllCourses);
router.get('/courses/analytics', getCourseAnalytics);
router.get('/courses/:id', getCourseById);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Projects (admin full access - including unpublished)
router.get('/projects', getAllProjects);
router.get('/projects/:id', getProjectById);
router.post('/projects', createProject);
router.put('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

module.exports = router;
