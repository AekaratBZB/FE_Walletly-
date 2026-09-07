# Debt Payoff Planner Implementation Plan — Part 2 (state and UI shell)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Continues `docs/superpowers/plans/2026-09-07-debt-payoff-planner.md`. Tasks 1–4
(engine and tests) must be complete and the suite green before starting here.

**Global Constraints:** as stated in Part 1. In particular: reuse existing CSS
classes from `src/index.css`, no new stylesheets, Thai UI copy, assumptions
always on screen, no `canvas-confetti`, commit after every task.

---

### Task 5: `debtStorage.js`, `useDebtState.js` and context wiring

**Files:**
- Create: `src/features/debt/debtStorage.js`
- Create: `src/features/debt/useDebtState.js`
- Modify: `src/context/WalletContext.jsx`

**Interfaces:**
- Consumes: nothing from the engine
- Produces, from `debtStorage.js`:
  - `DEFAULT_BUDGET_PROFILE: BudgetProfile`
  - `DEBT_FIXED_COST_CATEGORY: string`
  - `loadDebts() => Debt[]`
  - `saveDebts(debts: Debt[]) => void`
  - `loadBudgetProfile() => BudgetProfile | null`
  - `saveBudgetProfile(profile) => void`
  - `buildPrefillProfile({ allocationSettings, fixedCosts, savingsGoals, transactions }) => BudgetProfile`
  - `findDebtCandidates(fixedCosts) => FixedCost[]`
- Produces, from `useDebtState.js`:
  - `useDebtState({ addToast, allocationSettings, fixedCosts, savingsGoals, transactions })` returning
    `{ debts, budgetProfile, isAddDebtOpen, editingDebt, debtDraft, openAddDebt, closeAddDebt, saveDebt, deleteDebt, updateBudgetProfile, setDebts, setBudgetProfile }`
- Produces, from `WalletContext`: every key above is available through `useWallet()`

- [ ] **Step 1: Write `debtStorage.js`**

Create `src/features/debt/debtStorage.js`:

```js
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
```

- [ ] **Step 2: Write `useDebtState.js`**

Create `src/features/debt/useDebtState.js`:

```js
import { useState, useEffect } from 'react';
import {
  loadDebts,
  saveDebts,
  loadBudgetProfile,
  saveBudgetProfile,
  buildPrefillProfile
} from './debtStorage';

/**
 * Debt planner state. Lives here rather than inline in WalletContext so the
 * context file does not keep growing — it already carries five other feature
 * slices.
 */
export const useDebtState = ({
  addToast,
  allocationSettings,
  fixedCosts,
  savingsGoals,
  transactions
}) => {
  const [debts, setDebts] = useState(() => loadDebts());

  const [budgetProfile, setBudgetProfile] = useState(
    () =>
      loadBudgetProfile() ||
      buildPrefillProfile({ allocationSettings, fixedCosts, savingsGoals, transactions })
  );

  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [debtDraft, setDebtDraft] = useState(null);

  useEffect(() => {
    saveDebts(debts);
  }, [debts]);

  useEffect(() => {
    saveBudgetProfile(budgetProfile);
  }, [budgetProfile]);

  /**
   * Open the add/edit modal.
   * @param {Object|null} debt   an existing debt to edit, or null to add
   * @param {Object|null} draft  partial fields to prefill a new debt with
   */
  const openAddDebt = (debt = null, draft = null) => {
    setEditingDebt(debt);
    setDebtDraft(draft);
    setIsAddDebtOpen(true);
  };

  const closeAddDebt = () => {
    setIsAddDebtOpen(false);
    setEditingDebt(null);
    setDebtDraft(null);
  };

  const saveDebt = (debt) => {
    if (debt.id && debts.some((d) => d.id === debt.id)) {
      setDebts((prev) => prev.map((d) => (d.id === debt.id ? { ...d, ...debt } : d)));
      addToast(`แก้ไขหนี้ "${debt.name}" เรียบร้อยแล้ว`, 'success');
    } else {
      const created = { ...debt, id: debt.id || `debt-${Date.now()}`, isClosed: false };
      setDebts((prev) => [...prev, created]);
      addToast(`เพิ่มหนี้ "${created.name}" เข้าแผนปลอดหนี้เรียบร้อยแล้ว`, 'success');
    }
    closeAddDebt();
  };

  const deleteDebt = (id) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
    addToast('ลบรายการหนี้เรียบร้อยแล้ว', 'info');
  };

  const updateBudgetProfile = (patch) => {
    setBudgetProfile((prev) => ({ ...prev, ...patch }));
  };

  return {
    debts,
    budgetProfile,
    isAddDebtOpen,
    editingDebt,
    debtDraft,
    openAddDebt,
    closeAddDebt,
    saveDebt,
    deleteDebt,
    updateBudgetProfile,
    setDebts,
    setBudgetProfile
  };
};
```

