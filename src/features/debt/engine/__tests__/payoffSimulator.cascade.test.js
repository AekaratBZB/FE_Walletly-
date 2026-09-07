import { describe, it, expect } from 'vitest';
import { simulate } from '../payoffSimulator';
import { resolveSchedule } from '../debtMath';
import { GOLDEN_BUDGET, GOLDEN_DEBTS, GOLDEN_START } from './goldenFixture';

const opts = { startMonth: GOLDEN_START };
const EPS = 0.005;

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

/**
 * THE MONEY-CONSERVATION INVARIANT.
 *
 * Every baht taken out of `availableForLoan` in a month must land somewhere
 * that the row records — either as a payment against a debt or as an addition
 * to a holding pot. Nothing may evaporate.
 *
 * `availableForLoan` is re-derived from the row's own fields
 * (`Surplus - EmergencyContribution - buffer`) rather than by re-implementing
 * the loop, so the assertion is independent of the engine's internals.
 *
 * Outflow bookkeeping: `perDebt[].paid` counts money paid to a debt this
 * month, which for an annually-due loan includes a pot release funded in
 * EARLIER months. `perDebt[].held` is the pot balance at the end of the month.
 * So the cash that actually left this month's budget is
 *
 *     sum(paid) + sum(held_now - held_prev)
 *
 * because  paid = minimums + attack + releases  and  outflow = minimums +
 * attack + potAdds, and  potAdds - releases = held_now - held_prev.
 *
 * The invariant is an equality whenever some debt can still absorb another
 * baht, and an inequality only when every debt is full — capacity being
 * `balance - held`, since a pot is money already committed to that loan.
 */
const assertMoneyConserved = (projection, budgetProfile) => {
  const prevHeld = new Map();
  projection.Months.forEach((row, i) => {
    const buffer = resolveSchedule(
      budgetProfile.shortTermBuffer,
      budgetProfile.bufferOverrides,
      i
    );
    const available = Math.max(0, row.Surplus - row.EmergencyContribution - buffer);

    let outflow = 0;
    let capacityLeft = false;
    for (const d of row.perDebt) {
      const prev = prevHeld.get(d.debtId) || 0;
      outflow += d.paid + (d.held - prev);
      prevHeld.set(d.debtId, d.held);
      if (d.balance - d.held > EPS) capacityLeft = true;
    }

    if (capacityLeft) {
      // Some debt could still have taken money: every baht must be accounted for.
      expect(outflow, `month ${i}: outflow must equal availableForLoan`).toBeCloseTo(
        available,
        2
      );
    } else {
      // Everything is fully covered; spending less than the budget is correct,
      // spending MORE than the budget never is.
      expect(outflow, `month ${i}: outflow must not exceed availableForLoan`)
        .toBeLessThanOrEqual(available + EPS);
    }
  });
};

// ---------------------------------------------------------------------------
// Portfolios used by the regression cases
// ---------------------------------------------------------------------------

/** Blocker 1/3: a debt closes mid-month with surplus to spare. */
const TWO_LOANS = [
  amortizing({ id: 'low', name: 'low rate', principal: 100000, annualRatePct: 5 }),
  amortizing({ id: 'high', name: 'high rate', principal: 100000, annualRatePct: 25 })
];

/** Blocker 2: an annually-due loan that cannot absorb a whole month's surplus. */
const ANNUAL_PLUS_MORTGAGE = [
  amortizing({
    id: 'annual',
    name: 'annual loan',
    principal: 50000,
    annualRatePct: 20,
    frequency: 'annual',
    acceptsEarlyPayment: false,
    annualDueMonth: 6
  }),
  amortizing({
    id: 'mortgage',
    name: 'mortgage',
    principal: 500000,
    annualRatePct: 5
  })
];

// ---------------------------------------------------------------------------
// The invariant
// ---------------------------------------------------------------------------

describe('invariant: a month spends exactly the money it has', () => {
  it('holds for the golden fixture', () => {
    assertMoneyConserved(simulate(GOLDEN_DEBTS, GOLDEN_BUDGET, opts), GOLDEN_BUDGET);
  });

  it('holds when a debt closes mid-run (avalanche)', () => {
    const b = budget();
    assertMoneyConserved(simulate(TWO_LOANS, b, opts), b);
  });

  it('holds when a debt closes mid-run (snowball)', () => {
    const b = budget({ strategy: 'snowball' });
    assertMoneyConserved(simulate(TWO_LOANS, b, opts), b);
  });

  it('holds for the annually-due holding-pot path', () => {
    const b = budget();
    assertMoneyConserved(simulate(ANNUAL_PLUS_MORTGAGE, b, opts), b);
  });

  it('holds when minimums exceed the money available', () => {
    const b = budget();
    const debts = [
      amortizing({ id: 'a', minimumPayment: { mode: 'fixed', amount: 20000 } }),
      amortizing({ id: 'b', minimumPayment: { mode: 'fixed', amount: 20000 } })
    ];
    assertMoneyConserved(simulate(debts, b, { ...opts, maxMonths: 24 }), b);
  });
});

