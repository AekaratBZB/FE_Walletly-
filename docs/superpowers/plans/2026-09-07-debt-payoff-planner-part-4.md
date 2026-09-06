# Debt Payoff Planner Implementation Plan — Part 4 (UI phase 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Continues `docs/superpowers/plans/2026-09-07-debt-payoff-planner-part-3.md`.
Tasks 1–9 must be complete, `npm test` green, and phase 1 verified against the
§8 fixture in the running app before starting here.

**Global Constraints:** as stated in Part 1. In particular: `canvas-confetti`
must not be imported by this feature, and the discretionary ceiling is labelled
a limit, never a target.

**chart.js registration:** this project registers chart.js components at module
scope in the file that uses them, as in `src/features/reports/ReportsTab.jsx`.
Follow that pattern. A line chart needs `LineElement`, `PointElement` and
`Filler` in addition to the scales.

---

### Task 10: `AmortizationChart.jsx` and `CeilingPanel.jsx`

**Files:**
- Create: `src/features/debt/AmortizationChart.jsx`
- Create: `src/features/debt/CeilingPanel.jsx`
- Modify: `src/features/debt/DebtTab.jsx`

**Interfaces:**
- Consumes: a `Projection` (Task 2), `budgetProfile` via props, `formatCurrency` / `formatMonthLabel` (Task 6)
- Produces:
  - `<AmortizationChart projection />`
  - `<CeilingPanel projection budgetProfile />`

- [ ] **Step 1: Write `AmortizationChart.jsx`**

Create `src/features/debt/AmortizationChart.jsx`:

```jsx
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formatMonthLabel } from '../../shared/formatters';
import { TrendingDown } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export const AmortizationChart = ({ projection }) => {
  if (!projection.Months.length) return null;

  const labels = projection.Months.map((m) => formatMonthLabel(m.Month));

  const data = {
    labels,
    datasets: [
      {
        label: 'เงินต้นคงเหลือ',
        data: projection.Months.map((m) => Math.round(m.PrincipalBalance)),
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.12)',
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2
      },
      {
        label: 'ดอกเบี้ยค้างสะสม',
        data: projection.Months.map((m) => Math.round(m.AccruedInterestBalance)),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2
      },
      {
        label: 'กองฉุกเฉิน',
        data: projection.Months.map((m) => Math.round(m.EmergencyFundBalance)),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.10)',
        fill: false,
        pointRadius: 0,
        borderWidth: 2,
        borderDash: [5, 4],
        tension: 0.2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `${ctx.dataset.label}: ${Number(ctx.parsed.y).toLocaleString('th-TH')} ฿`
        }
      }
    },
    scales: {
      x: { ticks: { maxTicksLimit: 12, font: { size: 10 } }, grid: { display: false } },
      y: {
        ticks: {
          font: { size: 10 },
          callback: (v) => `${(v / 1000).toLocaleString('th-TH')}k`
        }
      }
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <TrendingDown size={18} />
            <span>เส้นทางลดหนี้ (Amortization)</span>
          </div>
          <div className="card-subtitle">
            เงินต้นจะยังไม่ลงจนกว่าดอกเบี้ยค้างจะถูกล้างหมดก่อน
          </div>
        </div>
      </div>

      <div style={{ height: '320px' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Write `CeilingPanel.jsx`**

Create `src/features/debt/CeilingPanel.jsx`:

```jsx
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { formatCurrency, formatMonthLabel } from '../../shared/formatters';
import { Utensils } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

/**
 * The discretionary ceiling: the spend level at which the debt stops shrinking.
 * It is a LIMIT, not a target, and is labelled that way. The ceiling rises in
 * steps as installment plans expire, which is the point of showing it.
 */
