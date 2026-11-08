import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { generateSlots } from '../src/utils/slots.js';

const profile = {
  workingDays: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '12:00',
  breakStart: '', breakEnd: '', slotMinutes: 30,
};
const longAgo = DateTime.fromISO('2020-01-01');

test('generates 6 half-hour slots for 09:00-12:00', () => {
  const slots = generateSlots(profile, '2030-03-04', [], longAgo); // a Monday
  assert.equal(slots.length, 6);
});

test('returns nothing on non-working days', () => {
  assert.equal(generateSlots(profile, '2030-03-03', [], longAgo).length, 0); // Sunday
});

test('skips the lunch break', () => {
  const p = { ...profile, endTime: '15:00', breakStart: '12:00', breakEnd: '13:00' };
  const slots = generateSlots(p, '2030-03-04', [], longAgo);
  assert.equal(slots.length, 6 + 4); // 09-12 and 13-15
});

test('marks booked slots unavailable', () => {
  const first = generateSlots(profile, '2030-03-04', [], longAgo)[0];
  const slots = generateSlots(profile, '2030-03-04', [new Date(first.start)], longAgo);
  assert.equal(slots[0].available, false);
  assert.equal(slots[1].available, true);
});

test('hides slots that are already in the past', () => {
  const now = DateTime.fromISO('2030-03-04T10:00:00', { zone: 'Asia/Kolkata' });
  const slots = generateSlots(profile, '2030-03-04', [], now);
  assert.equal(slots.length, 3); // 10:30, 11:00, 11:30
});
