import { DEMO_DATA } from '../../shared/demoData';

const STORAGE_KEYS = {
  FIXED_COSTS: 'finsmart_fixed_costs_v1'
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

export const loadFixedCosts = () => {
  const data = read(STORAGE_KEYS.FIXED_COSTS, DEMO_DATA.fixedCosts);
  return Array.isArray(data) ? data : DEMO_DATA.fixedCosts;
};

export const saveFixedCosts = (fixedCosts) => {
  localStorage.setItem(STORAGE_KEYS.FIXED_COSTS, JSON.stringify(fixedCosts));
};
