import { describe, it, expect } from 'vitest';
import {
  periodsRemaining,
  outstandingBalance,
  resolveSchedule,
  hasFutureOverride,
  monthlyInterest,
  minimumDue,
  hirePurchaseRebate,
  rebateDecayPerMonth,
  addMonths
} from '../debtMath';

describe('periodsRemaining', () => {
  it('subtracts paid from total', () => {
    expect(periodsRemaining({ periodsTotal: 14, periodsPaid: 2 })).toBe(12);
  });

  it('never goes negative', () => {
    expect(periodsRemaining({ periodsTotal: 3, periodsPaid: 5 })).toBe(0);
  });

  it('treats missing values as zero', () => {
    expect(periodsRemaining({})).toBe(0);
  });
});

describe('outstandingBalance', () => {
  it('uses payment times periods remaining for installment plans', () => {
    expect(outstandingBalance({
      type: 'installment', monthlyPayment: 1699, periodsTotal: 6, periodsPaid: 2
    })).toBe(6796);
  });

  it('uses payment times periods remaining for hire purchase', () => {
    expect(outstandingBalance({
      type: 'hirePurchase', monthlyPayment: 3374, periodsTotal: 14, periodsPaid: 0
    })).toBe(47236);
  });

  it('uses principal plus arrears for amortizing loans', () => {
    expect(outstandingBalance({
      type: 'amortizing', principal: 610000, accruedInterest: 21306
    })).toBe(631306);
  });
});

describe('resolveSchedule', () => {
  const overrides = [{ fromMonth: 3, amount: 3000 }, { fromMonth: 12, amount: 4000 }];

  it('returns the default before any override applies', () => {
    expect(resolveSchedule(2000, overrides, 0)).toBe(2000);
    expect(resolveSchedule(2000, overrides, 2)).toBe(2000);
  });

  it('returns the override from its fromMonth onwards', () => {
    expect(resolveSchedule(2000, overrides, 3)).toBe(3000);
    expect(resolveSchedule(2000, overrides, 11)).toBe(3000);
    expect(resolveSchedule(2000, overrides, 12)).toBe(4000);
  });

  it('picks the highest applicable fromMonth even when unsorted', () => {
    const unsorted = [{ fromMonth: 12, amount: 4000 }, { fromMonth: 3, amount: 3000 }];
    expect(resolveSchedule(2000, unsorted, 5)).toBe(3000);
  });

  it('handles a missing override list', () => {
    expect(resolveSchedule(1200, undefined, 0)).toBe(1200);
  });
});

describe('hasFutureOverride', () => {
  it('is true when an override starts after the given month', () => {
    expect(hasFutureOverride([{ fromMonth: 3, amount: 3000 }], 1)).toBe(true);
  });

  it('is false once every override has taken effect', () => {
    expect(hasFutureOverride([{ fromMonth: 3, amount: 3000 }], 3)).toBe(false);
    expect(hasFutureOverride([], 0)).toBe(false);
  });

  it('ignores a stale override far beyond the look-ahead window', () => {
    // A leftover step at month 400 is not evidence that this month's stalled
    // plan is about to recover; unbounded, it disables the non-termination
    // guard for 400 months.
    expect(hasFutureOverride([{ fromMonth: 400, amount: 3000 }], 0)).toBe(false);
    expect(hasFutureOverride([{ fromMonth: 400, amount: 3000 }], 388)).toBe(true);
  });

  it('counts an override exactly at the edge of the window', () => {
    expect(hasFutureOverride([{ fromMonth: 12, amount: 1 }], 0)).toBe(true);
    expect(hasFutureOverride([{ fromMonth: 13, amount: 1 }], 0)).toBe(false);
  });

  it('accepts an explicit window', () => {
    expect(hasFutureOverride([{ fromMonth: 5, amount: 1 }], 0, 3)).toBe(false);
    expect(hasFutureOverride([{ fromMonth: 5, amount: 1 }], 0, 5)).toBe(true);
  });

  it('ignores a non-numeric fromMonth', () => {
    expect(hasFutureOverride([{ fromMonth: 'later', amount: 1 }], 0)).toBe(false);
  });
});

