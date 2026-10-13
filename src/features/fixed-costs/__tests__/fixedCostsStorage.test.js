import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadFixedCosts, saveFixedCosts } from '../fixedCostsStorage';

describe('fixedCostsStorage', () => {
  beforeEach(() => {
    const store = {};
    global.localStorage = {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, val) => { store[key] = String(val); }),
      clear: vi.fn(() => { for (const k in store) delete store[k]; })
    };
  });

  it('returns an empty list when nothing is stored', () => {
    const data = loadFixedCosts();
    expect(data).toEqual([]);
  });

  it('persists and retrieves fixed costs correctly', () => {
    const list = [{ id: 'fc-1', title: 'ค่าเน็ต', amount: 599, isPaid: false }];
    saveFixedCosts(list);
    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'finsmart_fixed_costs_v1',
      JSON.stringify(list)
    );
    expect(loadFixedCosts()).toEqual(list);
  });
});
