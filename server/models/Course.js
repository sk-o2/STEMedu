const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['video', 'ppt', 'activity', 'pdf', 'link'], default: 'video' },
  url: String, // Can be video URL or link to resource
  duration: Number, // in minutes
  isFree: { type: Boolean, default: false },
  resources: [{ name: String, url: String }],
  order: Number,
});

const SectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  lessons: [LessonSchema],
  order: Number,
});

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: String,
  createdAt: { type: Date, default: Date.now },
});

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Course title is required'], trim: true },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String, required: true },
  shortDescription: { type: String, maxlength: 200 },
  thumbnail: { type: String, default: '' },
  previewVideo: String,
  category: {
    type: String,
    enum: ['Robotics', 'Game Development', 'Drone Technology', 'IoT', 'AI & Machine Learning', 'Electronics', '3D Printing', 'Coding'],
    required: true,
  },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isFree: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  discountPrice: Number,
  curriculum: [SectionSchema],
  studentsEnrolled: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reviews: [ReviewSchema],
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  totalDuration: Number, // total minutes
  totalLessons: { type: Number, default: 0 },
  tags: [String],
  requirements: [String],
  whatYouLearn: [String],
  isPublished: { type: Boolean, default: false },
  language: { type: String, default: 'English' },
  certificate: { type: Boolean, default: true },
}, { timestamps: true });

CourseSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

CourseSchema.methods.calculateRating = function () {
  if (this.reviews.length === 0) { this.rating = 0; this.totalReviews = 0; return; }
  const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
  this.rating = (sum / this.reviews.length).toFixed(1);
  this.totalReviews = this.reviews.length;
};

module.exports = mongoose.model('Course', CourseSchema);
