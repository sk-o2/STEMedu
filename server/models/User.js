const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 50 },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'] },
  password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
  role: { type: String, enum: ['student', 'tutor', 'admin'], default: 'student' },
  avatar: { type: String, default: '' },
  bio: { type: String, maxlength: 500 },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  completedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  bookmarkedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  stripeCustomerId: { type: String },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  lastLogin: { type: Date },
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

UserSchema.methods.getRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE });
};

module.exports = mongoose.model('User', UserSchema);
