import { describe, it, expect } from 'vitest';
import { simulate } from '../payoffSimulator';
import { GOLDEN_BUDGET, GOLDEN_DEBTS, GOLDEN_START } from './goldenFixture';

const opts = { startMonth: GOLDEN_START };

const amortizing = (over = {}) => ({
  id: 'a1',
  name: 'loan',
  type: 'amortizing',
  principal: 100000,
  accruedInterest: 0,
  annualRatePct: 12,
  frequency: 'monthly',
  annualDueMonth: null,
  acceptsEarlyPayment: true,
  minimumPayment: { mode: 'none' },
  isClosed: false,
  ...over
});

const budget = (over = {}) => ({
  netMonthlyIncome: 40000,
  fixedExpenses: 10000,
  discretionaryBudget: 5000,
  extraIncome: 0,
  emergencyFundCurrent: 0,
  emergencyFundTarget: 0,
  emergencyMonthlyContribution: 0,
  emergencyContributionOverrides: [],
  shortTermBuffer: 0,
  bufferOverrides: [],
  strategy: 'avalanche',
  manualOrder: [],
  ...over
});

describe('edge 1: surplus below zero', () => {
  const p = simulate(GOLDEN_DEBTS, { ...GOLDEN_BUDGET, discretionaryBudget: 25000 }, opts);

  it('is flagged infeasible', () => {
    expect(p.IsInfeasible).toBe(true);
  });

  it('terminates instead of running to the horizon', () => {
    expect(p.Months.length).toBe(1);
  });

  it('reports the minimum viable payment', () => {
    expect(p.MinimumViablePayment).toBeCloseTo(3342.29, 2);
  });

  it('records a negative surplus on the final row', () => {
    expect(p.Months[0].Surplus).toBeLessThan(0);
  });
});

describe('edge 2: no interest arrears at the start', () => {
  const p = simulate([amortizing({ accruedInterest: 0 })], budget(), opts);

  it('sends the first payment into principal beyond the first month of interest', () => {
    // month 0: interest 1000, payment 25000 => 24000 off principal
    expect(p.Months[0].InterestAccrued).toBeCloseTo(1000, 2);
    expect(p.Months[0].PrincipalBalance).toBeCloseTo(76000, 2);
  });

  it('reports no arrears-cleared month because there were none', () => {
    expect(p.InterestArrearsClearedMonth).toBeNull();
  });
});

describe('edge 3: acceptsEarlyPayment false with an annual due month', () => {
  const monthly = simulate(GOLDEN_DEBTS, GOLDEN_BUDGET, opts);

  const heldDebts = GOLDEN_DEBTS.map((d) =>
    d.type === 'amortizing'
      ? { ...d, acceptsEarlyPayment: false, frequency: 'annual', annualDueMonth: 6 }
      : d
  );
  const held = simulate(heldDebts, GOLDEN_BUDGET, opts);

  it('pays off later than the monthly path', () => {
    expect(held.MonthsToPayoff).toBeGreaterThan(monthly.MonthsToPayoff);
  });

  it('costs more total interest than the monthly path', () => {
    expect(held.TotalInterestPaid).toBeGreaterThan(monthly.TotalInterestPaid);
  });

  it('holds cash in months that are not the due month', () => {
    // Month 0 is October; June is month index 8.
    expect(held.Months[0].LoanPayment).toBeCloseTo(0, 2);
    expect(held.Months[0].HeldForAnnualPayment).toBeCloseTo(2015.34, 2);
    expect(held.Months[8].LoanPayment).toBeGreaterThan(0);
  });
});

describe('edge 4: every debt closed', () => {
  const closed = GOLDEN_DEBTS.map((d) => ({ ...d, isClosed: true }));
  const p = simulate(closed, GOLDEN_BUDGET, opts);

  it('returns an empty projection without throwing', () => {
    expect(p.Months).toEqual([]);
    expect(p.MonthsToPayoff).toBe(0);
    expect(p.IsInfeasible).toBe(false);
  });

  it('handles an empty debt list too', () => {
    const empty = simulate([], GOLDEN_BUDGET, opts);
    expect(empty.Months).toEqual([]);
    expect(empty.MonthlyInterestThreshold).toBe(0);
  });
});

describe('edge 5: fully paid installment plan', () => {
  it('is excluded from installmentTotal', () => {
    const debts = GOLDEN_DEBTS.map((d) =>
      d.id === 'inst-phone' ? { ...d, periodsPaid: 9 } : d
    );
    const p = simulate(debts, GOLDEN_BUDGET, opts);
    expect(p.Months[0].InstallmentTotal).toBeCloseTo(10864.30 - 856.90, 2);
  });
});

