# Debt Payoff Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "ปลอดหนี้" tab that simulates, month by month, when every debt a user carries is paid off, driven by a pure multi-loan simulation engine with per-debt interest rates.

**Architecture:** A pure JS engine (`simulate(debts, budget, options)`) with no I/O, no DB and no clock, verified against the 14 golden vectors and two sensitivity tables in the source spec's §8. State lives in `localStorage` behind a single `debtStorage.js` swap point so it can become a REST call later. UI is a new feature module following the existing feature-based pattern, shipped in two phases.

**Tech Stack:** React 18, Vite 6, vitest (new dev dependency), chart.js + react-chartjs-2 (already present), lucide-react (already present).

**Spec:** `docs/superpowers/specs/2026-09-07-debt-payoff-planner-design.md`

## Global Constraints

- Money is **never rounded mid-loop**. Full float64 precision through the simulation; round to 2 decimals only at display and test-comparison boundaries. Rounding each step accumulates ~0.27 THB over 54 months and breaks the ±0.01 tolerance on `TotalInterestPaid`.
- `simulate` is **pure**: no `new Date()`, no `localStorage`, no imports from `context/`. `startMonth` is passed in as `{ year, month }`.
- **Accrue interest before applying payment.** Reversing it shifts every row by one month.
- **Payments clear accrued interest before touching principal.** Any other order understates the payoff period.
- `hirePurchase` and `installment` balances are `monthlyPayment * periodsRemaining`. **Never an interest formula.**
- A null `settlementQuote` is **never** replaced by an estimate. It surfaces as `quoteMissing: true` and the UI shows "ขอใบเสนอปิดบัญชีจากเจ้าหนี้".
- `minimumPayment` defaults to `{ mode: 'none' }`, which means 0. It must **not** default to the month's interest.
- Money tolerance in tests: `toBeCloseTo(expected, 2)`. Month counts: `toBe(expected)`, exact.
- Every projection view renders the assumptions it was computed from, on screen, never in a tooltip.
- No gamification, streaks or mascots. `canvas-confetti` is a dependency and must not be imported by this feature.
- UI copy is Thai, matching the existing tabs. Reuse existing CSS classes from `src/index.css` — do not add new stylesheets.
- Commit after every task.

---

## File Structure

**Engine (pure, tested):**

| File | Responsibility |
|---|---|
| `src/features/debt/engine/types.js` | JSDoc typedefs only, no runtime code |
| `src/features/debt/engine/debtMath.js` | Balances, minimum-payment modes, schedule resolution, rebate math |
| `src/features/debt/engine/payoffSimulator.js` | `simulate()` — the month loop |
| `src/features/debt/engine/strategyRanker.js` | `rankDebts()` — payoff ordering with reasons |

**Tests:**

| File | Responsibility |
|---|---|
| `src/features/debt/engine/__tests__/goldenFixture.js` | The §8 fixture as data |
| `src/features/debt/engine/__tests__/debtMath.test.js` | Unit tests for the math helpers |
| `src/features/debt/engine/__tests__/payoffSimulator.golden.test.js` | The 14 §8 assertions + both sensitivity tables |
| `src/features/debt/engine/__tests__/payoffSimulator.edge.test.js` | 9 edge cases (5 from §8, 4 for multi-loan) |
| `src/features/debt/engine/__tests__/strategyRanker.test.js` | Ranking and quote-missing behaviour |

**State:**

| File | Responsibility |
|---|---|
| `src/features/debt/debtStorage.js` | `localStorage` I/O, defaults, first-load prefill — the API swap point |
| `src/features/debt/useDebtState.js` | React state + CRUD, consumed by `WalletContext` |

**UI phase 1:**

| File | Responsibility |
|---|---|
| `src/features/debt/DebtTab.jsx` | Tab shell, runs `simulate`, composes panels |
| `src/features/debt/PayoffSummaryCards.jsx` | 4 summary cards, infeasible banner, assumptions box |
| `src/features/debt/BudgetProfilePanel.jsx` | Budget inputs incl. schedule overrides |
| `src/features/debt/DebtListPanel.jsx` | Debt list, edit/delete, fixed-cost candidate prompt |
| `src/features/debt/AddDebtModal.jsx` | Add/edit form, fields switch on type |
| `src/features/debt/ScheduleTable.jsx` | Monthly schedule table |

**UI phase 2:**

| File | Responsibility |
|---|---|
| `src/features/debt/AmortizationChart.jsx` | Principal / arrears / emergency-fund lines |
| `src/features/debt/CeilingPanel.jsx` | Step chart of the discretionary ceiling |
| `src/features/debt/WhatIfSliders.jsx` | Discretionary + extra-income overrides |
| `src/features/debt/StrategyPanel.jsx` | Ranked order + avalanche/snowball comparison |

**Modified:**

| File | Change |
|---|---|
| `package.json` | Add `vitest` dev dependency, `test` and `test:watch` scripts |
| `src/shared/formatters.js` | Add `formatMonthLabel({ year, month })` |
| `src/context/WalletContext.jsx` | Call `useDebtState`, spread into value, wire backup/import/reset/clear |
| `src/components/Navbar.jsx` | Add the `debt` tab after `projection` |
| `src/App.jsx` | Add the `debt` case and render `AddDebtModal` |

---

### Task 1: Test runner and `debtMath.js`

**Files:**
- Modify: `package.json`
- Create: `src/features/debt/engine/types.js`
- Create: `src/features/debt/engine/debtMath.js`
- Test: `src/features/debt/engine/__tests__/debtMath.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `periodsRemaining(debt) => number`
  - `outstandingBalance(debt) => number`
  - `resolveSchedule(defaultValue: number, overrides: {fromMonth,amount}[], month: number) => number`
  - `hasFutureOverride(overrides, month: number) => boolean`
  - `monthlyInterest(loan: {principal, annualRatePct}) => number`
  - `minimumDue(loan) => number`
  - `hirePurchaseRebate(debt) => number | null`
  - `rebateDecayPerMonth(debt) => number | null`
  - `addMonths(start: {year,month}, count: number) => {year, month}`

- [ ] **Step 1: Install vitest**

```bash
npm i -D vitest
```

- [ ] **Step 2: Add the test scripts**

In `package.json`, replace the `"scripts"` block with:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```

`vite.config.js` needs no change. jsdom is not required — the engine never touches the DOM.

- [ ] **Step 3: Write the typedefs**

Create `src/features/debt/engine/types.js`:

```js
/**
 * JSDoc typedefs for the debt payoff engine. No runtime code — this file
 * exists so editors can complete the shapes and so the shapes are documented
 * in one place.
 *
 * @typedef {'amortizing' | 'hirePurchase' | 'installment'} DebtType
 *
 * @typedef {Object} MinimumPayment
 * @property {'none' | 'fixed' | 'percentOfBalance'} mode
 * @property {number} [amount]   Used when mode === 'fixed'
 * @property {number} [percent]  Used when mode === 'percentOfBalance', e.g. 8
 * @property {number} [floor]    Used when mode === 'percentOfBalance', e.g. 500
 *
 * @typedef {Object} Debt
 * @property {string} id
 * @property {string} name
 * @property {DebtType} type
 * @property {number} [principal]         amortizing only
 * @property {number} [accruedInterest]   amortizing only, unpaid interest carried over
 * @property {number} [annualRatePct]     amortizing only
 * @property {'monthly'|'annual'} [frequency]
 * @property {number|null} [annualDueMonth] 1-12, required when acceptsEarlyPayment is false
 * @property {boolean} [acceptsEarlyPayment] false => cash is held until annualDueMonth
 * @property {MinimumPayment} [minimumPayment]
 * @property {number} [monthlyPayment]    hirePurchase | installment
 * @property {number} [periodsPaid]       hirePurchase | installment
 * @property {number} [periodsTotal]      hirePurchase | installment
 * @property {number|null} [settlementQuote]     hirePurchase, lender-provided payoff figure
 * @property {string|null} [settlementQuoteDate] hirePurchase, YYYY-MM-DD
 * @property {boolean} isClosed
 *
 * @typedef {Object} ScheduleOverride
 * @property {number} fromMonth  0-based month index this amount takes effect from
 * @property {number} amount
 *
 * @typedef {Object} BudgetProfile
 * @property {number} netMonthlyIncome
 * @property {number} fixedExpenses
 * @property {number} discretionaryBudget
 * @property {number} extraIncome
 * @property {number} emergencyFundCurrent
 * @property {number} emergencyFundTarget
 * @property {number} emergencyMonthlyContribution
 * @property {ScheduleOverride[]} emergencyContributionOverrides
 * @property {number} shortTermBuffer
 * @property {ScheduleOverride[]} bufferOverrides
 * @property {'avalanche'|'snowball'|'manual'} strategy
 * @property {string[]} manualOrder
 *
 * @typedef {Object} YearMonth
 * @property {number} year
 * @property {number} month  1-12
 *
 * @typedef {Object} PerDebtRow
 * @property {string} debtId
 * @property {number} paid
 * @property {number} interestPortion
 * @property {number} principalPortion
 * @property {number} balance
 * @property {number} held
 *
 * @typedef {Object} MonthlyProjection
 * @property {number} Index
 * @property {YearMonth} Month
 * @property {number} InstallmentTotal
 * @property {number} Surplus
 * @property {number} EmergencyContribution
 * @property {number} LoanPayment
 * @property {number} HeldForAnnualPayment
 * @property {number} InterestAccrued
 * @property {number} AccruedInterestBalance
 * @property {number} PrincipalBalance
 * @property {number} EmergencyFundBalance
 * @property {number} DiscretionaryCeiling
 * @property {PerDebtRow[]} perDebt
 *
 * @typedef {Object} Projection
 * @property {MonthlyProjection[]} Months
 * @property {number} MonthsToPayoff
 * @property {YearMonth} PayoffDate
 * @property {number} TotalInterestPaid
 * @property {number|null} InterestArrearsClearedMonth
 * @property {number} MonthlyInterestThreshold
 * @property {boolean} IsInfeasible
 * @property {number|null} MinimumViablePayment
 */

export {};
```

- [ ] **Step 4: Write the failing tests for `debtMath`**

Create `src/features/debt/engine/__tests__/debtMath.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  periodsRemaining,
  outstandingBalance,
  resolveSchedule,
  hasFutureOverride,
  monthlyInterest,
  minimumDue,
  hirePurchaseRebate,
  rebateDecayPerMonth,
  addMonths
} from '../debtMath';

describe('periodsRemaining', () => {
  it('subtracts paid from total', () => {
    expect(periodsRemaining({ periodsTotal: 14, periodsPaid: 2 })).toBe(12);
  });

  it('never goes negative', () => {
    expect(periodsRemaining({ periodsTotal: 3, periodsPaid: 5 })).toBe(0);
  });

  it('treats missing values as zero', () => {
    expect(periodsRemaining({})).toBe(0);
  });
});

describe('outstandingBalance', () => {
  it('uses payment times periods remaining for installment plans', () => {
    expect(outstandingBalance({
      type: 'installment', monthlyPayment: 1699, periodsTotal: 6, periodsPaid: 2
    })).toBe(6796);
  });

  it('uses payment times periods remaining for hire purchase', () => {
    expect(outstandingBalance({
      type: 'hirePurchase', monthlyPayment: 3374, periodsTotal: 14, periodsPaid: 0
    })).toBe(47236);
  });

  it('uses principal plus arrears for amortizing loans', () => {
    expect(outstandingBalance({
      type: 'amortizing', principal: 610000, accruedInterest: 21306
    })).toBe(631306);
  });
});

describe('resolveSchedule', () => {
  const overrides = [{ fromMonth: 3, amount: 3000 }, { fromMonth: 12, amount: 4000 }];

  it('returns the default before any override applies', () => {
    expect(resolveSchedule(2000, overrides, 0)).toBe(2000);
    expect(resolveSchedule(2000, overrides, 2)).toBe(2000);
  });

  it('returns the override from its fromMonth onwards', () => {
    expect(resolveSchedule(2000, overrides, 3)).toBe(3000);
    expect(resolveSchedule(2000, overrides, 11)).toBe(3000);
    expect(resolveSchedule(2000, overrides, 12)).toBe(4000);
  });

  it('picks the highest applicable fromMonth even when unsorted', () => {
    const unsorted = [{ fromMonth: 12, amount: 4000 }, { fromMonth: 3, amount: 3000 }];
    expect(resolveSchedule(2000, unsorted, 5)).toBe(3000);
  });

  it('handles a missing override list', () => {
    expect(resolveSchedule(1200, undefined, 0)).toBe(1200);
  });
});

describe('hasFutureOverride', () => {
  it('is true when an override starts after the given month', () => {
    expect(hasFutureOverride([{ fromMonth: 3, amount: 3000 }], 1)).toBe(true);
  });

  it('is false once every override has taken effect', () => {
    expect(hasFutureOverride([{ fromMonth: 3, amount: 3000 }], 3)).toBe(false);
    expect(hasFutureOverride([], 0)).toBe(false);
  });
});

describe('monthlyInterest', () => {
  it('is principal times the annual rate over twelve', () => {
    expect(monthlyInterest({ principal: 610000, annualRatePct: 6.575 }))
      .toBeCloseTo(3342.2916666, 6);
  });

  it('is zero for a zero rate', () => {
    expect(monthlyInterest({ principal: 50000, annualRatePct: 0 })).toBe(0);
  });
});

describe('minimumDue', () => {
  it('is zero for mode none', () => {
    expect(minimumDue({
      principal: 610000, accruedInterest: 21306, minimumPayment: { mode: 'none' }
    })).toBe(0);
  });

  it('defaults to zero when minimumPayment is absent', () => {
    expect(minimumDue({ principal: 610000, accruedInterest: 0 })).toBe(0);
  });

  it('returns the fixed amount', () => {
    expect(minimumDue({
      principal: 100000, accruedInterest: 0,
      minimumPayment: { mode: 'fixed', amount: 8500 }
    })).toBe(8500);
  });

  it('returns a percentage of the outstanding balance', () => {
    expect(minimumDue({
      principal: 50000, accruedInterest: 0,
      minimumPayment: { mode: 'percentOfBalance', percent: 8, floor: 500 }
    })).toBe(4000);
  });

  it('applies the floor when the percentage falls below it', () => {
    expect(minimumDue({
      principal: 4000, accruedInterest: 0,
      minimumPayment: { mode: 'percentOfBalance', percent: 8, floor: 500 }
    })).toBe(500);
  });

  it('never exceeds the outstanding balance', () => {
    expect(minimumDue({
      principal: 300, accruedInterest: 0,
      minimumPayment: { mode: 'percentOfBalance', percent: 8, floor: 500 }
    })).toBe(300);
    expect(minimumDue({
      principal: 0, accruedInterest: 0,
      minimumPayment: { mode: 'percentOfBalance', percent: 8, floor: 500 }
    })).toBe(0);
  });
});

describe('hirePurchaseRebate', () => {
  it('is remaining payments minus the lender quote', () => {
    expect(hirePurchaseRebate({
      monthlyPayment: 3374, periodsTotal: 14, periodsPaid: 0, settlementQuote: 41000
    })).toBe(6236);
  });

  it('is null when no quote is present — never estimated', () => {
    expect(hirePurchaseRebate({
      monthlyPayment: 3374, periodsTotal: 14, periodsPaid: 0, settlementQuote: null
    })).toBeNull();
    expect(hirePurchaseRebate({
      monthlyPayment: 3374, periodsTotal: 14, periodsPaid: 0
    })).toBeNull();
  });
});

describe('rebateDecayPerMonth', () => {
  it('spreads the rebate across the remaining periods', () => {
    expect(rebateDecayPerMonth({
      monthlyPayment: 3374, periodsTotal: 14, periodsPaid: 0, settlementQuote: 41000
    })).toBeCloseTo(445.4285714, 6);
  });

  it('is null without a quote', () => {
    expect(rebateDecayPerMonth({
      monthlyPayment: 3374, periodsTotal: 14, periodsPaid: 0, settlementQuote: null
    })).toBeNull();
  });

  it('is null with no periods left', () => {
    expect(rebateDecayPerMonth({
      monthlyPayment: 3374, periodsTotal: 14, periodsPaid: 14, settlementQuote: 0
    })).toBeNull();
  });
});

describe('addMonths', () => {
  it('advances within the same year', () => {
    expect(addMonths({ year: 2026, month: 10 }, 1)).toEqual({ year: 2026, month: 11 });
  });

  it('rolls over the year boundary', () => {
    expect(addMonths({ year: 2026, month: 10 }, 3)).toEqual({ year: 2027, month: 1 });
  });

  it('advances 53 months from October 2026 to March 2031', () => {
    expect(addMonths({ year: 2026, month: 10 }, 53)).toEqual({ year: 2031, month: 3 });
  });

  it('returns the start month for a zero offset', () => {
    expect(addMonths({ year: 2026, month: 10 }, 0)).toEqual({ year: 2026, month: 10 });
  });
});
```

