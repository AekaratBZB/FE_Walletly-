import { hirePurchaseRebate, outstandingBalance, rebateDecayPerMonth } from './debtMath';
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
 * When the projection is infeasible its rows are truncated, so the interest an
 * amortizing debt will actually pay is unknowable from it — summing the rows
 * collapses `totalRemainingCost` toward zero and can rank a real interest-
 * bearing loan below a hire-purchase rebate, inverting the action plan the UI
 * presents. In that case every row carries `rankingUnreliable: true`, the
 * amortizing rows report `totalRemainingCost: null` rather than a fabricated
 * estimate, and they are pinned above the non-amortizing rows (an interest-
 * bearing debt always costs more to carry than a 0% plan) ordered by rate then
 * balance — both facts about the debt itself, not about the failed projection.
 *
 * @param {import('./types').Debt[]} debts
 * @param {import('./types').BudgetProfile} budget
 * @param {{ maxMonths?: number, startMonth?: import('./types').YearMonth }} [options]
 */
export const rankDebts = (debts, budget, options = {}) => {
  const projection = simulate(debts, budget, options);
  const unreliable = projection.IsInfeasible === true;

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
          rankingUnreliable: unreliable,
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
            rankingUnreliable: unreliable,
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
          rankingUnreliable: unreliable,
          reason: `ปิดบัญชีวันนี้ประหยัดได้ ${baht(rebate)} บาท และส่วนลดหดลงราวเดือนละ ${baht(decay)} บาท`
        };
      }

      if (unreliable) {
        // No honest interest figure exists: the projection stopped early.
        return {
          debtId: d.id,
          name: d.name,
          type: d.type,
          totalRemainingCost: null,
          quoteMissing: false,
          rebateDecayPerMonth: null,
          rankingUnreliable: true,
          reason: `ดอกเบี้ย ${d.annualRatePct}% ต่อปี — แผนปัจจุบันยังปิดหนี้ไม่ได้ จึงยังคำนวณดอกเบี้ยรวมไม่ได้ ต้องแก้งบประมาณก่อน`
        };
      }

      return {
        debtId: d.id,
        name: d.name,
        type: d.type,
        totalRemainingCost: interestByDebt.get(d.id) || 0,
        quoteMissing: false,
        rebateDecayPerMonth: null,
        rankingUnreliable: false,
        reason: `ดอกเบี้ย ${d.annualRatePct}% ต่อปี — โปะก้อนนี้ลดดอกเบี้ยได้ทันทีในงวดถัดไป`
      };
    });

  if (unreliable) {
    // Rows whose cost is unknown-but-real go first, ordered by facts about the
    // debt rather than by the truncated projection. The rest keep their own
    // projection-independent costs and stay descending below them.
    const rateOf = (r) => {
      const d = (debts || []).find((x) => x.id === r.debtId) || {};
      return Number(d.annualRatePct) || 0;
    };
    const balanceOfRow = (r) => {
      const d = (debts || []).find((x) => x.id === r.debtId);
      return d ? outstandingBalance(d) : 0;
    };
    ranked.sort((a, b) => {
      const au = a.totalRemainingCost === null;
      const bu = b.totalRemainingCost === null;
      if (au !== bu) return au ? -1 : 1;
      if (au) {
        if (rateOf(b) !== rateOf(a)) return rateOf(b) - rateOf(a);
        return balanceOfRow(b) - balanceOfRow(a);
      }
      return b.totalRemainingCost - a.totalRemainingCost;
    });
    return ranked;
  }

  ranked.sort((a, b) => b.totalRemainingCost - a.totalRemainingCost);
  return ranked;
};
