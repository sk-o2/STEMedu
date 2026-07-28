const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const MentoringBookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    default: () => 'BKG-' + uuidv4().split('-')[0].toUpperCase(),
  },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tutor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // assigned later or chosen
  package: {
    type: String,
    enum: ['30min', '1hr', '2hr'],
    required: true,
  },
  duration: { type: Number, required: true },   // minutes: 30, 60, 120
  price:    { type: Number, required: true },    // ₹
  date:     { type: String, required: true },    // YYYY-MM-DD
  time:     { type: String, required: true },    // HH:MM (24h)
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'rescheduled', 'completed'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending',
  },
  meetingLink:     { type: String, default: '' },
  meetingPlatform: { type: String, enum: ['google_meet', 'zoom', 'other', ''], default: '' },
  rejectionReason:    { type: String, default: '' },
  rescheduleDate:     { type: String, default: '' },
  rescheduleTime:     { type: String, default: '' },
  rescheduleReason:   { type: String, default: '' },
  studentNote:        { type: String, maxlength: 500, default: '' },
  completedAt:        { type: Date },
}, { timestamps: true });

// Index for fast queries
MentoringBookingSchema.index({ student: 1, status: 1 });
MentoringBookingSchema.index({ tutor: 1, status: 1 });
MentoringBookingSchema.index({ date: 1, time: 1, tutor: 1 });

module.exports = mongoose.model('MentoringBooking', MentoringBookingSchema);
