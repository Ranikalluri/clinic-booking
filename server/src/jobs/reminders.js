import cron from 'node-cron';
import { DateTime } from 'luxon';
import Booking from '../models/Booking.js';
import { sendMail } from '../utils/mailer.js';
import { CLINIC_TZ } from '../utils/slots.js';

// Runs every 5 minutes: emails patients whose appointment starts within 24 hours.
export function startReminderJob() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const due = await Booking.find({
        status: 'booked',
        reminderSent: false,
        start: { $gt: now, $lte: in24h },
      }).populate('doctor patient', 'name email');

      for (const b of due) {
        // Claim the booking first so a second server instance never double-sends
        const claimed = await Booking.findOneAndUpdate(
          { _id: b._id, reminderSent: false },
          { reminderSent: true }
        );
        if (!claimed) continue;

        const when = DateTime.fromJSDate(b.start).setZone(CLINIC_TZ).toFormat("ccc, dd LLL 'at' hh:mm a");
        await sendMail({
          to: b.patient.email,
          subject: 'Reminder: appointment within 24 hours',
          text: `Hi ${b.patient.name}, this is a reminder of your appointment with Dr. ${b.doctor.name} on ${when}.`,
        });
      }
    } catch (err) {
      console.error('Reminder job failed:', err.message);
    }
  });
  console.log('Reminder job scheduled (every 5 minutes).');
}
