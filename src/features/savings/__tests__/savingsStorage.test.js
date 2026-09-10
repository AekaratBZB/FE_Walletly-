import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSavingsGoals, saveSavingsGoals } from '../savingsStorage';
import { DEMO_DATA } from '../../../shared/demoData';

describe('savingsStorage', () => {
  beforeEach(() => {
    const store = {};
    global.localStorage = {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, val) => { store[key] = String(val); }),
      clear: vi.fn(() => { for (const k in store) delete store[k]; })
    };
  });

  it('loads fallback demo data when empty', () => {
    const data = loadSavingsGoals();
    expect(data).toEqual(DEMO_DATA.savingsGoals);
  });

  it('persists and retrieves savings goals correctly', () => {
    const goals = [{ id: 'goal-1', title: 'เที่ยวญี่ปุ่น', targetAmount: 50000, currentAmount: 12000 }];
    saveSavingsGoals(goals);
    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'finsmart_savings_goals_v1',
      JSON.stringify(goals)
    );
    expect(loadSavingsGoals()).toEqual(goals);
  });
});
