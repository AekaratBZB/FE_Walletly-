import { DEMO_DATA } from '../../shared/demoData';

const STORAGE_KEYS = {
  SAVINGS_GOALS: 'finsmart_savings_goals_v1'
};

const read = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (e) {
    console.error('Failed to parse localStorage for key:', key, e);
    return fallback;
  }
};

export const loadSavingsGoals = () => {
  const data = read(STORAGE_KEYS.SAVINGS_GOALS, DEMO_DATA.savingsGoals);
  return Array.isArray(data) ? data : DEMO_DATA.savingsGoals;
};

export const saveSavingsGoals = (savingsGoals) => {
  localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(savingsGoals));
};
