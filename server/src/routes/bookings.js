import { Router } from 'express';
import { z } from 'zod';
import { DateTime } from 'luxon';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CLINIC_TZ, clinicDateOf, generateSlots } from '../utils/slots.js';
import { sendMail } from '../utils/mailer.js';

const router = Router();
router.use(requireAuth);

const fmt = (d) =>
  DateTime.fromJSDate(d).setZone(CLINIC_TZ).toFormat("ccc, dd LLL yyyy 'at' hh:mm a");

// Patient books a slot
router.post('/', requireRole('patient'), async (req, res, next) => {
  try {
    const { doctorId, start, reason } = z
      .object({ doctorId: z.string(), start: z.string().datetime(), reason: z.string().max(300).optional() })
      .parse(req.body);

    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });

    // 1) Validate: the requested time must be a real, future slot in the doctor's schedule.
    const startDate = new Date(start);
    const valid = generateSlots(doctor.profile, clinicDateOf(startDate)).find(
      (s) => new Date(s.start).getTime() === startDate.getTime()
    );
    if (!valid) return res.status(400).json({ message: 'That time is not available for this doctor.' });

    // 2) Insert. The unique partial index rejects a second booking for the same slot,
    //    even if two patients click at the exact same moment.
    let booking;
    try {
      booking = await Booking.create({
        doctor: doctor._id,
        patient: req.user._id,
        start: startDate,
        end: new Date(valid.end),
        reason,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: 'Sorry, someone just booked that slot. Pick another time.' });
      }
      throw err;
    }

    sendMail({
      to: req.user.email,
      subject: 'Appointment confirmed',
      text: `Hi ${req.user.name},\n\nYour appointment with Dr. ${doctor.name} is confirmed for ${fmt(startDate)}.\n\nCity Clinic`,
    });

    res.status(201).json({ booking });
  } catch (err) {
    next(err);
  }
});

// My bookings: patients see their appointments, doctors see their schedule
router.get('/mine', async (req, res, next) => {
  try {
    const filter = req.user.role === 'doctor' ? { doctor: req.user._id } : { patient: req.user._id };
    const bookings = await Booking.find(filter)
      .populate('doctor', 'name profile.specialization')
      .populate('patient', 'name email phone')
      .sort({ start: -1 });
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

// Cancel. Patients must cancel at least 2 hours before; doctors can cancel any time.
router.patch('/:id/cancel', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('doctor patient', 'name email');
    const isOwner =
      booking &&
      (String(booking.patient._id) === String(req.user._id) || String(booking.doctor._id) === String(req.user._id));
    if (!isOwner) return res.status(404).json({ message: 'Booking not found.' });
    if (booking.status !== 'booked') return res.status(400).json({ message: 'This booking is already closed.' });

    if (req.user.role === 'patient' && booking.start.getTime() - Date.now() < 2 * 60 * 60 * 1000) {
      return res.status(400).json({ message: 'Appointments can only be cancelled up to 2 hours before.' });
    }

    booking.status = 'cancelled';
    await booking.save();

    const other = req.user.role === 'doctor' ? booking.patient : booking.doctor;
    sendMail({
      to: other.email,
      subject: 'Appointment cancelled',
      text: `The appointment on ${fmt(booking.start)} was cancelled by ${req.user.name}.`,
    });

    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

// Doctor marks a visit as completed
router.patch('/:id/complete', requireRole('doctor'), async (req, res, next) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, doctor: req.user._id, status: 'booked' },
      { status: 'completed' },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

export default router;