- [ ] **Step 5: Run the tests to verify they fail**

```bash
npm test
```

Expected: FAIL — `Failed to resolve import "../debtMath"`.

- [ ] **Step 6: Implement `debtMath.js`**

Create `src/features/debt/engine/debtMath.js`:

```js
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

/** True when some override has not taken effect yet, i.e. more cash may free up. */
export const hasFutureOverride = (overrides, month) =>
  (overrides || []).some((o) => Number(o.fromMonth) > month);

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
```

- [ ] **Step 7: Run the tests to verify they pass**

```bash
npm test
```

Expected: PASS — all `debtMath.test.js` tests green.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/features/debt/engine/types.js src/features/debt/engine/debtMath.js src/features/debt/engine/__tests__/debtMath.test.js
git commit -m "feat: add vitest and debt engine math helpers"
```

---

### Task 2: `payoffSimulator.js` — single-loan path, all §8 golden vectors

This is the task the whole feature rests on. Do not proceed past it with a red suite.

**Files:**
- Create: `src/features/debt/engine/__tests__/goldenFixture.js`
- Create: `src/features/debt/engine/payoffSimulator.js`
- Test: `src/features/debt/engine/__tests__/payoffSimulator.golden.test.js`

**Interfaces:**
- Consumes: everything exported from `debtMath.js` (Task 1)
- Produces:
  - `simulate(debts: Debt[], budget: BudgetProfile, options?: { maxMonths?: number, startMonth?: YearMonth }) => Projection`
  - From `goldenFixture.js`: `GOLDEN_BUDGET`, `GOLDEN_DEBTS`, `GOLDEN_START`

- [ ] **Step 1: Write the fixture**

Create `src/features/debt/engine/__tests__/goldenFixture.js`:

```js
/**
 * The §8 golden fixture from the source spec, as data.
 *
 * Verified by hand before implementation:
 *   installmentTotal m0 = 856.90+1699.00+1998.33+2496.66+439.41+3374.00 = 10,864.30
 *   surplus m0          = 29000 - 7920.36 - 5000 - 10864.30            =  5,215.34
 *   threshold           = 610000 * 0.06575 / 12                        =  3,342.29
 *   availableForLoan m0 = 5215.34 - 2000 - 1200                        =  2,015.34
 *   arrears m0          = 21306 + 3342.2916667 - 2015.34               = 22,632.95
 *   installmentTotal m2 = 10864.30 - 2496.66 (guitar done)             =  8,367.64
 *   m3 obligations      = 856.90 + 1699.00 + 3374.00                   =  5,929.90
 *   LoanPayment m3      = (29000-7920.36-5000-5929.90) - 3000 - 0      =  7,149.74
 *   principal m7        = 610000 - 845.0466667                         = 609,154.95
 */

export const GOLDEN_BUDGET = {
  netMonthlyIncome: 29000,
  fixedExpenses: 7920.36,
  discretionaryBudget: 5000,
  extraIncome: 0,
  emergencyFundCurrent: 8780,
  emergencyFundTarget: 40000,
  emergencyMonthlyContribution: 2000,
  emergencyContributionOverrides: [{ fromMonth: 3, amount: 3000 }],
  shortTermBuffer: 1200,
  bufferOverrides: [{ fromMonth: 2, amount: 0 }],
  strategy: 'avalanche',
  manualOrder: []
};

export const GOLDEN_DEBTS = [
  {
    id: 'loan-1',
    name: 'สินเชื่อ ธ.ก.ส.',
    type: 'amortizing',
    principal: 610000,
    accruedInterest: 21306,
    annualRatePct: 6.575,
    frequency: 'monthly',
    annualDueMonth: null,
    acceptsEarlyPayment: true,
    minimumPayment: { mode: 'none' },
    isClosed: false
  },
  { id: 'inst-phone', name: 'มือถือ', type: 'installment', monthlyPayment: 856.90, periodsPaid: 0, periodsTotal: 9, isClosed: false },
  { id: 'inst-camera', name: 'กล้อง', type: 'installment', monthlyPayment: 1699.00, periodsPaid: 0, periodsTotal: 6, isClosed: false },
  { id: 'inst-monitor', name: 'จอมอนิเตอร์', type: 'installment', monthlyPayment: 1998.33, periodsPaid: 0, periodsTotal: 3, isClosed: false },
  { id: 'inst-guitar', name: 'กีตาร์', type: 'installment', monthlyPayment: 2496.66, periodsPaid: 0, periodsTotal: 2, isClosed: false },
  { id: 'inst-keyboard', name: 'คีย์บอร์ด', type: 'installment', monthlyPayment: 439.41, periodsPaid: 0, periodsTotal: 3, isClosed: false },
  {
    id: 'hp-car',
    name: 'รถยนต์ (เช่าซื้อ)',
    type: 'hirePurchase',
    monthlyPayment: 3374.00,
    periodsPaid: 0,
    periodsTotal: 14,
    settlementQuote: null,
    settlementQuoteDate: null,
    isClosed: false
  }
];

/** Month 0 = October, per the source spec's fixture. */
export const GOLDEN_START = { year: 2026, month: 10 };
```

- [ ] **Step 2: Write the failing golden tests**

Create `src/features/debt/engine/__tests__/payoffSimulator.golden.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { simulate } from '../payoffSimulator';
import { GOLDEN_BUDGET, GOLDEN_DEBTS, GOLDEN_START } from './goldenFixture';

const run = (budgetPatch = {}) =>
  simulate(GOLDEN_DEBTS, { ...GOLDEN_BUDGET, ...budgetPatch }, { startMonth: GOLDEN_START });

