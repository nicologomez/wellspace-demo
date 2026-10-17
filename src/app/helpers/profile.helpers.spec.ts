import { THERAPISTS, DEFAULT_AVAILABILITY } from '../data/demo-data';
import { DEFAULT_AVA_PROFILE } from '../data/ava-profile';
import { allowedChoice, directoryWithAva } from './profile.helpers';
import { mergeSort, possibleTimes } from './client.helpers';
import { conflictsWithBookings } from './therapist.helpers';
import { Appointment, Format } from '../models/wellspace.model';

describe('Wellspace shared integration helpers', () => {
  it('merges Ava’s live card without changing sample therapists', () => {
    const changed = {
      ...DEFAULT_AVA_PROFILE,
      title: 'Working with greater clarity',
      formats: ['Video'] as Format[],
    };
    const merged = directoryWithAva(THERAPISTS, changed);
    expect(merged.find((t) => t.id === 'ava')?.title).toBe('Working with greater clarity');
    expect(merged.find((t) => t.id === 'noah')).toEqual(THERAPISTS.find((t) => t.id === 'noah'));
    expect(THERAPISTS.find((t) => t.id === 'ava')?.formats).toEqual(['Video', 'Call', 'In-Person']);
  });

  it('allows only currently offered formats and focus areas', () => {
    const changed = { ...DEFAULT_AVA_PROFILE, formats: ['Video'] as Format[] };
    expect(allowedChoice(changed, 'Video', 'Burnout')).toBe(true);
    expect(allowedChoice(changed, 'Call', 'Burnout')).toBe(false);
    expect(allowedChoice(changed, 'Video', 'Career')).toBe(false);
    expect(allowedChoice(undefined, 'Video', 'Burnout')).toBe(false);
  });

  it('retains the existing merge-sort ordering', () => {
    const sorted = mergeSort(THERAPISTS, (t) => t.name).map((t) => t.name);
    expect(sorted).toEqual([...sorted].sort());
  });

  it('recognizes a future reservation lost to a schedule edit', () => {
    const date = '2026-10-19'; // Fixed example: Monday, independent of real today.
    const booking: Appointment = {
      id: 'one',
      clientId: 'nichols-uid',
      therapistId: 'ava',
      date,
      time: '09:00',
      format: 'Video',
      focusArea: 'Burnout',
      context: '',
      status: 'booked',
      slotKey: 'ava_20261019_0900',
      createdAt: 0,
      updatedAt: 0,
    };
    const edited = {
      ...DEFAULT_AVAILABILITY,
      days: {
        ...DEFAULT_AVAILABILITY.days,
        Monday: { ...DEFAULT_AVAILABILITY.days['Monday'], enabled: false },
      },
    };
    const fixedNow = new Date(2026, 9, 18, 10);
    expect(possibleTimes(date, DEFAULT_AVAILABILITY, fixedNow).includes('09:00')).toBe(true);
    expect(conflictsWithBookings(edited, [booking], fixedNow)).toBe(true);
  });
});
