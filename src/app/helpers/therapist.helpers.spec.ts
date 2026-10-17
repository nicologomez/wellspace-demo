import { DEFAULT_AVAILABILITY } from '../data/demo-data';
import { Appointment } from '../models/wellspace.model';
import { conflictsWithBookings, validDay, weeklyHours } from './therapist.helpers';

describe('Therapist schedule helpers', () => {
  it('counts 40 available hours for the default week', () => {
    expect(weeklyHours(DEFAULT_AVAILABILITY)).toBe(40);
  });

  it('rejects a break after the working day', () => {
    const bad = { ...DEFAULT_AVAILABILITY.days['Monday'], breakEnd: '19:00' };
    expect(validDay(bad)).toBeFalse();
  });

  it('prevents removing a future booked Monday', () => {
    const booked = {
      id: 'test',
      date: '2099-10-19',
      time: '09:00',
      status: 'booked',
    } as Appointment;
    const changed = {
      ...DEFAULT_AVAILABILITY,
      days: {
        ...DEFAULT_AVAILABILITY.days,
        Monday: { ...DEFAULT_AVAILABILITY.days['Monday'], enabled: false },
      },
    };
    expect(conflictsWithBookings(changed, [booked])).toBeTrue();
  });
});
