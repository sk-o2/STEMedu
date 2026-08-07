const User = require('../models/User');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();
  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
    },
  });
};

// @desc Register user + send verification email
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const allowedRole = role === 'tutor' ? 'tutor' : 'student';

    // Generate email verification token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.create({
      name,
      email,
      password,
      role: allowedRole,
      isVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;

    // Fire email in background — do NOT await, so the response returns instantly
    sendVerificationEmail(user, verificationUrl).catch((emailErr) =>
      console.error('Verification email failed:', emailErr.message)
    );

    // Return token immediately — user is logged in but flagged as unverified
    sendToken(user, 201, res);
  } catch (err) { next(err); }
};

// @desc Verify email
exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link. Please request a new one.' });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    sendToken(user, 200, res);
  } catch (err) { next(err); }
};

// @desc Resend verification email
exports.resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ success: false, message: 'Email is already verified' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;
    await sendVerificationEmail(user, verificationUrl);

    res.status(200).json({ success: true, message: 'Verification email sent' });
  } catch (err) { next(err); }
};

// @desc Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Please provide email and password' });

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    sendToken(user, 200, res);
  } catch (err) { next(err); }
};

// @desc Get current user
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('enrolledCourses', 'title thumbnail category slug')
      .populate('bookmarkedProjects', 'title thumbnail slug');
    res.status(200).json({ success: true, user });
  } catch (err) { next(err); }
};

// @desc Update profile
exports.updateProfile = async (req, res, next) => {
  try {
    const updates = { name: req.body.name, bio: req.body.bio, avatar: req.body.avatar };
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.status(200).json({ success: true, user });
  } catch (err) { next(err); }
};

// @desc Change password
exports.changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = req.body.newPassword;
    await user.save();
    sendToken(user, 200, res);
  } catch (err) { next(err); }
};

// @desc Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with that email address' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

    try {
      await sendPasswordResetEmail(user, resetUrl);
      res.status(200).json({ success: true, message: 'Password reset email sent. Please check your inbox.' });
    } catch (emailErr) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent. Please try again.' });
    }
  } catch (err) { next(err); }
};

// @desc Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpire: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    sendToken(user, 200, res);
  } catch (err) { next(err); }
};
