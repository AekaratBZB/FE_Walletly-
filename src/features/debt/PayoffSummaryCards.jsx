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
 */
// Float subtraction in the engine can leave residues like -7.97e-14, which
// Math.round turns into -0. Adding 0 folds -0 back to 0 so the UI never
// shows a sign on a value that is actually zero.
const roundMoney = (x) => Math.round(x) + 0;

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
          value={formatCurrency(roundMoney(projection.TotalInterestPaid))}
          subtext="ตลอดแผน ตามตัวเลขที่กรอก"
          icon={Coins}
          colorScheme="amber"
          valueClass="text-warning"
        />

        <StatCard
          label="จุดคุ้มดอกเบี้ยต่อเดือน"
          value={`${formatCurrency(roundMoney(projection.MonthlyInterestThreshold))}/ด.`}
          subtext="ขีดจำกัด ไม่ใช่เป้า — ต่ำกว่านี้หนี้ไม่ลด"
          icon={TrendingDown}
          colorScheme="blue"
          valueClass="text-info"
        />

        <StatCard
          label={projection.IsInfeasible ? 'หนี้คงเหลือ ณ เดือนที่หยุดคำนวณ' : 'หนี้ตั้งต้นทั้งหมด'}
          value={formatCurrency(
            roundMoney(projection.IsInfeasible ? debtRemaining : startingDebt)
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
              {formatCurrency(roundMoney(projection.MinimumViablePayment || 0))}
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