// ---------------------------------------------------------------------------
// Blocker 1: attack cash above the target's balance must cascade
// ---------------------------------------------------------------------------

describe('blocker 1: the attack step cascades instead of destroying cash', () => {
  const p = simulate(TWO_LOANS, budget(), opts);
  const paid = (i, id) => p.Months[i].perDebt.find((d) => d.debtId === id).paid;

  it('spends the whole surplus in the month the first debt closes', () => {
    // month 4: the 25% loan only owes 5,541.86, the remaining 19,458.14 must
    // fall through to the 5% loan instead of vanishing.
    expect(paid(4, 'high')).toBeCloseTo(5541.86, 2);
    expect(paid(4, 'low')).toBeCloseTo(19458.14, 2);
    expect(p.Months[4].LoanPayment).toBeCloseTo(25000, 2);
  });

  it('pays off in 9 months, not 10', () => {
    expect(p.MonthsToPayoff).toBe(9);
  });

  it('pays 8,384.17 of interest', () => {
    expect(p.TotalInterestPaid).toBeCloseTo(8384.17, 2);
  });

  it('is feasible', () => {
    expect(p.IsInfeasible).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Blocker 2: a holding pot may never over-pool
// ---------------------------------------------------------------------------

describe('blocker 2: the holding pot is capped at what the loan owes', () => {
  const p = simulate(ANNUAL_PLUS_MORTGAGE, budget(), opts);

  it('never pools more than the loan owes', () => {
    for (const [i, row] of p.Months.entries()) {
      for (const d of row.perDebt) {
        expect(d.held, `month ${i}: pot for ${d.debtId}`).toBeLessThanOrEqual(
          d.balance + EPS
        );
      }
    }
  });

  it('lets the excess cascade to the mortgage instead of pooling forever', () => {
    const mortgagePaid = (i) =>
      p.Months[i].perDebt.find((d) => d.debtId === 'mortgage').paid;
    // The annual loan can absorb roughly two months of surplus; from month 2
    // the mortgage must start receiving the overflow.
    const earlyMortgage = [0, 1, 2, 3, 4, 5].reduce((s, i) => s + mortgagePaid(i), 0);
    expect(earlyMortgage).toBeGreaterThan(0);
    expect(mortgagePaid(2)).toBeGreaterThan(0);
  });

  it('pays off in 24 months', () => {
    expect(p.MonthsToPayoff).toBe(24);
  });

  it('pays 35,804 of interest', () => {
    expect(p.TotalInterestPaid).toBeCloseTo(35804, 0);
  });
});

// ---------------------------------------------------------------------------
// Blocker 3: no false IsInfeasible in a month a loan closed
// ---------------------------------------------------------------------------

describe('blocker 3: closing a loan is progress, not infeasibility', () => {
  it('snowball on the two-loan portfolio is feasible', () => {
    const p = simulate(TWO_LOANS, budget({ strategy: 'snowball' }), opts);
    expect(p.IsInfeasible).toBe(false);
    expect(p.MinimumViablePayment).toBeNull();
    expect(p.MonthsToPayoff).toBeGreaterThan(5);
  });

  it('manual with an empty order is feasible', () => {
    const p = simulate(TWO_LOANS, budget({ strategy: 'manual', manualOrder: [] }), opts);
    expect(p.IsInfeasible).toBe(false);
    expect(p.MinimumViablePayment).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Important 6: a fixed-obligation shortfall reports a meaningful figure
// ---------------------------------------------------------------------------

describe('important 6: infeasible because the obligations exceed income', () => {
  const debts = [
    {
      id: 'hp',
      name: 'car',
      type: 'hirePurchase',
      monthlyPayment: 8000,
      periodsPaid: 0,
      periodsTotal: 12,
      settlementQuote: null,
      isClosed: false
    },
    {
      id: 'inst',
      name: 'phone',
      type: 'installment',
      monthlyPayment: 1000,
      periodsPaid: 0,
      periodsTotal: 12,
      isClosed: false
    }
  ];
  // income 12,000 - fixed 4,000 - obligations 9,000 = -1,000
  const b = budget({
    netMonthlyIncome: 12000,
    fixedExpenses: 4000,
    discretionaryBudget: 0
  });
  const p = simulate(debts, b, opts);

  it('is infeasible', () => {
    expect(p.IsInfeasible).toBe(true);
  });

  it('names the failure mode as a budget shortfall', () => {
    expect(p.InfeasibleReason).toBe('budgetShortfall');
  });

  it('reports the shortfall, not a meaningless zero', () => {
    expect(p.MonthlyShortfall).toBeCloseTo(1000, 2);
    expect(p.MonthlyShortfall).toBeGreaterThan(0);
  });

  it('leaves MonthlyShortfall null on a feasible run', () => {
    const ok = simulate(GOLDEN_DEBTS, GOLDEN_BUDGET, opts);
    expect(ok.MonthlyShortfall).toBeNull();
    expect(ok.InfeasibleReason).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Minor 17: a stale far-future override must not disable the guard
// ---------------------------------------------------------------------------

describe('minor 17: a stale far-future override does not disable the guard', () => {
  // 1,000,000 at 30% accrues exactly the 25,000 available, so the balance is
  // flat forever and the guard must fire on month 0.
  const flat = [amortizing({ id: 'flat', principal: 1000000, annualRatePct: 30 })];

  it('reports infeasibility immediately with no overrides', () => {
    const p = simulate(flat, budget(), { ...opts, maxMonths: 60 });
    expect(p.IsInfeasible).toBe(true);
    expect(p.InfeasibleReason).toBe('debtNotFalling');
    expect(p.Months.length).toBe(1);
  });

  it('still reports infeasibility with a leftover override at month 400', () => {
    const p = simulate(flat, budget({ bufferOverrides: [{ fromMonth: 400, amount: 0 }] }), {
      ...opts,
      maxMonths: 60
    });
    expect(p.IsInfeasible).toBe(true);
    expect(p.InfeasibleReason).toBe('debtNotFalling');
    expect(p.Months.length).toBe(1);
  });

  it('still waits for an override that lands inside the look-ahead window', () => {
    const p = simulate(flat, budget({ bufferOverrides: [{ fromMonth: 6, amount: 0 }] }), {
      ...opts,
      maxMonths: 60
    });
    // Cash may genuinely change in six months, so the guard holds off.
    expect(p.Months.length).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// The manual strategy
// ---------------------------------------------------------------------------

describe('manual strategy', () => {
  it('honours an explicit order over rate and balance', () => {
    const p = simulate(
      TWO_LOANS,
      budget({ strategy: 'manual', manualOrder: ['low', 'high'] }),
      opts
    );
    const row = p.Months[0];
    const paid = (id) => row.perDebt.find((d) => d.debtId === id).paid;
    // avalanche would have attacked the 25% loan; manual must attack 'low'.
    expect(paid('low')).toBeCloseTo(25000, 2);
    expect(paid('high')).toBeCloseTo(0, 2);
  });

  it('skips ids that are already closed and moves to the next in the order', () => {
    const p = simulate(
      TWO_LOANS,
      budget({ strategy: 'manual', manualOrder: ['high', 'low'] }),
      opts
    );
    // 'high' closes in month 4; from month 5 every baht goes to 'low'.
    const paid = (i, id) => p.Months[i].perDebt.find((d) => d.debtId === id).paid;
    expect(paid(5, 'low')).toBeCloseTo(25000, 2);
    expect(paid(5, 'high')).toBeCloseTo(0, 2);
  });

  it('falls back to the first open debt when the order is empty', () => {
    const p = simulate(
      TWO_LOANS,
      budget({ strategy: 'manual', manualOrder: [] }),
      opts
    );
    const row = p.Months[0];
    const paid = (id) => row.perDebt.find((d) => d.debtId === id).paid;
    // 'low' is first in the debts array.
    expect(paid('low')).toBeCloseTo(25000, 2);
    expect(paid('high')).toBeCloseTo(0, 2);
  });

  it('falls back the same way when manualOrder is missing entirely', () => {
    const b = budget({ strategy: 'manual' });
    delete b.manualOrder;
    const p = simulate(TWO_LOANS, b, opts);
    expect(p.IsInfeasible).toBe(false);
    assertMoneyConserved(p, b);
  });
});
