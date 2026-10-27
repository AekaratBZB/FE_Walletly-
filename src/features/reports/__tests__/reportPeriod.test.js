import { describe, it, expect } from 'vitest';
import { countMonths, formatRangeLabel, getPresetRange, normalizeRange } from '../reportPeriod';

describe('reportPeriod', () => {
  it('builds preset ranges from the current month', () => {
    expect(getPresetRange('thisYear', '2026-10')).toEqual({ from: '2026-01', to: '2026-12' });
    expect(getPresetRange('lastYear', '2026-10')).toEqual({ from: '2025-01', to: '2025-12' });
    expect(getPresetRange('last6Months', '2026-03')).toEqual({ from: '2025-10', to: '2026-03' });
    expect(getPresetRange('thisMonth', '2026-10')).toEqual({ from: '2026-10', to: '2026-10' });
  });

  it('follows the real current year', () => {
    expect(getPresetRange('thisYear', '2027-01')).toEqual({ from: '2027-01', to: '2027-12' });
  });

  it('swaps reversed custom ranges and counts months inclusively', () => {
    expect(normalizeRange({ from: '2026-10', to: '2025-07' })).toEqual({ from: '2025-07', to: '2026-10' });
    expect(countMonths({ from: '2025-07', to: '2026-10' })).toBe(16);
    expect(countMonths({ from: '2026-10', to: '2026-10' })).toBe(1);
  });

  it('labels ranges in Thai with B.E. years', () => {
    expect(formatRangeLabel({ from: '2026-01', to: '2026-12' })).toBe('มกราคม – ธันวาคม 2569');
    expect(formatRangeLabel({ from: '2025-07', to: '2026-10' })).toBe('ก.ค. 2568 – ต.ค. 2569');
    expect(formatRangeLabel({ from: '2026-10', to: '2026-10' })).toBe('ตุลาคม 2569');
  });
});
