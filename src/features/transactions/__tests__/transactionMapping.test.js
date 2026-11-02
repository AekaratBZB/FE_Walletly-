import { describe, it, expect } from 'vitest';
import {
  mapTransactionDto,
  periodToRange,
  mergeWithProjected,
  resolveCategoryId,
  buildUpdatePayload,
  isLinkedTransaction,
  summarizeWallet
} from '../transactionMapping';

describe('buildUpdatePayload', () => {
  const original = {
    id: 'a-1', paymentMethod: 'เงินสด', paymentMethodId: 'pm-cash', accountId: 'acc-cash',
    destinationAccountId: null, savingsGoalId: 'goal-1', fixedCostId: null, debtId: 'debt-1', isRecurring: true
  };
  const changes = { type: 'savings', amount: '1500', date: '2026-11-01', note: 'n' };

  it('keeps links and account when payment method unchanged', () => {
    expect(buildUpdatePayload(original, changes, { categoryId: 'c1', paymentMethodId: 'pm-cash' })).toEqual({
      type: 'savings', amount: 1500, txDate: '2026-11-01', categoryId: 'c1',
      accountId: 'acc-cash', destinationAccountId: null, paymentMethodId: 'pm-cash',
      savingsGoalId: 'goal-1', fixedCostId: null, debtId: 'debt-1', note: 'n', isRecurring: true
    });
  });

  it('drops account so BE re-derives it when payment method changes', () => {
    const p = buildUpdatePayload(original, changes, { categoryId: 'c1', paymentMethodId: 'pm-qr' });
    expect(p.accountId).toBeNull();
    expect(p.paymentMethodId).toBe('pm-qr');
  });
});

describe('isLinkedTransaction', () => {
  it('detects goal/debt/source links', () => {
    expect(isLinkedTransaction({ savingsGoalId: 'g' })).toBe(true);
    expect(isLinkedTransaction({ sourceType: 'fixedCost' })).toBe(true);
    expect(isLinkedTransaction({ id: 'x' })).toBe(false);
  });
});

describe('summarizeWallet', () => {
  it('counts this month pending salary/fixed and skips rows after month end', () => {
    const s = summarizeWallet(
      [
        { type: 'income', amount: 30000, date: '2026-10-25' },
        { type: 'expense', amount: 2000, date: '2026-10-26' },
        { type: 'savings', amount: 5000, date: '2026-11-01' },
        { type: 'expense', amount: 999, date: '2026-12-01' },
        // projected ที่ติดมากับ transactions ไม่นับซ้ำ
        { type: 'income', amount: 1, date: '2026-11-25', isProjected: true }
      ],
      [
        { type: 'income', amount: 30000, date: '2026-11-25', isProjected: true },
        { type: 'fixed', amount: 8000, date: '2026-11-05', isProjected: true }
      ],
      '2026-11-30'
    );
    expect(s).toEqual({
      income: 60000, expense: 2000, fixed: 8000, savings: 5000, pendingIncome: 30000, balance: 45000
    });
  });
});

describe('mapTransactionDto', () => {
  it('maps a plain dto with defaults', () => {
    const r = mapTransactionDto({ id: 1, txDate: '2027-02-03', type: 'income', amount: '10' });
    expect(r).toEqual({
      id: 1,
      date: '2027-02-03',
      type: 'income',
      category: 'ทั่วไป',
      categoryId: undefined,
      amount: 10,
      paymentMethod: '',
      paymentMethodId: null,
      note: '',
      isProjected: false,
      sourceType: null,
      sourceId: null,
      sourcePeriod: null,
      isUserModified: false,
      accountId: null,
      destinationAccountId: null,
      savingsGoalId: null,
      fixedCostId: null,
      debtId: null,
      isRecurring: false
    });
  });

  it('keeps source fields and projected flag', () => {
    const r = mapTransactionDto({
      id: 'p1', txDate: '2027-02-25', type: 'fixed', categoryName: 'เช่า', categoryId: 3,
      amount: 5000, paymentMethodName: 'เงินสด', note: 'x',
      isProjected: true, sourceType: 'fixedCost', sourceId: 9, sourcePeriod: '2027-02-01', isUserModified: true
    });
    expect(r).toMatchObject({
      category: 'เช่า', categoryId: 3, paymentMethod: 'เงินสด', note: 'x',
      isProjected: true, sourceType: 'fixedCost', sourceId: 9, sourcePeriod: '2027-02-01', isUserModified: true
    });
  });
});

describe('periodToRange', () => {
  it('month mode gives first/last day', () => {
    expect(periodToRange({ periodMode: 'month', month: '2027-02' }))
      .toEqual({ startDate: '2027-02-01', endDate: '2027-02-28' });
    expect(periodToRange({ periodMode: 'month', month: '2028-02' }).endDate).toBe('2028-02-29');
    expect(periodToRange({ periodMode: 'month', month: '2027-12' }).endDate).toBe('2027-12-31');
  });

  it('range mode needs both sides', () => {
    expect(periodToRange({ periodMode: 'range', startDate: '2027-01-05', endDate: '2027-01-20' }))
      .toEqual({ startDate: '2027-01-05', endDate: '2027-01-20' });
    expect(periodToRange({ periodMode: 'range', startDate: '2027-01-05', endDate: '' })).toBeNull();
    expect(periodToRange({ periodMode: 'range', startDate: '', endDate: '2027-01-20' })).toBeNull();
  });

  it('all gives null', () => {
    expect(periodToRange({ periodMode: 'all' })).toBeNull();
  });
});

describe('mergeWithProjected', () => {
  it('sorts by date desc with projected after real on same date', () => {
    const real = [
      { id: 1, date: '2027-02-10' },
      { id: 2, date: '2027-02-25' }
    ];
    const projected = [
      { id: 'p1', date: '2027-02-25', isProjected: true },
      { id: 'p2', date: '2027-02-28', isProjected: true }
    ];
    expect(mergeWithProjected(real, projected).map((t) => t.id)).toEqual(['p2', 2, 'p1', 1]);
  });

  it('handles missing projected', () => {
    expect(mergeWithProjected([{ id: 1, date: '2027-01-01' }], undefined)).toHaveLength(1);
  });
});

describe('resolveCategoryId', () => {
  const cats = [
    { id: 'salary', type: 'income', name: 'เงินเดือน (Salary)' },
    { id: 'bonus', type: 'income', name: 'โบนัส (Bonus)' },
    { id: 'other-in', type: 'income', name: 'อื่นๆ' },
    { id: 'travel', type: 'expense', name: 'การเดินทาง / น้ำมัน' },
    { id: 'food', type: 'expense', name: 'อาหารและเครื่องดื่ม' }
  ];

  it('keeps an explicit categoryId', () => {
    expect(resolveCategoryId({ categoryId: 'x', category: 'โบนัส (Bonus)', type: 'income' }, cats)).toBe('x');
  });

  it('prefers the exact name over the first category of the same type', () => {
    expect(resolveCategoryId({ category: 'โบนัส (Bonus)', type: 'income' }, cats)).toBe('bonus');
  });

  it('matches names that differ only in spacing', () => {
    expect(resolveCategoryId({ category: 'การเดินทาง/น้ำมัน', type: 'expense' }, cats)).toBe('travel');
  });

  it('falls back to an "other" category of the same type, not the salary one', () => {
    expect(resolveCategoryId({ category: 'ขายของออนไลน์', type: 'income' }, cats)).toBe('other-in');
  });

  it('returns null when no category of that type exists', () => {
    expect(resolveCategoryId({ category: 'x', type: 'savings' }, cats)).toBeNull();
  });
});
