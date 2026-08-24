const express = require('express');
const router = express.Router();
const { getProjects, getProject, createProject, updateProject, deleteProject, toggleLike, toggleBookmark, getFeaturedProjects } = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getProjects);
router.get('/featured', getFeaturedProjects);
router.get('/:slug', getProject);
router.post('/', protect, authorize('admin', 'tutor'), createProject);
router.put('/:id', protect, authorize('admin', 'tutor'), updateProject);
router.delete('/:id', protect, authorize('admin'), deleteProject);
router.put('/:id/like', protect, toggleLike);
router.put('/:id/bookmark', protect, toggleBookmark);

module.exports = router;
