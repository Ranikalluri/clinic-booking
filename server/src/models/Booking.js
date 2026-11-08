import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    start: { type: Date, required: true }, // always UTC
    end: { type: Date, required: true },
    reason: { type: String, default: '', maxlength: 300 },
    status: { type: String, enum: ['booked', 'cancelled', 'completed'], default: 'booked' },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// THE double-booking guard: only one *active* booking per doctor per start time.
// Cancelled bookings are excluded, so a cancelled slot can be booked again.
bookingSchema.index(
  { doctor: 1, start: 1 },
  { unique: true, partialFilterExpression: { status: 'booked' } }
);
bookingSchema.index({ patient: 1, start: -1 });

export default mongoose.model('Booking', bookingSchema);
