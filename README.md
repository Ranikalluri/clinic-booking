# City Clinic: Appointment Booking (MERN)

Patients find a doctor, pick a free time slot and book. Doctors set their working hours
and manage their schedule. Confirmation and 24-hour reminder emails are sent automatically.

## Features
- Two roles: **patient** and **doctor** (JWT login, bcrypt passwords, Zod validation)
- Doctors set working days, hours, lunch break and appointment length
- Slots are **generated on the fly** from those rules (never stored), using Luxon
- **Double-booking prevention** with a unique partial index in MongoDB
- Patients can cancel up to 2 hours before; doctors can cancel or mark visits as done
- Email confirmation, cancellation notice and a reminder job (node-cron, every 5 minutes)
- Emails print to the console unless you configure SMTP

## Setup

Requirements: Node 18+ and MongoDB (local, or a free MongoDB Atlas cluster).

```bash
# 1. API
cd server
cp .env.example .env        # then edit MONGO_URI and JWT_SECRET
npm install
npm run seed                # creates demo doctors and a patient
npm run dev                 # http://localhost:5000

# 2. Web app (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

Demo logins (password `password123`): `patient@clinic.test`, `anita@clinic.test` (doctor),
`ravi@clinic.test` (doctor).

## Tests
```bash
cd server
npm test                    # slot logic + a 20-concurrent-requests double-booking test (needs MongoDB)
```

## How the important parts work

**Slots.** `server/src/utils/slots.js` takes a doctor's profile and a date, steps through
the working hours in `slotMinutes` increments, skips the break and past times, and marks
booked ones `available: false`.

**Double booking.** `models/Booking.js` has a unique index on `{ doctor, start }` limited to
`status: 'booked'`. If two patients submit the same slot together, MongoDB rejects the second
insert and the API answers `409`. Cancelled slots can be booked again.

**Time zones.** Everything is stored in UTC. The clinic has one time zone (`CLINIC_TZ`),
used to turn "09:00" into a real instant and to display times.

## Folder structure
```
server/src
  models/      User.js, Booking.js
  routes/      auth.js, doctors.js, bookings.js
  middleware/  auth.js
  utils/       slots.js, mailer.js
  jobs/        reminders.js
  seed.js, index.js
client/src
  pages/       Doctors, Book, Appointments, DoctorSettings, Login, Register
  components/  Navbar
  lib/         api.js, format.js
```

## Ideas to extend
Stripe Checkout for deposits, Google Calendar sync, a doctor's days-off calendar,
SMS reminders, an admin role, and moving tokens to httpOnly cookies.