describe('§8 golden vectors', () => {
  const p = run();

  it('MonthlyInterestThreshold is 3,342.29', () => {
    expect(p.MonthlyInterestThreshold).toBeCloseTo(3342.29, 2);
  });

  it('Months[0].InstallmentTotal is 10,864.30', () => {
    expect(p.Months[0].InstallmentTotal).toBeCloseTo(10864.30, 2);
  });

  it('Months[0].Surplus is 5,215.34', () => {
    expect(p.Months[0].Surplus).toBeCloseTo(5215.34, 2);
  });

  it('Months[0].LoanPayment is 2,015.34', () => {
    expect(p.Months[0].LoanPayment).toBeCloseTo(2015.34, 2);
  });

  it('Months[0].AccruedInterestBalance is 22,632.95', () => {
    expect(p.Months[0].AccruedInterestBalance).toBeCloseTo(22632.95, 2);
  });

  it('Months[2].InstallmentTotal is 8,367.64', () => {
    expect(p.Months[2].InstallmentTotal).toBeCloseTo(8367.64, 2);
  });

  it('Months[3].LoanPayment is 7,149.74', () => {
    expect(p.Months[3].LoanPayment).toBeCloseTo(7149.74, 2);
  });

  it('InterestArrearsClearedMonth is 7', () => {
    expect(p.InterestArrearsClearedMonth).toBe(7);
  });

  it('Months[7].PrincipalBalance is 609,154.95', () => {
    expect(p.Months[7].PrincipalBalance).toBeCloseTo(609154.95, 2);
  });

  it('Months[13].EmergencyFundBalance is 40,000.00', () => {
    expect(p.Months[13].EmergencyFundBalance).toBeCloseTo(40000.00, 2);
  });

  it('Months[17].InstallmentTotal is 0.00', () => {
    expect(p.Months[17].InstallmentTotal).toBeCloseTo(0, 2);
  });

  it('MonthsToPayoff is 54', () => {
    expect(p.MonthsToPayoff).toBe(54);
  });

  it('TotalInterestPaid is 131,445.49', () => {
    expect(p.TotalInterestPaid).toBeCloseTo(131445.49, 2);
  });

  it('is feasible', () => {
    expect(p.IsInfeasible).toBe(false);
    expect(p.MinimumViablePayment).toBeNull();
  });

  it('payoff lands in the month of the final row', () => {
    // Month 0 = October 2026, index 53 => March 2031
    expect(p.PayoffDate).toEqual({ year: 2031, month: 3 });
  });
});

describe('§8 sensitivity: discretionary budget', () => {
  const cases = [
    { discretionaryBudget: 3000, months: 47, interest: 117038 },
    { discretionaryBudget: 4000, months: 50, interest: 123754 },
    { discretionaryBudget: 5000, months: 54, interest: 131445 },
    { discretionaryBudget: 6000, months: 58, interest: 140350 },
    { discretionaryBudget: 7000, months: 62, interest: 150749 }
  ];

  it.each(cases)(
    'discretionary $discretionaryBudget gives $months months',
    ({ discretionaryBudget, months, interest }) => {
      const p = run({ discretionaryBudget });
      expect(p.MonthsToPayoff).toBe(months);
      // The spec's sensitivity table gives interest to the nearest baht.
      expect(Math.abs(p.TotalInterestPaid - interest)).toBeLessThanOrEqual(1);
    }
  );
});

describe('§8 sensitivity: extra income', () => {
  const cases = [
    { extraIncome: 0, months: 54, interest: 131445 },
    { extraIncome: 3000, months: 44, interest: 111129 },
    { extraIncome: 5000, months: 40, interest: 101200 },
    { extraIncome: 8000, months: 34, interest: 89801 }
  ];

  it.each(cases)(
    'extra income $extraIncome gives $months months',
    ({ extraIncome, months, interest }) => {
      const p = run({ extraIncome });
      expect(p.MonthsToPayoff).toBe(months);
      expect(Math.abs(p.TotalInterestPaid - interest)).toBeLessThanOrEqual(1);
    }
  );
});
```

- [ ] **Step 3: Run the tests to verify they fail**

```bash
npm test
```

Expected: FAIL — `Failed to resolve import "../payoffSimulator"`.

- [ ] **Step 4: Implement `payoffSimulator.js`**

Create `src/features/debt/engine/payoffSimulator.js`:

```js
import {
  periodsRemaining,
  resolveSchedule,
  hasFutureOverride,
  monthlyInterest,
  minimumDue,
  addMonths
} from './debtMath';

const MAX_MONTHS_DEFAULT = 600;

/** Half a satang. Real balances are never smaller, so this is a safe zero. */
const EPS = 0.005;

/** Mutable per-month copy of an amortizing debt. The input array is never touched. */
const makeWorkingLoan = (d) => ({
  id: d.id,
  name: d.name,
  principal: Number(d.principal) || 0,
  accruedInterest: Number(d.accruedInterest) || 0,
  annualRatePct: Number(d.annualRatePct) || 0,
  // undefined means yes; only an explicit false switches on the holding-pot path
  acceptsEarlyPayment: d.acceptsEarlyPayment !== false,
  annualDueMonth: Number(d.annualDueMonth) || null,
  minimumPayment: d.minimumPayment || { mode: 'none' },
  holdingPot: 0,
  isClosed: false
});

/**
 * Apply a payment. THIS ORDER IS MANDATORY: accrued interest is cleared before
 * anything touches principal. Any other order silently understates the payoff
 * period.
 */
const pay = (loan, amount) => {
  const p = Math.min(amount, loan.accruedInterest + loan.principal);
  if (p <= 0) return { paid: 0, interestPortion: 0, principalPortion: 0 };
  const interestPortion = Math.min(p, loan.accruedInterest);
  const principalPortion = p - interestPortion;
  loan.accruedInterest -= interestPortion;
  loan.principal -= principalPortion;
  return { paid: p, interestPortion, principalPortion };
};

const balanceOf = (loan) => loan.principal + loan.accruedInterest;

/** Which single debt gets the money left after every minimum is paid. */
const pickTarget = (openLoans, budget) => {
  // A loan that already owes nothing has nothing left to attack — sending it
  // more money would just pile up in its holding pot forever.
  const candidates = openLoans.filter((l) => balanceOf(l) > EPS);
  if (!candidates.length) return null;

  if (budget.strategy === 'snowball') {
    return candidates.reduce((best, l) => (balanceOf(l) < balanceOf(best) ? l : best));
  }

  if (budget.strategy === 'manual') {
    for (const id of budget.manualOrder || []) {
      const found = candidates.find((l) => l.id === id);
      if (found) return found;
    }
    return candidates[0];
  }

  // avalanche: highest rate wins, ties broken by the smaller balance
  return candidates.reduce((best, l) => {
    if (l.annualRatePct > best.annualRatePct) return l;
    if (l.annualRatePct === best.annualRatePct && balanceOf(l) < balanceOf(best)) return l;
    return best;
  });
};

/**
 * Month-by-month cash-flow simulation.
 *
 * Pure: no I/O, no DB, no clock. startMonth is passed in so the UI can re-run
 * this on every slider drag and the tests can pin "Month 0 = October".
 *
 * @param {import('./types').Debt[]} debts
 * @param {import('./types').BudgetProfile} budget
 * @param {{ maxMonths?: number, startMonth?: import('./types').YearMonth }} [options]
 * @returns {import('./types').Projection}
 */
