
const STORAGE_KEYS = {
  TRANSACTIONS: 'finsmart_transactions_v1'
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

export const loadTransactions = () => {
  const data = read(STORAGE_KEYS.TRANSACTIONS, []);
  return Array.isArray(data) ? data : [];
};

export const saveTransactions = (transactions) => {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
};