- [ ] **Step 3: Import the hook and its defaults in `WalletContext.jsx`**

In `src/context/WalletContext.jsx`, add to the imports at the top of the file:

```js
import { useDebtState } from '../features/debt/useDebtState';
import { DEFAULT_BUDGET_PROFILE } from '../features/debt/debtStorage';
```

- [ ] **Step 4: Call the hook after the existing state declarations**

In `src/context/WalletContext.jsx`, immediately after the `useEffect` that
persists `taxSettings` (the last of the five persistence effects), insert:

```js
  // Debt planner slice. Kept in its own hook so this file stops growing.
  const debt = useDebtState({
    addToast,
    allocationSettings,
    fixedCosts,
    savingsGoals,
    transactions
  });
```

- [ ] **Step 5: Include debts in the backup payload**

In `src/context/WalletContext.jsx`, inside `exportBackupJSON`, change the
`backup` object to:

```js
    const backup = {
      version: '2.1-react',
      exportedAt: new Date().toISOString(),
      transactions,
      fixedCosts,
      allocationSettings,
      savingsGoals,
      taxSettings,
      debts: debt.debts,
      budgetProfile: debt.budgetProfile
    };
```

- [ ] **Step 6: Restore debts on import**

In `src/context/WalletContext.jsx`, inside `importBackupJSON`, add these two
lines after `if (data.taxSettings) setTaxSettings(data.taxSettings);`:

```js
      if (data.debts) debt.setDebts(data.debts);
      if (data.budgetProfile) debt.setBudgetProfile(data.budgetProfile);
```

- [ ] **Step 7: Clear debts on reset and clear-all**

In `src/context/WalletContext.jsx`, inside `resetToDemo`, add before the
`addToast` call:

```js
    debt.setDebts([]);
    debt.setBudgetProfile(DEFAULT_BUDGET_PROFILE);
```

Inside `clearAllData`, add before the `addToast` call:

```js
    debt.setDebts([]);
    debt.setBudgetProfile(DEFAULT_BUDGET_PROFILE);
```

- [ ] **Step 8: Expose the slice on the provider value**

In `src/context/WalletContext.jsx`, in the object passed to
`WalletContext.Provider value={{ ... }}`, add as the last entry after
`clearAllData`:

```js
        ...debt
```

- [ ] **Step 9: Verify the app still boots**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 10: Commit**

```bash
git add src/features/debt/debtStorage.js src/features/debt/useDebtState.js src/context/WalletContext.jsx
git commit -m "feat: add debt planner state, storage and prefill"
```

---

### Task 6: Month formatting, tab registration and the tab shell

At the end of this task the tab exists, renders, and runs the engine — with the
panels still stubbed. That makes the next tasks independently reviewable.

**Files:**
- Modify: `src/shared/formatters.js`
- Modify: `src/components/Navbar.jsx`
- Modify: `src/App.jsx`
- Create: `src/features/debt/PayoffSummaryCards.jsx`
- Create: `src/features/debt/DebtTab.jsx`

**Interfaces:**
- Consumes: `simulate` (Task 2), `useWallet()` with the debt slice (Task 5)
- Produces:
  - `formatMonthLabel(m: YearMonth) => string` — Thai short month plus Buddhist year
  - `<PayoffSummaryCards projection budgetProfile debtCount />`
  - `<DebtTab />`

- [ ] **Step 1: Fold negative zero in `formatCurrency`, then add `formatMonthLabel`**

The debt engine never rounds mid-loop, so float subtraction can leave
residues like `-7.97e-14` in a value the UI then does `Math.round(...)` on.
`Math.round(-7.97e-14)` is `-0`, and `(-0).toLocaleString('th-TH', ...)` is
`"-0"` — so any display call site can render `-0 ฿`. Fix this once, in the
shared formatter, rather than at each call site (patching call sites is how
this bug came back after being "fixed" twice already). Modify
`formatCurrency` in `src/shared/formatters.js`:

