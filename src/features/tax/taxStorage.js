import { DEMO_DATA } from '../../shared/demoData';

const STORAGE_KEYS = {
  TAX_SETTINGS: 'finsmart_tax_settings_v1'
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

export const loadTaxSettings = () => {
  const data = read(STORAGE_KEYS.TAX_SETTINGS, DEMO_DATA.taxSettings);
  return data && typeof data === 'object' ? data : DEMO_DATA.taxSettings;
};

export const saveTaxSettings = (taxSettings) => {
  localStorage.setItem(STORAGE_KEYS.TAX_SETTINGS, JSON.stringify(taxSettings));
};
