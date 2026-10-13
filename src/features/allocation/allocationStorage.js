const STORAGE_KEYS = {
  ALLOCATION_SETTINGS: 'finsmart_allocation_v1'
};

export const EMPTY_ALLOCATION_SETTINGS = {
  rule: '50-30-20',
  monthlyIncome: 0,
  buckets: { needs: 50, wants: 30, savings: 20 }
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
  const data = read(STORAGE_KEYS.ALLOCATION_SETTINGS, null);
  return data && typeof data === 'object' ? data : { ...EMPTY_ALLOCATION_SETTINGS };
};

export const saveAllocationSettings = (allocationSettings) => {
  localStorage.setItem(STORAGE_KEYS.ALLOCATION_SETTINGS, JSON.stringify(allocationSettings));
};
