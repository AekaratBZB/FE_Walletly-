/**
 * Persistence for the debt planner.
 *
 * This is the single swap point: replacing the bodies of loadDebts /
 * saveDebts / loadBudgetProfile / saveBudgetProfile with fetch calls moves the
 * feature onto a REST API without touching the engine or the UI.
 */

const STORAGE_KEYS = {
  DEBTS: 'finsmart_debts_v1',
  BUDGET_PROFILE: 'finsmart_budget_profile_v1'
};

/** The fixed-cost category that means "this is really a debt". */
export const DEBT_FIXED_COST_CATEGORY = 'ชำระหนี้สิน (บัตรเครดิต/สินเชื่อบุคคล)';

const DISCRETIONARY_CATEGORIES = ['อาหารและเครื่องดื่ม', 'ช้อปปิ้งและของใช้'];

export const DEFAULT_BUDGET_PROFILE = {
  netMonthlyIncome: 0,
  fixedExpenses: 0,
  discretionaryBudget: 0,
  extraIncome: 0,
  emergencyFundCurrent: 0,
  emergencyFundTarget: 0,
  emergencyMonthlyContribution: 0,
  emergencyContributionOverrides: [],
  shortTermBuffer: 0,
  bufferOverrides: [],
  strategy: 'avalanche',
  manualOrder: []
};

const read = (key) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error('Failed to parse localStorage for key:', key, e);
    return null;
  }
};

export const loadDebts = () => {
  const stored = read(STORAGE_KEYS.DEBTS);
  return Array.isArray(stored) ? stored : [];
};

export const saveDebts = (debts) => {
  localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
};

export const loadBudgetProfile = () => {
  const stored = read(STORAGE_KEYS.BUDGET_PROFILE);
  return stored && typeof stored === 'object'
    ? { ...DEFAULT_BUDGET_PROFILE, ...stored }
    : null;
};

export const saveBudgetProfile = (profile) => {
  localStorage.setItem(STORAGE_KEYS.BUDGET_PROFILE, JSON.stringify(profile));
};

/**
 * First-load prefill from the data the user already has in other tabs.
 *
 * Debts themselves are NOT prefilled: a fixed cost carries no rate, no
 * principal and no period count, and inventing those would break the rule
 * against fabricating figures. See findDebtCandidates for the prompt instead.
 */
export const buildPrefillProfile = ({
  allocationSettings = {},
  fixedCosts = [],
  savingsGoals = [],
  transactions = []
} = {}) => {
  const fixedExpenses = fixedCosts
    .filter((fc) => fc.category !== DEBT_FIXED_COST_CATEGORY)
    .reduce((sum, fc) => sum + (Number(fc.amount) || 0), 0);

  const prefixes = transactions
    .map((t) => (t.date || '').slice(0, 7))
    .filter(Boolean)
    .sort();
  const latest = prefixes.length ? prefixes[prefixes.length - 1] : null;

  const discretionaryBudget = latest
    ? transactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            (t.date || '').startsWith(latest) &&
            DISCRETIONARY_CATEGORIES.includes(t.category)
        )
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    : 0;

  const emergency = savingsGoals.find((g) => g.category === 'ความมั่นคง');

  return {
    ...DEFAULT_BUDGET_PROFILE,
    netMonthlyIncome: Number(allocationSettings.monthlyIncome) || 0,
    fixedExpenses,
    discretionaryBudget,
    emergencyFundCurrent: emergency ? Number(emergency.currentAmount) || 0 : 0,
    emergencyFundTarget: emergency ? Number(emergency.targetAmount) || 0 : 0,
    emergencyMonthlyContribution: emergency
      ? Number(emergency.monthlyContribution) || 0
      : 0
  };
};

/** Fixed costs that look like debts, offered to the user as add-debt candidates. */
export const findDebtCandidates = (fixedCosts = []) =>
  fixedCosts.filter((fc) => fc.category === DEBT_FIXED_COST_CATEGORY);
