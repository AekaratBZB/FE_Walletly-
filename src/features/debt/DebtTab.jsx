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
