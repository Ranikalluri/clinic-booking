// Needs MongoDB running (uses a separate test database).
import 'dotenv/config';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Booking from '../src/models/Booking.js';

const uri = (process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/clinic_booking') + '_test';
await mongoose.connect(uri);
await Booking.deleteMany({});
await Booking.init();
after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('20 simultaneous requests for one slot -> exactly one succeeds', async () => {
  const doctor = new mongoose.Types.ObjectId();
  const start = new Date('2030-03-04T04:00:00Z');
  const end = new Date('2030-03-04T04:30:00Z');

  const results = await Promise.allSettled(
    Array.from({ length: 20 }, () =>
      Booking.create({ doctor, patient: new mongoose.Types.ObjectId(), start, end })
    )
  );
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(results.filter((r) => r.status === 'rejected').length, 19);
});

test('a cancelled slot can be booked again', async () => {
  const doctor = new mongoose.Types.ObjectId();
  const start = new Date('2030-03-05T04:00:00Z');
  const end = new Date('2030-03-05T04:30:00Z');
  const first = await Booking.create({ doctor, patient: new mongoose.Types.ObjectId(), start, end });
  first.status = 'cancelled';
  await first.save();
  await Booking.create({ doctor, patient: new mongoose.Types.ObjectId(), start, end }); // must not throw
});