```js
export const formatCurrency = (amount, includeSymbol = true, decimals = 0) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return includeSymbol ? '0 ฿' : '0';
  }
  // Float subtraction upstream (e.g. in the debt engine) can leave residues
  // like -7.97e-14, and Math.round of those is -0. (-0).toLocaleString() is
  // "-0", so fold -0 back to 0 here — adding 0 leaves every real value
  // (including genuine negatives) untouched: -0 + 0 === 0, -1234 + 0 === -1234.
  const normalized = Number(amount) + 0;
  const formatted = normalized.toLocaleString('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  return includeSymbol ? `${formatted} ฿` : formatted;
};
```

Then append `formatMonthLabel` to the same file:

```js
const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

/**
 * Formats a { year, month } pair (month 1-12) as a Thai short month with a
 * Buddhist-era year, e.g. { year: 2031, month: 3 } -> "มี.ค. 2574"
 */
export const formatMonthLabel = (m) => {
  if (!m || !m.year || !m.month) return '-';
  return `${THAI_MONTHS_SHORT[m.month - 1]} ${m.year + 543}`;
};
```

- [ ] **Step 2: Register the tab in the navbar**

In `src/components/Navbar.jsx`, add `Landmark` to the `lucide-react` import
list, then insert this entry into `TABS` directly after the `projection` entry:

```js
  { id: 'debt', label: 'ปลอดหนี้', fullLabel: 'วางแผนปลอดหนี้ (Debt Payoff Planner)', icon: Landmark },
```

- [ ] **Step 3: Route the tab in `App.jsx`**

In `src/App.jsx`, add the import:

```js
import { DebtTab } from './features/debt/DebtTab';
```

and add this case to `renderActiveTab`, directly after the `projection` case:

```js
      case 'debt':
        return <DebtTab />;
```

- [ ] **Step 4: Write `PayoffSummaryCards.jsx`**

Create `src/features/debt/PayoffSummaryCards.jsx`:

