const express = require('express');
const router = express.Router();
const {
  getCourses, getCourse, createCourse, updateCourse, deleteCourse,
  enrollCourse, addReview, getFeaturedCourses, createCheckoutSession, stripeWebhook,
  createRazorpayCourseOrder, verifyRazorpayCoursePayment,
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

// Webhook needs to be before anything that parses body differently, though it is usually handled in index.js, but just in case we have a specific path:
// However we mapped /api/courses/webhook in index.js for raw body.
router.post('/webhook', stripeWebhook);

router.get('/', getCourses);
router.get('/featured', getFeaturedCourses);
router.post('/verify-razorpay-payment', protect, verifyRazorpayCoursePayment);
router.get('/:slug', getCourse);
router.post('/', protect, authorize('admin', 'tutor'), createCourse);
router.put('/:id', protect, authorize('admin', 'tutor'), updateCourse);
router.delete('/:id', protect, authorize('admin'), deleteCourse);
router.post('/:id/enroll', protect, enrollCourse);
router.post('/:id/checkout', protect, createCheckoutSession);
router.post('/:id/create-razorpay-order', protect, createRazorpayCourseOrder);
router.post('/:id/review', protect, addReview);

module.exports = router;
