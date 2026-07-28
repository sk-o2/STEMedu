const mongoose = require('mongoose');

const AISessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: String, required: true, unique: true },
  components: [{ name: String, quantity: Number }],
  conversation: [{
    role: { type: String, enum: ['user', 'model'] },
    parts: [{ text: String }],
    timestamp: { type: Date, default: Date.now },
  }],
  suggestedProjects: [{
    title: String,
    description: String,
    difficulty: String,
    additionalComponents: [String],
    matchScore: Number,
  }],
}, { timestamps: true });

module.exports = mongoose.model('AISession', AISessionSchema);
