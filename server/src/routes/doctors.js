import { Router } from 'express';
import { z } from 'zod';
import { DateTime } from 'luxon';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CLINIC_TZ, generateSlots } from '../utils/slots.js';

const router = Router();
const PUBLIC_FIELDS = 'name profile';

// Doctor updates their own working hours / fee
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM format');
const profileSchema = z.object({
  specialization: z.string().min(2),
  bio: z.string().max(500).optional(),
  fee: z.coerce.number().min(0),
  workingDays: z.array(z.number().int().min(1).max(7)).min(1),
  startTime: hhmm,
  endTime: hhmm,
  breakStart: hhmm.or(z.literal('')).optional(),
  breakEnd: hhmm.or(z.literal('')).optional(),
  slotMinutes: z.coerce.number().int().refine((n) => [15, 20, 30, 45, 60].includes(n), 'Invalid slot length'),
});

router.put('/me/profile', requireAuth, requireRole('doctor'), async (req, res, next) => {
  try {
    const data = profileSchema.parse(req.body);
    if (data.startTime >= data.endTime) {
      return res.status(400).json({ message: 'Closing time must be after opening time.' });
    }
    req.user.profile = { ...req.user.profile.toObject(), ...data };
    await req.user.save();
    res.json({ user: req.user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (_req, res, next) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select(PUBLIC_FIELDS).sort({ name: 1 });
    res.json({ doctors });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' }).select(PUBLIC_FIELDS);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });
    res.json({ doctor });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/slots', async (req, res, next) => {
  try {
    const { date } = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(req.query);
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });

    const dayStart = DateTime.fromISO(date, { zone: CLINIC_TZ }).startOf('day');
    const booked = await Booking.find({
      doctor: doctor._id,
      status: 'booked',
      start: { $gte: dayStart.toJSDate(), $lt: dayStart.plus({ days: 1 }).toJSDate() },
    }).select('start');

    res.json({
      timezone: CLINIC_TZ,
      slots: generateSlots(doctor.profile, date, booked.map((b) => b.start)),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
