const MentoringBooking = require('../models/MentoringBooking');
const User = require('../models/User');
const { sendMentoringEmail } = require('../utils/mailer');
const { createRazorpayOrder, verifyRazorpaySignature } = require('../utils/razorpay');

// Configurable packages (can be overridden by env vars)
const PACKAGES = {
  '30min': { duration: 30,  price: Number(process.env.MENTORING_PRICE_30MIN) || 99,  label: '30 Minutes' },
  '1hr':   { duration: 60,  price: Number(process.env.MENTORING_PRICE_1HR)   || 199, label: '1 Hour'     },
  '2hr':   { duration: 120, price: Number(process.env.MENTORING_PRICE_2HR)   || 349, label: '2 Hours'    },
};

// Helper: generate available time slots (9AM–6PM, every hour, skip booked)
const ALL_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

// ── @desc  Get packages & pricing
exports.getPackages = (req, res) => {
  res.json({ success: true, packages: PACKAGES });
};

// ── @desc  Get available slots for a date (+ optional tutor)
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { date, tutorId } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    const query = { date, status: { $in: ['pending', 'confirmed'] } };
    if (tutorId) query.tutor = tutorId;

    const booked = await MentoringBooking.find(query).select('time');
    const bookedTimes = booked.map(b => b.time);
    const available = ALL_SLOTS.filter(s => !bookedTimes.includes(s));

    res.json({ success: true, slots: available, bookedSlots: bookedTimes });
  } catch (err) { next(err); }
};

// ── @desc  Get all tutors (for student to choose from)
exports.getTutors = async (req, res, next) => {
  try {
    const tutors = await User.find({ role: 'tutor' }).select('name avatar bio email');
    res.json({ success: true, tutors });
  } catch (err) { next(err); }
};

// ── @desc  Create booking (student)
exports.createBooking = async (req, res, next) => {
  try {
    const { package: pkg, date, time, tutorId, studentNote } = req.body;

    if (!PACKAGES[pkg]) return res.status(400).json({ success: false, message: 'Invalid package' });
    const { duration, price } = PACKAGES[pkg];

    // Check slot is still free
    const conflict = await MentoringBooking.findOne({
      date, time, status: { $in: ['pending', 'confirmed'] },
      ...(tutorId ? { tutor: tutorId } : {}),
    });
    if (conflict) return res.status(400).json({ success: false, message: 'This slot is no longer available. Please choose another.' });

    const booking = await MentoringBooking.create({
      student: req.user.id,
      tutor: tutorId || null,
      package: pkg,
      duration,
      price,
      date,
      time,
      studentNote: studentNote || '',
      paymentStatus: 'paid', // Simulated payment
    });

    const populated = await MentoringBooking.findById(booking._id)
      .populate('student', 'name email avatar')
      .populate('tutor',   'name email avatar');

    // Notify tutor
    if (populated.tutor) {
      sendMentoringEmail('new_booking_tutor', populated).catch(console.error);
    }
    // Confirm student
    sendMentoringEmail('booking_received_student', populated).catch(console.error);

    res.status(201).json({ success: true, booking: populated });
  } catch (err) { next(err); }
};

// ── @desc  Create Razorpay order for 1-on-1 mentoring booking
exports.createRazorpayMentoringOrder = async (req, res, next) => {
  try {
    const { package: pkg, date, time, tutorId, studentNote } = req.body;

    if (!PACKAGES[pkg]) return res.status(400).json({ success: false, message: 'Invalid package' });
    const { duration, price } = PACKAGES[pkg];

    // Check slot availability
    const conflict = await MentoringBooking.findOne({
      date, time, status: { $in: ['pending', 'confirmed'] },
      ...(tutorId ? { tutor: tutorId } : {}),
    });
    if (conflict) return res.status(400).json({ success: false, message: 'This slot is no longer available. Please choose another.' });

    const order = await createRazorpayOrder({
      amount: price,
      currency: 'INR',
      receipt: `mentor_${Date.now().toString().slice(-8)}`,
      notes: { package: pkg, date, time, studentId: req.user.id },
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
      bookingPayload: { package: pkg, date, time, tutorId, studentNote, price, duration },
    });
  } catch (err) { next(err); }
};

