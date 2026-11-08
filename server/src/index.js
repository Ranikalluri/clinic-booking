import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import authRoutes from './routes/auth.js';
import doctorRoutes from './routes/doctors.js';
import bookingRoutes from './routes/bookings.js';
import { startReminderJob } from './jobs/reminders.js';
import Booking from './models/Booking.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/bookings', bookingRoutes);

// Central error handler
app.use((err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: err.issues[0].message, issues: err.issues });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id.' });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on our side.' });
});

const PORT = process.env.PORT || 5000;
await mongoose.connect(process.env.MONGO_URI);
await Booking.init(); // make sure the unique index exists before taking bookings
startReminderJob();
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
