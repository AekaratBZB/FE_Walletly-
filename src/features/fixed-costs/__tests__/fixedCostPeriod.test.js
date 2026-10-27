import { describe, it, expect } from 'vitest';
import {
  addMonths,
  describeFixedCostPeriod,
  getDurationMonths,
  getInstallmentNumber,
  isFixedCostActiveInMonth,
  isFixedCostIncluded,
  sumIncludedFixedCosts,
  toMonthKey
} from '../fixedCostPeriod';

describe('fixedCostPeriod', () => {
  const loan = { id: 'a', amount: 1000, startMonth: '2026-11', endMonth: '2027-10' };
  const internet = { id: 'b', amount: 599 };

  it('adds months across year boundaries', () => {
    expect(addMonths('2026-11', 11)).toBe('2027-10');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });

  it('reads BE dates as month keys', () => {
    expect(toMonthKey('2026-10-01')).toBe('2026-10');
    expect(toMonthKey(null)).toBeNull();
  });

  it('computes duration and installment number', () => {
    expect(getDurationMonths(loan)).toBe(12);
    expect(getInstallmentNumber(loan, '2027-01')).toBe(3);
    expect(getDurationMonths(internet)).toBeNull();
  });

  it('is active only inside its period; open-ended items are always active', () => {
    expect(isFixedCostActiveInMonth(loan, '2026-10')).toBe(false);
    expect(isFixedCostActiveInMonth(loan, '2026-11')).toBe(true);
    expect(isFixedCostActiveInMonth(loan, '2027-10')).toBe(true);
    expect(isFixedCostActiveInMonth(loan, '2027-11')).toBe(false);
    expect(isFixedCostActiveInMonth(internet, '1999-01')).toBe(true);
  });

  it('includes by default and excludes only the unticked month', () => {
    const excluded = { ...internet, excludedMonths: ['2026-12'] };
    expect(isFixedCostIncluded(excluded, '2026-11')).toBe(true);
    expect(isFixedCostIncluded(excluded, '2026-12')).toBe(false);
  });

  it('describes the period relative to a month', () => {
    expect(describeFixedCostPeriod(internet, '2026-11')).toBe('ไม่มีกำหนด');
    expect(describeFixedCostPeriod(loan, '2026-10')).toBe('เริ่ม พ.ย. 2569 · 12 เดือน');
    expect(describeFixedCostPeriod(loan, '2027-01')).toBe('งวด 3/12 · ถึง ต.ค. 2570');
    expect(describeFixedCostPeriod(loan, '2027-11')).toBe('สิ้นสุดแล้ว (ต.ค. 2570)');
  });

  it('sums only included items for the month', () => {
    const items = [loan, { ...internet, excludedMonths: ['2027-01'] }];
    expect(sumIncludedFixedCosts(items, '2026-12')).toBe(1599);
    expect(sumIncludedFixedCosts(items, '2027-01')).toBe(1000);
    expect(sumIncludedFixedCosts(items, '2026-10')).toBe(599);
  });
});