```jsx
import React from 'react';
import { StatCard } from '../../components/StatCard';
import { formatCurrency, formatMonthLabel } from '../../shared/formatters';
import { CalendarCheck, Coins, TrendingDown, AlertTriangle } from 'lucide-react';

/**
 * Summary cards, the infeasible banner, and the assumptions box.
 *
 * The assumptions box is always visible and never a tooltip: the whole
 * projection rests on user-entered numbers, so if the food budget is a guess,
 * the payoff date is a guess.
 *
 * Values go through `Math.round` then `formatCurrency` like every other
 * display site in this feature — `formatCurrency` folds any -0 that
 * produces, so there is no local rounding helper here.
 */
export const PayoffSummaryCards = ({ projection, budgetProfile, debtCount }) => {
  const last = projection.Months.length
    ? projection.Months[projection.Months.length - 1]
    : null;

  const debtRemaining = last
    ? last.PrincipalBalance + last.AccruedInterestBalance
    : 0;

  const startingDebt = projection.Months.length
    ? projection.Months[0].PrincipalBalance + projection.Months[0].AccruedInterestBalance
    : 0;

  return (
    <>
      <div className="grid grid-cols-4 mb-4">
        <StatCard
          label="เดือนที่ปลอดหนี้"
          value={
            projection.IsInfeasible || !projection.MonthsToPayoff
              ? '—'
              : formatMonthLabel(projection.PayoffDate)
          }
          subtext={
            projection.IsInfeasible
              ? 'งบปัจจุบันยังปิดหนี้ไม่ได้'
              : `อีก ${projection.MonthsToPayoff} เดือน`
          }
          icon={CalendarCheck}
          colorScheme={projection.IsInfeasible ? 'rose' : 'emerald'}
          valueClass={projection.IsInfeasible ? 'text-danger' : 'text-success'}
        />

        <StatCard
          label="ดอกเบี้ยที่จะจ่ายรวม"
          value={formatCurrency(Math.round(projection.TotalInterestPaid))}
          subtext="ตลอดแผน ตามตัวเลขที่กรอก"
          icon={Coins}
          colorScheme="amber"
          valueClass="text-warning"
        />

        <StatCard
          label="จุดคุ้มดอกเบี้ยต่อเดือน"
          value={`${formatCurrency(Math.round(projection.MonthlyInterestThreshold))}/ด.`}
          subtext="ขีดจำกัด ไม่ใช่เป้า — ต่ำกว่านี้หนี้ไม่ลด"
          icon={TrendingDown}
          colorScheme="blue"
          valueClass="text-info"
        />

        <StatCard
          label={projection.IsInfeasible ? 'หนี้คงเหลือ ณ เดือนที่หยุดคำนวณ' : 'หนี้ตั้งต้นทั้งหมด'}
          value={formatCurrency(
            Math.round(projection.IsInfeasible ? debtRemaining : startingDebt)
          )}
          subtext={`${debtCount} รายการในแผน`}
          icon={AlertTriangle}
          colorScheme="rose"
          valueClass="text-danger"
        />
      </div>

      {projection.IsInfeasible && (
        <div
          className="card mb-4 p-4"
          style={{ borderLeft: '4px solid var(--danger)' }}
        >
          <div className="font-bold text-base text-danger">
            🔴 งบปัจจุบันยังปิดหนี้ไม่ได้
          </div>
          <p className="text-xs text-main mt-1">
            เงินที่เหลือไปชำระหนี้น้อยกว่าดอกเบี้ยที่เดินในแต่ละเดือน หนี้จึงไม่ลดลง
            ต้องมีเงินเข้าชำระหนี้อย่างน้อย{' '}
            <b className="num-font">
              {formatCurrency(Math.round(projection.MinimumViablePayment || 0))}
            </b>{' '}
            ต่อเดือน หนี้จึงจะเริ่มลด — ลดงบกินใช้ หรือเพิ่มรายได้เสริม
          </p>
        </div>
      )}

      <div
        className="mb-4 p-3"
        style={{
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div className="text-xs font-semibold text-muted mb-1">
          คำนวณจากตัวเลขเหล่านี้
        </div>
        <div className="text-xs text-main num-font">
          รายได้สุทธิ {formatCurrency(budgetProfile.netMonthlyIncome)} ·
          รายได้เสริม {formatCurrency(budgetProfile.extraIncome)} ·
          ฟิกคอส {formatCurrency(budgetProfile.fixedExpenses)} ·
          งบกินใช้ {formatCurrency(budgetProfile.discretionaryBudget)} ·
          กองฉุกเฉิน {formatCurrency(budgetProfile.emergencyFundCurrent)} /{' '}
          {formatCurrency(budgetProfile.emergencyFundTarget)}
        </div>
        <div className="text-xs text-subtle mt-1">
          นี่คือการฉายภาพจากตัวเลขที่คุณกรอกเอง ไม่ใช่คำแนะนำทางการเงินหรือการลงทุน
          ถ้าตัวเลขที่กรอกเป็นการประมาณ วันปลอดหนี้ก็เป็นการประมาณเช่นกัน
        </div>
      </div>
    </>
  );
};
```

- [ ] **Step 5: Write `DebtTab.jsx` with stub panels**

Create `src/features/debt/DebtTab.jsx`:

