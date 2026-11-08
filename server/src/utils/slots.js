import { DateTime } from 'luxon';

export const CLINIC_TZ = process.env.CLINIC_TZ || 'Asia/Kolkata';

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Build all slots for one doctor on one calendar date (clinic time zone).
 * Slots are computed on the fly from the doctor's rules, never stored.
 *
 * @param profile      doctor.profile
 * @param dateStr      'YYYY-MM-DD' (a date in the clinic's time zone)
 * @param bookedStarts Date[] of already-booked start times
 * @param now          DateTime, injectable for tests
 * @returns [{ start: ISO-UTC, end: ISO-UTC, available: boolean }]
 */
export function generateSlots(profile, dateStr, bookedStarts = [], now = DateTime.now()) {
  const day = DateTime.fromISO(dateStr, { zone: CLINIC_TZ }).startOf('day');
  if (!day.isValid) return [];
  if (!profile.workingDays.includes(day.weekday)) return [];

  const open = toMinutes(profile.startTime);
  const close = toMinutes(profile.endTime);
  const step = profile.slotMinutes;
  const hasBreak = profile.breakStart && profile.breakEnd;
  const breakStart = hasBreak ? toMinutes(profile.breakStart) : 0;
  const breakEnd = hasBreak ? toMinutes(profile.breakEnd) : 0;
  const taken = new Set(bookedStarts.map((d) => new Date(d).getTime()));

  const slots = [];
  for (let m = open; m + step <= close; m += step) {
    // skip anything that overlaps the lunch break
    if (hasBreak && m < breakEnd && m + step > breakStart) continue;

    // set() uses wall-clock time, so this stays correct across DST changes
    const start = day.set({ hour: Math.floor(m / 60), minute: m % 60 });
    if (start <= now) continue; // no slots in the past

    slots.push({
      start: start.toUTC().toISO(),
      end: start.plus({ minutes: step }).toUTC().toISO(),
      available: !taken.has(start.toMillis()),
    });
  }
  return slots;
}

/** The clinic-local date string for a given UTC instant. */
export const clinicDateOf = (isoOrDate) =>
  DateTime.fromJSDate(new Date(isoOrDate)).setZone(CLINIC_TZ).toISODate();
