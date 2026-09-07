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
