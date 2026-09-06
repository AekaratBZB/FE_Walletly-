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