export const simulate = (debts, budget, options = {}) => {
  const maxMonths = options.maxMonths || MAX_MONTHS_DEFAULT;
  const startMonth = options.startMonth || { year: 2026, month: 1 };

  const active = (debts || []).filter((d) => !d.isClosed);

  const fixedObligations = active
    .filter((d) => d.type === 'hirePurchase' || d.type === 'installment')
    .map((d) => ({
      monthlyPayment: Number(d.monthlyPayment) || 0,
      periods: periodsRemaining(d)
    }));

  const loans = active.filter((d) => d.type === 'amortizing').map(makeWorkingLoan);

  const income = Number(budget.netMonthlyIncome) || 0;
  const extraIncome = Number(budget.extraIncome) || 0;
  const fixedExpenses = Number(budget.fixedExpenses) || 0;
  const discretionaryBudget = Number(budget.discretionaryBudget) || 0;
  const fundTarget = Number(budget.emergencyFundTarget) || 0;
  let fundCurrent = Number(budget.emergencyFundCurrent) || 0;

  const monthlyInterestThreshold = loans.reduce((s, l) => s + monthlyInterest(l), 0);

  const months = [];
  let totalInterestPaid = 0;
  let interestArrearsClearedMonth = null;
  const startedWithArrears = loans.some((l) => l.accruedInterest > EPS);
  let isInfeasible = false;
  let minimumViablePayment = null;
  let prevTotalDebt = loans.reduce((s, l) => s + balanceOf(l), 0);

  for (let month = 0; month < maxMonths; month++) {
    const installmentTotal = fixedObligations.reduce(
      (s, o) => s + (month < o.periods ? o.monthlyPayment : 0),
      0
    );

    const openLoans = loans.filter((l) => !l.isClosed);

    // Debt free: no interest-bearing debt left AND no installment plans running.
    if (!openLoans.length && installmentTotal === 0) break;

    const surplus =
      income + extraIncome - fixedExpenses - discretionaryBudget - installmentTotal;

    // Interest accrues even in a month the budget cannot cover, so the recorded
    // row stays honest.
    if (surplus < 0) {
      let accrued = 0;
      for (const loan of openLoans) {
        const i = monthlyInterest(loan);
        loan.accruedInterest += i;
        accrued += i;
      }
      isInfeasible = true;
      minimumViablePayment = openLoans.reduce((s, l) => s + monthlyInterest(l), 0);
      months.push({
        Index: month,
        Month: addMonths(startMonth, month),
        InstallmentTotal: installmentTotal,
        Surplus: surplus,
        EmergencyContribution: 0,
        LoanPayment: 0,
        HeldForAnnualPayment: 0,
        InterestAccrued: accrued,
        AccruedInterestBalance: loans.reduce((s, l) => s + l.accruedInterest, 0),
        PrincipalBalance: loans.reduce((s, l) => s + l.principal, 0),
        EmergencyFundBalance: fundCurrent,
        DiscretionaryCeiling:
          income + extraIncome - fixedExpenses - installmentTotal - accrued,
        perDebt: loans.map((l) => ({
          debtId: l.id,
          paid: 0,
          interestPortion: 0,
          principalPortion: 0,
          balance: balanceOf(l),
          held: l.holdingPot
        }))
      });
      break;
    }

    // The emergency fund is served before any debt, capped at the target.
    const contribution = resolveSchedule(
      budget.emergencyMonthlyContribution,
      budget.emergencyContributionOverrides,
      month
    );
    const emergencyContribution = Math.min(
      contribution,
      Math.max(0, fundTarget - fundCurrent),
      Math.max(0, surplus)
    );
    fundCurrent += emergencyContribution;

    const buffer = resolveSchedule(budget.shortTermBuffer, budget.bufferOverrides, month);
    let availableForLoan = Math.max(0, surplus - emergencyContribution - buffer);

    // ACCRUE FIRST, then pay. Reversing this shifts every row by one month.
    let interestAccrued = 0;
    for (const loan of openLoans) {
      const i = monthlyInterest(loan);
      loan.accruedInterest += i;
      interestAccrued += i;
    }

    const paidByDebt = new Map();
    const record = (loan, r) => {
      const cur = paidByDebt.get(loan.id) || {
        paid: 0,
        interestPortion: 0,
        principalPortion: 0
      };
      cur.paid += r.paid;
      cur.interestPortion += r.interestPortion;
      cur.principalPortion += r.principalPortion;
      paidByDebt.set(loan.id, cur);
    };

    let loanPayment = 0;
    let interestPaidThisMonth = 0;
    let heldThisMonth = 0;

    // Minimums on every loan that accepts monthly payment. A loan with
    // acceptsEarlyPayment === false has no monthly obligation at all.
    for (const loan of openLoans) {
      if (!loan.acceptsEarlyPayment) continue;
      if (availableForLoan <= 0) break;
      const due = Math.min(minimumDue(loan), availableForLoan);
      if (due <= 0) continue;
      const r = pay(loan, due);
      availableForLoan -= r.paid;
      loanPayment += r.paid;
      interestPaidThisMonth += r.interestPortion;
      record(loan, r);
    }

    // Everything left attacks one debt.
    if (availableForLoan > 0) {
      const target = pickTarget(openLoans, budget);
      if (target) {
        if (!target.acceptsEarlyPayment) {
          target.holdingPot += availableForLoan;
          heldThisMonth += availableForLoan;
          availableForLoan = 0;
        } else {
          const r = pay(target, availableForLoan);
          availableForLoan -= r.paid;
          loanPayment += r.paid;
          interestPaidThisMonth += r.interestPortion;
          record(target, r);
        }
      }
    }

    // Release any holding pot whose annual due month is this calendar month.
    const calendarMonth = addMonths(startMonth, month).month;
    for (const loan of openLoans) {
      if (loan.acceptsEarlyPayment) continue;
      if (loan.holdingPot <= 0) continue;
      if (loan.annualDueMonth !== calendarMonth) continue;
      const r = pay(loan, loan.holdingPot);
      loan.holdingPot -= r.paid;
      loanPayment += r.paid;
      interestPaidThisMonth += r.interestPortion;
      record(loan, r);
    }

    totalInterestPaid += interestPaidThisMonth;

    for (const loan of openLoans) {
      if (loan.principal <= EPS && loan.accruedInterest <= EPS) {
        loan.isClosed = true;
        // The debt is gone — any cash still sitting in its pot is no longer
        // earmarked for it and must not be treated as an outstanding
        // obligation (see the non-termination guard's holdingPot check).
        loan.holdingPot = 0;
      }
    }

    const arrearsBalance = loans.reduce((s, l) => s + l.accruedInterest, 0);
    if (
      interestArrearsClearedMonth === null &&
      startedWithArrears &&
      arrearsBalance <= EPS
    ) {
      interestArrearsClearedMonth = month;
    }

    months.push({
      Index: month,
      Month: addMonths(startMonth, month),
      InstallmentTotal: installmentTotal,
      Surplus: surplus,
      EmergencyContribution: emergencyContribution,
      LoanPayment: loanPayment,
      HeldForAnnualPayment: heldThisMonth,
      InterestAccrued: interestAccrued,
      AccruedInterestBalance: arrearsBalance,
      PrincipalBalance: loans.reduce((s, l) => s + l.principal, 0),
      EmergencyFundBalance: fundCurrent,
      DiscretionaryCeiling:
        income + extraIncome - fixedExpenses - installmentTotal - interestAccrued,
      perDebt: loans.map((l) => {
        const r = paidByDebt.get(l.id) || {
          paid: 0,
          interestPortion: 0,
          principalPortion: 0
        };
        return {
          debtId: l.id,
          paid: r.paid,
          interestPortion: r.interestPortion,
          principalPortion: r.principalPortion,
          balance: balanceOf(l),
          held: l.holdingPot
        };
      })
    });

    // Non-termination guard. The source spec's "payment <= interest" rule is
    // wrong: that holds for the first seven months of its own fixture, which
    // is feasible because the installment plans are about to expire and free
    // up cash. Only stop when no new cash can ever arrive.
    const stillOpen = loans.filter((l) => !l.isClosed);
    if (stillOpen.length) {
      const noMoreCashComing =
        installmentTotal === 0 &&
        emergencyContribution === 0 &&
        buffer === 0 &&
        !hasFutureOverride(budget.emergencyContributionOverrides, month) &&
        !hasFutureOverride(budget.bufferOverrides, month) &&
        // Cash sitting in a holding pot IS on its way — it lands in the annual
        // due month. Without this the annual path is wrongly flagged
        // infeasible once the installments expire.
        stillOpen.every((l) => l.holdingPot <= EPS);

      const totalDebt = stillOpen.reduce((s, l) => s + balanceOf(l), 0);
      if (noMoreCashComing && totalDebt >= prevTotalDebt) {
        isInfeasible = true;
        minimumViablePayment = stillOpen.reduce((s, l) => s + monthlyInterest(l), 0);
        break;
      }
      prevTotalDebt = totalDebt;
    }
  }

  // Ran out of horizon with debt still open.
  if (!isInfeasible && loans.some((l) => !l.isClosed) && months.length >= maxMonths) {
    isInfeasible = true;
    minimumViablePayment = loans
      .filter((l) => !l.isClosed)
      .reduce((s, l) => s + monthlyInterest(l), 0);
  }

  return {
    Months: months,
    MonthsToPayoff: months.length,
    PayoffDate: months.length ? addMonths(startMonth, months.length - 1) : startMonth,
    TotalInterestPaid: totalInterestPaid,
    InterestArrearsClearedMonth: interestArrearsClearedMonth,
    MonthlyInterestThreshold: monthlyInterestThreshold,
    IsInfeasible: isInfeasible,
    MinimumViablePayment: isInfeasible ? minimumViablePayment : null
  };
};
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npm test
```

Expected: PASS — all 15 golden assertions and both sensitivity tables green.

**If `TotalInterestPaid` alone fails**, this is the checkpoint the spec flags. The implementation above sums `interestPortion` actually paid, which includes clearing the 21,306 of pre-existing arrears (reading 1). Hand estimation supports reading 1: `131445.49 - 21306 = 110139.49` over 54 months implies an average principal of about 372,000, which is consistent with a balance that sits at 610,000 for seven months and then declines. If the test still fails, switch `totalInterestPaid += interestPaidThisMonth` to `totalInterestPaid += interestAccrued` (reading 2) and re-run. Do not change any other line to chase this number.

- [ ] **Step 6: Commit**

```bash
git add src/features/debt/engine/payoffSimulator.js src/features/debt/engine/__tests__/goldenFixture.js src/features/debt/engine/__tests__/payoffSimulator.golden.test.js
git commit -m "feat: add payoff simulator passing all golden vectors"
```

---

### Task 3: Edge cases and the multi-loan generalization

**GATE:** the §8 golden tests must still be green when this task ends. If they break, the generalization is wrong — fix it here, do not work around it later.

**Files:**
- Modify: `src/features/debt/engine/payoffSimulator.js` (only if a test demands it)
- Test: `src/features/debt/engine/__tests__/payoffSimulator.edge.test.js`

**Interfaces:**
- Consumes: `simulate` (Task 2), `GOLDEN_BUDGET` / `GOLDEN_DEBTS` / `GOLDEN_START` (Task 2)
- Produces: nothing new — this task proves the engine's behaviour outside the single-loan path

- [ ] **Step 1: Write the failing edge-case tests**

Create `src/features/debt/engine/__tests__/payoffSimulator.edge.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { simulate } from '../payoffSimulator';
import { GOLDEN_BUDGET, GOLDEN_DEBTS, GOLDEN_START } from './goldenFixture';

