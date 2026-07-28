const express = require('express');
const router = express.Router();
const {
  getPackages,
  getAvailableSlots,
  getTutors,
  createBooking,
  createRazorpayMentoringOrder,
  verifyRazorpayMentoringPayment,
  getMyBookings,
  cancelBooking,
  getTutorBookings,
  acceptBooking,
  rejectBooking,
  rescheduleBooking,
  addMeetingLink,
  markCompleted,
  adminGetBookings,
  adminGetRevenue,
  adminCancelBooking,
  adminAssignTutor,
  adminUpdatePricing,
} = require('../controllers/mentoringController');
const { protect, authorize } = require('../middleware/auth');

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/packages',        getPackages);
router.get('/slots',           getAvailableSlots);
router.get('/tutors',          getTutors);

// ── Student ───────────────────────────────────────────────────────────────────
router.post('/book',                          protect, createBooking);
router.post('/create-razorpay-order',          protect, createRazorpayMentoringOrder);
router.post('/verify-razorpay-payment',        protect, verifyRazorpayMentoringPayment);
router.get('/my-bookings',                    protect, getMyBookings);
router.put('/my-bookings/:id/cancel',   protect, cancelBooking);

// ── Tutor ─────────────────────────────────────────────────────────────────────
router.get('/tutor-bookings',                    protect, authorize('tutor', 'admin'), getTutorBookings);
router.put('/tutor-bookings/:id/accept',         protect, authorize('tutor', 'admin'), acceptBooking);
router.put('/tutor-bookings/:id/reject',         protect, authorize('tutor', 'admin'), rejectBooking);
router.put('/tutor-bookings/:id/reschedule',     protect, authorize('tutor', 'admin'), rescheduleBooking);
router.put('/tutor-bookings/:id/meeting-link',   protect, authorize('tutor', 'admin'), addMeetingLink);
router.put('/tutor-bookings/:id/complete',       protect, authorize('tutor', 'admin'), markCompleted);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/admin/all',               protect, authorize('admin'), adminGetBookings);
router.get('/admin/revenue',           protect, authorize('admin'), adminGetRevenue);
router.put('/admin/:id/cancel',        protect, authorize('admin'), adminCancelBooking);
router.put('/admin/:id/assign-tutor',  protect, authorize('admin'), adminAssignTutor);
router.put('/admin/pricing',           protect, authorize('admin'), adminUpdatePricing);

module.exports = router;
