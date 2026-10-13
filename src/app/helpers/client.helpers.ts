import { Availability, Format, Therapist } from '../models/wellspace.model';

export type SortBy = 'name' | 'focus' | 'format';

export function mergeSort<T>(items: T[], key: (item: T) => string): T[] {
  if (items.length < 2) return [...items];
  const middle = Math.floor(items.length / 2);
  const left = mergeSort(items.slice(0, middle), key);
  const right = mergeSort(items.slice(middle), key);
  const result: T[] = [];
  while (left.length && right.length) {
    const a = key(left[0]).toLowerCase();
    const b = key(right[0]).toLowerCase();
    result.push(a <= b ? left.shift()! : right.shift()!);
  }
  return [...result, ...left, ...right];
}

export function searchTherapists(
  therapists: Therapist[],
  search: string,
  focus: string,
  format: string,
  sortBy: SortBy,
  savedOnly: boolean,
  savedIds: string[],
): Therapist[] {
  const term = search.trim().toLowerCase();
  const matching = therapists.filter(
    (t) =>
      (!savedOnly || savedIds.includes(t.id)) &&
      (!focus || t.focusAreas.includes(focus)) &&
      (!format || t.formats.includes(format as Format)) &&
      (!term || `${t.name} ${t.credential} ${t.focusAreas.join(' ')}`.toLowerCase().includes(term)),
  );
  const keys: Record<SortBy, (t: Therapist) => string> = {
    name: (t) => t.name,
    focus: (t) => t.focusAreas[0] ?? '',
    format: (t) => t.formats[0] ?? '',
  };
  return mergeSort(matching, keys[sortBy]);
}

export function toDateText(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
export function nextDates(days = 14, today = new Date()): string[] {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + i);
    return toDateText(date);
  });
}
export function slotId(date: string, time: string): string {
  return `ava_${date.replaceAll('-', '')}_${time.replace(':', '')}`;
}
export function possibleTimes(date: string, week: Availability, now = new Date()): string[] {
  const [year, month, day] = date.split('-').map(Number);
  const dayDate = new Date(year, month - 1, day);
  const config = week.days[dayDate.toLocaleDateString('en-US', { weekday: 'long' })];
  if (!config?.enabled) return [];
  const minutes = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
  const eligible: string[] = [];
  for (let t = minutes(config.start); t + 45 <= minutes(config.end); t += 60) {
    const inBreak = t < minutes(config.breakEnd) && t + 45 > minutes(config.breakStart);
    if (inBreak) continue;
    const time = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
    if (new Date(year, month - 1, day, Math.floor(t / 60), t % 60) <= now) continue;
    eligible.push(time);
  }
  return eligible.slice(0, config.slots);
}