const opts = { startMonth: GOLDEN_START };

const amortizing = (over = {}) => ({
  id: 'a1',
  name: 'loan',
  type: 'amortizing',
  principal: 100000,
  accruedInterest: 0,
  annualRatePct: 12,
  frequency: 'monthly',
  annualDueMonth: null,
  acceptsEarlyPayment: true,
  minimumPayment: { mode: 'none' },
  isClosed: false,
  ...over
});

const budget = (over = {}) => ({
  netMonthlyIncome: 40000,
  fixedExpenses: 10000,
  discretionaryBudget: 5000,
  extraIncome: 0,
  emergencyFundCurrent: 0,
  emergencyFundTarget: 0,
  emergencyMonthlyContribution: 0,
  emergencyContributionOverrides: [],
  shortTermBuffer: 0,
  bufferOverrides: [],
  strategy: 'avalanche',
  manualOrder: [],
  ...over
});

describe('edge 1: surplus below zero', () => {
  const p = simulate(GOLDEN_DEBTS, { ...GOLDEN_BUDGET, discretionaryBudget: 25000 }, opts);

  it('is flagged infeasible', () => {
    expect(p.IsInfeasible).toBe(true);
  });

  it('terminates instead of running to the horizon', () => {
    expect(p.Months.length).toBe(1);
  });

  it('reports the minimum viable payment', () => {
    expect(p.MinimumViablePayment).toBeCloseTo(3342.29, 2);
  });

  it('records a negative surplus on the final row', () => {
    expect(p.Months[0].Surplus).toBeLessThan(0);
  });
});

describe('edge 2: no interest arrears at the start', () => {
  const p = simulate([amortizing({ accruedInterest: 0 })], budget(), opts);

  it('sends the first payment into principal beyond the first month of interest', () => {
    // month 0: interest 1000, payment 25000 => 24000 off principal
    expect(p.Months[0].InterestAccrued).toBeCloseTo(1000, 2);
    expect(p.Months[0].PrincipalBalance).toBeCloseTo(76000, 2);
  });

  it('reports no arrears-cleared month because there were none', () => {
    expect(p.InterestArrearsClearedMonth).toBeNull();
  });
});

describe('edge 3: acceptsEarlyPayment false with an annual due month', () => {
  const monthly = simulate(GOLDEN_DEBTS, GOLDEN_BUDGET, opts);

  const heldDebts = GOLDEN_DEBTS.map((d) =>
    d.type === 'amortizing'
      ? { ...d, acceptsEarlyPayment: false, frequency: 'annual', annualDueMonth: 6 }
      : d
  );
  const held = simulate(heldDebts, GOLDEN_BUDGET, opts);

  it('pays off later than the monthly path', () => {
    expect(held.MonthsToPayoff).toBeGreaterThan(monthly.MonthsToPayoff);
  });

  it('costs more total interest than the monthly path', () => {
    expect(held.TotalInterestPaid).toBeGreaterThan(monthly.TotalInterestPaid);
  });

  it('holds cash in months that are not the due month', () => {
    // Month 0 is October; June is month index 8.
    expect(held.Months[0].LoanPayment).toBeCloseTo(0, 2);
    expect(held.Months[0].HeldForAnnualPayment).toBeCloseTo(2015.34, 2);
    expect(held.Months[8].LoanPayment).toBeGreaterThan(0);
  });

  // The loan genuinely pays off in real time. A pickTarget that keeps
  // shovelling money into a closed loan's holding pot, or a closing
  // condition that can never see an empty pot, both regress to a run that
  // grinds on to maxMonths — this pins that down.
  it('actually terminates instead of running to the horizon', () => {
    expect(held.MonthsToPayoff).toBeLessThan(200);
    expect(held.MonthsToPayoff).toBeLessThan(600);
  });

  it('is feasible: the debt does get paid off', () => {
    expect(held.IsInfeasible).toBe(false);
  });

  it('leaves no holding pot outstanding once the loan closes', () => {
    const last = held.Months[held.Months.length - 1];
    const heldAmounts = last.perDebt.map((d) => d.held);
    for (const h of heldAmounts) {
      expect(h).toBeCloseTo(0, 2);
    }
  });
});

