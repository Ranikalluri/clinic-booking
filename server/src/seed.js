import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Booking from './models/Booking.js';

await mongoose.connect(process.env.MONGO_URI);
await Promise.all([User.deleteMany({}), Booking.deleteMany({})]);

const passwordHash = await bcrypt.hash('password123', 10);

await User.insertMany([
  {
    name: 'Anita Rao', email: 'anita@clinic.test', passwordHash, role: 'doctor',
    profile: { specialization: 'General Physician', fee: 400, bio: '12 years in family medicine.' },
  },
  {
    name: 'Ravi Kumar', email: 'ravi@clinic.test', passwordHash, role: 'doctor',
    profile: { specialization: 'Dermatologist', fee: 700, bio: 'Skin, hair and allergy care.', slotMinutes: 20, startTime: '10:00', endTime: '18:00', workingDays: [1, 2, 3, 4, 5, 6] },
  },
  {
    name: 'Meena Iyer', email: 'meena@clinic.test', passwordHash, role: 'doctor',
    profile: { specialization: 'Pediatrician', fee: 600, bio: 'Newborn to teenage care.', slotMinutes: 15 },
  },
  { name: 'Test Patient', email: 'patient@clinic.test', passwordHash, role: 'patient', phone: '9999999999' },
]);

console.log('Seeded. Log in with patient@clinic.test or anita@clinic.test, password: password123');
await mongoose.disconnect();