// ── @desc  Verify Razorpay payment and create mentoring booking
exports.verifyRazorpayMentoringPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingPayload } = req.body;

    if (!bookingPayload) return res.status(400).json({ success: false, message: 'Booking payload is required' });

    const isValid = verifyRazorpaySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const { package: pkg, date, time, tutorId, studentNote, price, duration } = bookingPayload;

    const booking = await MentoringBooking.create({
      student: req.user.id,
      tutor: tutorId || null,
      package: pkg,
      duration: duration || PACKAGES[pkg]?.duration || 30,
      price: price || PACKAGES[pkg]?.price || 99,
      date,
      time,
      studentNote: studentNote || '',
      paymentStatus: 'paid',
    });

    const populated = await MentoringBooking.findById(booking._id)
      .populate('student', 'name email avatar')
      .populate('tutor',   'name email avatar');

    if (populated.tutor) {
      sendMentoringEmail('new_booking_tutor', populated).catch(console.error);
    }
    sendMentoringEmail('booking_received_student', populated).catch(console.error);

    res.status(201).json({ success: true, booking: populated });
  } catch (err) { next(err); }
};


// ── @desc  Get student's own bookings
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await MentoringBooking.find({ student: req.user.id })
      .populate('tutor', 'name avatar email')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) { next(err); }
};