describe('edge 4: every debt closed', () => {
  const closed = GOLDEN_DEBTS.map((d) => ({ ...d, isClosed: true }));
  const p = simulate(closed, GOLDEN_BUDGET, opts);

  it('returns an empty projection without throwing', () => {
    expect(p.Months).toEqual([]);
    expect(p.MonthsToPayoff).toBe(0);
    expect(p.IsInfeasible).toBe(false);
  });

  it('handles an empty debt list too', () => {
    const empty = simulate([], GOLDEN_BUDGET, opts);
    expect(empty.Months).toEqual([]);
    expect(empty.MonthlyInterestThreshold).toBe(0);
  });
});

describe('edge 5: fully paid installment plan', () => {
  it('is excluded from installmentTotal', () => {
    const debts = GOLDEN_DEBTS.map((d) =>
      d.id === 'inst-phone' ? { ...d, periodsPaid: 9 } : d
    );
    const p = simulate(debts, GOLDEN_BUDGET, opts);
    expect(p.Months[0].InstallmentTotal).toBeCloseTo(10864.30 - 856.90, 2);
  });
});

describe('edge 6: avalanche across two rates', () => {
  const card = amortizing({
    id: 'card',
    principal: 50000,
    annualRatePct: 19,
    minimumPayment: { mode: 'fixed', amount: 2000 }
  });
  const mortgage = amortizing({
    id: 'mortgage',
    principal: 600000,
    annualRatePct: 6.5,
    minimumPayment: { mode: 'fixed', amount: 5000 }
  });
  const p = simulate([card, mortgage], budget({ strategy: 'avalanche' }), opts);
  const row = p.Months[0];
  const paid = (id) => row.perDebt.find((d) => d.debtId === id).paid;

  it('gives the attack money to the higher rate', () => {
    // surplus 25000, minimums 2000 + 5000, attack 18000 => card gets 20000
    expect(paid('card')).toBeCloseTo(20000, 2);
  });

  it('gives the lower rate only its minimum', () => {
    expect(paid('mortgage')).toBeCloseTo(5000, 2);
  });
});

describe('edge 7: snowball costs more interest than avalanche', () => {
  const card = amortizing({
    id: 'card',
    principal: 200000,
    annualRatePct: 19,
    minimumPayment: { mode: 'fixed', amount: 2000 }
  });
  const small = amortizing({
    id: 'small',
    principal: 40000,
    annualRatePct: 5,
    minimumPayment: { mode: 'fixed', amount: 1000 }
  });

  const avalanche = simulate([card, small], budget({ strategy: 'avalanche' }), opts);
  const snowball = simulate([card, small], budget({ strategy: 'snowball' }), opts);

  it('both terminate', () => {
    expect(avalanche.IsInfeasible).toBe(false);
    expect(snowball.IsInfeasible).toBe(false);
  });

  it('snowball pays more interest', () => {
    expect(snowball.TotalInterestPaid).toBeGreaterThan(avalanche.TotalInterestPaid);
  });
});

describe('edge 8: percent-of-balance minimum', () => {
  // The card is deliberately NOT the avalanche target: the 20% loan absorbs
  // every baht of attack money, so the card only ever receives its contractual
  // minimum. With a single debt the attack step would dump everything into it
  // and the percentage behaviour would be invisible.
  const big = amortizing({
    id: 'big',
    principal: 500000,
    annualRatePct: 20,
    minimumPayment: { mode: 'none' }
  });
  const card = amortizing({
    id: 'card',
    principal: 50000,
    annualRatePct: 15,
    minimumPayment: { mode: 'percentOfBalance', percent: 8, floor: 500 }
  });

  const p = simulate([big, card], budget(), { ...opts, maxMonths: 200 });
  const cardPaid = (i) => p.Months[i].perDebt.find((d) => d.debtId === 'card').paid;

  it('charges 8% of the balance including this month interest', () => {
    // interest 50000 * 0.15 / 12 = 625, balance 50625, 8% = 4050
    expect(cardPaid(0)).toBeCloseTo(4050, 2);
  });

  it('falls every month as the balance falls', () => {
    for (let i = 1; i <= 10; i++) {
      expect(cardPaid(i)).toBeLessThan(cardPaid(i - 1));
    }
  });

  it('stays above the floor while the balance is still large', () => {
    for (let i = 0; i <= 10; i++) {
      expect(cardPaid(i)).toBeGreaterThan(500);
    }
  });

  it('sends every baht of attack money to the 20% loan instead', () => {
    const bigPaid = p.Months[0].perDebt.find((d) => d.debtId === 'big').paid;
    // surplus 25000 less the card's 4050 minimum
    expect(bigPaid).toBeCloseTo(20950, 2);
  });
});

describe('edge 9: minimums exceed the money available', () => {
  const a = amortizing({
    id: 'a',
    principal: 100000,
    annualRatePct: 10,
    minimumPayment: { mode: 'fixed', amount: 20000 }
  });
  const b = amortizing({
    id: 'b',
    principal: 100000,
    annualRatePct: 10,
    minimumPayment: { mode: 'fixed', amount: 20000 }
  });
  const p = simulate([a, b], budget(), { ...opts, maxMonths: 24 });
  const row = p.Months[0];

  it('pays minimums in order until the money runs out', () => {
    // surplus is 25000 against 40000 of minimums
    expect(row.LoanPayment).toBeCloseTo(25000, 2);
  });

  it('never goes negative and never throws', () => {
    // Float subtraction can leave a few 1e-13 residues, so compare against a
    // sub-satang epsilon rather than exact zero.
    for (const m of p.Months) {
      expect(m.LoanPayment).toBeGreaterThanOrEqual(-0.005);
      expect(m.PrincipalBalance).toBeGreaterThanOrEqual(-0.005);
      expect(m.AccruedInterestBalance).toBeGreaterThanOrEqual(-0.005);
    }
  });

  it('never pays out more than the surplus', () => {
    for (const m of p.Months) {
      expect(m.LoanPayment).toBeLessThanOrEqual(m.Surplus + 0.005);
    }
  });
});
```

- [ ] **Step 2: Run the tests and read the failures**

```bash
npm test
```

Expected: the golden suite stays green; some edge cases may fail. The
implementation in Task 2 already covers all nine, so treat any failure as a
real defect in `payoffSimulator.js` and fix it there — never by weakening an
assertion.

- [ ] **Step 3: Fix any defect the edge cases expose**

Only if a test fails. Likely spots, in order of probability:

1. Edge 3 month index for June. Month 0 is October 2026, so June 2027 is index 8. If `HeldForAnnualPayment` is 0 at month 0, the holding-pot branch in step 7 is not being reached — check that `acceptsEarlyPayment: false` survives `makeWorkingLoan`.
2. Edge 8 floor behaviour. If a payment of 0 appears while a balance remains, `minimumDue` is clamping to the balance too early — the clamp must be the last operation.
3. Edge 9 ordering. If `LoanPayment` exceeds `surplus`, the `availableForLoan -= r.paid` line is missing or misplaced in the minimums loop.

- [ ] **Step 4: Run the full suite**

```bash
npm test
```

Expected: PASS — golden suite plus all nine edge cases green. **This is the gate.**

- [ ] **Step 5: Commit**

```bash
git add src/features/debt/engine/__tests__/payoffSimulator.edge.test.js src/features/debt/engine/payoffSimulator.js
git commit -m "test: cover multi-loan strategies, holding pot and infeasible input"
```

---

### Task 4: `strategyRanker.js`

**Files:**
- Create: `src/features/debt/engine/strategyRanker.js`
- Test: `src/features/debt/engine/__tests__/strategyRanker.test.js`

**Interfaces:**
- Consumes: `simulate` (Task 2), `hirePurchaseRebate` / `rebateDecayPerMonth` (Task 1)
- Produces:
  - `rankDebts(debts, budget, options?) => RankedDebt[]` where
    `RankedDebt = { debtId, name, type, totalRemainingCost, quoteMissing, rebateDecayPerMonth, reason }`,
    sorted descending by `totalRemainingCost`

- [ ] **Step 1: Write the failing tests**

Create `src/features/debt/engine/__tests__/strategyRanker.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { rankDebts } from '../strategyRanker';
import { GOLDEN_BUDGET, GOLDEN_DEBTS, GOLDEN_START } from './goldenFixture';

