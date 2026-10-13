import { describe, it, expect } from 'vitest';
import { simulate } from '../payoffSimulator';
import { GOLDEN_BUDGET, GOLDEN_DEBTS, GOLDEN_START } from './goldenFixture';

const run = (budgetPatch = {}) =>
  simulate(GOLDEN_DEBTS, { ...GOLDEN_BUDGET, ...budgetPatch }, { startMonth: GOLDEN_START });

describe('§8 golden vectors', () => {
  const p = run();

  it('MonthlyInterestThreshold is 3,342.29', () => {
    expect(p.MonthlyInterestThreshold).toBeCloseTo(3342.29, 2);
  });

  it('Months[0].InstallmentTotal is 10,864.30', () => {
    expect(p.Months[0].InstallmentTotal).toBeCloseTo(10864.30, 2);
  });

  it('Months[0].Surplus is 5,215.34', () => {
    expect(p.Months[0].Surplus).toBeCloseTo(5215.34, 2);
  });

  it('Months[0].LoanPayment is 2,015.34', () => {
    expect(p.Months[0].LoanPayment).toBeCloseTo(2015.34, 2);
  });

  it('Months[0].AccruedInterestBalance is 22,632.95', () => {
    expect(p.Months[0].AccruedInterestBalance).toBeCloseTo(22632.95, 2);
  });

  it('Months[2].InstallmentTotal is 8,367.64', () => {
    expect(p.Months[2].InstallmentTotal).toBeCloseTo(8367.64, 2);
  });

  it('Months[3].LoanPayment is 7,149.74', () => {
    expect(p.Months[3].LoanPayment).toBeCloseTo(7149.74, 2);
  });

  it('InterestArrearsClearedMonth is 7', () => {
    expect(p.InterestArrearsClearedMonth).toBe(7);
  });

  it('Months[7].PrincipalBalance is 609,154.95', () => {
    expect(p.Months[7].PrincipalBalance).toBeCloseTo(609154.95, 2);
  });

  it('Months[13].EmergencyFundBalance is 40,000.00', () => {
    expect(p.Months[13].EmergencyFundBalance).toBeCloseTo(40000.00, 2);
  });

  it('Months[17].InstallmentTotal is 0.00', () => {
    expect(p.Months[17].InstallmentTotal).toBeCloseTo(0, 2);
  });

  it('MonthsToPayoff is 54', () => {
    expect(p.MonthsToPayoff).toBe(54);
  });

  it('TotalInterestPaid is 131,445.49', () => {
    expect(p.TotalInterestPaid).toBeCloseTo(131445.49, 2);
  });

  it('is feasible', () => {
    expect(p.IsInfeasible).toBe(false);
    expect(p.MinimumViablePayment).toBeNull();
  });

  it('payoff lands in the month of the final row', () => {
    // Month 0 = October 2026, index 53 => March 2031
    expect(p.PayoffDate).toEqual({ year: 2031, month: 3 });
  });
});

describe('§8 sensitivity: discretionary budget', () => {
  const cases = [
    { discretionaryBudget: 3000, months: 47, interest: 117038 },
    { discretionaryBudget: 4000, months: 50, interest: 123754 },
    { discretionaryBudget: 5000, months: 54, interest: 131445 },
    { discretionaryBudget: 6000, months: 58, interest: 140350 },
    { discretionaryBudget: 7000, months: 62, interest: 150749 }
  ];

  it.each(cases)(
    'discretionary $discretionaryBudget gives $months months',
    ({ discretionaryBudget, months, interest }) => {
      const p = run({ discretionaryBudget });
      expect(p.MonthsToPayoff).toBe(months);
      // The spec's sensitivity table gives interest to the nearest baht.
      expect(Math.abs(p.TotalInterestPaid - interest)).toBeLessThanOrEqual(1);
    }
  );
});

describe('§8 sensitivity: extra income', () => {
  const cases = [
    { extraIncome: 0, months: 54, interest: 131445 },
    { extraIncome: 3000, months: 44, interest: 111129 },
    { extraIncome: 5000, months: 40, interest: 101200 },
    { extraIncome: 8000, months: 34, interest: 89801 }
  ];

  it.each(cases)(
    'extra income $extraIncome gives $months months',
    ({ extraIncome, months, interest }) => {
      const p = run({ extraIncome });
      expect(p.MonthsToPayoff).toBe(months);
      expect(Math.abs(p.TotalInterestPaid - interest)).toBeLessThanOrEqual(1);
    }
  );
});
