/**
 * Pure math helpers for the debt payoff engine.
 *
 * Money is never rounded here. Rounding inside the simulation loop accumulates
 * enough error over 54 months to break the golden vectors, so rounding happens
 * only at the display boundary in the UI components.
 */

/** Installment periods still owed. Never negative. */
export const periodsRemaining = (debt) =>
  Math.max(0, (Number(debt.periodsTotal) || 0) - (Number(debt.periodsPaid) || 0));

/**
 * Outstanding balance.
 *
 * For hirePurchase and installment this is payment x periods remaining and
 * NEVER an interest formula — a hire-purchase contract has its total interest
 * baked in and is not a reducing-balance loan.
 */
export const outstandingBalance = (debt) => {
  if (debt.type === 'amortizing') {
    return (Number(debt.principal) || 0) + (Number(debt.accruedInterest) || 0);
  }
  return (Number(debt.monthlyPayment) || 0) * periodsRemaining(debt);
};

/**
 * Value of a stepped schedule at a given month: the amount of the override
 * with the highest fromMonth that is <= month, or defaultValue if none apply.
 * Order-independent — the caller does not have to keep overrides sorted.
 */
export const resolveSchedule = (defaultValue, overrides, month) => {
  let value = Number(defaultValue) || 0;
  let best = -1;
  for (const o of overrides || []) {
    const from = Number(o.fromMonth);
    if (!Number.isFinite(from) || from > month) continue;
    if (from >= best) {
      best = from;
      value = Number(o.amount) || 0;
    }
  }
  return value;
};

/** How far ahead an override still counts as "cash on its way". See below. */
export const OVERRIDE_LOOKAHEAD_MONTHS = 12;

/**
 * True when some override has not taken effect yet, i.e. more cash may free up.
 *
 * Bounded to the next `withinMonths` months. An unbounded test lets a single
 * stale override at, say, month 400 keep the non-termination guard switched
 * off for 400 months, so a portfolio whose debt is visibly growing grinds all
 * the way to maxMonths instead of reporting infeasibility. One year is the
 * horizon over which a household budget change is plausibly real; a schedule
 * step further out than that is no evidence that this month's stalled plan is
 * about to recover.
 */
export const hasFutureOverride = (overrides, month, withinMonths = OVERRIDE_LOOKAHEAD_MONTHS) =>
  (overrides || []).some((o) => {
    const from = Number(o.fromMonth);
    return Number.isFinite(from) && from > month && from - month <= withinMonths;
  });

/** One month of interest on the outstanding principal. */
export const monthlyInterest = (loan) =>
  (Number(loan.principal) || 0) * ((Number(loan.annualRatePct) || 0) / 100 / 12);

/**
 * Contractual minimum for this month.
 *
 * Mode 'none' means 0. It must stay the default: the golden fixture pays
 * 2,015.34 against interest of 3,342.29 in month 0, and a minimum defaulting
 * to the month's interest would flag a shortfall and break every vector.
 * Growing interest arrears is the correct behaviour.
 */
export const minimumDue = (loan) => {
  const mp = loan.minimumPayment || { mode: 'none' };
  const balance = (Number(loan.principal) || 0) + (Number(loan.accruedInterest) || 0);
  let due = 0;
  if (mp.mode === 'fixed') {
    due = Number(mp.amount) || 0;
  } else if (mp.mode === 'percentOfBalance') {
    const pct = balance * ((Number(mp.percent) || 0) / 100);
    due = Math.max(Number(mp.floor) || 0, pct);
  }
  return Math.min(due, balance);
};

/**
 * Rebate obtainable by settling a hire-purchase contract today.
 * Returns null when the lender has not given a quote — never estimated from a
 * rate. An estimated rebate that is five times too high sends the user into a
 * bad decision, which is the exact failure this feature exists to prevent.
 */
export const hirePurchaseRebate = (debt) => {
  const quote = debt.settlementQuote;
  if (quote === null || quote === undefined || quote === '') return null;
  return (Number(debt.monthlyPayment) || 0) * periodsRemaining(debt) - Number(quote);
};

/** How much of the rebate evaporates per period. Null without a quote. */
export const rebateDecayPerMonth = (debt) => {
  const rebate = hirePurchaseRebate(debt);
  const n = periodsRemaining(debt);
  if (rebate === null || n <= 0) return null;
  return rebate / n;
};

/** Advance a { year, month } pair by a whole number of months. month is 1-12. */
export const addMonths = (start, count) => {
  const zeroBased = start.year * 12 + (start.month - 1) + count;
  return { year: Math.floor(zeroBased / 12), month: (zeroBased % 12) + 1 };
};
