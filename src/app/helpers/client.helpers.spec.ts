import { mergeSort, possibleTimes, searchTherapists, slotId } from './client.helpers';
import { DEFAULT_AVAILABILITY, THERAPISTS } from '../data/demo-data';

describe('Wellspace client helpers', () => {
  it('uses Merge Sort for alphabetical names', () => {
    const sorted = mergeSort([{ name: 'Zoe' }, { name: 'Ava' }], (item) => item.name);
    expect(sorted.map((item) => item.name)).toEqual(['Ava', 'Zoe']);
  });

  it('filters for burnout and Ava', () => {
    const found = searchTherapists(THERAPISTS, 'Ava', 'Burnout', '', 'name', false, []);
    expect(found.map((item) => item.id)).toEqual(['ava']);
  });

  it('generates a unique booked-slot ID', () => {
    expect(slotId('2026-10-19', '09:00')).toBe('ava_20261019_0900');
  });

  it('disables Saturday even when the date is in the future', () => {
    expect(possibleTimes('2099-10-17', DEFAULT_AVAILABILITY)).toEqual([]);
  });
});
