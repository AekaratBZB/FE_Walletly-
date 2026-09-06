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
});
