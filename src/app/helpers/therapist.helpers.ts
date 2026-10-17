import { Appointment, Availability, DaySchedule } from '../models/wellspace.model';
import { DEFAULT_AVAILABILITY } from '../data/demo-data';
import { possibleTimes } from './client.helpers';

export const WEEK_DAYS = (() => [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
])();

export function minutes(text: string): number {
  if (!/^\d\d:\d\d$/.test(text)) return -1;
  const [hour, minute] = text.split(':').map(Number);
  if (hour > 23 || minute > 59) return -1;
  return hour * 60 + minute;
}

export function validDay(day: DaySchedule): boolean {
  if (!day.enabled) return true;
  const [start, end, from, to] = [day.start, day.end, day.breakStart, day.breakEnd].map(minutes);
  if (Math.min(start, end, from, to) < 0) return false;
  if (end - start < 45 || from < start || to > end || to <= from) return false;
  let possible = 0;
  for (let time = start; time + 45 <= end; time += 60) {
    if (time < to && time + 45 > from) continue;
    possible++;
  }
  return Number.isInteger(day.slots) && day.slots >= 1 && day.slots <= possible;
}

export function emptyDay(day: string): DaySchedule {
  // A removed Firestore field must still provide valid time inputs for re-creation.
  const preset = DEFAULT_AVAILABILITY.days[day] ?? DEFAULT_AVAILABILITY.days['Monday'];
  return { ...preset, enabled: false, slots: 0 };
}

export function weeklyHours(week: Availability): number {
  return WEEK_DAYS.reduce((total, day) => {
    const value = week.days[day];
    if (!value?.enabled) return total;
    return (
      total +
      Math.max(
        0,
        minutes(value.end) -
          minutes(value.start) -
          (minutes(value.breakEnd) - minutes(value.breakStart)),
      ) /
        60
    );
  }, 0);
}

export function conflictsWithBookings(
  week: Availability,
  appointments: Appointment[],
  now = new Date(),
): boolean {
  return appointments.some((item) => {
    if (item.status !== 'booked') return false;
    if (new Date(`${item.date}T${item.time}`) <= now) return false;
    return !possibleTimes(item.date, week, now).includes(item.time);
  });
}
