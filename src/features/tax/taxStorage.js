import { DEMO_DATA } from '../../shared/demoData';

const STORAGE_KEYS = {
  TAX_SETTINGS: 'finsmart_tax_settings_v1'
};

export const EMPTY_TAX_SETTINGS = {
  taxYear: 2026,
  annualSalary: 0,
  annualBonus: 0,
  freelanceIncome: 0,
  socialSecurity: 0,
  personalDeduction: 60000,
  spouseDeduction: 0,
  childCount: 0,
  parentCount: 0,
  lifeInsurance: 0,
  healthInsurance: 0,
  ssfAmount: 0,
  rmfAmount: 0,
  thaiEsgAmount: 0,
  providentFund: 0,
  mortgageInterest: 0,
  easyReceipt: 0,
  donationGeneral: 0,
  donationEducation: 0,
  withholdingTax: 0
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

// Older builds seeded new users with the demo tax form; treat an untouched
// copy of it as "no data" so those users stop seeing invented income.
const isUntouchedDemo = (data) =>
  JSON.stringify(data) === JSON.stringify(DEMO_DATA.taxSettings);

export const loadTaxSettings = () => {
  const data = read(STORAGE_KEYS.TAX_SETTINGS, null);
  if (!data || typeof data !== 'object' || isUntouchedDemo(data)) {
    return { ...EMPTY_TAX_SETTINGS };
  }
  return data;
};

export const saveTaxSettings = (taxSettings) => {
  localStorage.setItem(STORAGE_KEYS.TAX_SETTINGS, JSON.stringify(taxSettings));
};