```jsx
import React, { useMemo } from 'react';
import { useWallet } from '../../context/WalletContext';
import { simulate } from './engine/payoffSimulator';
import { PayoffSummaryCards } from './PayoffSummaryCards';

export const DebtTab = () => {
  const { debts, budgetProfile } = useWallet();

  // The engine is pure and takes no clock, so the current month is resolved
  // here, once per mount.
  const startMonth = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }, []);

  const projection = useMemo(
    () => simulate(debts, budgetProfile, { startMonth }),
    [debts, budgetProfile, startMonth]
  );

  const openDebts = debts.filter((d) => !d.isClosed);

  return (
    <div className="tab-panel active">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h2>🏦 วางแผนปลอดหนี้ (Debt Payoff Planner)</h2>
          <p>
            จำลองการผ่อนหนี้เดือนต่อเดือน เพื่อดูว่าหนี้ทุกก้อนจะหมดเมื่อไหร่
            และวันนั้นขยับไปแค่ไหนเมื่อเปลี่ยนงบกินใช้หรือเพิ่มรายได้เสริม
          </p>
        </div>
      </div>

      <PayoffSummaryCards
        projection={projection}
        budgetProfile={budgetProfile}
        debtCount={openDebts.length}
      />

      {openDebts.length === 0 && (
        <div className="card p-6 text-center">
          <div className="font-bold text-base mb-1">ยังไม่มีรายการหนี้ในแผน</div>
          <p className="text-xs text-muted">
            เพิ่มหนี้ก้อนแรกเพื่อเริ่มคำนวณวันปลอดหนี้
          </p>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 6: Verify the tab renders**

```bash
npm run build
```

Expected: build succeeds.

Then run `npm run dev`, open the app, click the "ปลอดหนี้" tab. Expected: the
header, four summary cards showing dashes and zeros, the assumptions box, and
the empty-state card. No console errors.

- [ ] **Step 7: Commit**

```bash
git add src/shared/formatters.js src/components/Navbar.jsx src/App.jsx src/features/debt/PayoffSummaryCards.jsx src/features/debt/DebtTab.jsx
git commit -m "feat: add debt planner tab shell and payoff summary cards"
```

---

### Task 7: `BudgetProfilePanel.jsx`

**Files:**
- Create: `src/features/debt/BudgetProfilePanel.jsx`
- Modify: `src/features/debt/DebtTab.jsx`

**Interfaces:**
- Consumes: `budgetProfile` and `updateBudgetProfile` from `useWallet()` (Task 5)
- Produces: `<BudgetProfilePanel />` — reads and writes the profile itself, takes no props

- [ ] **Step 1: Write the panel**

Create `src/features/debt/BudgetProfilePanel.jsx`:

```jsx
import React from 'react';
import { useWallet } from '../../context/WalletContext';
import { Wallet, Plus, Trash2 } from 'lucide-react';

const NumberField = ({ label, hint, value, onChange }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <input
      type="number"
      className="form-input num-font"
      step="any"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
    {hint && <div className="text-xs text-subtle mt-1">{hint}</div>}
  </div>
);

/**
 * Stepped schedule editor. Used for the emergency contribution and the
 * short-term buffer, both of which change at known months — the golden fixture
 * needs 2,000 for months 0-2 then 3,000, and a buffer of 1,200 for months 0-1
 * then 0.
 */