describe('monthlyInterest', () => {
  it('is principal times the annual rate over twelve', () => {
    expect(monthlyInterest({ principal: 610000, annualRatePct: 6.575 }))
      .toBeCloseTo(3342.2916666, 6);
  });

  it('is zero for a zero rate', () => {
    expect(monthlyInterest({ principal: 50000, annualRatePct: 0 })).toBe(0);
  });
});

describe('minimumDue', () => {
  it('is zero for mode none', () => {
    expect(minimumDue({
      principal: 610000, accruedInterest: 21306, minimumPayment: { mode: 'none' }
    })).toBe(0);
  });

  it('defaults to zero when minimumPayment is absent', () => {
    expect(minimumDue({ principal: 610000, accruedInterest: 0 })).toBe(0);
  });

  it('returns the fixed amount', () => {
    expect(minimumDue({
      principal: 100000, accruedInterest: 0,
      minimumPayment: { mode: 'fixed', amount: 8500 }
    })).toBe(8500);
  });

  it('returns a percentage of the outstanding balance', () => {
    expect(minimumDue({
      principal: 50000, accruedInterest: 0,
      minimumPayment: { mode: 'percentOfBalance', percent: 8, floor: 500 }
    })).toBe(4000);
  });

  it('applies the floor when the percentage falls below it', () => {
    expect(minimumDue({
      principal: 4000, accruedInterest: 0,
      minimumPayment: { mode: 'percentOfBalance', percent: 8, floor: 500 }
    })).toBe(500);
  });

  it('never exceeds the outstanding balance', () => {
    expect(minimumDue({
      principal: 300, accruedInterest: 0,
      minimumPayment: { mode: 'percentOfBalance', percent: 8, floor: 500 }
    })).toBe(300);
    expect(minimumDue({
      principal: 0, accruedInterest: 0,
      minimumPayment: { mode: 'percentOfBalance', percent: 8, floor: 500 }
    })).toBe(0);
  });
});

describe('hirePurchaseRebate', () => {
  it('is remaining payments minus the lender quote', () => {
    expect(hirePurchaseRebate({
      monthlyPayment: 3374, periodsTotal: 14, periodsPaid: 0, settlementQuote: 41000
    })).toBe(6236);
  });

  it('is null when no quote is present — never estimated', () => {
    expect(hirePurchaseRebate({
      monthlyPayment: 3374, periodsTotal: 14, periodsPaid: 0, settlementQuote: null
    })).toBeNull();
    expect(hirePurchaseRebate({
      monthlyPayment: 3374, periodsTotal: 14, periodsPaid: 0
    })).toBeNull();
  });
});

describe('rebateDecayPerMonth', () => {
  it('spreads the rebate across the remaining periods', () => {
    expect(rebateDecayPerMonth({
      monthlyPayment: 3374, periodsTotal: 14, periodsPaid: 0, settlementQuote: 41000
    })).toBeCloseTo(445.4285714, 6);
  });

  it('is null without a quote', () => {
    expect(rebateDecayPerMonth({
      monthlyPayment: 3374, periodsTotal: 14, periodsPaid: 0, settlementQuote: null
    })).toBeNull();
  });

  it('is null with no periods left', () => {
    expect(rebateDecayPerMonth({
      monthlyPayment: 3374, periodsTotal: 14, periodsPaid: 14, settlementQuote: 0
    })).toBeNull();
  });
});

describe('addMonths', () => {
  it('advances within the same year', () => {
    expect(addMonths({ year: 2026, month: 10 }, 1)).toEqual({ year: 2026, month: 11 });
  });

  it('rolls over the year boundary', () => {
    expect(addMonths({ year: 2026, month: 10 }, 3)).toEqual({ year: 2027, month: 1 });
  });

  it('advances 53 months from October 2026 to March 2031', () => {
    expect(addMonths({ year: 2026, month: 10 }, 53)).toEqual({ year: 2031, month: 3 });
  });

  it('returns the start month for a zero offset', () => {
    expect(addMonths({ year: 2026, month: 10 }, 0)).toEqual({ year: 2026, month: 10 });
  });
});