export const CeilingPanel = ({ projection, budgetProfile }) => {
  if (!projection.Months.length) return null;

  const shown = projection.Months.slice(0, 36);
  const budget = Number(budgetProfile.discretionaryBudget) || 0;
  const first = shown[0];
  const breathingRoom = first.DiscretionaryCeiling - budget;

  const data = {
    labels: shown.map((m) => formatMonthLabel(m.Month)),
    datasets: [
      {
        type: 'bar',
        label: 'เพดานงบกินใช้ (ขีดจำกัด)',
        data: shown.map((m) => Math.round(m.DiscretionaryCeiling)),
        backgroundColor: 'rgba(56, 189, 248, 0.45)',
        borderColor: '#0ea5e9',
        borderWidth: 1
      },
      {
        type: 'line',
        label: 'งบกินใช้ที่ตั้งไว้',
        data: shown.map(() => Math.round(budget)),
        borderColor: '#f43f5e',
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `${ctx.dataset.label}: ${Number(ctx.parsed.y).toLocaleString('th-TH')} ฿`
        }
      }
    },
    scales: {
      x: { ticks: { maxTicksLimit: 12, font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { font: { size: 10 } } }
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <Utensils size={18} />
            <span>เพดานงบกินใช้รายเดือน</span>
          </div>
          <div className="card-subtitle">
            เพดานนี้เป็น <b>ขีดจำกัด ไม่ใช่เป้า</b> — ใช้เกินเส้นนี้เดือนไหน หนี้เดือนนั้นโต
            และเพดานจะขึ้นเป็นขั้นบันไดทุกครั้งที่ผ่อนก้อนหนึ่งหมดงวด
          </div>
        </div>
      </div>

      <div
        className="mb-3 p-3"
        style={{
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div className="text-xs text-muted">ช่องว่างหายใจเดือนนี้ (Breathing Room)</div>
        <div
          className={`font-bold text-lg num-font ${
            breathingRoom >= 0 ? 'text-success' : 'text-danger'
          }`}
        >
          {breathingRoom >= 0 ? '+' : '-'}
          {formatCurrency(Math.abs(Math.round(breathingRoom)))}
        </div>
        <div className="text-xs text-subtle">
          {breathingRoom >= 0
            ? 'ยังใช้จ่ายได้ต่ำกว่าเพดาน หนี้เดือนนี้จึงลดลง'
            : 'ใช้จ่ายเกินเพดาน หนี้เดือนนี้จะโตขึ้น ไม่ลด'}
        </div>
      </div>

      <div style={{ height: '300px' }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Mount both in `DebtTab.jsx`**

In `src/features/debt/DebtTab.jsx`, add the imports:

```jsx
import { AmortizationChart } from './AmortizationChart';
import { CeilingPanel } from './CeilingPanel';
```

and insert this block between the two-panel grid and `<ScheduleTable />`:

```jsx
      <div className="grid grid-cols-2 gap-6 mb-4">
        <AmortizationChart projection={projection} />
        <CeilingPanel projection={projection} budgetProfile={budgetProfile} />
      </div>
```

- [ ] **Step 4: Verify both charts render**

```bash
npm run build
```

Expected: build succeeds.

Then run `npm run dev` with the §8 fixture entered and check:
1. The amortization chart shows เงินต้นคงเหลือ flat near 610k for the first
   seven months, then falling; ดอกเบี้ยค้างสะสม rising to about 24k then
   falling to zero around month 7; กองฉุกเฉิน rising to 40k and flattening
2. The ceiling chart shows visible upward steps at months 2, 3, 6, 9 and 14 —
   each one an installment plan expiring
3. Breathing room at month 0 is `29000 - 7920.36 - 10864.30 - 3342.29 - 5000`,
   i.e. about `+1,873 ฿`, shown green

- [ ] **Step 5: Commit**

```bash
git add src/features/debt/AmortizationChart.jsx src/features/debt/CeilingPanel.jsx src/features/debt/DebtTab.jsx
git commit -m "feat: add amortization chart and discretionary ceiling view"
```

---

### Task 11: `WhatIfSliders.jsx` and `StrategyPanel.jsx`

**Files:**
- Create: `src/features/debt/WhatIfSliders.jsx`
- Create: `src/features/debt/StrategyPanel.jsx`
- Modify: `src/features/debt/DebtTab.jsx`

**Interfaces:**
- Consumes: `simulate` (Task 2), `rankDebts` (Task 4), `formatCurrency` / `formatMonthLabel` (Task 6)
- Produces:
  - `<WhatIfSliders budgetProfile overrides onChange />` where
    `overrides = { discretionaryBudget: number|null, extraIncome: number|null }`
    and `null` means "use the saved profile value"
  - `<StrategyPanel debts budgetProfile startMonth />`

The sliders do **not** write to `budgetProfile`. They are what-if overrides held
in `DebtTab`'s local state, mirroring the source spec's `/simulate` body of
non-persisted overrides.

- [ ] **Step 1: Write `WhatIfSliders.jsx`**

Create `src/features/debt/WhatIfSliders.jsx`:

```jsx
import React from 'react';
import { formatCurrency } from '../../shared/formatters';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';

const Slider = ({ label, hint, value, min, max, step, onChange }) => (
  <div className="form-group">
    <div className="flex justify-between items-baseline mb-1">
      <label className="form-label" style={{ marginBottom: 0 }}>
        {label}
      </label>
      <span className="font-bold num-font text-sm text-primary">
        {formatCurrency(Math.round(value))}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{ width: '100%' }}
    />
    <div className="flex justify-between text-xs text-subtle">
      <span className="num-font">{formatCurrency(min)}</span>
      <span className="num-font">{formatCurrency(max)}</span>
    </div>
    {hint && <div className="text-xs text-subtle mt-1">{hint}</div>}
  </div>
);

/**
 * What-if levers. These override the saved budget for the projection only and
 * are never persisted — the same contract as the source spec's /simulate body.
 */
export const WhatIfSliders = ({ budgetProfile, overrides, onChange }) => {
  const discretionary =
    overrides.discretionaryBudget === null
      ? Number(budgetProfile.discretionaryBudget) || 0
      : overrides.discretionaryBudget;

  const extra =
    overrides.extraIncome === null
      ? Number(budgetProfile.extraIncome) || 0
      : overrides.extraIncome;

  const income = Number(budgetProfile.netMonthlyIncome) || 0;
  const discretionaryMax = Math.max(20000, Math.ceil(income / 1000) * 1000);

  const isDirty =
    overrides.discretionaryBudget !== null || overrides.extraIncome !== null;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <SlidersHorizontal size={18} />
            <span>ทดลองปรับตัวเลข (What-if)</span>
          </div>
          <div className="card-subtitle">
            ลากแล้วดูวันปลอดหนี้ขยับทันที — ค่านี้ไม่ถูกบันทึกทับงบที่ตั้งไว้
          </div>
        </div>

        {isDirty && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onChange({ discretionaryBudget: null, extraIncome: null })}
          >
            <RotateCcw size={14} />
            <span>กลับค่าที่ตั้งไว้</span>
          </button>
        )}
      </div>

      <Slider
        label="งบกินใช้ต่อเดือน"
        hint="ลดงบกินใช้ 1,000 บาท มักย่นเวลาปลอดหนี้ได้หลายเดือน"
        value={discretionary}
        min={0}
        max={discretionaryMax}
        step={500}
        onChange={(v) => onChange({ ...overrides, discretionaryBudget: v })}
      />

      <Slider
        label="รายได้เสริมต่อเดือน"
        hint="รายได้เสริมทุกบาทไหลเข้าชำระหนี้ทั้งหมด หลังกองฉุกเฉินถึงเป้า"
        value={extra}
        min={0}
        max={20000}
        step={500}
        onChange={(v) => onChange({ ...overrides, extraIncome: v })}
      />
    </div>
  );
};
```

- [ ] **Step 2: Write `StrategyPanel.jsx`**

Create `src/features/debt/StrategyPanel.jsx`:

```jsx
import React, { useMemo } from 'react';
import { rankDebts } from './engine/strategyRanker';
import { simulate } from './engine/payoffSimulator';
import { formatCurrency } from '../../shared/formatters';
import { ListOrdered, AlertCircle } from 'lucide-react';

const TYPE_LABEL = {
  amortizing: 'ลดต้นลดดอก',
  hirePurchase: 'เช่าซื้อ',
  installment: 'ผ่อน 0%'
};

/**
 * Ranked payoff order plus a like-for-like avalanche vs snowball comparison.
 * The engine is pure, so running it twice to show the difference costs nothing.
 */
export const StrategyPanel = ({ debts, budgetProfile, startMonth }) => {
  const ranked = useMemo(
    () => rankDebts(debts, budgetProfile, { startMonth }),
    [debts, budgetProfile, startMonth]
  );

  const comparison = useMemo(() => {
    const avalanche = simulate(
      debts,
      { ...budgetProfile, strategy: 'avalanche' },
      { startMonth }
    );
    const snowball = simulate(
      debts,
      { ...budgetProfile, strategy: 'snowball' },
      { startMonth }
    );
    return {
      avalanche,
      snowball,
      interestDelta: snowball.TotalInterestPaid - avalanche.TotalInterestPaid,
      monthsDelta: snowball.MonthsToPayoff - avalanche.MonthsToPayoff
    };
  }, [debts, budgetProfile, startMonth]);

  if (!ranked.length) return null;

  const interestBearingCount = debts.filter(
    (d) => !d.isClosed && d.type === 'amortizing'
  ).length;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <ListOrdered size={18} />
            <span>ลำดับที่ควรโปะก่อน</span>
          </div>
          <div className="card-subtitle">
            เรียงตามต้นทุนจริงของการถือหนี้ ไม่ใช่ตามยอด — ยอด 0% ที่ใหญ่มากก็ต้นทุนศูนย์
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th>หนี้</th>
              <th className="text-right">ต้นทุนที่เหลือ</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((r, i) => (
              <tr key={r.debtId}>
                <td className="num-font font-bold text-muted">{i + 1}</td>
                <td>
                  <div className="font-semibold text-sm text-main">
                    {r.name}{' '}
                    <span className="text-xs text-muted">
                      ({TYPE_LABEL[r.type] || r.type})
                    </span>
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      r.quoteMissing ? 'text-warning' : 'text-muted'
                    }`}
                  >
                    {r.quoteMissing && (
                      <AlertCircle size={12} style={{ verticalAlign: '-2px' }} />
                    )}{' '}
                    {r.reason}
                  </div>
                </td>
                <td className="text-right num-font font-bold text-sm">
                  {r.quoteMissing ? '—' : formatCurrency(Math.round(r.totalRemainingCost))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {interestBearingCount >= 2 && (
        <div
          className="mt-4 p-3"
          style={{
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}
        >
          <div className="text-xs font-semibold text-muted mb-2">
            เทียบสองวิธีด้วยตัวเลขของคุณเอง
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-muted">Avalanche (ดอกแพงสุดก่อน)</div>
              <div className="font-bold num-font text-success">
                {comparison.avalanche.MonthsToPayoff} เดือน ·{' '}
                {formatCurrency(Math.round(comparison.avalanche.TotalInterestPaid))}
              </div>
            </div>
            <div>
              <div className="text-muted">Snowball (ยอดน้อยสุดก่อน)</div>
              <div className="font-bold num-font text-warning">
                {comparison.snowball.MonthsToPayoff} เดือน ·{' '}
                {formatCurrency(Math.round(comparison.snowball.TotalInterestPaid))}
              </div>
            </div>
          </div>
          <div className="text-xs text-main mt-2">
            Avalanche ประหยัดดอกเบี้ยกว่า{' '}
            <b className="num-font">
              {formatCurrency(Math.round(Math.abs(comparison.interestDelta)))}
            </b>
            {comparison.monthsDelta !== 0 && (
              <>
                {' '}
                และปลอดหนี้เร็วกว่า{' '}
                <b className="num-font">{Math.abs(comparison.monthsDelta)}</b> เดือน
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 3: Wire the overrides and both panels into `DebtTab.jsx`**

Replace the whole contents of `src/features/debt/DebtTab.jsx` with:

```jsx
import React, { useMemo, useState, useDeferredValue } from 'react';
import { useWallet } from '../../context/WalletContext';
import { simulate } from './engine/payoffSimulator';
import { PayoffSummaryCards } from './PayoffSummaryCards';
import { BudgetProfilePanel } from './BudgetProfilePanel';
import { DebtListPanel } from './DebtListPanel';
import { WhatIfSliders } from './WhatIfSliders';
import { AmortizationChart } from './AmortizationChart';
import { CeilingPanel } from './CeilingPanel';
import { StrategyPanel } from './StrategyPanel';
import { ScheduleTable } from './ScheduleTable';

const NO_OVERRIDES = { discretionaryBudget: null, extraIncome: null };

export const DebtTab = () => {
  const { debts, budgetProfile } = useWallet();
  const [overrides, setOverrides] = useState(NO_OVERRIDES);

  // The engine is pure and takes no clock, so the current month is resolved
  // here, once per mount.
  const startMonth = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }, []);

  // What-if values override the saved profile for the projection only. They are
  // never written back to storage.
  const effectiveBudget = useMemo(
    () => ({
      ...budgetProfile,
      discretionaryBudget:
        overrides.discretionaryBudget === null
          ? budgetProfile.discretionaryBudget
          : overrides.discretionaryBudget,
      extraIncome:
        overrides.extraIncome === null ? budgetProfile.extraIncome : overrides.extraIncome
    }),
    [budgetProfile, overrides]
  );

  // 60 months across a handful of debts is well under 5 ms of pure JS, so no
  // network debounce is needed. useDeferredValue keeps slider drags smooth.
  const deferredBudget = useDeferredValue(effectiveBudget);

  const projection = useMemo(
    () => simulate(debts, deferredBudget, { startMonth }),
    [debts, deferredBudget, startMonth]
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
        budgetProfile={deferredBudget}
        debtCount={openDebts.length}
      />

      <div className="grid grid-cols-3 gap-6 mb-4">
        <BudgetProfilePanel />
        <DebtListPanel />
      </div>

      {openDebts.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-6 mb-4">
            <WhatIfSliders
              budgetProfile={budgetProfile}
              overrides={overrides}
              onChange={setOverrides}
            />
            <div style={{ gridColumn: 'span 2' }}>
              <StrategyPanel
                debts={debts}
                budgetProfile={deferredBudget}
                startMonth={startMonth}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-4">
            <AmortizationChart projection={projection} />
            <CeilingPanel projection={projection} budgetProfile={deferredBudget} />
          </div>

          <ScheduleTable projection={projection} />
        </>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Verify the sliders and comparison**

```bash
npm run build
```

Expected: build succeeds.

Then run `npm run dev` with the §8 fixture entered and check:
1. Dragging งบกินใช้ to `3,000` gives `47` months. To `4,000` gives `50`. To
   `6,000` gives `58`. To `7,000` gives `62`. These match the sensitivity table
   in the tests exactly.
2. Dragging รายได้เสริม to `3,000` gives `44` months, `5,000` gives `40`,
   `8,000` gives `34`.
3. "กลับค่าที่ตั้งไว้" restores 54 months, and the saved values in
   `BudgetProfilePanel` were never modified.
4. Every chart, the schedule table and the summary cards update together on one
   drag with no visible lag.
5. The strategy panel lists the loan first, the hire purchase with a
   "ขอใบเสนอปิดบัญชี" warning and a dash for cost, and every installment plan
   at `0 ฿`.
6. The avalanche/snowball comparison block is hidden with only one
   interest-bearing debt. Add a second amortizing debt and confirm it appears
   and that Avalanche shows the lower interest.

- [ ] **Step 5: Confirm the constraints hold**

Check by inspection:
1. `grep -rn "canvas-confetti" src/features/debt/` returns nothing
2. The assumptions box is visible on the tab without hovering anything
3. No view shows an estimated settlement quote for a debt whose quote is blank
4. The ceiling is labelled "ขีดจำกัด ไม่ใช่เป้า" in `CeilingPanel`

- [ ] **Step 6: Run the full test suite**

```bash
npm test
```

Expected: PASS — the engine was not touched in phase 2.

- [ ] **Step 7: Commit**

```bash
git add src/features/debt/WhatIfSliders.jsx src/features/debt/StrategyPanel.jsx src/features/debt/DebtTab.jsx
git commit -m "feat: add what-if sliders and payoff strategy comparison"
```

---

## Definition of done

Verify each item before calling the feature complete:

- [ ] All 14 §8 golden vectors pass, plus both sensitivity tables
- [ ] All nine edge cases pass, including the four multi-loan ones
- [ ] §8 is still green after the multi-loan generalization (the Task 3 gate)
- [ ] `simulate` is pure — no DB, no clock, no config dependency
- [ ] Infeasible input returns a structured result; it never hangs and never throws
- [ ] `hirePurchase` debts are never amortized as reducing-balance loans
- [ ] A null `settlementQuote` never becomes an estimated figure anywhere in the UI
- [ ] Every projection view renders the assumptions it was computed from
- [ ] A slider drag updates the charts with no visible lag at 60 months
- [ ] Debts and the budget profile survive a page reload, appear in the JSON
      backup, and are cleared by both reset and clear-all
