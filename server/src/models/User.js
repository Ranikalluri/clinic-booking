import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    specialization: { type: String, default: 'General Physician' },
    bio: { type: String, default: '' },
    fee: { type: Number, default: 500 },
    // Luxon weekday numbers: 1 = Monday ... 7 = Sunday
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5] },
    startTime: { type: String, default: '09:00' },
    endTime: { type: String, default: '17:00' },
    breakStart: { type: String, default: '13:00' },
    breakEnd: { type: String, default: '14:00' },
    slotMinutes: { type: Number, default: 30 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: '' },
    role: { type: String, enum: ['patient', 'doctor'], default: 'patient' },
    profile: { type: profileSchema, default: undefined }, // doctors only
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function () {
  const o = this.toObject();
  delete o.passwordHash;
  delete o.__v;
  return o;
};

export default mongoose.model('User', userSchema);
