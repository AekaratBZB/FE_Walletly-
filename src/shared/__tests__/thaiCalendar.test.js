import { describe, it, expect } from 'vitest';
import {
  buildMonthGrid,
  daysInMonth,
  formatThaiDate,
  formatThaiMonth,
  parseValue,
  toBuddhistYear,
  toDateValue,
  toMonthValue
} from '../thaiCalendar';
import { formatDate } from '../formatters';

describe('thaiCalendar', () => {
  it('converts Gregorian to Buddhist-era year', () => {
    expect(toBuddhistYear(2026)).toBe(2569);
  });

  it('formats month and date values in Thai with B.E. year', () => {
    expect(formatThaiMonth('2026-10')).toBe('ตุลาคม 2569');
    expect(formatThaiMonth('2026-01', { short: true })).toBe('ม.ค. 2569');
    expect(formatThaiDate('2026-10-27')).toBe('27 ต.ค. 2569');
    expect(formatThaiMonth('')).toBe('');
    expect(formatThaiDate('2026-10')).toBe('');
  });

  it('keeps stored values in Gregorian', () => {
    expect(toMonthValue(2026, 3)).toBe('2026-03');
    expect(toDateValue(2027, 1, 5)).toBe('2027-01-05');
    expect(parseValue('2026-10-27')).toEqual({ year: 2026, month: 10, day: 27 });
    expect(parseValue('2026-10')).toEqual({ year: 2026, month: 10, day: null });
    expect(parseValue('nope')).toBeNull();
  });

  it('shows table dates with a B.E. year', () => {
    expect(formatDate('2026-10-27')).toBe('27/10/2569');
    expect(formatDate('')).toBe('-');
  });

  it('handles leap years', () => {
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
  });

  it('pads the grid so day 1 lands on its weekday (Sunday first)', () => {
    // 1 ต.ค. 2026 เป็นวันพฤหัสบดี (index 4)
    const grid = buildMonthGrid(2026, 10);
    expect(grid.slice(0, 4)).toEqual([null, null, null, null]);
    expect(grid[4]).toBe(1);
    expect(grid[grid.length - 1]).toBe(31);
  });
});
