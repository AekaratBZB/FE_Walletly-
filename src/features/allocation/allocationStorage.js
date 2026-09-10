import { DEMO_DATA } from '../../shared/demoData';

const STORAGE_KEYS = {
  ALLOCATION_SETTINGS: 'finsmart_allocation_v1'
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

export const loadAllocationSettings = () => {
  const data = read(STORAGE_KEYS.ALLOCATION_SETTINGS, DEMO_DATA.allocationSettings);
  return data && typeof data === 'object' ? data : DEMO_DATA.allocationSettings;
};

export const saveAllocationSettings = (allocationSettings) => {
  localStorage.setItem(STORAGE_KEYS.ALLOCATION_SETTINGS, JSON.stringify(allocationSettings));
};