// ── @desc  Cancel booking (student)
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await MentoringBooking.findOne({ _id: req.params.id, student: req.user.id })
      .populate('student', 'name email')
      .populate('tutor', 'name email');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (['cancelled','completed','rejected'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${booking.status} booking` });
    }
    booking.status = 'cancelled';
    await booking.save();

    if (booking.tutor) sendMentoringEmail('booking_cancelled_tutor', booking).catch(console.error);

    res.json({ success: true, booking });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────────────────────────────
// TUTOR ACTIONS
// ────────────────────────────────────────────────────────────────────────────────

// ── @desc  Get tutor's bookings (assigned to me OR unassigned)
exports.getTutorBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    // Show bookings assigned to this tutor AND unassigned bookings (tutor = null)
    const baseFilter = { $or: [{ tutor: req.user.id }, { tutor: null }] };
    const query = status && status !== 'all'
      ? { ...baseFilter, status }
      : baseFilter;
    const bookings = await MentoringBooking.find(query)
      .populate('student', 'name email avatar')
      .populate('tutor',   'name email avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) { next(err); }
};

// ── @desc  Accept booking (tutor) — also auto-assigns if unassigned
exports.acceptBooking = async (req, res, next) => {
  try {
    const booking = await MentoringBooking.findOne({
      _id: req.params.id,
      $or: [{ tutor: req.user.id }, { tutor: null }],
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    // Auto-assign tutor if not yet assigned
    if (!booking.tutor) booking.tutor = req.user.id;
    booking.status = 'confirmed';
    await booking.save();
    const populated = await booking.populate([
      { path: 'student', select: 'name email' },
      { path: 'tutor',   select: 'name email' },
    ]);
    sendMentoringEmail('booking_confirmed_student', populated).catch(console.error);
    res.json({ success: true, booking: populated });
  } catch (err) { next(err); }
};

// ── @desc  Reject booking (tutor)
exports.rejectBooking = async (req, res, next) => {
  try {
    const booking = await MentoringBooking.findOne({
      _id: req.params.id,
      $or: [{ tutor: req.user.id }, { tutor: null }],
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (!booking.tutor) booking.tutor = req.user.id;
    booking.status = 'rejected';
    booking.rejectionReason = req.body.reason || '';
    await booking.save();
    const populated = await booking.populate([
      { path: 'student', select: 'name email' },
      { path: 'tutor',   select: 'name email' },
    ]);
    sendMentoringEmail('booking_rejected_student', populated).catch(console.error);
    res.json({ success: true, booking: populated });
  } catch (err) { next(err); }
};

// ── @desc  Reschedule booking (tutor)
exports.rescheduleBooking = async (req, res, next) => {
  try {
    const { newDate, newTime, reason } = req.body;
    const booking = await MentoringBooking.findOne({
      _id: req.params.id,
      $or: [{ tutor: req.user.id }, { tutor: null }],
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (!booking.tutor) booking.tutor = req.user.id;
    booking.status = 'rescheduled';
    booking.rescheduleDate   = newDate;
    booking.rescheduleTime   = newTime;
    booking.rescheduleReason = reason || '';
    booking.date = newDate;
    booking.time = newTime;
    await booking.save();
    const populated = await booking.populate([
      { path: 'student', select: 'name email' },
      { path: 'tutor',   select: 'name email' },
    ]);
    sendMentoringEmail('booking_rescheduled_student', populated).catch(console.error);
    res.json({ success: true, booking: populated });
  } catch (err) { next(err); }
};

// ── @desc  Add meeting link (tutor)
exports.addMeetingLink = async (req, res, next) => {
  try {
    const { meetingLink, meetingPlatform } = req.body;
    const booking = await MentoringBooking.findOne({
      _id: req.params.id,
      $or: [{ tutor: req.user.id }, { tutor: null }],
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (!booking.tutor) booking.tutor = req.user.id;
    booking.meetingLink     = meetingLink;
    booking.meetingPlatform = meetingPlatform || 'google_meet';
    await booking.save();
    const populated = await booking.populate([
      { path: 'student', select: 'name email' },
      { path: 'tutor',   select: 'name email' },
    ]);
    sendMentoringEmail('meeting_link_added_student', populated).catch(console.error);
    res.json({ success: true, booking: populated });
  } catch (err) { next(err); }
};

// ── @desc  Mark completed (tutor)
exports.markCompleted = async (req, res, next) => {
  try {
    const booking = await MentoringBooking.findOne({
      _id: req.params.id,
      $or: [{ tutor: req.user.id }, { tutor: null }],
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (!booking.tutor) booking.tutor = req.user.id;
    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();
    res.json({ success: true, booking });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────────────────────────────
// ADMIN ACTIONS
// ────────────────────────────────────────────────────────────────────────────────

// ── @desc  Get all bookings (admin)
exports.adminGetBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    const bookings = await MentoringBooking.find(query)
      .populate('student', 'name email avatar')
      .populate('tutor',   'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await MentoringBooking.countDocuments(query);
    res.json({ success: true, total, bookings });
  } catch (err) { next(err); }
};

// ── @desc  Get revenue stats (admin)
exports.adminGetRevenue = async (req, res, next) => {
  try {
    const [totalRevenue, completed, pending, byPackage] = await Promise.all([
      MentoringBooking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$price' } } },
      ]),
      MentoringBooking.countDocuments({ status: 'completed' }),
      MentoringBooking.countDocuments({ status: 'pending' }),
      MentoringBooking.aggregate([
        { $group: { _id: '$package', count: { $sum: 1 }, revenue: { $sum: '$price' } } },
      ]),
    ]);
    res.json({
      success: true,
      revenue: {
        total: totalRevenue[0]?.total || 0,
        completed,
        pending,
        byPackage,
        packages: PACKAGES,
      },
    });
  } catch (err) { next(err); }
};

// ── @desc  Admin cancel booking
exports.adminCancelBooking = async (req, res, next) => {
  try {
    const booking = await MentoringBooking.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true })
      .populate('student', 'name email')
      .populate('tutor', 'name email');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, booking });
  } catch (err) { next(err); }
};

// ── @desc  Admin assign tutor
exports.adminAssignTutor = async (req, res, next) => {
  try {
    const booking = await MentoringBooking.findByIdAndUpdate(
      req.params.id,
      { tutor: req.body.tutorId },
      { new: true }
    ).populate('student', 'name email').populate('tutor', 'name email');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    sendMentoringEmail('new_booking_tutor', booking).catch(console.error);
    res.json({ success: true, booking });
  } catch (err) { next(err); }
};

// ── @desc  Admin update pricing (stored in env for now — returns current)
exports.adminUpdatePricing = async (req, res) => {
  // In a real app you'd persist to DB — for now just returns updated packages
  const { price30, price1hr, price2hr } = req.body;
  if (price30)  PACKAGES['30min'].price = Number(price30);
  if (price1hr) PACKAGES['1hr'].price   = Number(price1hr);
  if (price2hr) PACKAGES['2hr'].price   = Number(price2hr);
  res.json({ success: true, packages: PACKAGES, message: 'Pricing updated for this session' });
};
