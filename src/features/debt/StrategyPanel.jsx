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

const STRATEGY_LABEL = {
  avalanche: 'Avalanche',
  snowball: 'Snowball'
};

/**
 * Builds the Thai copy for the avalanche-vs-snowball comparison. Both
 * comparisons can point the same way, opposite ways, or tie — the copy must
 * name whichever strategy actually wins each measure rather than assuming
 * avalanche always does.
 */
/**
 * Which strategy wins each measure, or null for a tie. Both deltas are
 * snowball minus avalanche, so a positive delta means snowball is the worse of
 * the two on that measure.
 */
const winnersOf = ({ interestDelta, monthsDelta }) => ({
  cheaper: interestDelta > 0 ? 'avalanche' : interestDelta < 0 ? 'snowball' : null,
  faster: monthsDelta > 0 ? 'avalanche' : monthsDelta < 0 ? 'snowball' : null
});

const buildComparisonCopy = ({ interestDelta, monthsDelta, cheaper, faster }) => {
  const interestAmount = formatCurrency(Math.round(Math.abs(interestDelta)));
  const monthsAmount = Math.abs(monthsDelta);

  if (!cheaper && !faster) {
    return 'สองวิธีให้ผลลัพธ์เหมือนกันทุกประการสำหรับหนี้ชุดนี้';
  }

  if (cheaper && !faster) {
    return (
      <>
        {STRATEGY_LABEL[cheaper]} ประหยัดดอกเบี้ยกว่า{' '}
        <b className="num-font">{interestAmount}</b> ใช้เวลาปลอดหนี้เท่ากัน
      </>
    );
  }

  if (!cheaper && faster) {
    return (
      <>
        {STRATEGY_LABEL[faster]} ปลอดหนี้เร็วกว่า{' '}
        <b className="num-font">{monthsAmount}</b> เดือน ดอกเบี้ยรวมเท่ากัน
      </>
    );
  }

  if (cheaper === faster) {
    return (
      <>
        {STRATEGY_LABEL[cheaper]} ประหยัดดอกเบี้ยกว่า{' '}
        <b className="num-font">{interestAmount}</b> และปลอดหนี้เร็วกว่า{' '}
        <b className="num-font">{monthsAmount}</b> เดือน
      </>
    );
  }

  // Trade-off: one strategy is cheaper, the other finishes sooner.
  return (
    <>
      {STRATEGY_LABEL[cheaper]} ประหยัดดอกเบี้ยกว่า{' '}
      <b className="num-font">{interestAmount}</b> แต่ {STRATEGY_LABEL[faster]} ปลอดหนี้เร็วกว่า{' '}
      <b className="num-font">{monthsAmount}</b> เดือน
    </>
  );
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
    const deltas = {
      interestDelta: snowball.TotalInterestPaid - avalanche.TotalInterestPaid,
      monthsDelta: snowball.MonthsToPayoff - avalanche.MonthsToPayoff
    };
    return {
      avalanche,
      snowball,
      bothFeasible: !avalanche.IsInfeasible && !snowball.IsInfeasible,
      ...deltas,
      // Derived once, so the figures' colour and the sentence below them can
      // never disagree about who won.
      ...winnersOf(deltas)
    };
  }, [debts, budgetProfile, startMonth]);

  if (!ranked.length) return null;

  const interestBearingCount = debts.filter(
    (d) => !d.isClosed && d.type === 'amortizing'
  ).length;

  const rankingUnreliable = ranked.some((r) => r.rankingUnreliable);

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

      {rankingUnreliable && (
        <div className="text-xs text-warning mb-2">
          <AlertCircle size={12} style={{ verticalAlign: '-2px' }} />{' '}
          ลำดับนี้ยังเชื่อถือไม่ได้เต็มที่ เพราะแผนปัจจุบันยังปิดหนี้ไม่ได้
          ตัวเลขต้นทุนของหนี้บางก้อนจึงยังคำนวณไม่ได้
        </div>
      )}

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
                  {r.quoteMissing || r.totalRemainingCost === null
                    ? '—'
                    : formatCurrency(Math.round(r.totalRemainingCost))}
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

          {comparison.bothFeasible ? (
            <>
              {/* Colour follows the cheaper run, not a fixed assumption that
                  avalanche wins. It usually does — but not when the highest-rate
                  debt is paid annually, because attack money routed to it sits
                  in a holding pot reducing nothing while a payable debt starves.
                  Colouring avalanche green regardless would contradict the
                  sentence directly below these figures. */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-muted">Avalanche (ดอกแพงสุดก่อน)</div>
                  <div
                    className={`font-bold num-font ${
                      comparison.cheaper === 'avalanche' ? 'text-success' : 'text-main'
                    }`}
                  >
                    {comparison.avalanche.MonthsToPayoff} เดือน ·{' '}
                    {formatCurrency(Math.round(comparison.avalanche.TotalInterestPaid))}
                  </div>
                </div>
                <div>
                  <div className="text-muted">Snowball (ยอดน้อยสุดก่อน)</div>
                  <div
                    className={`font-bold num-font ${
                      comparison.cheaper === 'snowball' ? 'text-success' : 'text-main'
                    }`}
                  >
                    {comparison.snowball.MonthsToPayoff} เดือน ·{' '}
                    {formatCurrency(Math.round(comparison.snowball.TotalInterestPaid))}
                  </div>
                </div>
              </div>
              <div className="text-xs text-main mt-2">
                {buildComparisonCopy(comparison)}
              </div>
            </>
          ) : (
            <div className="text-xs text-muted">
              ยังเทียบสองวิธีไม่ได้ เพราะงบปัจจุบันยังปิดหนี้ไม่ได้ในอย่างน้อยหนึ่งวิธี
              ตัวเลขจึงยังไม่นิ่งพอจะเทียบกัน
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-subtle mt-2">
        นี่คือการฉายภาพจากตัวเลขที่คุณกรอกเอง ไม่ใช่คำแนะนำทางการเงินหรือการลงทุน
      </div>
    </div>
  );
};
