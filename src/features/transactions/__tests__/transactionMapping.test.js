import { describe, it, expect } from 'vitest';
import { mapTransactionDto, periodToRange, mergeWithProjected } from '../transactionMapping';

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
      note: '',
      isProjected: false,
      sourceType: null,
      sourceId: null,
      sourcePeriod: null,
      isUserModified: false
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