const opts = { startMonth: GOLDEN_START };

describe('rankDebts', () => {
  const ranked = rankDebts(GOLDEN_DEBTS, GOLDEN_BUDGET, opts);
  const byId = (id) => ranked.find((r) => r.debtId === id);

  it('returns one row per open debt', () => {
    expect(ranked).toHaveLength(GOLDEN_DEBTS.length);
  });

  it('costs an installment plan at zero however large the balance', () => {
    expect(byId('inst-camera').totalRemainingCost).toBe(0);
    expect(byId('inst-camera').reason).toContain('0%');
  });

  it('flags a hire purchase with no settlement quote instead of estimating', () => {
    const car = byId('hp-car');
    expect(car.quoteMissing).toBe(true);
    expect(car.totalRemainingCost).toBe(0);
    expect(car.rebateDecayPerMonth).toBeNull();
    expect(car.reason).toContain('ใบเสนอปิดบัญชี');
  });

  it('costs the amortizing loan at the interest it will actually pay', () => {
    expect(byId('loan-1').totalRemainingCost).toBeCloseTo(131445.49, 0);
  });

  it('ranks descending by cost, so the loan leads', () => {
    expect(ranked[0].debtId).toBe('loan-1');
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].totalRemainingCost).toBeGreaterThanOrEqual(
        ranked[i].totalRemainingCost
      );
    }
  });

  it('uses the lender quote for a hire purchase when one exists', () => {
    const withQuote = GOLDEN_DEBTS.map((d) =>
      d.id === 'hp-car' ? { ...d, settlementQuote: 41000 } : d
    );
    const car = rankDebts(withQuote, GOLDEN_BUDGET, opts).find(
      (r) => r.debtId === 'hp-car'
    );
    expect(car.quoteMissing).toBe(false);
    expect(car.totalRemainingCost).toBeCloseTo(6236, 2);
    expect(car.rebateDecayPerMonth).toBeCloseTo(445.4285714, 4);
  });

  it('excludes closed debts', () => {
    const closed = GOLDEN_DEBTS.map((d) =>
      d.id === 'inst-guitar' ? { ...d, isClosed: true } : d
    );
    expect(rankDebts(closed, GOLDEN_BUDGET, opts)).toHaveLength(
      GOLDEN_DEBTS.length - 1
    );
  });

  it('handles an empty debt list', () => {
    expect(rankDebts([], GOLDEN_BUDGET, opts)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm test
```

Expected: FAIL — `Failed to resolve import "../strategyRanker"`.

- [ ] **Step 3: Implement `strategyRanker.js`**

Create `src/features/debt/engine/strategyRanker.js`:

```js
import { hirePurchaseRebate, rebateDecayPerMonth } from './debtMath';
import { simulate } from './payoffSimulator';

const baht = (n) => Math.round(n).toLocaleString('th-TH');

/**
 * Rank debts by the actual cost of carrying them — not by size, and not by
 * balance either, because a large 0% balance costs nothing.
 *
 * The amortizing figure comes from a real projection rather than a closed-form
 * approximation, so it accounts for the freed cash as installment plans expire.
 *
 * @param {import('./types').Debt[]} debts
 * @param {import('./types').BudgetProfile} budget
 * @param {{ maxMonths?: number, startMonth?: import('./types').YearMonth }} [options]
 */
export const rankDebts = (debts, budget, options = {}) => {
  const projection = simulate(debts, budget, options);

  const interestByDebt = new Map();
  for (const row of projection.Months) {
    for (const d of row.perDebt) {
      interestByDebt.set(d.debtId, (interestByDebt.get(d.debtId) || 0) + d.interestPortion);
    }
  }

  const ranked = (debts || [])
    .filter((d) => !d.isClosed)
    .map((d) => {
      if (d.type === 'installment') {
        return {
          debtId: d.id,
          name: d.name,
          type: d.type,
          totalRemainingCost: 0,
          quoteMissing: false,
          rebateDecayPerMonth: null,
          reason:
            'ผ่อน 0% — ต้นทุนการถือหนี้ก้อนนี้เป็นศูนย์ ยอดใหญ่แค่ไหนก็โปะก่อนกำหนดไม่ประหยัด'
        };
      }

      if (d.type === 'hirePurchase') {
        const rebate = hirePurchaseRebate(d);
        if (rebate === null) {
          return {
            debtId: d.id,
            name: d.name,
            type: d.type,
            totalRemainingCost: 0,
            quoteMissing: true,
            rebateDecayPerMonth: null,
            reason:
              'ยังไม่มีใบเสนอปิดบัญชี — ขอใบเสนอปิดบัญชีจากเจ้าหนี้ก่อน จึงจะรู้ส่วนลดที่ได้จริง'
          };
        }
        const decay = rebateDecayPerMonth(d);
        return {
          debtId: d.id,
          name: d.name,
          type: d.type,
          totalRemainingCost: rebate,
          quoteMissing: false,
          rebateDecayPerMonth: decay,
          reason: `ปิดบัญชีวันนี้ประหยัดได้ ${baht(rebate)} บาท และส่วนลดหดลงราวเดือนละ ${baht(decay)} บาท`
        };
      }

      return {
        debtId: d.id,
        name: d.name,
        type: d.type,
        totalRemainingCost: interestByDebt.get(d.id) || 0,
        quoteMissing: false,
        rebateDecayPerMonth: null,
        reason: `ดอกเบี้ย ${d.annualRatePct}% ต่อปี — โปะก้อนนี้ลดดอกเบี้ยได้ทันทีในงวดถัดไป`
      };
    });

  ranked.sort((a, b) => b.totalRemainingCost - a.totalRemainingCost);
  return ranked;
};
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npm test
```

Expected: PASS — whole suite green.

- [ ] **Step 5: Commit**

```bash
git add src/features/debt/engine/strategyRanker.js src/features/debt/engine/__tests__/strategyRanker.test.js
git commit -m "feat: rank debts by actual carrying cost"
```

---

The remaining tasks (state wiring, UI phase 1, UI phase 2) are specified in
`docs/superpowers/plans/2026-09-07-debt-payoff-planner-part-2.md`.
