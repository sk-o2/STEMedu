const Course = require('../models/Course');
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createRazorpayOrder, verifyRazorpaySignature } = require('../utils/razorpay');

// @desc Get all courses with filters
exports.getCourses = async (req, res, next) => {
  try {
    const { category, level, isFree, search, page = 1, limit = 12 } = req.query;
    const query = { isPublished: true };
    if (category) query.category = category;
    if (level) query.level = level;
    if (isFree !== undefined) query.isFree = isFree === 'true';
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .populate('instructor', 'name avatar')
      .select('-curriculum')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.status(200).json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), courses });
  } catch (err) { next(err); }
};

// @desc Get single course by slug
exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug, isPublished: true })
      .populate('instructor', 'name avatar bio')
      .populate('studentsEnrolled', '_id');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.status(200).json({ success: true, course });
  } catch (err) { next(err); }
};

// @desc Create course (admin/tutor)
exports.createCourse = async (req, res, next) => {
  try {
    req.body.instructor = req.user.id;
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, course });
  } catch (err) { next(err); }
};

// @desc Update course
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.status(200).json({ success: true, course });
  } catch (err) { next(err); }
};

// @desc Delete course
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.status(200).json({ success: true, message: 'Course deleted' });
  } catch (err) { next(err); }
};

// @desc Enroll in free course
exports.enrollCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (!course.isFree) return res.status(400).json({ success: false, message: 'This course requires purchase' });
    if (course.studentsEnrolled.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Already enrolled' });
    }
    course.studentsEnrolled.push(req.user.id);
    await course.save();
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { enrolledCourses: course._id } });
    res.status(200).json({ success: true, message: 'Enrolled successfully' });
  } catch (err) { next(err); }
};

// @desc Add review
exports.addReview = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    const alreadyReviewed = course.reviews.find(r => r.user.toString() === req.user.id);
    if (alreadyReviewed) return res.status(400).json({ success: false, message: 'Already reviewed' });
    course.reviews.push({ user: req.user.id, rating: req.body.rating, comment: req.body.comment });
    course.calculateRating();
    await course.save();
    res.status(201).json({ success: true, message: 'Review added' });
  } catch (err) { next(err); }
};

// @desc Get featured / top courses
exports.getFeaturedCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate('instructor', 'name avatar')
      .select('-curriculum')
      .sort({ studentsEnrolled: -1, rating: -1 })
      .limit(6);
    res.status(200).json({ success: true, courses });
  } catch (err) { next(err); }
};

// @desc Create Stripe checkout session
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (course.isFree) return res.status(400).json({ success: false, message: 'Course is free' });

    const alreadyPurchased = (await User.findById(req.user.id)).enrolledCourses.includes(course._id);
    if (alreadyPurchased) return res.status(400).json({ success: false, message: 'Already purchased' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: req.user.email,
      metadata: { userId: req.user.id, courseId: course._id.toString() },
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: { name: course.title, description: course.description },
          unit_amount: Math.round((course.discountPrice || course.price) * 100),
        },
        quantity: 1,
      }],
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/courses/${course.slug}`,
    });

    res.status(200).json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    if (err.type && err.type.startsWith('Stripe')) {
      err.statusCode = 500;
      err.message = 'Payment gateway configuration error (Stripe key invalid)';
    }
    next(err);
  }
};

// @desc Stripe webhook handler
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, courseId } = session.metadata;
    try {
      await User.findByIdAndUpdate(userId, { $addToSet: { enrolledCourses: courseId } });
      await Course.findByIdAndUpdate(courseId, { $addToSet: { studentsEnrolled: userId } });
    } catch (err) { console.error('Webhook processing error:', err); }
  }
  res.json({ received: true });
};

// ── Razorpay Integration ──────────────────────────────────────────────────────

// @desc Create Razorpay order for course purchase
exports.createRazorpayCourseOrder = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const user = await User.findById(req.user.id);
    if (user.enrolledCourses.includes(course._id)) {
      return res.status(400).json({ success: false, message: 'You are already enrolled in this course' });
    }

    const price = course.isFree ? 0 : (course.discountPrice || course.price || 0);
    if (price === 0) {
      // Free course enrollment
      await User.findByIdAndUpdate(req.user.id, { $addToSet: { enrolledCourses: course._id } });
      await Course.findByIdAndUpdate(course._id, { $addToSet: { studentsEnrolled: req.user.id } });
      return res.status(200).json({ success: true, isFree: true, message: 'Enrolled in free course successfully' });
    }

    const order = await createRazorpayOrder({
      amount: price,
      currency: 'INR',
      receipt: `course_${course._id.toString().slice(-6)}_${Date.now().toString().slice(-6)}`,
      notes: { courseId: course._id.toString(), userId: req.user.id },
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
      course: { id: course._id, title: course.title, price },
    });
  } catch (err) { next(err); }
};

// @desc Verify Razorpay payment and complete course enrollment
exports.verifyRazorpayCoursePayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId } = req.body;

    if (!courseId) return res.status(400).json({ success: false, message: 'Course ID is required' });

    const isValid = verifyRazorpaySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Enroll student in course
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { enrolledCourses: courseId } });
    await Course.findByIdAndUpdate(courseId, { $addToSet: { studentsEnrolled: req.user.id } });

    res.status(200).json({
      success: true,
      message: '🎉 Payment successful! You are now enrolled in the course.',
    });
  } catch (err) { next(err); }
};