describe('edge 6: avalanche across two rates', () => {
  const card = amortizing({
    id: 'card',
    principal: 50000,
    annualRatePct: 19,
    minimumPayment: { mode: 'fixed', amount: 2000 }
  });
  const mortgage = amortizing({
    id: 'mortgage',
    principal: 600000,
    annualRatePct: 6.5,
    minimumPayment: { mode: 'fixed', amount: 5000 }
  });
  const p = simulate([card, mortgage], budget({ strategy: 'avalanche' }), opts);
  const row = p.Months[0];
  const paid = (id) => row.perDebt.find((d) => d.debtId === id).paid;

  it('gives the attack money to the higher rate', () => {
    // surplus 25000, minimums 2000 + 5000, attack 18000 => card gets 20000
    expect(paid('card')).toBeCloseTo(20000, 2);
  });

  it('gives the lower rate only its minimum', () => {
    expect(paid('mortgage')).toBeCloseTo(5000, 2);
  });
});

describe('edge 7: snowball costs more interest than avalanche', () => {
  const card = amortizing({
    id: 'card',
    principal: 200000,
    annualRatePct: 19,
    minimumPayment: { mode: 'fixed', amount: 2000 }
  });
  const small = amortizing({
    id: 'small',
    principal: 40000,
    annualRatePct: 5,
    minimumPayment: { mode: 'fixed', amount: 1000 }
  });

  const avalanche = simulate([card, small], budget({ strategy: 'avalanche' }), opts);
  const snowball = simulate([card, small], budget({ strategy: 'snowball' }), opts);

  it('both terminate', () => {
    expect(avalanche.IsInfeasible).toBe(false);
    expect(snowball.IsInfeasible).toBe(false);
  });

  it('snowball pays more interest', () => {
    expect(snowball.TotalInterestPaid).toBeGreaterThan(avalanche.TotalInterestPaid);
  });
});

describe('edge 8: percent-of-balance minimum', () => {
  // The card is deliberately NOT the avalanche target: the 20% loan absorbs
  // every baht of attack money, so the card only ever receives its contractual
  // minimum. With a single debt the attack step would dump everything into it
  // and the percentage behaviour would be invisible.
  const big = amortizing({
    id: 'big',
    principal: 500000,
    annualRatePct: 20,
    minimumPayment: { mode: 'none' }
  });
  const card = amortizing({
    id: 'card',
    principal: 50000,
    annualRatePct: 15,
    minimumPayment: { mode: 'percentOfBalance', percent: 8, floor: 500 }
  });

  const p = simulate([big, card], budget(), { ...opts, maxMonths: 200 });
  const cardPaid = (i) => p.Months[i].perDebt.find((d) => d.debtId === 'card').paid;

  it('charges 8% of the balance including this month interest', () => {
    // interest 50000 * 0.15 / 12 = 625, balance 50625, 8% = 4050
    expect(cardPaid(0)).toBeCloseTo(4050, 2);
  });

  it('falls every month as the balance falls', () => {
    for (let i = 1; i <= 10; i++) {
      expect(cardPaid(i)).toBeLessThan(cardPaid(i - 1));
    }
  });

  it('stays above the floor while the balance is still large', () => {
    for (let i = 0; i <= 10; i++) {
      expect(cardPaid(i)).toBeGreaterThan(500);
    }
  });

  it('sends every baht of attack money to the 20% loan instead', () => {
    const bigPaid = p.Months[0].perDebt.find((d) => d.debtId === 'big').paid;
    // surplus 25000 less the card's 4050 minimum
    expect(bigPaid).toBeCloseTo(20950, 2);
  });
});

describe('edge 9: minimums exceed the money available', () => {
  const a = amortizing({
    id: 'a',
    principal: 100000,
    annualRatePct: 10,
    minimumPayment: { mode: 'fixed', amount: 20000 }
  });
  const b = amortizing({
    id: 'b',
    principal: 100000,
    annualRatePct: 10,
    minimumPayment: { mode: 'fixed', amount: 20000 }
  });
  const p = simulate([a, b], budget(), { ...opts, maxMonths: 24 });
  const row = p.Months[0];

  it('pays minimums in order until the money runs out', () => {
    // surplus is 25000 against 40000 of minimums
    expect(row.LoanPayment).toBeCloseTo(25000, 2);
  });

  it('never goes negative and never throws', () => {
    // Float subtraction can leave a few 1e-13 residues, so compare against a
    // sub-satang epsilon rather than exact zero.
    for (const m of p.Months) {
      expect(m.LoanPayment).toBeGreaterThanOrEqual(-0.005);
      expect(m.PrincipalBalance).toBeGreaterThanOrEqual(-0.005);
      expect(m.AccruedInterestBalance).toBeGreaterThanOrEqual(-0.005);
    }
  });

  it('never pays out more than the surplus', () => {
    for (const m of p.Months) {
      expect(m.LoanPayment).toBeLessThanOrEqual(m.Surplus + 0.005);
    }
  });
});
