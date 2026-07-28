const mongoose = require('mongoose');

const StepSchema = new mongoose.Schema({
  stepNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: [String],
  codeSnippet: String,
  codeLanguage: String,
  tip: String,
  warning: String,
});

const ComponentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  optional: { type: Boolean, default: false },
  description: String,
  link: String, // buy link
});

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Project title is required'], trim: true },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String, required: true },
  shortDescription: { type: String, maxlength: 250 },
  thumbnail: { type: String, default: '' },
  category: {
    type: String,
    enum: ['Robotics', 'Game Development', 'Drone Technology', 'IoT', 'AI & Machine Learning', 'Electronics', '3D Printing', 'Coding'],
    required: true,
  },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  estimatedTime: String, // e.g. "2-3 hours"
  components: [ComponentSchema],
  steps: [StepSchema],
  tags: [String],
  isFree: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  relatedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  videoUrl: String,
  githubUrl: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });

ProjectSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Project', ProjectSchema);
