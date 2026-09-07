import React from 'react';
import { StatCard } from '../../components/StatCard';
import { formatCurrency, formatMonthLabel } from '../../shared/formatters';
import { outstandingBalance, periodsRemaining } from './engine/debtMath';
import { CalendarCheck, Coins, TrendingDown, AlertTriangle } from 'lucide-react';

/**
 * Balance still owed on the fixed-schedule debts (hirePurchase, installment)
 * as of a given 0-based month index into the projection.
 *
 * The engine never tracks a declining balance for these — it only knows the
 * flat monthly payment and how many of the plan's periods are still ahead of
 * `startMonth` (see payoffSimulator's fixedObligations). So the balance as of
 * month `atIndex` is what is left after `atIndex + 1` payments have been made:
 * monthlyPayment x periods still owed beyond this month.
 */
const stillRunningFixedBalance = (debts, atIndex) =>
  (debts || [])
    .filter((d) => d.type === 'hirePurchase' || d.type === 'installment')
    .reduce((sum, d) => {
      const remaining = Math.max(0, periodsRemaining(d) - (atIndex + 1));
      return sum + (Number(d.monthlyPayment) || 0) * remaining;
    }, 0);

/**
 * Summary cards, the infeasible banner, and the assumptions box.
 *
 * The assumptions box is always visible and never a tooltip: the whole
 * projection rests on user-entered numbers, so if the food budget is a guess,
 * the payoff date is a guess.
 */
export const PayoffSummaryCards = ({ projection, budgetProfile, debts }) => {
  const openDebts = debts || [];
  const last = projection.Months.length
    ? projection.Months[projection.Months.length - 1]
    : null;

  // Card 4, IsInfeasible variant: the amortizing balances the engine tracked
  // plus whatever is still owed on installment/hire-purchase plans that are
  // still running at the month the simulation stopped. Reporting the
  // amortizing figure alone under-reports real debt for any portfolio that
  // also carries a hire-purchase or an installment plan.
  const debtRemaining = last
    ? last.PrincipalBalance +
      last.AccruedInterestBalance +
      stillRunningFixedBalance(openDebts, last.Index)
    : 0;

  // Card 4, feasible variant: the true starting balance across every open
  // debt, using the same product-rule math the engine and the debt list use
  // (outstandingBalance never applies an interest formula to hirePurchase or
  // installment).
  const startingDebt = openDebts.reduce((sum, d) => sum + outstandingBalance(d), 0);

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
          subtext={`${openDebts.length} รายการในแผน`}
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
            {projection.InfeasibleReason === 'budgetShortfall' && (
              <>
                ค่าใช้จ่ายคงที่ งบกินใช้ และค่างวดผ่อนของเดือนนี้รวมกันมากกว่ารายได้ที่มี
                เงินจึงไม่เหลือไปถึงหนี้เลยแม้แต่บาทเดียว ต้องหาเงินเพิ่มอีกอย่างน้อย{' '}
                <b className="num-font">
                  {formatCurrency(Math.round(projection.MonthlyShortfall))}
                </b>{' '}
                ต่อเดือน หรือลดค่าใช้จ่ายลงให้พอ ก่อนจะเริ่มโปะหนี้ได้
              </>
            )}
            {/* A 0% amortizing debt receiving nothing also stops falling, and
                then the interest floor is genuinely zero — quoting it as the
                amount needed would be meaningless, so name the real problem. */}
            {projection.InfeasibleReason === 'debtNotFalling' &&
              Math.round(projection.MinimumViablePayment) <= 0 && (
                <>
                  ไม่มีเงินเหลือไปถึงหนี้เลยในแต่ละเดือน ยอดหนี้จึงไม่ขยับ
                  ต้องลดงบกินใช้ หรือเพิ่มรายได้เสริม ให้มีเงินเหลือไปชำระหนี้ก่อน
                </>
              )}
            {projection.InfeasibleReason === 'debtNotFalling' &&
              Math.round(projection.MinimumViablePayment) > 0 && (
                <>
                  เงินที่เหลือไปชำระหนี้น้อยกว่าดอกเบี้ยที่เดินในแต่ละเดือน หนี้จึงไม่ลดลง
                  ต้องมีเงินเข้าชำระหนี้อย่างน้อย{' '}
                  <b className="num-font">
                    {formatCurrency(Math.round(projection.MinimumViablePayment))}
                  </b>{' '}
                  ต่อเดือน หนี้จึงจะเริ่มลด — ลดงบกินใช้ หรือเพิ่มรายได้เสริม
                </>
              )}
            {projection.InfeasibleReason === 'horizonExhausted' && (
              <>
                ด้วยตัวเลขงบประมาณปัจจุบัน แผนนี้ยังปิดหนี้ไม่จบภายใน 50 ปีที่ระบบคำนวณให้
                ต้องลดงบกินใช้หรือเพิ่มรายได้เสริมให้มากขึ้นกว่านี้
              </>
            )}
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
