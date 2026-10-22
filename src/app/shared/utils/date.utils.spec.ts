import {
  addDays,
  differenceInCalendarDays,
  formatDate,
  parseIsoDate,
  toIsoDate,
} from './date.utils';

describe('date utils', () => {
  it('converts a date to an ISO date string in local time', () => {
    expect(toIsoDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });

  it('parses an ISO date string as local midnight', () => {
    expect(parseIsoDate('2026-10-30')).toEqual(new Date(2026, 9, 30));
  });

  it('adds days across a month boundary', () => {
    expect(toIsoDate(addDays(new Date(2026, 9, 30), 3))).toBe('2026-11-02');
  });

  it('counts calendar days regardless of time of day', () => {
    expect(differenceInCalendarDays(new Date(2026, 9, 25, 1), new Date(2026, 9, 22, 23))).toBe(3);
    expect(differenceInCalendarDays(new Date(2026, 9, 20), new Date(2026, 9, 22))).toBe(-2);
  });

  it('formats a date as a short US date', () => {
    expect(formatDate('2026-10-30')).toBe('Oct 30, 2026');
  });
});
