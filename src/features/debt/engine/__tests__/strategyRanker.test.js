import { describe, it, expect } from 'vitest';
import { rankDebts } from '../strategyRanker';
import { GOLDEN_BUDGET, GOLDEN_DEBTS, GOLDEN_START } from './goldenFixture';

const opts = { startMonth: GOLDEN_START };

describe('rankDebts', () => {
  const ranked = rankDebts(GOLDEN_DEBTS, GOLDEN_BUDGET, opts);
  const byId = (id) => ranked.find((r) => r.debtId === id);

  it('returns one row per open debt', () => {
    expect(ranked).toHaveLength(GOLDEN_DEBTS.length);
  });

  it('costs an installment plan at zero however large the balance', () => {
    expect(byId('inst-camera').totalRemainingCost).toBe(0);
    expect(byId('inst-camera').reason).toContain('0%');
  });

  it('flags a hire purchase with no settlement quote instead of estimating', () => {
    const car = byId('hp-car');
    expect(car.quoteMissing).toBe(true);
    expect(car.totalRemainingCost).toBe(0);
    expect(car.rebateDecayPerMonth).toBeNull();
    expect(car.reason).toContain('ใบเสนอปิดบัญชี');
  });

  it('costs the amortizing loan at the interest it will actually pay', () => {
    expect(byId('loan-1').totalRemainingCost).toBeCloseTo(131445.49, 2);
  });

  it('ranks descending by cost, so the loan leads', () => {
    expect(ranked[0].debtId).toBe('loan-1');
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].totalRemainingCost).toBeGreaterThanOrEqual(
        ranked[i].totalRemainingCost
      );
    }
  });

  it('uses the lender quote for a hire purchase when one exists', () => {
    const withQuote = GOLDEN_DEBTS.map((d) =>
      d.id === 'hp-car' ? { ...d, settlementQuote: 41000 } : d
    );
    const car = rankDebts(withQuote, GOLDEN_BUDGET, opts).find(
      (r) => r.debtId === 'hp-car'
    );
    expect(car.quoteMissing).toBe(false);
    expect(car.totalRemainingCost).toBeCloseTo(6236, 2);
    expect(car.rebateDecayPerMonth).toBeCloseTo(445.4285714, 4);
  });

  it('excludes closed debts', () => {
    const closed = GOLDEN_DEBTS.map((d) =>
      d.id === 'inst-guitar' ? { ...d, isClosed: true } : d
    );
    expect(rankDebts(closed, GOLDEN_BUDGET, opts)).toHaveLength(
      GOLDEN_DEBTS.length - 1
    );
  });

  it('handles an empty debt list', () => {
    expect(rankDebts([], GOLDEN_BUDGET, opts)).toEqual([]);
  });

  it('marks the ranking reliable on a feasible projection', () => {
    for (const r of ranked) {
      expect(r.rankingUnreliable).toBe(false);
    }
  });
});

describe('rankDebts on an infeasible projection', () => {
  // discretionaryBudget 25,000 drives the surplus negative, so the projection
  // stops after one row and no amortizing interest can be summed from it.
  const infeasibleBudget = { ...GOLDEN_BUDGET, discretionaryBudget: 25000 };
  const withQuote = GOLDEN_DEBTS.map((d) =>
    d.id === 'hp-car' ? { ...d, settlementQuote: 41000 } : d
  );
  const ranked = rankDebts(withQuote, infeasibleBudget, opts);
  const byId = (id) => ranked.find((r) => r.debtId === id);

  it('flags every row as unreliable', () => {
    for (const r of ranked) {
      expect(r.rankingUnreliable).toBe(true);
    }
  });

  it('refuses to invent an interest figure for the amortizing loan', () => {
    expect(byId('loan-1').totalRemainingCost).toBeNull();
    expect(byId('loan-1').reason).toContain('ยังคำนวณดอกเบี้ยรวมไม่ได้');
  });

  it('keeps the interest-bearing loan above the hire-purchase rebate', () => {
    // The truncated projection would have costed the loan at 0, ranking it
    // below the car's 6,236 rebate and inverting the action plan.
    expect(ranked[0].debtId).toBe('loan-1');
    expect(byId('hp-car').totalRemainingCost).toBeCloseTo(6236, 2);
    const carIndex = ranked.findIndex((r) => r.debtId === 'hp-car');
    expect(carIndex).toBeGreaterThan(0);
  });

  it('leaves the projection-independent rows descending below it', () => {
    const rest = ranked.filter((r) => r.totalRemainingCost !== null);
    for (let i = 1; i < rest.length; i++) {
      expect(rest[i - 1].totalRemainingCost).toBeGreaterThanOrEqual(
        rest[i].totalRemainingCost
      );
    }
  });
});
