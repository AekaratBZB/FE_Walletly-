import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadTransactions, saveTransactions } from '../transactionsStorage';
import { DEMO_DATA } from '../../../shared/demoData';

describe('transactionsStorage', () => {
  beforeEach(() => {
    const store = {};
    global.localStorage = {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, val) => { store[key] = String(val); }),
      clear: vi.fn(() => { for (const k in store) delete store[k]; })
    };
  });

  it('loads fallback demo data when localStorage is empty', () => {
    const data = loadTransactions();
    expect(data).toEqual(DEMO_DATA.transactions);
  });

  it('saves and reloads transactions correctly', () => {
    const customTx = [{ id: 'tx-1', amount: 500, category: 'อาหาร' }];
    saveTransactions(customTx);
    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'finsmart_transactions_v1',
      JSON.stringify(customTx)
    );
    const loaded = loadTransactions();
    expect(loaded).toEqual(customTx);
  });
});