const ScheduleEditor = ({ label, overrides, onChange }) => {
  const list = overrides || [];

  const update = (index, patch) => {
    onChange(list.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>

      {list.map((o, i) => (
        <div key={i} className="flex gap-2 items-center mb-2">
          <span className="text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>
            ตั้งแต่เดือนที่
          </span>
          <input
            type="number"
            className="form-input num-font"
            style={{ width: '80px', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
            min="0"
            value={o.fromMonth}
            onChange={(e) => update(i, { fromMonth: parseInt(e.target.value, 10) || 0 })}
          />
          <span className="text-xs text-muted">เป็น</span>
          <input
            type="number"
            className="form-input num-font"
            style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
            step="any"
            value={o.amount}
            onChange={(e) => update(i, { amount: parseFloat(e.target.value) || 0 })}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            title="ลบขั้นนี้"
            onClick={() => onChange(list.filter((_, idx) => idx !== i))}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() =>
          onChange([...list, { fromMonth: list.length ? 0 : 1, amount: 0 }])
        }
      >
        <Plus size={14} />
        <span>เพิ่มขั้น</span>
      </button>
    </div>
  );
};

export const BudgetProfilePanel = () => {
  const { budgetProfile, updateBudgetProfile } = useWallet();
  const p = budgetProfile;
  const set = (key) => (value) => updateBudgetProfile({ [key]: value });

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <Wallet size={18} />
            <span>ตั้งค่างบประมาณ</span>
          </div>
          <div className="card-subtitle">
            ตัวเลขทุกช่องเป็นของแผนปลอดหนี้ แก้ที่นี่ไม่กระทบแท็บอื่น
          </div>
        </div>
      </div>

      <NumberField
        label="รายได้สุทธิต่อเดือน (บาท)"
        value={p.netMonthlyIncome}
        onChange={set('netMonthlyIncome')}
      />

      <NumberField
        label="รายได้เสริมต่อเดือน (บาท)"
        hint="ตัวแปรสำหรับทดลอง — เพิ่มแล้วดูวันปลอดหนี้ขยับ"
        value={p.extraIncome}
        onChange={set('extraIncome')}
      />

      <NumberField
        label="ค่าใช้จ่ายคงที่ต่อเดือน (บาท)"
        hint="ค่าเช่า ค่าน้ำค่าไฟ มือถือ ประกัน — ไม่รวมค่างวดหนี้"
        value={p.fixedExpenses}
        onChange={set('fixedExpenses')}
      />

      <NumberField
        label="งบกินใช้ต่อเดือน (บาท)"
        hint="อาหาร + ของใช้ส่วนตัว — ตัวแปรหลักที่ขยับวันปลอดหนี้"
        value={p.discretionaryBudget}
        onChange={set('discretionaryBudget')}
      />

      <NumberField
        label="กองฉุกเฉินปัจจุบัน (บาท)"
        value={p.emergencyFundCurrent}
        onChange={set('emergencyFundCurrent')}
      />

      <NumberField
        label="เป้ากองฉุกเฉิน (บาท)"
        hint="ถึงเป้าแล้วเงินส่วนนี้จะไหลไปชำระหนี้เอง"
        value={p.emergencyFundTarget}
        onChange={set('emergencyFundTarget')}
      />

      <NumberField
        label="เงินเข้ากองฉุกเฉินต่อเดือน (บาท)"
        value={p.emergencyMonthlyContribution}
        onChange={set('emergencyMonthlyContribution')}
      />

      <ScheduleEditor
        label="ขั้นของเงินเข้ากองฉุกเฉิน (ถ้ามี)"
        overrides={p.emergencyContributionOverrides}
        onChange={(v) => updateBudgetProfile({ emergencyContributionOverrides: v })}
      />

      <NumberField
        label="เงินกันสำรองระยะสั้นต่อเดือน (บาท)"
        hint="เงินที่กันไว้ไม่เอาไปโปะหนี้ เช่น ค่าใช้จ่ายก้อนที่รู้ล่วงหน้า"
        value={p.shortTermBuffer}
        onChange={set('shortTermBuffer')}
      />

      <ScheduleEditor
        label="ขั้นของเงินกันสำรอง (ถ้ามี)"
        overrides={p.bufferOverrides}
        onChange={(v) => updateBudgetProfile({ bufferOverrides: v })}
      />

      <div className="form-group">
        <label className="form-label">ลำดับการโปะหนี้</label>
        <select
          className="form-select"
          value={p.strategy}
          onChange={(e) => updateBudgetProfile({ strategy: e.target.value })}
        >
          <option value="avalanche">
            Avalanche — โปะก้อนดอกแพงสุดก่อน (ประหยัดดอกที่สุด)
          </option>
          <option value="snowball">
            Snowball — โปะก้อนยอดน้อยสุดก่อน (ปิดหนี้ได้เร็วเป็นก้อน)
          </option>
          <option value="manual">Manual — เรียงลำดับเอง</option>
        </select>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Mount the panel in `DebtTab.jsx`**

In `src/features/debt/DebtTab.jsx`, add the import:

```jsx
import { BudgetProfilePanel } from './BudgetProfilePanel';
```

and replace the empty-state block with:

```jsx
      <div className="grid grid-cols-3 gap-6 mb-4">
        <BudgetProfilePanel />

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <div>
              <div className="card-title">รายการหนี้</div>
              <div className="card-subtitle">เพิ่มในขั้นถัดไป</div>
            </div>
          </div>
        </div>
      </div>
```

- [ ] **Step 3: Verify the panel works end to end**

```bash
npm run build
```

Expected: build succeeds.

Then run `npm run dev`, open the "ปลอดหนี้" tab and check:
1. Changing "งบกินใช้ต่อเดือน" updates the assumptions box immediately
2. "เพิ่มขั้น" adds a schedule row; entering month 3 / amount 3000 persists
3. Reloading the page keeps every value

- [ ] **Step 4: Commit**

```bash
git add src/features/debt/BudgetProfilePanel.jsx src/features/debt/DebtTab.jsx
git commit -m "feat: add debt planner budget profile panel"
```

---

Tasks 8–11 (debt list, add/edit modal, schedule table, and UI phase 2) are
specified in `docs/superpowers/plans/2026-09-07-debt-payoff-planner-part-3.md`.
