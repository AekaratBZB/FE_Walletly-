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
